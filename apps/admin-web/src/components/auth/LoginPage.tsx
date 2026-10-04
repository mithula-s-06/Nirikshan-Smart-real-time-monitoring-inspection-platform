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
} from 'lucide-react';
import { PortalEmblem } from '../common/Topbar';

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
