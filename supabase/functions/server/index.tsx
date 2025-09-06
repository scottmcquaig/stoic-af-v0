import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import Stripe from "npm:stripe@17.3.1";

const app = new Hono();

// Initialize Supabase client with service role key for server operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia',
});

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to get user from token
const getUser = async (authorization: string | undefined) => {
  if (!authorization?.startsWith('Bearer ')) {
    console.log('❌ Missing or invalid authorization header format:', authorization);
    throw new Error('Invalid authorization header');
  }
  
  const token = authorization.split(' ')[1];
  console.log('🔍 Attempting to validate token (first 20 chars):', token.substring(0, 20) + '...');
  
  // Create a new supabase client for this user verification using the anon key
  const userSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cXdjdWh1ZHlzdWRnamJlb3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzQ3NDEsImV4cCI6MjA3MjUxMDc0MX0.TcOn3BqD4wMB5SWzgs71D4_xUNfYTSK9qfAH40QyT7I'
  );
  
  const { data: { user }, error } = await userSupabase.auth.getUser(token);
  
  if (error) {
    console.log('❌ Supabase auth error:', error.message);
    throw new Error('Unauthorized');
  }
  
  if (!user) {
    console.log('❌ No user returned from token validation');
    throw new Error('Unauthorized');
  }
  
  console.log('✅ User validated successfully:', user.id);
  return user;
};

// Health check endpoint
app.get("/make-server-6d6f37b2/health", (c) => {
  return c.json({ status: "ok" });
});

// Stripe configuration endpoint
app.get("/make-server-6d6f37b2/stripe/config", (c) => {
  console.log('Stripe config request received');
  const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
  console.log('Publishable key available:', !!publishableKey);
  
  if (!publishableKey) {
    console.log('Stripe not configured - missing STRIPE_PUBLISHABLE_KEY');
    return c.json({ error: 'Stripe not configured' }, 500);
  }
  
  console.log('Returning publishable key (first 12 chars):', publishableKey.substring(0, 12));
  return c.json({ publishableKey });
});

// Authentication endpoints
app.post("/make-server-6d6f37b2/auth/signup", async (c) => {
  try {
    const { email, password, fullName } = await c.req.json();

    if (!email || !password || !fullName) {
      return c.json({ error: 'Email, password, and full name are required' }, 400);
    }

    console.log('Creating user with Supabase auth for email:', email);
    
    // Create user with admin privileges
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: fullName },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });

    if (error) {
      // Handle specific error cases
      if (error.code === 'email_exists' || 
          error.message.includes('already been registered') || 
          error.message.includes('User already registered')) {
        console.log('🔍 Email already exists for signup attempt:', email);
        return c.json({ 
          error: 'Account already exists with this email address. Please try logging in instead.',
          code: 'email_exists'
        }, 422);
      } else if (error.message.includes('Invalid email')) {
        console.error('❌ Invalid email format during signup:', email);
        return c.json({ error: 'Please enter a valid email address' }, 400);
      } else if (error.message.includes('Password')) {
        console.error('❌ Password validation failed during signup');
        return c.json({ error: 'Password does not meet security requirements' }, 400);
      } else {
        console.error('❌ Unexpected Supabase auth error:', error);
        return c.json({ error: `Signup failed: ${error.message}` }, 400);
      }
    }

    if (!data?.user) {
      console.error('User creation succeeded but no user data returned');
      return c.json({ error: 'User creation failed - no user data' }, 500);
    }

    console.log('User created successfully, creating profile...');

    // Create initial user profile in KV store
    const userProfile = {
      current_track: null,
      current_day: 0,
      streak: 0,
      total_days_completed: 0,
      tracks_completed: [],
      onboarding_completed: false,
      created_at: new Date().toISOString()
    };

    // Initialize empty purchases array
    const userPurchases: string[] = [];

    try {
      await kv.set(`profile:${data.user.id}`, userProfile);
      await kv.set(`purchases:${data.user.id}`, userPurchases);
      console.log('Signup completed successfully for:', email);
    } catch (kvError) {
      console.error('KV store error:', kvError);
      return c.json({ error: 'User created but profile setup failed' }, 500);
    }
    
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        created_at: data.user.created_at
      }
    });
  } catch (error) {
    console.error('Signup error (outer catch):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Internal server error during signup: ${errorMessage}` }, 500);
  }
});

