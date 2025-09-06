// Track management endpoints
app.post("/make-server-6d6f37b2/tracks/start", async (c) => {
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
    if (day >= 30) {
      // Track completed
      const completedTrack = {
        track: trackName,
        completed_at: new Date().toISOString(),
        days_completed: 30
      };

      updatedProfile = {
        ...profile,
        current_track: null,
        current_day: 0,
        total_days_completed: (profile.total_days_completed || 0) + 1,
        tracks_completed: [...(profile.tracks_completed || []), completedTrack],
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
      message: day >= 30 ? `🎉 Congratulations! You've completed the ${trackName} track!` : `Day ${day} completed! Ready for day ${day + 1}.`
    });
  } catch (error) {
    console.error('Complete day error:', error);
    return c.json({ error: 'Failed to complete day' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);