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
    <footer className="w-full bg-[#071738] text-slate-300 text-xs border-t border-[#132c63] mt-auto select-none">
      {/* 🇮🇳 National Tricolor Accent Divider */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      {!compact && (
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Ministry & Portal Identity */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <NationalEmblem size="md" variant="white" showMotto={true} />
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-white tracking-wide">
                    सामाजिक न्याय और अधिकारिता विभाग
                  </div>
                  <div className="text-[11px] font-bold text-amber-300">
                    Department of Social Justice and Empowerment
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium mt-0.5">
                    Ministry of Social Justice and Empowerment
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Government of India
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>NIRIKSHAN</strong> is an enterprise AI monitoring, surprise inspection, and financial audit platform engineered to ensure zero leakage, transparent grant disbursement, and genuine beneficiary delivery across all Central Sector Schemes.
              </p>

              <div className="text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Shastri Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001</span>
                </div>
              </div>
            </div>

            {/* Column 2: Flagship Schemes & Portals */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-[#1c3872] pb-1.5 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Direct Government Portals
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <a
                    href="https://socialjustice.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition flex items-center justify-between group"
                  >
                    <span>DoSJE Official Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://esanudaan.dosje.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition flex items-center justify-between group"
                  >
                    <span>e-Anudaan NGO Grant Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://pmdaksh.dosje.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition flex items-center justify-between group"
                  >
                    <span>PM-DAKSH Skill Development</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://pmajay.dosje.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition flex items-center justify-between group"
                  >
                    <span>PM-AJAY Adarsh Gram Yojana</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://transgender.dosje.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition flex items-center justify-between group"
                  >
                    <span>National Portal for Transgender Persons</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://india.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-300 transition flex items-center justify-between group"
                  >
                    <span>National Portal of India (india.gov.in)</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: 24x7 Helplines & Nodal Support */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-[#1c3872] pb-1.5 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> 24x7 National Helplines
              </h4>
              <div className="space-y-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#0e214d] border border-[#1d3d7d]">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Elderline / Social Justice</span>
                    <span className="text-amber-400 font-mono text-xs">14566</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Toll-free national grievance &amp; assistance</p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0e214d] border border-[#1d3d7d]">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>National De-addiction (NAPDDR)</span>
                    <span className="text-emerald-400 font-mono text-xs">1800-11-0031</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Toll-free counseling &amp; rehabilitation support</p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0e214d] border border-[#1d3d7d]">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Sugamya Bharat Divyangjan</span>
                    <span className="text-sky-400 font-mono text-xs">14488</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Accessibility infrastructure helpline</p>
                </div>
              </div>
            </div>

            {/* Column 4: Compliance, Cloud & Security Certifications */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-[#1c3872] pb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Standards &amp; Certifications
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="p-2 rounded bg-[#0b1c42] border border-[#1c3973] flex flex-col items-center text-center">
                  <span className="font-bold text-white">GIGW 3.0</span>
                  <span className="text-[9px] text-slate-400">Govt Website Standard</span>
                </div>
                <div className="p-2 rounded bg-[#0b1c42] border border-[#1c3973] flex flex-col items-center text-center">
                  <span className="font-bold text-white">STQC Certified</span>
                  <span className="text-[9px] text-slate-400">Quality Verified</span>
                </div>
                <div className="p-2 rounded bg-[#0b1c42] border border-[#1c3973] flex flex-col items-center text-center">
                  <span className="font-bold text-white">MeghRaj Cloud</span>
                  <span className="text-[9px] text-slate-400">NIC GI-Cloud</span>
                </div>
                <div className="p-2 rounded bg-[#0b1c42] border border-[#1c3973] flex flex-col items-center text-center">
                  <span className="font-bold text-white">ISO 27001</span>
                  <span className="text-[9px] text-slate-400">ISMS Security</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e214d] border border-[#1d3d7d] text-[10px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Lock className="w-3 h-3" />
                  <span>Zero-Trust Security &amp; Audit Logs</span>
                </div>
                <p className="text-slate-400">
                  Protected under the Information Technology Act, 2000. All queries, sessions, and CCTV stream accesses are logged with immutable SHA-256 evidence hashes.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Links & GIGW Compliance Bar */}
          <div className="mt-8 pt-6 border-t border-[#132c63] flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href="#terms" className="hover:text-amber-300 transition">Terms &amp; Conditions</a>
              <span>•</span>
              <a href="#privacy" className="hover:text-amber-300 transition">Privacy Policy</a>
              <span>•</span>
              <a href="#hyperlink" className="hover:text-amber-300 transition">Hyperlinking Policy</a>
              <span>•</span>
              <a href="#copyright" className="hover:text-amber-300 transition">Copyright Policy</a>
              <span>•</span>
              <a href="#accessibility" className="hover:text-amber-300 transition">Accessibility Statement</a>
              <span>•</span>
              <a href="#disclaimer" className="hover:text-amber-300 transition">Disclaimer</a>
              <span>•</span>
              <a href="#help" className="hover:text-amber-300 transition">Help &amp; FAQ</a>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Last Updated: <strong>October 2026</strong></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>Release: <strong>v1.0.0-PROD</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Authority & Hosting Attribution Bar */}
      <div className="bg-[#050f26] border-t border-[#0d1d42] px-6 py-3.5 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            &copy; {currentYear} Department of Social Justice and Empowerment, Ministry of Social Justice and Empowerment, Government of India.
          </div>
          <div className="text-[10.5px] text-slate-400">
            Designed, Developed and Maintained by{' '}
            <strong className="text-slate-200">National Informatics Centre (NIC)</strong> / NIRIKSHAN AI Project Directorate.
          </div>
        </div>
      </div>
    </footer>
  );
};