// Get user profile
app.get("/make-server-6d6f37b2/user/profile", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    
    console.log('🔍 Fetching profile for user:', user.id);
    
    let profile;
    try {
      // Get profile from KV store
      profile = await kv.get(`profile:${user.id}`);
      console.log('📋 Profile KV result:', profile);
    } catch (kvError) {
      console.error('❌ KV store error in profile fetch:', kvError);
      
      // Return a default profile if KV store fails
      const defaultProfile = {
        current_track: null,
        current_day: 0,
        streak: 0,
        total_days_completed: 0,
        tracks_completed: [],
        onboarding_completed: false,
        created_at: new Date().toISOString()
      };
      
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          created_at: user.created_at
        },
        profile: defaultProfile,
        warning: 'Database temporarily unavailable - showing default profile'
      });
    }
    
    if (!profile) {
      // Create default profile if it doesn't exist
      const defaultProfile = {
        current_track: null,
        current_day: 0,
        streak: 0,
        total_days_completed: 0,
        tracks_completed: [],
        onboarding_completed: false,
        created_at: new Date().toISOString()
      };
      
      try {
        await kv.set(`profile:${user.id}`, defaultProfile);
        
        // Initialize empty purchases if not exists
        const existingPurchases = await kv.get(`purchases:${user.id}`);
        if (!existingPurchases) {
          await kv.set(`purchases:${user.id}`, []);
        }
      } catch (kvSetError) {
        console.error('❌ Failed to create default profile:', kvSetError);
        // Continue anyway with the default profile
      }
      
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          created_at: user.created_at
        },
        profile: defaultProfile
      });
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        created_at: user.created_at
      },
      profile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    
    // Check if it's an auth error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    return c.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update user profile
app.put("/make-server-6d6f37b2/user/profile", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    const updates = await c.req.json();
    
    // Get current profile
    const currentProfile = await kv.get(`profile:${user.id}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    // Update profile with new data
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`profile:${user.id}`, updatedProfile);
    
    return c.json({
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get user purchases
app.get("/make-server-6d6f37b2/purchases", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    
    console.log('🔍 Fetching purchases for user:', user.id);
    
    let purchases;
    try {
      // Get purchases from KV store
      purchases = await kv.get(`purchases:${user.id}`) || [];
      console.log('📋 Purchases KV result:', purchases);
    } catch (kvError) {
      console.error('❌ KV store error in purchases fetch:', kvError);
      // Return empty array if KV store fails
      purchases = [];
    }
    
    if (!Array.isArray(purchases)) {
      console.log('⚠️ Purchases data is not an array, resetting to empty array');
      purchases = [];
      // Try to reset it in KV store
      try {
        await kv.set(`purchases:${user.id}`, purchases);
      } catch (kvSetError) {
        console.error('❌ Failed to reset purchases array:', kvSetError);
      }
    }
    
    console.log('✅ Returning purchases for user:', user.id, purchases);

    return c.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error('Purchases fetch error:', error);
    
    // Check if it's an auth error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    return c.json({ 
      error: 'Failed to fetch purchases',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create payment intent for direct card processing
app.post("/make-server-6d6f37b2/payments/create-intent", async (c) => {
  try {
    console.log('💳 Payment intent creation request received');
    
    const authHeader = c.req.header('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    const user = await getUser(authHeader);
    const { trackName } = await c.req.json();
    
    console.log('Payment intent request:', { userId: user.id, trackName });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      console.log('❌ Invalid track name:', trackName);
      return c.json({ error: 'Invalid track name' }, 400);
    }

    // Check if user already owns this track
    const purchases = await kv.get(`purchases:${user.id}`) || [];
    console.log('Current user purchases:', purchases);
    
    if (purchases.includes(trackName)) {
      console.log('❌ Track already purchased by user');
      return c.json({ error: 'Track already purchased' }, 400);
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 400, // $4.00 in cents
      currency: 'usd',
      metadata: {
        user_id: user.id,
        track_name: trackName,
      },
      description: `Stoic AF Journal - ${trackName} Track (30-day program)`,
    });

    console.log('✅ Payment intent created successfully:', {
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret?.substring(0, 20) + '...',
      user_id: user.id,
      track_name: trackName,
      amount: paymentIntent.amount
    });

    return c.json({ 
      success: true, 
      client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Failed to create payment intent: ${errorMessage}` }, 500);
  }
});

