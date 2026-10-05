import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  Shield,
  Home,
  LogIn,
  Landmark,
  Zap,
} from 'lucide-react';
import { PortalEmblem } from '../common/Topbar';

const QUICK_LOGIN_PRESETS = [
  {
    roleName: 'Super Admin',
    desc: 'National HQ (All Privileges)',
    email: 'superadmin@nirikshan.gov.in',
    badge: 'Full Access',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    roleName: 'Joint Secretary',
    desc: 'National Oversight (DoSJE)',
    email: 'dept.official1@nirikshan.gov.in',
    badge: 'National',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    roleName: 'Field Inspector',
    desc: 'Surprise Inspections & PMU',
    email: 'inspector1@nirikshan.gov.in',
    badge: 'Inspector',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    roleName: 'Institution Head',
    desc: 'NGO Administrator',
    email: 'ngo.admin1@nirikshan.gov.in',
    badge: 'Institution',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attempt = async (em: string, pw: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(em, pw);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (targetEmail = 'superadmin@nirikshan.gov.in') => {
    setEmail(targetEmail);
    setPassword('Password@123');
    attempt(targetEmail, 'Password@123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your official government email and password.');
      return;
    }
    attempt(email, password);
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-[#0f2147] flex flex-col font-sans">
      {/* Identity strip */}
      <div className="bg-white border-b border-[#d6deec] px-6 h-[4.25rem] flex items-center justify-between shadow-sm">
        <PortalEmblem />
        <div className="hidden md:block px-5 py-1.5 rounded-xl bg-white border border-[#d6deec] shadow-sm text-sm font-bold text-[#0f2147]">
          NIRIKSHAN Monitoring &amp; Intelligence Portal
        </div>
        <div className="hidden lg:block text-right leading-tight">
          <div className="text-[11px] font-bold text-[#0b2a6b]">Azadi Ka Amrit Mahotsav</div>
          <div className="text-[11px] text-[#f58a3c] font-semibold">Digital India &bull; Sunishchit Nirikshan</div>
        </div>
      </div>

      {/* Navy bar */}
      <div className="h-12 bg-[#0b2a6b] flex items-center justify-between pr-4 shadow-sm">
        <div className="h-full flex items-center">
          <span className="h-full px-5 flex items-center gap-1.5 bg-[#f58a3c] text-white text-xs font-bold">
            <Home className="w-3.5 h-3.5" /> Home
          </span>
          <span className="px-5 text-xs text-white/90 font-medium">Official sign-in required</span>
        </div>
        <span className="h-8 px-4 rounded-lg bg-[#f58a3c] text-white text-xs font-bold flex items-center gap-1.5">
          <LogIn className="w-3.5 h-3.5" /> Login
        </span>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto p-6 grid lg:grid-cols-5 gap-8 items-center my-auto">
        {/* Left: Ministry Portal Overview */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-[#0b2a6b] via-[#14398f] to-[#4a97ab] text-white p-8 shadow-xl">
            <div className="text-[11px] font-bold tracking-[0.2em] text-[#f58a3c]">DEPARTMENT OF SOCIAL JUSTICE &amp; EMPOWERMENT</div>
            <h1 className="text-2xl lg:text-3xl font-extrabold mt-2 leading-tight !text-white">
              Centralised Monitoring, Surprise Inspection &amp; Anomaly Intelligence
            </h1>
            <p className="text-sm text-white/90 mt-4 max-w-xl leading-relaxed">
              Unified real-time surveillance, random inspection assignment, attendance analytics, beneficiary integrity monitoring, and AI-assisted fraud detection across all DoSJE schemes.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 text-[11px] font-semibold">
              {['Server-enforced RBAC', 'Jurisdictional Data Scope', 'Immutable Audit Logs', 'OpenCV YuNet AI'].map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white shadow-sm">{t}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#d6deec] p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#0b2a6b] uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#f58a3c]" /> Official Ministry Notice
            </div>
            <p className="text-xs text-[#4d5d7c] leading-relaxed">
              All institutional users, project directors, and field monitoring officers must sign in using their assigned official credentials. Session activities, biometric rollcalls, and inspection findings are cryptographically hashed and monitored by DoSJE National Command Centre.
            </p>
          </div>
        </div>

        {/* Right: sign-in card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white border border-[#d6deec] shadow-xl overflow-hidden">
            <div className="bg-[#0b2a6b] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Landmark className="w-4 h-4 text-[#f58a3c]" /> Official Sign In
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 border border-white/30 font-semibold text-white">TLS SECURED</span>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="leading-relaxed font-medium">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0f2147] mb-1.5">Official Email / Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6b7a96] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="officer@nirikshan.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#d6deec] text-sm text-[#0f2147] placeholder-[#8a97ae] focus:outline-none focus:border-[#0b2a6b] focus:ring-2 focus:ring-[#0b2a6b]/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#0f2147]">Password</label>
                  <span className="text-[11px] text-[#0b2a6b] hover:underline font-semibold cursor-pointer">Contact nodal officer</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6b7a96] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-[#d6deec] text-sm text-[#0f2147] placeholder-[#8a97ae] focus:outline-none focus:border-[#0b2a6b] focus:ring-2 focus:ring-[#0b2a6b]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#f58a3c] hover:bg-[#e0701f] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Verifying identity...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>SIGN IN</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-[#6b7a96] text-center font-medium">
                5 failed attempts lock the account for 15 minutes.
              </p>

              {/* Quick Login for Testing */}
              <div className="pt-2">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2.5 text-[#0b2a6b] font-bold text-[10px] tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Testing &amp; Evaluation Mode
                    </span>
                  </div>
                </div>

                {/* Primary Quick Login Button */}
                <button
                  type="button"
                  id="btn-quick-login"
                  onClick={() => handleQuickLogin('superadmin@nirikshan.gov.in')}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  title="Instant 1-Click Login as Super Admin"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                  <span>⚡ Quick Test Login (Super Admin)</span>
                </button>

                {/* 1-Click Persona Cards */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="text-[10px] font-semibold text-[#6b7a96] flex items-center justify-between px-0.5">
                    <span>Or 1-Click Login by Role:</span>
                    <span className="text-emerald-700 font-bold">Auto Pre-fill &amp; Auth</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_LOGIN_PRESETS.map((p) => (
                      <button
                        key={p.email}
                        type="button"
                        id={`btn-quick-login-${p.roleName.toLowerCase().replace(/\s+/g, '-')}`}
                        disabled={loading}
                        onClick={() => handleQuickLogin(p.email)}
                        className="text-left p-2 rounded-lg border border-[#d6deec] hover:border-[#0b2a6b] bg-slate-50 hover:bg-blue-50/70 transition group cursor-pointer disabled:opacity-60 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[11px] font-bold text-[#0f2147] group-hover:text-[#0b2a6b] truncate">
                            {p.roleName}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>
                        <div className="text-[9.5px] text-[#6b7a96] truncate mt-0.5 font-medium">
                          {p.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="rounded-xl bg-[#fff7ec] border border-[#f58a3c]/40 p-3.5 text-[11px] text-[#324568] leading-relaxed shadow-sm">
            <div className="font-bold text-[#e0701f] uppercase tracking-wide mb-0.5">Statutory security advisory</div>
            Authorised government access only. Activity on this system is monitored and audited; all authentication
            attempts and queries are recorded in immutable audit logs (IT Act, 2000).
          </div>
        </div>
      </div>

      <footer className="bg-[#0b2a6b] text-white/90 text-[11px] px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#071d4d] mt-auto">
        <div>&copy; Department of Social Justice &amp; Empowerment, Government of India &bull; NIRIKSHAN</div>
        <div>Security policy &bull; Privacy charter &bull; Hosted on NIC / C-DAC infrastructure</div>
      </footer>
    </div>
  );
};
