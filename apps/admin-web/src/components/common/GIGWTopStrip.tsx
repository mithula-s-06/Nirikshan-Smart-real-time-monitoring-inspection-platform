import React, { useState, useEffect } from 'react';
import { Volume2, Eye, Globe2, Shield, Info, Check } from 'lucide-react';

interface GIGWTopStripProps {
  onSkipToContent?: () => void;
}

export const GIGWTopStrip: React.FC<GIGWTopStripProps> = ({ onSkipToContent }) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0); // -1 (small), 0 (normal), 1 (large)
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [screenReaderNotice, setScreenReaderNotice] = useState<boolean>(false);

  // Apply font size adjustment to document root
  const handleFontSizeChange = (delta: number) => {
    const nextLevel = Math.max(-1, Math.min(2, delta === 0 ? 0 : fontSizeLevel + delta));
    setFontSizeLevel(nextLevel);
    const scale = nextLevel === -1 ? '93%' : nextLevel === 0 ? '100%' : nextLevel === 1 ? '108%' : '115%';
    document.documentElement.style.fontSize = scale;
  };

  // Toggle contrast mode
  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSkipToContent) {
      onSkipToContent();
    } else {
      const mainEl = document.querySelector('main') || document.getElementById('main-content');
      if (mainEl) {
        mainEl.scrollIntoView({ behavior: 'smooth' });
        mainEl.focus();
      }
    }
  };

  return (
    <div className="w-full bg-[#071738] text-[#f1f5f9] text-[11px] select-none border-b border-[#132c63]">
      {/* 🇮🇳 National Tricolor Band (Saffron | White | India Green) */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#FF9933]" title="Tiranga Saffron" />
        <div className="w-1/3 bg-[#FFFFFF]" title="Tiranga White" />
        <div className="w-1/3 bg-[#138808]" title="Tiranga India Green" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Official Government of India & Ministry Identifiers */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium tracking-tight">
            <span className="text-[#FF9933] font-extrabold text-[11.5px] tracking-wide drop-shadow-sm">GOVERNMENT OF INDIA</span>
          </div>
          <span className="hidden sm:inline text-white/40">•</span>
          <div className="hidden md:flex items-center gap-1.5 text-white">
            <span className="text-white font-semibold text-[11px]">Ministry of Social Justice and Empowerment</span>
          </div>
        </div>

        {/* Right: GIGW Accessibility & Language Tools */}
        <div className="flex items-center gap-3 ml-auto text-[10.5px]">
          {/* Skip to Main Content (GIGW 3.0 Mandatory) */}
          <a
            href="#main-content"
            onClick={handleSkip}
            className="text-[#f1f5f9] hover:text-[#FF9933] underline font-semibold transition py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            Skip to Main Content
          </a>

          <span className="text-white/30">|</span>

          {/* Screen Reader Access */}
          <button
            type="button"
            onClick={() => setScreenReaderNotice(!screenReaderNotice)}
            className="flex items-center gap-1 text-[#f1f5f9] hover:text-[#FF9933] transition"
            title="Screen Reader Access Guidelines"
          >
            <Volume2 className="w-3 h-3 text-[#FF9933]" />
            <span className="hidden lg:inline font-medium">Screen Reader Access</span>
          </button>

          <span className="text-white/30">|</span>

          {/* Text Size Resizer: A- | A | A+ */}
          <div className="flex items-center gap-1 bg-[#0e224e] px-1.5 py-0.5 rounded border border-[#1d3d7d]">
            <button
              type="button"
              onClick={() => handleFontSizeChange(-1)}
              className={`px-1 rounded hover:bg-white/20 font-bold transition text-[10px] ${
                fontSizeLevel === -1 ? 'text-[#FF9933]' : 'text-[#f1f5f9]'
              }`}
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange(0)}
              className={`px-1 rounded hover:bg-white/20 font-bold transition text-[11px] ${
                fontSizeLevel === 0 ? 'text-[#FF9933]' : 'text-[#f1f5f9]'
              }`}
              title="Standard Font Size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange(1)}
              className={`px-1 rounded hover:bg-white/20 font-bold transition text-[12px] ${
                fontSizeLevel > 0 ? 'text-[#FF9933]' : 'text-[#f1f5f9]'
              }`}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          <span className="text-white/30">|</span>

          {/* Contrast Mode Toggle */}
          <button
            type="button"
            onClick={toggleContrast}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition ${
              highContrast
                ? 'bg-amber-400 text-[#071738] border-amber-300 font-bold'
                : 'bg-[#0e224e] border-[#1d3d7d] text-[#f1f5f9] hover:text-white'
            }`}
            title="Toggle High Contrast Mode"
          >
            <Eye className="w-3 h-3 text-amber-300" />
            <span className="hidden sm:inline font-medium">{highContrast ? 'Standard' : 'Contrast'}</span>
          </button>

          <span className="text-white/30">|</span>

          {/* Official Language Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0e224e] border border-[#1d3d7d]">
            <Globe2 className="w-3 h-3 text-emerald-400" />
            <span className="font-bold text-amber-300 text-[10.5px]">English</span>
            <span className="text-[9.5px] text-white/80 font-medium">(Official)</span>
          </div>
        </div>
      </div>

      {/* Screen Reader Modal / Banner */}
      {screenReaderNotice && (
        <div className="bg-[#0c1f48] border-t border-[#1c3f85] px-4 py-2 text-[#f1f5f9] text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl">
            <Info className="w-4 h-4 text-[#FF9933] shrink-0" />
            <span className="text-white/95">
              <strong className="text-white">Screen Reader Compatibility Notice:</strong> This NIRIKSHAN portal complies with the Guidelines for Indian Government Websites (GIGW 3.0) and World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. It is compatible with major screen readers including NVDA, JAWS, and VoiceOver.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScreenReaderNotice(false)}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