// Process payment intent after successful payment
app.post("/make-server-6d6f37b2/payments/process-payment-intent", async (c) => {
  try {
    console.log('✅ Processing payment intent request received');
    
    const authHeader = c.req.header('Authorization');
    const user = await getUser(authHeader);
    const { paymentIntentId, trackName } = await c.req.json();
    
    console.log('Process payment intent request:', { userId: user.id, trackName, paymentIntentId });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    if (!paymentIntentId) {
      return c.json({ error: 'Payment intent ID required' }, 400);
    }

    // Verify the payment intent with Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return c.json({ error: 'Payment not completed' }, 400);
      }

      if (paymentIntent.metadata?.user_id !== user.id || paymentIntent.metadata?.track_name !== trackName) {
        return c.json({ error: 'Payment intent metadata mismatch' }, 400);
      }

      console.log('✅ Stripe payment intent verified:', {
        payment_intent_id: paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      });

      // Get current purchases
      const purchases = await kv.get(`purchases:${user.id}`) || [];
      console.log('Current user purchases before payment:', purchases);
      
      // Add the track if not already present
      if (!purchases.includes(trackName)) {
        purchases.push(trackName);
        await kv.set(`purchases:${user.id}`, purchases);
        
        // Verify the purchase was saved
        const verifiedPurchases = await kv.get(`purchases:${user.id}`);
        console.log('Verified purchases after payment:', verifiedPurchases);
        
        console.log('✅ Payment processing completed successfully:', {
          userId: user.id,
          trackName,
          totalTracks: verifiedPurchases?.length || 0
        });

        return c.json({
          success: true,
          message: `Successfully purchased ${trackName} track`,
          purchases: verifiedPurchases,
          track: trackName
        });
      } else {
        console.log('Track already owned by user, payment processed');
        return c.json({
          success: true,
          message: `${trackName} track already owned`,
          purchases
        });
      }

    } catch (stripeError) {
      console.error('❌ Stripe payment intent verification failed:', stripeError);
      return c.json({ error: 'Payment verification failed' }, 400);
    }

  } catch (error) {
    console.error('❌ Payment intent processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Payment processing failed: ${errorMessage}` }, 500);
  }
});

