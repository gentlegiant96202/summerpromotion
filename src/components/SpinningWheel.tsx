"use client";

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';

// --- Interfaces ---
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

// --- Ref Handle ---
export interface SpinningWheelRef {
  doSpin: () => void;
}

// --- Configuration ---
const SLICE_COUNT = 10;
const SLICE_DEGREE = 360 / SLICE_COUNT;

const wheelPrizes = [
  { prizeId: 1, label: ["1000 AED", "GIFT CARD"] }, // Slice 0
  { prizeId: 4, label: ["250 AED", "GIFT CARD"] },  // Slice 1
  { prizeId: 4, label: ["250 AED", "GIFT CARD"] },  // Slice 2
  { prizeId: 3, label: ["500 AED", "GIFT CARD"] },  // Slice 3
  { prizeId: 4, label: ["250 AED", "GIFT CARD"] },  // Slice 4
  { prizeId: 4, label: ["250 AED", "GIFT CARD"] },  // Slice 5
  { prizeId: 2, label: ["750 AED", "GIFT CARD"] },  // Slice 6
  { prizeId: 4, label: ["250 AED", "GIFT CARD"] },  // Slice 7
  { prizeId: 3, label: ["500 AED", "GIFT CARD"] },  // Slice 8
  { prizeId: 4, label: ["250 AED", "GIFT CARD"] },  // Slice 9
];

// --- Component ---
const SpinningWheel = forwardRef<SpinningWheelRef, SpinningWheelProps>(({
  prizes,
  onSpinComplete,
  isSpinning,
  onSpinStart,
  disabled = false,
}, ref) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const getPrizeBySliceIndex = (index: number) => {
    const prizeInfo = wheelPrizes[index];
    return prizes.find(p => p.id === prizeInfo.prizeId)!;
  };

  const handleSpin = () => {
    // Only check disabled, not isSpinning since parent controls that
    if (disabled) return;

    console.log('Wheel handleSpin called, isSpinning:', isSpinning, 'disabled:', disabled);

    // This function is called via ref from form submission
    // The wheel spinning logic only - form modal already handled
    
    const random = Math.random();
    const targetPrizeId = random < 0.7 ? 4 : 3;

    const possibleSlices = wheelPrizes
      .map((p, i) => (p.prizeId === targetPrizeId ? i : -1))
      .filter(i => i !== -1);
    
    const targetSliceIndex = possibleSlices[Math.floor(Math.random() * possibleSlices.length)];

    const targetRotation = 360 - (targetSliceIndex * SLICE_DEGREE);
    const randomRotations = Math.floor(Math.random() * 5 + 5) * 360;
    
    const newRotation = rotation + randomRotations + targetRotation - (rotation % 360);
    
    console.log('Starting wheel spin, new rotation:', newRotation);
    setRotation(newRotation);

    setTimeout(() => {
        const finalPrize = getPrizeBySliceIndex(targetSliceIndex);
        console.log('Wheel spin complete, final prize:', finalPrize);
        onSpinComplete(finalPrize);
    }, 5000);
  };

  useImperativeHandle(ref, () => ({
    doSpin: handleSpin,
  }));

  return (
    <>
      <style jsx>{`
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
            box-shadow: 0 0 15px rgba(255,255,255,0.4), 0 0 25px rgba(0,0,0,0.2);
          }
          50% {
            box-shadow: 0 0 25px rgba(255,255,255,0.6), 0 0 35px rgba(255,255,255,0.3), 0 0 45px rgba(0,0,0,0.1);
          }
        }

        .wheel-container {
          position: relative;
          width: 500px;
          height: 500px;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: pulse-glow 3s ease-in-out infinite;
          border-radius: 50%;
        }
        .pointer {
          position: absolute;
          top: 10px;
          left: 51%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
          border-top: 40px solid #7c0c0c;
          z-index: 20;
        }
        .wheel {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 12px solid #7c0c0c;
          position: relative;
          overflow: hidden;
          transition: transform 5s cubic-bezier(0.1, 0.7, 0.3, 1);
          background: conic-gradient(
            #e5e7eb 0deg 36deg, #d1d5db 36deg 72deg, #e5e7eb 72deg 108deg,
            #d1d5db 108deg 144deg, #e5e7eb 144deg 180deg, #d1d5db 180deg 216deg,
            #e5e7eb 216deg 252deg, #d1d5db 252deg 288deg, #e5e7eb 288deg 324deg,
            #d1d5db 324deg 360deg
          );
        }
        .slice-text {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
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
        }
        .spin-button-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
        }
         .spin-button {
          background: linear-gradient(145deg, #e5e5e5, #b8b8b8);
          color: #7c0c0c;
          border-radius: 50%;
          width: 100px;
          height: 100px;
          font-weight: 700;
          font-size: 24px;
          border: 8px solid #7c0c0c;
          box-shadow: 0 0 15px rgba(255,255,255,0.4), 0 0 25px rgba(0,0,0,0.2);
          cursor: pointer;
          animation: spin-button-pulse 2s ease-in-out infinite;
          /* Restrict transition to box-shadow only to avoid size/transform glitches */
          transition: box-shadow 0.3s ease;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .spin-button:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (max-width: 640px) {
          .wheel-container { width: 300px; height: 300px; }
          .slice-text { font-size: 8px; transform: rotate(var(--angle)) translateY(-120px); }
          .spin-button { width: 80px; height: 80px; font-size: 20px; border-width: 6px; }
          .pointer { border-left-width: 15px; border-right-width: 15px; border-top-width: 25px; top: 6px; left: 51%; }
        }
      `}</style>

      <div className="wheel-container">
        <div className="pointer" />
        <div
          ref={wheelRef}
          className="wheel"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {wheelPrizes.map((prize, i) => (
            <div
              key={i}
              className="slice-text"
              style={{ '--angle': `${i * SLICE_DEGREE + (SLICE_DEGREE / 2)}deg` } as React.CSSProperties}
            >
              {prize.label.map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx < prize.label.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
        <div className="spin-button-container">
           <button
            onClick={onSpinStart}
            disabled={isSpinning || disabled}
            className="spin-button"
          >
            {isSpinning ? "..." : disabled ? "WON" : "SPIN"}
          </button>
        </div>
      </div>
    </>
  );
});

SpinningWheel.displayName = 'SpinningWheel';
export default SpinningWheel; 