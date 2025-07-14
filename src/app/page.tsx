"use client";

import { useState, useEffect, useRef } from 'react';
import SpinningWheel, { SpinningWheelRef } from '@/components/SpinningWheel';
import { createClient } from '../lib/supabase';
import Image from 'next/image';

interface LeaderboardEntry {
  id: string;
  name: string;
  selected_prize: string;
  entry_date: string;
}

// Moved constant arrays outside the component to prevent re-creation on each render
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
  '250 AED GIFT CARD',
  '500 AED GIFT CARD',
  '750 AED GIFT CARD',
  '1000 AED GIFT CARD',
];

const prizes = [
  { id: 1, name: '1000 AED GIFT CARD', color: '#D85050', probability: 0 },
  { id: 2, name: '750 AED GIFT CARD', color: '#D85050', probability: 0 },
  { id: 3, name: '500 AED GIFT CARD', color: '#D85050', probability: 0.3 },
  { id: 4, name: '250 AED GIFT CARD', color: '#D85050', probability: 0.7 }
];

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
  const [hasSpun, setHasSpun] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  
  // Use ref to store form data reliably for webhook
  const submittedFormDataRef = useRef({
    name: '',
    mobile: '',
    countryCode: '+971'
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{ id: number; name: string; color: string; probability: number } | null>(null);
  const [recentWinners, setRecentWinners] = useState<LeaderboardEntry[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const wheelRef = useRef<SpinningWheelRef>(null);

  // ---------- FAKE LEADERBOARD DATA ----------
  

  const [fakeEntries, setFakeEntries] = useState<LeaderboardEntry[]>([]);
  const [usedNames, setUsedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generateFakeEntry = () => {
      // Filter out already used names
      const availableNames = FAKE_NAMES.filter(name => !usedNames.has(name));
      
      // If we've used all names, reset the used names set
      if (availableNames.length === 0) {
        setUsedNames(new Set());
        return;
      }
      
      const name = availableNames[Math.floor(Math.random() * availableNames.length)];
      const prize = FAKE_PRIZES[Math.floor(Math.random() * FAKE_PRIZES.length)];
      const newEntry: LeaderboardEntry = {
        id: 'fake-' + Date.now(),
        name,
        selected_prize: prize,
        entry_date: new Date().toISOString(),
      };
      
      setUsedNames(prev => new Set([...prev, name]));
      setFakeEntries(prev => {
        const updated = [newEntry, ...prev];
        return updated.slice(0, 10);
      });
    };

    // First entry after 10 seconds
    const first = setTimeout(generateFakeEntry, 10000);
    // Subsequent entries every 60-120 seconds (much less frequent)
    const interval = setInterval(generateFakeEntry, 60000 + Math.random() * 60000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [usedNames]);

  const combinedEntries = [...fakeEntries, ...recentWinners].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  

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
      
      const webhookPayload = {
        event: 'wheel_winner',
        data: {
          name: winnerData.name,
          mobile: winnerData.mobile,
          prize: winnerData.prize,
          entry_date: winnerData.entryDate,
          timestamp: new Date().toISOString()
        }
      };
      
      // Debug: Log what we're sending to the webhook
      console.log('Sending webhook payload:', JSON.stringify(webhookPayload, null, 2));
      console.log('Mobile number being sent:', winnerData.mobile);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
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
    
    // Prevent multiple submissions
    if (isSpinning) {
      console.log('Form submission blocked - already spinning');
      return;
    }
    
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
        setDuplicateError('You have already entered and won a Gift Card. Thank you!');
        return;
      }

      setDuplicateError(null);
      
      // Store the form data before resetting - use both state and ref
      const formDataToSubmit = { ...formData };
      setSubmittedFormData(formDataToSubmit);
      submittedFormDataRef.current = formDataToSubmit;
      
      console.log('Form submitted with data:', formDataToSubmit);
      console.log('Full mobile from form:', fullMobile);
      console.log('Stored in ref:', submittedFormDataRef.current);
      
      // Close modal first
      setShowFormModal(false);

      // Small delay to ensure modal closes before starting spin
      setTimeout(() => {
        // Add haptic feedback for mobile when starting spin
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
        
        playSpinSound();
        
        // Ensure wheel ref exists before calling doSpin
        if (wheelRef.current) {
          console.log('Calling doSpin...');
          setIsSpinning(true);
          wheelRef.current.doSpin();
        } else {
          console.error('wheelRef.current is null');
          setIsSpinning(false);
        }
      }, 100);

      // Reset form
      setFormData({ name: '', mobile: '', countryCode: '+971' });
    } catch (error) {
      console.error('Unexpected error in form submit:', error);
      setDuplicateError('Something went wrong. Please try again later.');
    }
  };

  const handleOpenFormModal = () => {
    setShowFormModal(true);
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
      
      // Add entry to local leaderboard immediately
      const formDataFromRef = submittedFormDataRef.current;
      const newEntry: LeaderboardEntry = {
        id: 'real-' + Date.now(),
        name: formDataFromRef.name.toUpperCase(),
        selected_prize: prize.name,
        entry_date: new Date().toISOString()
      };
      setRecentWinners(prev => [newEntry, ...prev.slice(0, 9)]);
      
      // Send webhook with winner data - use ref for reliable data
      const fullMobileForWebhook = formDataFromRef.countryCode + formDataFromRef.mobile;
      console.log('Debug webhook call:');
      console.log('submittedFormData state:', submittedFormData);
      console.log('submittedFormDataRef.current:', formDataFromRef);
      console.log('Country code from ref:', formDataFromRef.countryCode);
      console.log('Mobile number from ref:', formDataFromRef.mobile);
      console.log('Full mobile for webhook:', fullMobileForWebhook);
      
      await sendWebhook({
        name: formDataFromRef.name.toUpperCase(),
        mobile: fullMobileForWebhook,
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
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1), 0 0 60px rgba(255, 255, 255, 0.05);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.2), 0 0 90px rgba(255, 255, 255, 0.1);
          }
        }
        
        @keyframes spin-button-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.6), 0 0 35px rgba(255, 255, 255, 0.3);
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

        .form-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.4s ease-out;
        }

        .form-modal-content {
          background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 40px;
          max-width: 520px;
          width: 90%;
          box-shadow: 
            0 25px 80px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: modalSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .form-modal-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
        
        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: white;
          font-size: 18px;
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        
        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(40px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes smoothFadeIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes smoothSlideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes smoothSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-smooth-fade-in {
          animation: smoothFadeIn 0.8s ease-out forwards;
        }
        
        .animate-smooth-slide-left {
          animation: smoothSlideInLeft 1s ease-out forwards;
        }
        
        .animate-smooth-slide-right {
          animation: smoothSlideInRight 1s ease-out forwards;
        }
        
        .animate-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animate-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animate-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>

      <main className="bg-black pt-4 pb-8" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)' }}>
        {/* Mobile Logo - Only visible on mobile */}
        <div className="block lg:hidden w-full px-3 py-2 text-center opacity-0 animate-smooth-fade-in">
          <Image src="/asset-2.png" alt="Logo" width={56} height={56} className="mx-auto rounded-lg" />
        </div>
        
        {/* Hero section with spinning wheel promotion */}
         <div className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-4 relative flex items-center justify-center md:min-h-screen">
          <div className="w-full max-w-7xl mx-auto relative z-10 transition-all duration-1000 ease-out">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              
              {/* Left Column: Spinning Wheel */}
              <div className="flex flex-col items-center justify-center space-y-8 opacity-0 animate-smooth-slide-left animate-delay-200">
                <div className="text-center space-y-4 opacity-0 animate-smooth-fade-in animate-delay-400">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white drop-shadow-lg" style={{ fontFamily: 'Impact, sans-serif' }}>
                    SPIN TO WIN!
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-300 font-light">
                    Give it a spin—your prize awaits!
                  </p>
                </div>
                
                <div className="opacity-0 animate-smooth-fade-in animate-delay-600">
                  <SpinningWheel
                    ref={wheelRef}
                    prizes={prizes}
                    isSpinning={isSpinning}
                    onSpinComplete={handleSpinComplete}
                    onSpinStart={handleOpenFormModal}
                    disabled={hasSpun}
                  />
                </div>
              </div>
              
              {/* Right Column: Live Leaderboard */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 opacity-0 animate-smooth-slide-right animate-delay-400 flex flex-col justify-center h-full">
                <div className="bg-gradient-to-r from-white/20 via-white/25 to-white/20 px-4 py-3 border-b border-white/10 rounded-t-lg mb-4">
                                      <h2 className="text-white font-normal text-xl flex items-center justify-center tracking-wide" style={{ fontFamily: 'Impact, sans-serif' }}>
                      <span className="mr-2 text-2xl">🏆</span>
                      LIVE LEADERBOARD
                      <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    </h2>
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
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

          {/* Form Modal */}
          {showFormModal && (
            <div className="form-modal">
              <div className="form-modal-content">
                <button onClick={() => setShowFormModal(false)} className="close-button">&times;</button>
                                  <div className="text-center space-y-4 mb-10">
                    <h2 className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white tracking-wide" style={{ fontFamily: 'Impact, sans-serif' }}>
                      ENTER TO WIN
                    </h2>
                    <p className="text-sm text-gray-400 font-light tracking-wide">
                      Complete the form below to participate
                    </p>
                  </div>
                    
                                  <form onSubmit={handleFormSubmit} className="space-y-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-light text-gray-300 tracking-wide">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        className="w-full px-5 py-4 bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/30 transition-all duration-500 uppercase tracking-wide hover:bg-white/8"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-light text-gray-300 tracking-wide">
                        Mobile Number
                      </label>
                      <div className="flex space-x-3">
                        <input
                          type="tel"
                          value={formData.countryCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9+]/g, '');
                            setFormData({...formData, countryCode: value});
                          }}
                          className="px-4 py-4 bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/30 transition-all duration-500 w-28 text-center tracking-wide hover:bg-white/8"
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
                          className="flex-1 px-5 py-4 bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/30 transition-all duration-500 tracking-wide hover:bg-white/8"
                          placeholder="Enter mobile number"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  
                                      {duplicateError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-red-300 text-sm font-light tracking-wide">
                        {duplicateError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSpinning}
                      className="group w-full bg-gradient-to-r from-white to-gray-200 text-black font-light py-5 px-8 rounded-2xl transition-shadow duration-300 hover:shadow-2xl hover:from-gray-100 hover:to-gray-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-xl relative overflow-hidden tracking-wide"
                      style={{ fontFamily: 'Impact, sans-serif' }}
                    >
                      <span className="relative z-10">
                        {isSpinning ? 'SPINNING...' : 'SPIN TO WIN'}
                      </span>
                      {!isSpinning && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      )}
                    </button>
                </form>
              </div>
            </div>
          )}

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
                  <h2 className="text-2xl font-light text-white mb-4" style={{ fontFamily: 'Impact, sans-serif' }}>
                    CONGRATULATIONS!
                  </h2>
                  <p className="text-xl font-light text-white mb-4" style={{ fontFamily: 'Impact, sans-serif' }}>
                    YOU&apos;VE JUST WON {currentPrize ? currentPrize.name : 'AED 250'}!
                  </p>
                  <p className="text-gray-300 mb-6">
                    More details will be shared soon. Thank you for participating!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
    </>
  );
}