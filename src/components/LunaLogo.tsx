import React from "react";

interface LunaLogoProps {
  className?: string;
  size?: number;
  hideText?: boolean;
}

export const LunaLogo: React.FC<LunaLogoProps> = ({ 
  className = "", 
  size = 120, 
  hideText = false 
}) => {
  return (
    <div 
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep Charcoal/Black Outer Background Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="#0C0A09" stroke="#E5C158" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="42" fill="#1C1917" stroke="#E5C158" strokeWidth="0.75" strokeDasharray="3,1" />

        {/* Central Crescent Moon (Gold) */}
        <path
          d="M 40,25 
             A 22,22 0 1,0 68,66 
             A 17,17 0 1,1 40,25"
          fill="url(#goldGradient)"
          filter="url(#subtleShadow)"
        />

        {/* Golden Spoon laying across the crescent moon */}
        <g transform="rotate(-32 50 50) translate(0, -2)">
          {/* Spoon head */}
          <ellipse cx="50" cy="30" rx="4.5" ry="7" fill="url(#goldGradient)" stroke="#78350F" strokeWidth="0.5" />
          {/* Spoon handle line */}
          <path
            d="M 50,37 L 50,72"
            stroke="url(#goldGradient)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Spoon handle details */}
          <circle cx="50" cy="72" r="1.8" fill="url(#goldGradient)" />
          {/* Shiny overlay on spoon */}
          <path
            d="M 48,27 A 2.5,4 0 0,1 49.5,35"
            stroke="#FFFFFF"
            strokeWidth="0.75"
            strokeLinecap="round"
            fill="none"
            opacity="0.65"
          />
        </g>

        {/* Sparkling Stars around (Gold) */}
        {/* Star 1 */}
        <polygon points="70,30 71.5,32.5 74,33 72,34.5 72.5,37 70,35.5 67.5,37 68,34.5 66,33 68.5,32.5" fill="#F43F5E" className="animate-pulse" opacity="0.3" /> {/* Little red berry star */}
        
        {/* Star 2 (Sparkly Golden 4-point star) */}
        <path d="M 32,38 Q 35,38 35,35 Q 35,38 38,38 Q 35,38 35,41 Q 35,38 32,38" fill="#E5C158" />
        {/* Star 3 (Sparkly Golden 4-point star) */}
        <path d="M 58,68 Q 60,68 60,66 Q 60,68 62,68 Q 60,68 60,70 Q 60,68 58,68" fill="#E5C158" />
        {/* Star 4 (Sparkly Golden 4-point star) */}
        <path d="M 72,50 Q 74,50 74,48 Q 74,50 76,50 Q 74,50 74,52 Q 74,50 72,50" fill="#E5C158" />

        {/* Brand Text around border (Simulated Circular Text paths) */}
        {/* Using standard text SVG elements aligned dynamically or simulated */}
        {!hideText && (
          <>
            {/* LUNA letter layout */}
            <text x="50" y="16" fill="#E5C158" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" letterSpacing="2" textAnchor="middle">
              LUNA
            </text>
            
            {/* CAFE letter layout */}
            <text x="50" y="91" fill="#E5C158" fontFamily="Georgia, serif" fontSize="7" fontWeight="bold" letterSpacing="3" textAnchor="middle">
              CAFÉ
            </text>
          </>
        )}

        {/* Gradients and Filters Definitions */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="40%" stopColor="#E5C158" />
            <stop offset="100%" stopColor="#B28926" />
          </linearGradient>

          <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};
