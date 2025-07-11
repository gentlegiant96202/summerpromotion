"use client";

import React, { useState, useRef } from 'react';

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

// --- Configuration ---
const SLICE_COUNT = 10;
const SLICE_DEGREE = 360 / SLICE_COUNT;

const wheelPrizes = [
  { prizeId: 1, label: ["AED 1000", "PREPAID", "GIFT CARD"] }, // Slice 0
  { prizeId: 4, label: ["AED 250", "PREPAID", "GIFT CARD"] },  // Slice 1
  { prizeId: 4, label: ["AED 250", "PREPAID", "GIFT CARD"] },  // Slice 2
  { prizeId: 3, label: ["AED 500", "PREPAID", "GIFT CARD"] },  // Slice 3
  { prizeId: 4, label: ["AED 250", "PREPAID", "GIFT CARD"] },  // Slice 4
  { prizeId: 4, label: ["AED 250", "PREPAID", "GIFT CARD"] },  // Slice 5
  { prizeId: 2, label: ["AED 750", "PREPAID", "GIFT CARD"] },  // Slice 6
  { prizeId: 4, label: ["AED 250", "PREPAID", "GIFT CARD"] },  // Slice 7
  { prizeId: 3, label: ["AED 500", "PREPAID", "GIFT CARD"] },  // Slice 8
  { prizeId: 4, label: ["AED 250", "PREPAID", "GIFT CARD"] },  // Slice 9
];

// --- Component ---
export default function SpinningWheel({
  prizes,
  onSpinComplete,
  isSpinning,
  onSpinStart,
  disabled = false,
}: SpinningWheelProps) {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const getPrizeBySliceIndex = (index: number) => {
    const prizeInfo = wheelPrizes[index];
    return prizes.find(p => p.id === prizeInfo.prizeId)!;
  };

  const spin = () => {
    if (isSpinning || disabled) return;

    onSpinStart();

    const random = Math.random();
    const targetPrizeId = random < 0.7 ? 4 : 3;

    const possibleSlices = wheelPrizes
      .map((p, i) => (p.prizeId === targetPrizeId ? i : -1))
      .filter(i => i !== -1);
    
    const targetSliceIndex = possibleSlices[Math.floor(Math.random() * possibleSlices.length)];

    const targetRotation = 360 - (targetSliceIndex * SLICE_DEGREE);
    const randomRotations = Math.floor(Math.random() * 5 + 5) * 360;
    
    const newRotation = rotation + randomRotations + targetRotation - (rotation % 360);
    
    setRotation(newRotation);

    setTimeout(() => {
        const finalPrize = getPrizeBySliceIndex(targetSliceIndex);
        onSpinComplete(finalPrize);
    }, 5000);
  };

  return (
    <>
      <style jsx>{`
        .wheel-container {
          position: relative;
          width: 500px;
          height: 500px;
          display: flex;
          justify-content: center;
          align-items: center;
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
            #e5e7eb 0deg 36deg, #f1f5f9 36deg 72deg, #e5e7eb 72deg 108deg,
            #f1f5f9 108deg 144deg, #e5e7eb 144deg 180deg, #f1f5f9 180deg 216deg,
            #e5e7eb 216deg 252deg, #f1f5f9 252deg 288deg, #e5e7eb 288deg 324deg,
            #f1f5f9 324deg 360deg
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
          background: white;
          color: #7c0c0c;
          border-radius: 50%;
          width: 100px;
          height: 100px;
          font-weight: 700;
          font-size: 24px;
          border: 8px solid #7c0c0c;
          box-shadow: 0 0 15px rgba(0,0,0,0.2);
          cursor: pointer;
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
            onClick={spin}
            disabled={isSpinning || disabled}
            className="spin-button"
          >
            {isSpinning ? "..." : disabled ? "WON" : "SPIN"}
          </button>
        </div>
      </div>
    </>
  );
} 