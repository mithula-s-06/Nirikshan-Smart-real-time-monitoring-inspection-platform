import React, { useState } from 'react';
import { UserCheck, Briefcase, Clock, HelpCircle, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface BeneficiaryDashboardProps {
  beneficiary: any;
  activeSubTab: string;
  onSelectSubTab: (tab: string) => void;
}

export const BeneficiaryDashboard: React.FC<BeneficiaryDashboardProps> = ({
  beneficiary,
  activeSubTab,
  onSelectSubTab,
}) => {
  const profile = beneficiary || {
    name: 'Rohan Suresh Sharma',
    beneficiaryId: 'BEN-2026-PUN-001',
    dateOfBirth: '12 Apr 2005',
    age: 21,
    guardianName: 'Suresh Sharma',
    category: 'OBC',
    scheme: 'DDU-GKY Rural Livelihoods Scheme',
    facility: 'St. Jude Residential Youth Hostel, Pune',
    enrollmentStartDate: '01 June 2025',
    maskedPhone: '98******12',
    eligibilityStatus: 'ELIGIBLE',
    verificationStatus: 'VERIFIED',
    totalSessions: 42,
    attendedSessions: 40,
  };

  const [grievanceText, setGrievanceText] = useState('');
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(false);

  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceText) return;
    setGrievanceSubmitted(true);
    setGrievanceText('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Citizen Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
            {profile.name?.slice(0, 2)?.toUpperCase() || 'RS'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{profile.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                CITIZEN PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ID: {profile.beneficiaryId} &bull; Scheme: {profile.scheme}
            </p>
          </div>
        </div>
        <StatusBadge status={profile.eligibilityStatus} />
      </div>

      {/* Profile Overview */}
      {activeSubTab === 'ben_profile' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
              Personal Information & Scheme Enrollment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block text-[11px]">Father / Guardian</span>
                <span className="text-slate-200 font-medium">{profile.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Date of Birth (Age)</span>
                <span className="text-slate-200 font-medium">{profile.dateOfBirth} ({profile.age} yrs)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Social Category</span>
                <span className="text-slate-200 font-medium">{profile.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Registered Mobile</span>
                <span className="font-mono text-slate-200 font-medium">{profile.maskedPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Institution Facility</span>
                <span className="text-slate-200 font-medium">{profile.facility}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Enrollment Date</span>
                <span className="text-slate-200 font-medium">{profile.enrollmentStartDate}</span>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-slate-200">Aadhaar & Bank Account Document Verification</div>
                <div className="text-[11px] text-slate-400">Successfully verified with national registry.</div>
              </div>
            </div>
            <StatusBadge status={profile.verificationStatus} />
          </div>
        </div>
      )}

      {/* Scheme Entitlements Sub-Tab */}
      {activeSubTab === 'ben_scheme' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
            My Government Welfare Scheme Entitlements
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-200">Residential Boarding & Meals Allowance</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Free residential lodging and nutritious meals at St. Jude Hostel.</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-200">Vocational Tool Kit & Certification Course</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Solar PV installation and micro-grid maintenance curriculum.</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px]">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-200">Monthly Trainee DBT Stipend</div>
                <p className="text-[11px] text-slate-400 mt-0.5">₹2,500 transferred directly to Aadhaar-seeded bank account monthly.</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px]">
                DISBURSED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Sub-Tab */}
      {activeSubTab === 'ben_attendance' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Attendance Verification Record</h3>
              <p className="text-slate-400 text-[11px]">AI photo verified classroom rollcalls</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-emerald-400 font-bold text-base">
                {Math.round((profile.attendedSessions / profile.totalSessions) * 100)}%
              </span>
              <div className="text-[10px] text-slate-500 font-mono">
                {profile.attendedSessions} / {profile.totalSessions} sessions
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { date: 'Yesterday (03 Oct)', session: 'Morning Rollcall & Lab', status: 'PRESENT (VERIFIED)' },
              { date: '02 Oct 2026', session: 'Gandhi Jayanti Workshop', status: 'PRESENT (VERIFIED)' },
              { date: '01 Oct 2026', session: 'Solar Grid Practical', status: 'PRESENT (VERIFIED)' },
              { date: '30 Sep 2026', session: 'Electrical Safety Lecture', status: 'EXCUSED LEAVE' },
              { date: '29 Sep 2026', session: 'Morning Rollcall', status: 'PRESENT (VERIFIED)' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-200">{item.session}</span>
                  <span className="text-[11px] text-slate-500 block font-mono">{item.date}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  item.status.includes('PRESENT')
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support & Grievance Sub-Tab */}
      {activeSubTab === 'ben_support' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-slate-200 text-sm border-b border-slate-800 pb-2">
            Direct Support & Grievance Redressal
          </h3>
          <p className="text-slate-400 text-[11px]">
            Have an issue with hostel amenities, stipend payments, or attendance records? Submit a message directly to the DoSJE District Monitoring Officer.
          </p>

          {grievanceSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/80 text-center space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-emerald-300">Grievance Registered Successfully</div>
              <p className="text-[11px] text-slate-400">Ticket Ref: GRV-2026-0982 &bull; Assigned to District Collectorate Pune</p>
            </div>
          ) : (
            <form onSubmit={handleGrievanceSubmit} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Your Grievance / Feedback Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your concern in plain language..."
                  value={grievanceText}
                  onChange={(e) => setGrievanceText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" /> Submit Grievance
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
