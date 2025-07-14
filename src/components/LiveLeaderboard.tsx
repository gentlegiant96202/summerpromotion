"use client";

import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase';

// ---------- FAKE LEADERBOARD DATA ----------
const FAKE_NAMES = [
  'JACK WATSON', 'EMMA BROWN', 'OLIVER JONES', 'AVA TAYLOR', 'LUCAS CLARK',
  'MIA HARRIS', 'LIAM WILSON', 'SOPHIA MARTIN', 'NOAH THOMPSON', 'ISLA MOORE',
  'ELIJAH WHITE', 'GRACE HALL', 'HARPER ALLEN', 'HENRY YOUNG', 'ELLA KING',
  'JAMES WRIGHT', 'SCARLETT SCOTT', 'LEO GREEN', 'CHLOE ADAMS', 'AIDEN BAKER',
  'LILY NELSON', 'MASON CARTER', 'SOPHIE MITCHELL', 'ETHAN ROBERTS', 'ZOE TURNER',
  'ARCHIE PHILLIPS', 'RUBY CAMPBELL', 'JOSHUA PARKER', 'FREYA EVANS', 'LOGAN COLLINS',
  // Arabic names
  'AHMED ALI', 'FATIMA KHAN', 'MOHAMMED HASSAN', 'LAILA ABDULLAH', 'OMAR SAEED',
  // Indian names
  'RAHUL SHARMA', 'PRIYA PATEL', 'ARJUN SINGH', 'ANITA KUMAR', 'VIKRAM DAS',
];
const FAKE_PRIZES = [
  '500 AED PREPAID GIFT CARD',
  '750 AED PREPAID GIFT CARD',
  '1000 AED PREPAID GIFT CARD',
];

interface LeaderboardEntry {
  id: string;
  name: string;
  selected_prize: string;
  entry_date: string;
}

export default function LiveLeaderboard() {
  const [recentWinners, setRecentWinners] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [fakeEntries, setFakeEntries] = useState<LeaderboardEntry[]>([]);

  // ------------------ FAKE ENTRY GENERATOR ------------------
  useEffect(() => {
    const generateFakeEntry = () => {
      const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
      const prize = FAKE_PRIZES[Math.floor(Math.random() * FAKE_PRIZES.length)];
      const newEntry: LeaderboardEntry = {
        id: 'fake-' + Date.now(),
        name,
        selected_prize: prize,
        entry_date: new Date().toISOString(),
      };

      setFakeEntries(prev => {
        const updated = [newEntry, ...prev];
        // cap at 15 fake rows
        return updated.slice(0, 15);
      });
    };

    // first fake entry appears quickly so the board never looks empty
    const initialTimeout = setTimeout(generateFakeEntry, 5000);

    // subsequent entries every 30-60 s
    const interval = setInterval(generateFakeEntry, 30000 + Math.random() * 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial data
    const fetchRecentWinners = async () => {
      try {
        console.log('Fetching recent winners...');
        const { data, error } = await supabase
          .from('wheel_entries')
          .select('id, name, selected_prize, entry_date')
          .order('entry_date', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching recent winners:', error);
          return;
        }

        console.log('Fetched data:', data);
        setRecentWinners(data || []);
      } catch (error) {
        console.error('Failed to fetch recent winners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentWinners();

    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wheel_entries'
        },
        (payload) => {
          const newEntry = payload.new as LeaderboardEntry;
          setRecentWinners(prev => [newEntry, ...prev.slice(0, 9)]);
          
          // Show a brief notification for new entries
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Winner!', {
              body: `${newEntry.name} just won ${newEntry.selected_prize}!`,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const truncatePrize = (prize: string) => {
    if (prize.length <= 30) return prize;
    return prize.substring(0, 27) + '...';
  };

  // merge fake + real, newest first
  const combinedEntries = [...fakeEntries, ...recentWinners].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="fixed top-24 right-2 sm:hidden z-40">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-white/20 backdrop-blur-md rounded-lg p-2 border border-white/20 text-white"
        >
          {isVisible ? '📊' : '🏆'}
        </button>
      </div>
      
      {/* Mobile: Fixed sidebar */}
      <div className={`
        sm:hidden fixed top-24 right-2 w-72 max-h-80 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden z-40 transition-all duration-300 ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }
      `}>
        <div className="bg-white/20 px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-bold text-sm flex items-center">
            <span className="mr-2">🏆</span>
            Live Leaderboard
            <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </h3>
        </div>
      
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="text-white/60 text-sm">Loading...</div>
            </div>
          ) : combinedEntries.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-white/60 text-sm">No entries yet</div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {combinedEntries.map((entry, index) => (
                <div key={entry.id} className="p-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-white/20 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm break-words">
                          {entry.name}
                        </div>
                        <div className="text-white/70 text-xs break-words">
                          {truncatePrize(entry.selected_prize)}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/50 text-xs ml-2 flex-shrink-0">
                      {formatDate(entry.entry_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Fixed on the right side */}
      <div className="hidden sm:block fixed top-1/2 right-4 transform -translate-y-1/2 w-96 max-h-80 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden z-40">
        <div className="bg-white/20 px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-bold text-sm flex items-center">
            <span className="mr-2">🏆</span>
            Live Leaderboard
            <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </h3>
        </div>
      
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="text-white/60 text-sm">Loading...</div>
            </div>
          ) : combinedEntries.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-white/60 text-sm">No entries yet</div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {combinedEntries.map((entry, index) => (
                <div key={entry.id} className="p-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-white/20 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm break-words">
                          {entry.name}
                        </div>
                        <div className="text-white/70 text-xs break-words">
                          {truncatePrize(entry.selected_prize)}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/50 text-xs ml-2 flex-shrink-0">
                      {formatDate(entry.entry_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 