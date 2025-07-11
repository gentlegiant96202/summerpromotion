"use client";

import { useState, useEffect } from 'react';
import SpinningWheel from '@/components/SpinningWheel';
import { createClient } from '../lib/supabase';
import Image from 'next/image';

interface LeaderboardEntry {
  id: string;
  name: string;
  selected_prize: string;
  entry_date: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    countryCode: '+971'
  });
  const [submittedFormData, setSubmittedFormData] = useState({
    name: '',
    mobile: '',
    countryCode: '+971'
  });
  const [isSpinning, setIsSpinning] = useState(false);

  // Track if this user has already spun to disable further spins
  const [hasSpun, setHasSpun] = useState(false);

  // Error message if this mobile has already spun
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const [showWheel, setShowWheel] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{ id: number; name: string; color: string; probability: number } | null>(null);
  const [recentWinners, setRecentWinners] = useState<LeaderboardEntry[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

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
    'AED 250 PREPAID GIFT CARD',
    'AED 500 PREPAID GIFT CARD',
    'AED 750 PREPAID GIFT CARD',
    'AED 1000 PREPAID GIFT CARD',
  ];

  const [fakeEntries, setFakeEntries] = useState<LeaderboardEntry[]>([]);

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
        return updated.slice(0, 15);
      });
    };

    const first = setTimeout(generateFakeEntry, 5000);
    const interval = setInterval(generateFakeEntry, 30000 + Math.random() * 30000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [FAKE_NAMES, FAKE_PRIZES]);

  const combinedEntries = [...fakeEntries, ...recentWinners].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  const prizes = [
    { id: 1, name: 'AED 1000 PREPAID GIFT CARD', color: '#D85050', probability: 0 },
    { id: 2, name: 'AED 750 PREPAID GIFT CARD', color: '#D85050', probability: 0 },
    { id: 3, name: 'AED 500 PREPAID GIFT CARD', color: '#D85050', probability: 0.3 },
    { id: 4, name: 'AED 250 PREPAID GIFT CARD', color: '#D85050', probability: 0.7 }
  ];

  // Fetch leaderboard data
  useEffect(() => {
    const supabase = createClient();

    const fetchRecentWinners = async () => {
      try {
        const { data, error } = await supabase
          .from('wheel_entries')
          .select('id, name, selected_prize, entry_date')
          .order('entry_date', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching recent winners:', error);
          return;
        }

        setRecentWinners(data || []);
      } catch (error) {
        console.error('Failed to fetch recent winners:', error);
      } finally {
        setIsLoadingWinners(false);
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper functions for leaderboard
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const truncateName = (name: string) => {
    if (name.length <= 15) return name;
    return name.substring(0, 12) + '...';
  };

  const truncatePrize = (prize: string) => {
    if (prize.length <= 25) return prize;
    return prize.substring(0, 22) + '...';
  };

  // Sound effects (commented out until sound files are added)
  const playSpinSound = () => {
    // const audio = new Audio('/spin-sound.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => console.log('Audio play failed'));
  };

  const playWinSound = () => {
    // const audio = new Audio('/win-sound.mp3');
    // audio.volume = 0.4;
    // audio.play().catch(() => console.log('Audio play failed'));
  };

  // Save entry to database
  const saveEntryToDatabase = async (prize: { id: number; name: string; color: string; probability: number }) => {
    const supabase = createClient();
    
    try {
      const clientIP = await getClientIP();
      
      const { error } = await supabase
        .from('wheel_entries')
        .insert([
          {
            name: submittedFormData.name.toUpperCase(),
            mobile: submittedFormData.countryCode + submittedFormData.mobile,
            selected_prize: prize.name,
            prize_id: prize.id,
            ip_address: clientIP,
            entry_date: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error saving to database:', error);
        throw error;
      }

    } catch (error) {
      console.error('Failed to save entry:', error);
      throw error;
    }
  };

  const sendWebhook = async (winnerData: {
    name: string;
    mobile: string;
    prize: string;
    entryDate: string;
  }) => {
    try {
      // Bothook.io webhook endpoint
      const webhookUrl = 'https://bothook.io/v1/public/triggers/webhooks/ad29e7ad-96a8-4710-83cc-6c2a3ec49564';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'wheel_winner',
          data: {
            name: winnerData.name,
            mobile: winnerData.mobile,
            prize: winnerData.prize,
            entry_date: winnerData.entryDate,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.status, response.statusText);
      } else {
        console.log('Webhook sent successfully to Bothook.io');
      }
    } catch (error) {
      console.error('Failed to send webhook:', error);
      // Don't throw error - webhook failure shouldn't break the user experience
    }
  };

  // Get client IP (simplified version)
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return 'unknown';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullMobile = formData.countryCode + formData.mobile;
    const supabase = createClient();

    try {
      // Check for existing mobile number
      const { data: existingEntries, error: dupError } = await supabase
        .from('wheel_entries')
        .select('*')
        .eq('mobile', fullMobile);

      if (dupError) {
        console.error('Duplicate check failed:', dupError);
        setDuplicateError('Something went wrong. Please try again later.');
        return;
      }

      if (existingEntries && existingEntries.length > 0) {
        setDuplicateError('You have already entered and won a Prepaid Gift Card. Thank you!');
        return;
      }

      setDuplicateError(null);
      setSubmittedFormData(formData);
      setShowWheel(true);

      // Reset form
      setFormData({ name: '', mobile: '', countryCode: '+971' });
    } catch (error) {
      console.error('Unexpected error in form submit:', error);
      setDuplicateError('Something went wrong. Please try again later.');
    }
  };

  const handleSpinStart = () => {
    
    // Add haptic feedback for mobile when starting spin
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
    
    setIsSpinning(true);
    playSpinSound();
  };

  const handleSpinComplete = async (prize: { id: number; name: string; color: string; probability: number }) => {
    setHasSpun(true);
    
    // Add haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    setIsSpinning(false);
    
    try {
      // Save to database
      await saveEntryToDatabase(prize);
      
      // Send webhook with winner data
      await sendWebhook({
        name: submittedFormData.name.toUpperCase(),
        mobile: submittedFormData.countryCode + submittedFormData.mobile,
        prize: prize.name,
        entryDate: new Date().toISOString()
      });
      
      // Play win sound
      playWinSound();
      
      // Show confetti
      setShowConfetti(true);
      
      // Set current prize and show congratulations modal
      setCurrentPrize(prize);
      setShowCongratulations(true);
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to save entry:', error);
      // Still show the congratulations even if database save fails
      setCurrentPrize(prize);
      playWinSound();
      setShowConfetti(true);
      setShowCongratulations(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  };

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const confetti = () => {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 150; i++) {
          setTimeout(() => {
            const confettiPiece = document.createElement('div');
            confettiPiece.style.position = 'fixed';
            confettiPiece.style.left = Math.random() * 100 + 'vw';
            confettiPiece.style.top = '-10px';
            confettiPiece.style.width = '10px';
            confettiPiece.style.height = '10px';
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiPiece.style.borderRadius = '50%';
            confettiPiece.style.pointerEvents = 'none';
            confettiPiece.style.zIndex = '9999';
            confettiPiece.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
            
            document.body.appendChild(confettiPiece);
            
            setTimeout(() => {
              if (document.body.contains(confettiPiece)) {
                document.body.removeChild(confettiPiece);
              }
            }, 5000);
          }, i * 20);
        }
      };
      
      confetti();
    }
  }, [showConfetti]);

  return (
    <>
      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        
        .confetti {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
        }
        
        .congratulations-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }
        
                                .modal-content {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          max-width: 500px;
          margin: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.5s ease-out;
        }
        
        .modal-title {
          color: #ffffff;
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .modal-message {
          color: #e5e7eb;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        
        .modal-prize {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 15px;
          margin: 20px 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .modal-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 30px;
          border-radius: 25px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .modal-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .background-wheel {
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 12px solid #7c0c0c;
          position: relative;
          background: conic-gradient(
            #e5e7eb 0deg 45deg,
            #f1f5f9 45deg 90deg,
            #e5e7eb 90deg 135deg,
            #f1f5f9 135deg 180deg,
            #e5e7eb 180deg 225deg,
            #f1f5f9 225deg 270deg,
            #e5e7eb 270deg 315deg,
            #f1f5f9 315deg 360deg
          );
          box-shadow: inset 0 0 0 2px #c0c0c0, inset 0 0 0 4px white;
          opacity: 0.3;
          filter: blur(2px);
        }

        .background-wheel .inner-circle {
          position: absolute;
          width: 120px;
          height: 120px;
          background: #f3f4f6;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 640px) {
          .background-wheel {
            width: 300px;
            height: 300px;
            border: 8px solid #7c0c0c;
          }
          .background-wheel .inner-circle {
            width: 80px;
            height: 80px;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .background-wheel {
            width: 400px;
            height: 400px;
            border: 10px solid #7c0c0c;
          }
          .background-wheel .inner-circle {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>

        <main className="bg-black pt-4 pb-8">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="block lg:hidden w-full px-3 py-2 text-center">
            <Image src="/asset-2.png" alt="Logo" width={56} height={56} className="mx-auto rounded-lg" />
          </div>
          
          {/* Hero section with spinning wheel promotion */}
                       <div className="w-full px-3 sm:px-6 lg:px-8 py-1 sm:py-4 relative">
            
            {/* Background Wheel (only visible when form is shown) */}
            {!showWheel && (
              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ top: '120px' }}>
                <div className="background-wheel opacity-10 blur-sm scale-75">
                  <div className="inner-circle"></div>
                </div>
              </div>
            )}
            
            {!showWheel ? (
              /* Initial State - Two Column Layout: Form+Prizes on Left, Leaderboard on Right */
              <div className="w-full max-w-7xl mx-auto relative z-10 transition-all duration-1000 ease-out">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
                  {/* Left Column: Form and Prizes Combined */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 animate-[slideInLeft_0.8s_ease-out]">
                    <div className="space-y-6">
                      <div className="text-center space-y-3">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                          SPIN TO WIN!
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-200 font-medium">
                          Enter your details and spin to win amazing prizes!
                        </p>
                      </div>
                      
                      <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                          <label className="block text-base font-semibold text-gray-200 mb-2">
                            Your Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent uppercase"
                            style={{ '--tw-ring-color': '#D85050' } as React.CSSProperties}
                            placeholder="ENTER YOUR FULL NAME"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-base font-semibold text-gray-200 mb-2">
                            WhatsApp Number
                          </label>
                          <div className="flex">
                            <input
                              type="tel"
                              value={formData.countryCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9+]/g, '');
                                setFormData({...formData, countryCode: value});
                              }}
                              className="px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:border-transparent w-20"
                              style={{ '--tw-ring-color': '#D85050' } as React.CSSProperties}
                              placeholder="+971"
                              maxLength={4}
                            />
                            <input
                              type="tel"
                              value={formData.mobile}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData({...formData, mobile: value});
                              }}
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-r-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                              style={{ '--tw-ring-color': '#D85050' } as React.CSSProperties}
                              placeholder="501234567"
                              maxLength={10}
                              required
                            />
                          </div>
                          <p className="text-sm text-gray-300 mt-2">We&apos;ll contact you if you win!</p>
                        </div>
                        
                        {duplicateError && (
                          <div className="mb-2 text-red-400 text-sm font-semibold">
                            {duplicateError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full bg-white text-black font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:bg-gray-200 text-xl"
                          style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}
                        >
                          SPIN TO WIN!
                        </button>
                      </form>

                      {/* Prizes Section - Show all prizes */}
                      <div className="mt-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                          AMAZING PRIZES
                        </h2>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                          {prizes.map((prize, index) => (
                            <div key={index} className="bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{prize.name}</span>
                                <span className="text-white/50 text-sm">#{index + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: Live Leaderboard */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 animate-[slideInRight_0.8s_ease-out]">
                      <div className="bg-white/20 px-4 py-3 border-b border-white/10 rounded-t-lg mb-4">
                        <h2 className="text-white font-bold text-lg flex items-center justify-center" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                          <span className="mr-2">🏆</span>
                          LIVE LEADERBOARD
                          <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </h2>
                      </div>
                      
                      <div className="space-y-2">
                        {isLoadingWinners ? (
                          <div className="p-3 text-center">
                            <div className="text-white/60 text-sm">Loading...</div>
                          </div>
                        ) : combinedEntries.length === 0 ? (
                          <div className="p-3 text-center">
                            <div className="text-white/60 text-sm">No entries yet</div>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/10">
                            {combinedEntries.map((entry, index) => (
                              <div key={entry.id} className="p-2 hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                      index === 0 ? 'bg-white/30 text-white' :
                                      index === 1 ? 'bg-white/25 text-white' :
                                      index === 2 ? 'bg-white/20 text-white' :
                                      'bg-white/20 text-white'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-white font-medium text-xs truncate">
                                        {truncateName(entry.name)}
                                      </div>
                                      <div className="text-white/70 text-xs truncate">
                                        {truncatePrize(entry.selected_prize)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-white/50 text-xs ml-2">
                                    {formatDate(entry.entry_date)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* After Form Submission - Show Spinning Wheel and Leaderboard */
                <div className="w-full max-w-7xl mx-auto relative z-10 transition-all duration-1000 ease-out">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {/* Spinning Wheel Section - Takes up 2/3 of the width on desktop */}
                    <div className="lg:col-span-2 flex flex-col items-center space-y-6">
                      {/* Title Section */}
                      <div className="text-center space-y-3">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                          SPIN THE WHEEL!
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-200 font-medium">
                          Good luck, {submittedFormData.name}!
                        </p>
        </div>
                      
                      {/* Spinning Wheel */}
                      <div className="flex justify-center">
                        <SpinningWheel
                          prizes={prizes}
                          isSpinning={isSpinning}
                          onSpinComplete={handleSpinComplete}
                          onSpinStart={handleSpinStart}
                          disabled={hasSpun}
                        />
                      </div>
                      
                      {/* Instructions */}
                      <div className="text-center max-w-md">
                        <p className="text-gray-300 text-sm">
                          Click the wheel to spin and discover your prize!
                        </p>
                      </div>
                    </div>
                    
                    {/* Leaderboard Section - Takes up 1/3 of the width on desktop */}
                    <div className="lg:col-span-1">
                      <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 sticky top-4">
                        <div className="bg-white/20 px-4 py-3 border-b border-white/10 rounded-t-lg mb-4">
                          <h2 className="text-white font-bold text-lg flex items-center justify-center" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                            <span className="mr-2">🏆</span>
                            LIVE LEADERBOARD
                            <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </h2>
                        </div>
                        
                        <div className="space-y-2">
                          {isLoadingWinners ? (
                            <div className="p-3 text-center">
                              <div className="text-white/60 text-sm">Loading...</div>
                            </div>
                          ) : combinedEntries.length === 0 ? (
                            <div className="p-3 text-center">
                              <div className="text-white/60 text-sm">No entries yet</div>
                            </div>
                          ) : (
                            <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
                              {combinedEntries.map((entry, index) => (
                                <div key={entry.id} className="p-2 hover:bg-white/5 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                        index === 0 ? 'bg-white/30 text-white' :
                                        index === 1 ? 'bg-white/25 text-white' :
                                        index === 2 ? 'bg-white/20 text-white' :
                                        'bg-white/20 text-white'
                                      }`}>
                                        {index + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium text-xs truncate">
                                          {entry.name}
                                        </div>
                                        <div className="text-white/70 text-xs truncate">
                                          {truncatePrize(entry.selected_prize)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-white/50 text-xs ml-2">
                                      {formatDate(entry.entry_date)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Congratulations Modal */}
            {showCongratulations && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-black rounded-2xl p-6 max-w-md w-full border border-white/20 animate-[fadeInScale_0.5s_ease-out] relative">
                  <button
                    onClick={() => setShowCongratulations(false)}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200 text-2xl font-bold"
                  >
                    ×
                  </button>
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                      CONGRATULATIONS!
                    </h2>
                    <p className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>
                      YOU&apos;VE JUST WON {currentPrize ? currentPrize.name : 'AED 250'}!
                    </p>
                    <p className="text-gray-300 mb-6">
                      More details will be shared soon. Thank you for participating!
                    </p>
                  </div>
                </div>
    </div>
            )}
          </main>
        </>
  );
}
