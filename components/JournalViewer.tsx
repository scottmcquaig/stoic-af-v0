import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, Download, Calendar, Book, Trophy, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface JournalEntry {
  day: number;
  entry_text: string;
  created_at: string;
  updated_at?: string;
}

interface Props {
  trackName: string;
  onBack: () => void;
}

export default function JournalViewer({ trackName, onBack }: Props) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const trackColors = {
    Money: 'var(--track-money)',
    Relationships: 'var(--track-relationships)',
    Discipline: 'var(--track-discipline)',
    Ego: 'var(--track-ego)'
  };

  const trackColor = trackColors[trackName as keyof typeof trackColors] || 'var(--accent)';

  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;
      
      try {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const session = await import('../utils/supabase/client').then(m => m.supabase.auth.getSession());
        const accessToken = session.data.session?.access_token || publicAnonKey;

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6d6f37b2/journal/entries/${trackName}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setEntries(result.entries || []);
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
        toast.error('Failed to load journal entries');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user, trackName]);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Simple text export for now - will be enhanced later
      const completedEntries = entries.filter(e => e.entry_text && e.entry_text.trim().length > 0);
      
      let textContent = `Stoic AF Journal - ${trackName} Track\n`;
      textContent += `Exported on: ${new Date().toLocaleDateString()}\n`;
      textContent += `Total Entries: ${completedEntries.length}\n\n`;
      textContent += '='.repeat(60) + '\n\n';
      
      completedEntries
        .sort((a, b) => a.day - b.day)
        .forEach((entry) => {
          textContent += `DAY ${entry.day}\n`;
          textContent += `Date: ${new Date(entry.created_at).toLocaleDateString()}\n`;
          textContent += '-'.repeat(40) + '\n';
          textContent += entry.entry_text + '\n\n';
          textContent += '='.repeat(60) + '\n\n';
        });
      
      textContent += `\nExported from Stoic AF Journal\n`;
      textContent += `© ${new Date().getFullYear()} Stoic AF. All rights reserved.`;
      
      // Create and download text file
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Stoic-AF-Journal-${trackName}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Journal exported successfully! 📄');
    } catch (error) {
      console.error('Error exporting journal:', error);
      toast.error('Failed to export journal. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completedEntries = entries.filter(e => e.entry_text && e.entry_text.trim().length > 0);
  const completionPercentage = Math.round((completedEntries.length / 30) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl text-foreground">{trackName} Journal</h1>
                <p className="text-sm text-muted-foreground">
                  {completedEntries.length} of 30 days completed ({completionPercentage}%)
                </p>
              </div>
            </div>
            <Button 
              onClick={exportToPDF} 
              disabled={exporting || completedEntries.length === 0}
              className="flex items-center gap-2"
              style={{ backgroundColor: trackColor }}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Text'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Summary Card */}
        <Card className="mb-8" style={{ borderColor: trackColor }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" style={{ color: trackColor }} />
                  {trackName} Track Summary
                </CardTitle>
                <CardDescription>
                  Your journey through 30 days of Stoic wisdom
                </CardDescription>
              </div>
              <Badge variant="outline" style={{ borderColor: trackColor, color: trackColor }}>
                {completedEntries.length}/30 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: trackColor }}>{completedEntries.length}</div>
                <div className="text-sm text-muted-foreground">Days Completed</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: trackColor }}>
                  {completedEntries.reduce((total, entry) => total + entry.entry_text.split(' ').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Words</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: trackColor }}>{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Journal Entries</h2>
          </div>

          {completedEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Entries Yet</h3>
                <p className="text-muted-foreground">
                  Start journaling to see your entries here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {entries
                .filter(entry => entry.entry_text && entry.entry_text.trim().length > 0)
                .sort((a, b) => a.day - b.day)
                .map((entry) => (
                  <Card key={entry.day} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Day {entry.day}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-48 w-full">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {entry.entry_text}
                        </div>
                      </ScrollArea>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{entry.entry_text.split(' ').length} words</span>
                        {entry.updated_at && entry.updated_at !== entry.created_at && (
                          <span>Updated {new Date(entry.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}