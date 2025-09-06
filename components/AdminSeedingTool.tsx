import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function AdminSeedingTool() {
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSeedPrompts = async () => {
    if (!jsonData.trim()) {
      setResult({ type: 'error', message: 'Please enter JSON data' });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      // Parse JSON data
      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
      } catch (parseError) {
        setResult({ type: 'error', message: 'Invalid JSON format. Please check your data.' });
        return;
      }

      // Validate data structure
      if (!parsedData.track_id || !parsedData.days || !Array.isArray(parsedData.days)) {
        setResult({ type: 'error', message: 'Invalid data structure. Expected track_id and days array.' });
        return;
      }

      if (parsedData.days.length !== 30) {
        setResult({ type: 'error', message: 'Days array must contain exactly 30 days.' });
        return;
      }

      // Send data to backend
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/admin/seed-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(parsedData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResult({ type: 'success', message: result.message });
        setJsonData(''); // Clear the form on success
      } else {
        setResult({ type: 'error', message: result.error || 'Failed to seed prompts' });
      }
    } catch (error) {
      console.error('Seeding error:', error);
      setResult({ type: 'error', message: 'An error occurred while seeding prompts' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSeedMoney = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      // Load the money track data from the data file
      const { moneyTrackData } = await import('../data/money-track');
      
      console.log('Seeding Money track with data:', moneyTrackData);

      // Send data to backend
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/admin/seed-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(moneyTrackData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResult({ type: 'success', message: result.message + ' (Money track seeded automatically)' });
      } else {
        setResult({ type: 'error', message: result.error || 'Failed to seed Money track' });
      }
    } catch (error) {
      console.error('Quick seeding error:', error);
      setResult({ type: 'error', message: 'An error occurred while seeding Money track' });
    } finally {
      setIsLoading(false);
    }
  };

  const moneyTrackExample = `{
  "track_id": "MONEY",
  "days": [
    {
      "day": 1,
      "daily_theme": "Your Wealth Isn't Your Worth",
      "stoic_quote": "Wealth consists not in having great possessions, but in having few wants.",
      "quote_author": "Epictetus",
      "bro_translation": "Having a fat bank account doesn't mean shit if you're constantly chasing more. Learn to need less and you'll feel rich.",
      "todays_challenge": "Write down everything you spent money on in the last 48 hours. Circle the items that truly improved your life and cross out the ones that were just impulse buys.",
      "challenge_type": "reflection",
      "todays_intention": "Today I will pause before every purchase and ask if it serves me or just my ego.",
      "evening_reflection_prompts": [
        "What did I think I needed today that I actually didn't?",
        "When did money stress hijack my mood?",
        "What possession owns too much mental real estate?"
      ]
    }
  ]
}`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Admin: Seed Journal Prompts
          </CardTitle>
          <CardDescription>
            Upload journal prompts data to the database. Use this tool to populate the system with track content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="jsonData" className="block text-sm font-medium mb-2">
              JSON Data
            </label>
            <Textarea
              id="jsonData"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={handleSeedPrompts} 
              disabled={isLoading || !jsonData.trim()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isLoading ? 'Seeding...' : 'Seed Prompts'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setJsonData(moneyTrackExample)}
              disabled={isLoading}
            >
              Load Example Data
            </Button>

            <Button
              onClick={handleQuickSeedMoney}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Quick Seed Money Track
            </Button>
          </div>

          {result && (
            <Alert className={result.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Data Format Requirements:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>track_id</code>: Must be one of "MONEY", "RELATIONSHIPS", "DISCIPLINE", "EGO"</li>
              <li>• <code>days</code>: Array of exactly 30 day objects</li>
              <li>• Each day must have: day, daily_theme, stoic_quote, quote_author, bro_translation, todays_challenge, challenge_type, todays_intention, evening_reflection_prompts</li>
              <li>• <code>challenge_type</code>: Should be "reflection" or "action"</li>
              <li>• <code>evening_reflection_prompts</code>: Array of 3 strings</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}