import React from 'react';
import {
  ShieldCheck,
  Building,
  PhoneCall,
  ExternalLink,
  Lock,
  Server,
  FileText,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { NationalEmblem } from './NationalEmblem';

interface GovernmentFooterProps {
  compact?: boolean;
}

export const GovernmentFooter: React.FC<GovernmentFooterProps> = ({ compact = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#071738] text-[#cbd5e1] text-xs border-t border-[#132c63] mt-auto select-none">
      {/* 🇮🇳 National Tricolor Accent Divider */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-3.5">
        {/* Top Summary Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-[#132c63]">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <NationalEmblem size="sm" variant="white" showMotto={true} />
            <div className="leading-tight">
              <div className="text-[12px] font-extrabold text-white tracking-wide">
                Department of Social Justice and Empowerment
              </div>
              <div className="text-[10px] text-amber-300 font-semibold mt-0.5 flex items-center gap-1.5">
                <span>Ministry of Social Justice and Empowerment</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">Government of India</span>
              </div>
            </div>
          </div>

          {/* Helplines & Key Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <div className="px-2.5 py-1 rounded bg-[#0e214d] border border-[#1d3d7d] flex items-center gap-1.5">
              <PhoneCall className="w-3 h-3 text-amber-400" />
              <span className="text-[#94a3b8]">Elderline:</span>
              <span className="text-amber-400 font-bold font-mono">14566</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#0e214d] border border-[#1d3d7d] flex items-center gap-1.5">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span className="text-[#94a3b8]">De-addiction:</span>
              <span className="text-emerald-400 font-bold font-mono">1800-11-0031</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#0e214d] border border-[#1d3d7d] flex items-center gap-1.5">
              <PhoneCall className="w-3 h-3 text-sky-400" />
              <span className="text-[#94a3b8]">Disability:</span>
              <span className="text-sky-400 font-bold font-mono">14488</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#0b1c42] border border-[#1c3973] text-[9.5px] font-bold text-white">
              GIGW 3.0
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0b1c42] border border-[#1c3973] text-[9.5px] font-bold text-white">
              STQC
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0b1c42] border border-[#1c3973] text-[9.5px] font-bold text-white">
              NIC GI-Cloud
            </span>
          </div>
        </div>

        {/* Policy Links & Release Metadata */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[#94a3b8]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href="#terms" className="hover:text-amber-300 transition">Terms &amp; Conditions</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-amber-300 transition">Privacy Policy</a>
            <span>•</span>
            <a href="#hyperlink" className="hover:text-amber-300 transition">Hyperlinking Policy</a>
            <span>•</span>
            <a href="#copyright" className="hover:text-amber-300 transition">Copyright Policy</a>
            <span>•</span>
            <a href="#accessibility" className="hover:text-amber-300 transition">Accessibility</a>
            <span>•</span>
            <a href="#help" className="hover:text-amber-300 transition">Help &amp; FAQ</a>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-[#94a3b8]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Updated: <strong className="text-[#cbd5e1]">October 2026</strong></span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-400" />
              <span>Release: <strong className="text-[#cbd5e1]">v1.0.0-PROD</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Authority & Hosting Attribution Bar */}
      <div className="bg-[#050f26] border-t border-[#0d1d42] px-6 py-2 text-[10px] text-[#94a3b8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div>
            &copy; {currentYear} Department of Social Justice and Empowerment, Ministry of Social Justice and Empowerment, Government of India.
          </div>
          <div>
            Maintained by <strong className="text-white">National Informatics Centre (NIC)</strong> / NIRIKSHAN AI Project Directorate.
          </div>
        </div>
      </div>
    </footer>
  );
};
