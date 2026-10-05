import React from 'react';

interface NationalEmblemProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'navy' | 'gold' | 'white' | 'dark';
  className?: string;
  showMotto?: boolean;
}

/**
 * State Emblem of India (Lion Capital of Ashoka)
 * With the four Asiatic lions back-to-back, Ashoka Chakra,
 * and the sacred motto "सत्यमेव जयते" (Truth Alone Triumphs).
 */
export const NationalEmblem: React.FC<NationalEmblemProps> = ({
  size = 'md',
  variant = 'navy',
  className = '',
  showMotto = true,
}) => {
  const sizeMap = {
    sm: { width: 32, height: 38 },
    md: { width: 44, height: 52 },
    lg: { width: 56, height: 66 },
    xl: { width: 72, height: 86 },
  };

  const colorMap = {
    navy: {
      primary: '#0b2a6b',
      secondary: '#1d4fb8',
      accent: '#f58a3c',
      motto: '#0b2a6b',
    },
    gold: {
      primary: '#d4af37',
      secondary: '#c59b27',
      accent: '#f39c12',
      motto: '#b8860b',
    },
    white: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      accent: '#f58a3c',
      motto: '#ffffff',
    },
    dark: {
      primary: '#0f2147',
      secondary: '#1c2f58',
      accent: '#f58a3c',
      motto: '#0f2147',
    },
  };

  const { width, height } = sizeMap[size];
  const colors = colorMap[variant];

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      title="State Emblem of India — Satyameva Jayate"
      aria-label="State Emblem of India"
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm transition-transform hover:scale-105 duration-200"
      >
        {/* Crown / Top Profile of the Lions */}
        <g fill={colors.primary}>
          {/* Central Lion Head */}
          <path d="M42 12 C42 7, 58 7, 58 12 C60 14, 62 18, 62 23 C62 28, 59 31, 56 34 L56 40 C56 42, 54 44, 50 44 C46 44, 44 42, 44 40 L44 34 C41 31, 38 28, 38 23 C38 18, 40 14, 42 12 Z" />
          
          {/* Central Lion Mane tufts */}
          <path d="M44 18 C46 16, 54 16, 56 18 C58 21, 58 25, 56 28 C54 30, 46 30, 44 28 C42 25, 42 21, 44 18 Z" fill={colors.secondary} opacity="0.35" />
          
          {/* Left Lion Head & Silhouette */}
          <path d="M38 17 C34 16, 26 21, 24 28 C22 34, 25 41, 30 45 C34 48, 38 46, 42 43 L42 35 C38 33, 36 29, 36 25 C36 21, 37 19, 38 17 Z" />
          {/* Left Lion Mane accents */}
          <path d="M28 26 C26 31, 28 36, 32 38 C35 39, 38 37, 38 33 C38 29, 34 26, 28 26 Z" fill={colors.secondary} opacity="0.4" />
          
          {/* Right Lion Head & Silhouette */}
          <path d="M62 17 C66 16, 74 21, 76 28 C78 34, 75 41, 70 45 C66 48, 62 46, 58 43 L58 35 C62 33, 64 29, 64 25 C64 21, 63 19, 62 17 Z" />
          {/* Right Lion Mane accents */}
          <path d="M72 26 C74 31, 72 36, 68 38 C65 39, 62 37, 62 33 C62 29, 66 26, 72 26 Z" fill={colors.secondary} opacity="0.4" />

          {/* Forepaws of Lions on Abacus */}
          <path d="M32 46 C32 44, 37 44, 37 49 L37 57 C37 60, 31 60, 31 57 Z" />
          <path d="M43 47 C43 45, 47 45, 47 50 L47 57 C47 60, 42 60, 42 57 Z" />
          <path d="M53 47 C53 45, 57 45, 57 50 L57 57 C57 60, 52 60, 52 57 Z" />
          <path d="M63 46 C63 44, 68 44, 68 49 L68 57 C68 60, 62 60, 62 57 Z" />
        </g>

        {/* The Abacus Platform (Circular base) */}
        <rect x="18" y="58" width="64" height="15" rx="3" fill={colors.primary} />
        <rect x="20" y="60" width="60" height="11" rx="2" fill="white" opacity="0.15" />

        {/* Ashoka Chakra in Center of Abacus */}
        <circle cx="50" cy="65.5" r="5.5" stroke="white" strokeWidth="1.2" fill={colors.secondary} />
        <circle cx="50" cy="65.5" r="1.5" fill="white" />
        {/* Chakra Spokes (24 rays stylized as 8 primary spokes) */}
        {[0, 45, 90, 135].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="60.5"
            x2="50"
            y2="70.5"
            stroke="white"
            strokeWidth="0.75"
            transform={`rotate(${deg} 50 65.5)`}
          />
        ))}

        {/* Galloping Horse on the Left of Abacus */}
        <path
          d="M26 63 C27 61, 30 61, 32 63 C33 65, 31 68, 28 68 C27 68, 25 66, 26 63 Z"
          fill="white"
          opacity="0.85"
        />
        
        {/* Galloping Bull on the Right of Abacus */}
        <path
          d="M74 63 C73 61, 70 61, 68 63 C67 65, 69 68, 72 68 C73 68, 75 66, 74 63 Z"
          fill="white"
          opacity="0.85"
        />

        {/* Bell-shaped Lotus Base (Inverted Lotus) */}
        <path
          d="M24 74 C24 74, 30 84, 50 84 C70 84, 76 74, 76 74 C73 78, 66 87, 50 87 C34 87, 27 78, 24 74 Z"
          fill={colors.primary}
        />
        {/* Lotus petal fluting lines */}
        {[34, 42, 50, 58, 66].map((x) => (
          <line
            key={x}
            x1={x}
            y1="75"
            x2={x}
            y2="83"
            stroke="white"
            strokeWidth="0.8"
            opacity="0.4"
          />
        ))}

        {/* Lower Stepped Base Plinth */}
        <rect x="22" y="88" width="56" height="4" rx="1.5" fill={colors.primary} />
        <rect x="28" y="93" width="44" height="2.5" rx="1" fill={colors.primary} opacity="0.8" />

        {/* Inscription: Satyameva Jayate (सत्यमेव जयते) */}
        {showMotto && (
          <text
            x="50"
            y="108"
            textAnchor="middle"
            fill={colors.motto}
            fontSize="8.5"
            fontFamily="'Noto Sans Devanagari', 'Mangal', 'Yash', sans-serif"
            fontWeight="bold"
            letterSpacing="0.8"
          >
            सत्यमेव जयते
          </text>
        )}
      </svg>
    </div>
  );
};