// Development endpoint to grant tracks for testing
app.post("/make-server-6d6f37b2/dev/grant-track", async (c) => {
  try {
    console.log('🚀 Dev grant track request received');
    
    const user = await getUser(c.req.header('Authorization'));
    const { trackName } = await c.req.json();
    
    console.log('Dev grant track request:', { userId: user.id, trackName });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    // Get current purchases
    const purchases = await kv.get(`purchases:${user.id}`) || [];
    console.log('Current user purchases:', purchases);
    
    if (purchases.includes(trackName)) {
      console.log('✅ Track already owned by user');
      return c.json({ 
        success: true, 
        message: 'Track already owned',
        purchases 
      });
    }

    // Add track to user's purchases
    purchases.push(trackName);
    await kv.set(`purchases:${user.id}`, purchases);
    
    // Verify the purchase was saved
    const verifiedPurchases = await kv.get(`purchases:${user.id}`);
    console.log('Verified purchases after dev grant:', verifiedPurchases);
    
    console.log('✅ Dev grant completed successfully:', {
      userId: user.id,
      trackName,
      totalTracks: verifiedPurchases?.length || 0
    });

    return c.json({
      success: true,
      message: `Successfully granted ${trackName} track for development`,
      purchases: verifiedPurchases,
      track: trackName
    });

  } catch (error) {
    console.error('❌ Dev grant error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Dev grant failed: ${errorMessage}` }, 500);
  }
});

// Admin endpoint to seed track prompts
app.post("/make-server-6d6f37b2/admin/seed-prompts", async (c) => {
  try {
    console.log('🌱 Seeding prompts request received');
    
    const data = await c.req.json();
    
    console.log('Seeding data:', { track_id: data.track_id, days_count: data.days?.length });
    
    if (!data.track_id || !['MONEY', 'RELATIONSHIPS', 'DISCIPLINE', 'EGO'].includes(data.track_id)) {
      return c.json({ error: 'Invalid track_id' }, 400);
    }

    if (!data.days || !Array.isArray(data.days) || data.days.length !== 30) {
      return c.json({ error: 'Days array must contain exactly 30 days' }, 400);
    }

    // Validate each day object
    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      if (!day.day || !day.daily_theme || !day.stoic_quote || !day.quote_author || 
          !day.bro_translation || !day.todays_challenge || !day.todays_intention ||
          !day.evening_reflection_prompts || !Array.isArray(day.evening_reflection_prompts)) {
        return c.json({ error: `Day ${i + 1} is missing required fields` }, 400);
      }
    }

    // Store in KV
    await kv.set(`prompts:${data.track_id}`, data);
    
    console.log('✅ Prompts seeded successfully for track:', data.track_id);

    return c.json({
      success: true,
      message: `Successfully seeded prompts for ${data.track_id} track`
    });
  } catch (error) {
    console.error('❌ Prompts seeding error:', error);
    return c.json({ error: 'Failed to seed prompts' }, 500);
  }
});

// Track prompts/seed data endpoints
app.get("/make-server-6d6f37b2/prompts/:trackName", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    const trackName = c.req.param('trackName');
    
    console.log('Fetching prompts for track:', { userId: user.id, trackName });
    
    if (!trackName || !['MONEY', 'RELATIONSHIPS', 'DISCIPLINE', 'EGO'].includes(trackName.toUpperCase())) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    // Get track data from KV store
    const trackData = await kv.get(`prompts:${trackName.toUpperCase()}`);
    
    if (!trackData) {
      console.log('No prompts found for track:', trackName);
      return c.json({ error: 'Track prompts not found' }, 404);
    }
    
    console.log('Found prompts for track:', trackName, 'Days:', trackData.days?.length || 0);

    return c.json(trackData);
  } catch (error) {
    console.error('Track prompts fetch error:', error);
    return c.json({ error: 'Failed to fetch track prompts' }, 500);
  }
});

