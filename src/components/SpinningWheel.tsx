"use client";

import React, { useState } from "react";

interface Prize {
  id: number;
  name: string;
  color: string;
  probability: number;
}

interface SpinningWheelProps {
  prizes: Prize[]; // Must contain exactly 4 prizes (1000, 750, 500, 250) with ids 1-4
  onSpinComplete: (prize: Prize) => void;
  isSpinning: boolean;
  onSpinStart: () => void;
  disabled?: boolean;
}

/*****************************************************************************************
 * CONFIGURATION                                                                           *
 *****************************************************************************************/

// Wheel always has 10 equally-sized slices (36° each)
const SLICE_COUNT = 10;
const SLICE_DEG = 360 / SLICE_COUNT; // 36°
const TEXT_ROTATION_OFFSET = 18; // Text sits at the centre of the slice
// Fine-tune where the wheel stops so the pointer sits deeper inside the slice
const STOP_TWEAK_DEG = 9; // positive = wheel stops earlier (counter-clockwise)

// Pointer visual orientation in gradient degrees (0° = right, 90° = down)
const POINTER_DEG = 90; // Pointer arrow points straight downwards
// Hard-coded slice order – prize ids as defined in the parent component                    
// Index 0   1  2  3  4  5  6  7  8  9
// Prize  1000 250 250 750 250 250 250 500 250 250
const SLICE_PRIZE_IDS: number[] = [1, 4, 4, 2, 4, 4, 4, 3, 4, 4];

// Human-readable labels for each slice (kept in sync with prize/order above)
const SLICE_LABELS: string[][] = [
  ["AED 1000", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
  ["AED 750", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
  ["AED 500", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
  ["AED 250", "PREPAID", "GIFT CARD"],
];

/*****************************************************************************************
 * HELPER FUNCTIONS                                                                        *
 *****************************************************************************************/

// Returns the absolute wheel rotation (deg) required so that slice i lines up with pointer
const angleForSlice = (sliceIndex: number): number => {
  // Rotate wheel so that the chosen slice centre (offset by 18°) aligns with the pointer (90°)
  return (
    POINTER_DEG - (sliceIndex * SLICE_DEG + TEXT_ROTATION_OFFSET) + STOP_TWEAK_DEG + 360 * 2
  ) % 360;
};

// Given a wheel rotation, work out which slice is under the pointer
const sliceForAngle = (wheelAngle: number): number => {
  // Convert wheel rotation into pointer angle (0° at top, clockwise positive)
  const pointerAngle = (POINTER_DEG - wheelAngle + 360) % 360; // 0-359, with 0° at pointer
  // Shift so that slice centres start at 0° then divide by slice size
  const shifted = (pointerAngle + 360 - TEXT_ROTATION_OFFSET - STOP_TWEAK_DEG) % 360;
  return Math.floor(shifted / SLICE_DEG);
};

/*****************************************************************************************
 * COMPONENT                                                                               *
 *****************************************************************************************/

export default function SpinningWheel({
  prizes,
  onSpinComplete,
  isSpinning,
  onSpinStart,
  disabled = false,
}: SpinningWheelProps) {
  // Internal state tracks cumulative rotation
  const [angle, setAngle] = useState(0);

  // Utility to map slice index -> Prize object
  const prizeForSlice = (sliceIndex: number): Prize => {
    const prizeId = SLICE_PRIZE_IDS[sliceIndex];
    return (
      prizes.find((p) => p.id === prizeId) ||
      prizes[prizes.length - 1] // Fallback to last prize (should never happen)
    );
  };

  const spin = () => {
    // Guard clauses
    if (isSpinning || disabled) return;

    // Inform parent that spinning has begun
    onSpinStart();

    /**************************************************************************
     * 1. Pick the target slice                                                *
     *    The business rule is to ALWAYS land on the FIRST AED 250 slice      *
     **************************************************************************/
    const targetSlice = 2; // Slightly further 250 slice so pointer sits deeper inside

    // How far do we need to rotate from current orientation?                 
    const currentOrientation = angle % 360; // 0-359
    const targetOrientation = angleForSlice(targetSlice); // Absolute target angle
    const delta = (targetOrientation - currentOrientation + 360) % 360; // 0-359

    // Add 4-6 full rotations for effect
    const fullRotations = 4 + Math.floor(Math.random() * 3); // 4, 5 or 6
    const finalAngle = angle + fullRotations * 360 + delta;

    // Apply rotation – CSS transition handles animation
    setAngle(finalAngle);

    // Fire callback after transition ends (4s matches CSS duration)
    setTimeout(() => {
      const landedSlice = sliceForAngle(finalAngle % 360);
      onSpinComplete(prizeForSlice(landedSlice));
    }, 4000);
  };

  /*****************************************************************************************
   * RENDER                                                                                *
   *****************************************************************************************/

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
            #e5e7eb 0deg 36deg,
            #f1f5f9 36deg 72deg,
            #e5e7eb 72deg 108deg,
            #f1f5f9 108deg 144deg,
            #e5e7eb 144deg 180deg,
            #f1f5f9 180deg 216deg,
            #e5e7eb 216deg 252deg,
            #f1f5f9 252deg 288deg,
            #e5e7eb 288deg 324deg,
            #f1f5f9 324deg 360deg
          );
          box-shadow: inset 0 0 0 2px #c0c0c0, inset 0 0 0 4px #ffffff;
          transition: transform 4s cubic-bezier(0.33, 1, 0.68, 1);
        }

        .wheel:not(.spinning) {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: inset 0 0 0 2px #c0c0c0, inset 0 0 0 4px #ffffff,
              0 0 20px rgba(216, 80, 80, 0.3);
          }
          50% {
            box-shadow: inset 0 0 0 2px #c0c0c0, inset 0 0 0 4px #ffffff,
              0 0 40px rgba(216, 80, 80, 0.6);
          }
        }

        .wheel span {
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
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
        }

        .pointer {
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 25px solid #7c0c0c;
          /* Arrow initially points up; rotate 180° to point down */
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          transform-origin: 50% 80%;
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

        /* Spin button styling */
        .spin-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          font-weight: 700;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .spin-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .spin-button:active:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(1px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .spin-button:disabled {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        /* Responsive tweaks */
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
        {/* Pointer */}
        <div className="pointer" />

        {/* WHEEL */}
        <div
          className={`wheel ${isSpinning ? "spinning" : ""}`}
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="inner-circle" />
          {/* Render slice labels */}
          {SLICE_PRIZE_IDS.map((prizeId, i) => (
            <span
              key={i}
              style={{
                "--angle": `${TEXT_ROTATION_OFFSET + i * SLICE_DEG}deg`,
              } as React.CSSProperties}
            >
              {SLICE_LABELS[i].map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx < SLICE_LABELS[i].length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          ))}
        </div>

        {/* SPIN BUTTON */}
        <div className="flex justify-center mt-6">
          <button
            onClick={spin}
            disabled={isSpinning || disabled}
            className={`spin-button text-white font-bold py-3 px-8 rounded-lg text-lg ${
              isSpinning || disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              zIndex: 1000,
              fontFamily: "Impact, sans-serif",
              fontWeight: "normal",
            }}
          >
            {isSpinning ? "SPINNING..." : disabled ? "ALREADY WON!" : "SPIN NOW!"}
          </button>
        </div>
      </div>
    </>
  );
} 