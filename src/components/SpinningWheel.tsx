"use client";

import { useState } from 'react';

interface Prize {
  id: number;
  name: string;
  color: string;
  probability: number;
}

interface SpinningWheelProps {
  prizes: Prize[];
  onSpinComplete: (prize: Prize) => void;
  isSpinning: boolean;
  onSpinStart: () => void;
  disabled?: boolean;
}

export default function SpinningWheel({ prizes, onSpinComplete, isSpinning, onSpinStart, disabled = false }: SpinningWheelProps) {
  const [angle, setAngle] = useState(0);

  const spin = () => {
    console.log('Spin button clicked!');
    console.log('isSpinning:', isSpinning);
    console.log('disabled:', disabled);
    
    if (isSpinning || disabled) {
      console.log('Already spinning or disabled, returning early');
      return;
    }
    
    console.log('Starting spin...');
    onSpinStart();
    
    const randomDeg = Math.floor(Math.random() * 360 + 720);
    const newAngle = angle + randomDeg;
    console.log('New angle:', newAngle);
    setAngle(newAngle);
    
    // Calculate winning segment
    const segmentAngle = 360 / 8; // 8 segments
    const normalizedAngle = (360 - (newAngle % 360)) % 360;
    const winningSegment = Math.floor(normalizedAngle / segmentAngle);
    console.log('Winning segment:', winningSegment);
    
    setTimeout(() => {
      console.log('Spin complete, calling onSpinComplete');
      const selectedPrize = prizes[winningSegment] || prizes[0];
      onSpinComplete(selectedPrize);
    }, 4000);
  };

  console.log('Component render - isSpinning:', isSpinning);

  return (
    <>
      <style jsx>{`
        .wheel {
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
          transition: transform 4s cubic-bezier(0.33, 1, 0.68, 1);
        }

        .wheel:not(.spinning) {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: inset 0 0 0 2px #c0c0c0, inset 0 0 0 4px white, 0 0 20px rgba(216, 80, 80, 0.3);
          }
          50% {
            box-shadow: inset 0 0 0 2px #c0c0c0, inset 0 0 0 4px white, 0 0 40px rgba(216, 80, 80, 0.6);
          }
        }

        .wheel span {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0%;
          top: 0%;
          transform-origin: 50% 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.3;
          color: #1f2937;
          transform: rotate(var(--angle)) translateY(-200px);
          text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
        }

        .pointer {
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 25px solid #7c0c0c;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%) rotate(0deg);
          z-index: 20;
        }

        .inner-circle {
          position: absolute;
          width: 120px;
          height: 120px;
          background: #f3f4f6;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
          z-index: 1;
        }

        .spin-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          font-weight: 700;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .spin-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .spin-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .spin-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .spin-button:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 640px) {
          .wheel {
            width: 300px;
            height: 300px;
            border: 8px solid #7c0c0c;
          }
          .wheel span {
            font-size: 8px;
            transform: rotate(var(--angle)) translateY(-120px);
          }
          .inner-circle {
            width: 80px;
            height: 80px;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .wheel {
            width: 400px;
            height: 400px;
            border: 10px solid #7c0c0c;
          }
          .wheel span {
            font-size: 10px;
            transform: rotate(var(--angle)) translateY(-160px);
          }
          .inner-circle {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
      
      <div className="relative">
        <div className="pointer"></div>
        <div 
          id="wheel" 
          className={`wheel ${isSpinning ? 'spinning' : ''}`}
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="inner-circle"></div>
          <span style={{ '--angle': '22.5deg' } as React.CSSProperties}>
            4 YEARS PREMIUM<br />SERVICECARE
          </span>
          <span style={{ '--angle': '67.5deg' } as React.CSSProperties}>
            1000 AED<br />SERVICE GIFT CARD
          </span>
          <span style={{ '--angle': '112.5deg' } as React.CSSProperties}>
            FULL<br />CERAMIC COATING
          </span>
          <span style={{ '--angle': '157.5deg' } as React.CSSProperties}>
            2 YEARS STANDARD<br />SERVICECARE
          </span>
          <span style={{ '--angle': '202.5deg' } as React.CSSProperties}>
            MALL OF EMIRATES<br />GIFT CARD AED 3,500
          </span>
          <span style={{ '--angle': '247.5deg' } as React.CSSProperties}>
            4 YEARS PREMIUM<br />SERVICECARE
          </span>
          <span style={{ '--angle': '292.5deg' } as React.CSSProperties}>
            1000 AED<br />SERVICE GIFT CARD
          </span>
          <span style={{ '--angle': '337.5deg' } as React.CSSProperties}>
            FULL<br />CERAMIC COATING
          </span>
        </div>
        <div className="flex justify-center mt-6">
          <button 
            onClick={spin} 
            disabled={isSpinning || disabled}
            className={`spin-button text-white font-bold py-3 px-8 rounded-lg text-lg ${(isSpinning || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ zIndex: 1000, fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}
          >
            {isSpinning ? 'SPINNING...' : disabled ? 'ALREADY WON!' : 'SPIN NOW!'}
          </button>
        </div>
      </div>
    </>
  );
} 