// Track management endpoints
app.post("/make-server-6d6f37b2/journal/start-track", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    const { trackName } = await c.req.json();
    
    console.log('Starting track:', { userId: user.id, trackName });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    // Check if user owns this track
    const purchases = await kv.get(`purchases:${user.id}`) || [];
    if (!purchases.includes(trackName)) {
      return c.json({ error: 'Track not purchased' }, 400);
    }

    // Get current profile
    const profile = await kv.get(`profile:${user.id}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Update profile to start the track
    const updatedProfile = {
      ...profile,
      current_track: trackName,
      current_day: 1,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`profile:${user.id}`, updatedProfile);
    
    console.log('Track started successfully:', { userId: user.id, trackName });

    return c.json({
      success: true,
      message: `Started ${trackName} track`,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Track start error:', error);
    return c.json({ error: 'Failed to start track' }, 500);
  }
});

// Journal endpoints
app.get("/make-server-6d6f37b2/journal/entries/:trackName", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    const trackName = c.req.param('trackName');
    
    console.log('Fetching journal entries:', { userId: user.id, trackName });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    // Get entries from KV store
    const entries = await kv.get(`journal:${user.id}:${trackName}`) || [];
    
    console.log('Found journal entries:', entries.length);

    return c.json({
      success: true,
      entries
    });
  } catch (error) {
    console.error('Journal entries fetch error:', error);
    return c.json({ error: 'Failed to fetch journal entries' }, 500);
  }
});

app.post("/make-server-6d6f37b2/journal/entry", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    const { trackName, day, entryText } = await c.req.json();
    
    console.log('Saving journal entry:', { userId: user.id, trackName, day });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    if (!day || day < 1 || day > 30) {
      return c.json({ error: 'Invalid day number' }, 400);
    }

    if (!entryText || entryText.trim().length === 0) {
      return c.json({ error: 'Entry text is required' }, 400);
    }

    // Get existing entries
    const entries = await kv.get(`journal:${user.id}:${trackName}`) || [];
    
    // Find existing entry for this day
    const existingEntryIndex = entries.findIndex((entry: any) => entry.day === day);
    
    const entryData = {
      day,
      entry_text: entryText.trim(),
      created_at: existingEntryIndex >= 0 ? entries[existingEntryIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingEntryIndex >= 0) {
      // Update existing entry
      entries[existingEntryIndex] = entryData;
    } else {
      // Add new entry
      entries.push(entryData);
    }

    // Save entries back to KV store
    await kv.set(`journal:${user.id}:${trackName}`, entries);
    
    console.log('Journal entry saved successfully');

    return c.json({
      success: true,
      entry: entryData
    });
  } catch (error) {
    console.error('Journal entry save error:', error);
    return c.json({ error: 'Failed to save journal entry' }, 500);
  }
});

app.post("/make-server-6d6f37b2/journal/complete-day", async (c) => {
  try {
    const user = await getUser(c.req.header('Authorization'));
    const { trackName, day } = await c.req.json();
    
    console.log('Completing day:', { userId: user.id, trackName, day });
    
    if (!trackName || !['Money', 'Relationships', 'Discipline', 'Ego'].includes(trackName)) {
      return c.json({ error: 'Invalid track name' }, 400);
    }

    if (!day || day < 1 || day > 30) {
      return c.json({ error: 'Invalid day number' }, 400);
    }

    // Get current profile
    const profile = await kv.get(`profile:${user.id}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Check if this is the current track and day
    if (profile.current_track !== trackName) {
      return c.json({ error: 'Not the current active track' }, 400);
    }

    if (profile.current_day !== day) {
      return c.json({ error: 'Not the current day' }, 400);
    }

    // Update profile for next day or complete track
    let updatedProfile;
    let trackCompleted = false;
    
    if (day >= 30) {
      // Track completed
      trackCompleted = true;
      const completedTracks = Array.isArray(profile.tracks_completed) ? profile.tracks_completed : [];
      
      // Only add if not already completed
      if (!completedTracks.includes(trackName)) {
        completedTracks.push(trackName);
      }

      updatedProfile = {
        ...profile,
        current_track: null,
        current_day: 0,
        total_days_completed: (profile.total_days_completed || 0) + 1,
        tracks_completed: completedTracks,
        streak: (profile.streak || 0) + 1,
        updated_at: new Date().toISOString()
      };
    } else {
      // Move to next day
      updatedProfile = {
        ...profile,
        current_day: day + 1,
        total_days_completed: (profile.total_days_completed || 0) + 1,
        streak: (profile.streak || 0) + 1,
        updated_at: new Date().toISOString()
      };
    }
    
    await kv.set(`profile:${user.id}`, updatedProfile);
    
    console.log('Day completed successfully');

    return c.json({
      success: true,
      profile: updatedProfile,
      trackCompleted,
      message: day >= 30 ? `🎉 Congratulations! You've completed the ${trackName} track!` : `Day ${day} completed! Ready for day ${day + 1}.`
    });
  } catch (error) {
    console.error('Complete day error:', error);
    return c.json({ error: 'Failed to complete day' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);