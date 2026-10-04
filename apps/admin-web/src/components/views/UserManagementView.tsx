import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Building,
  MapPin
} from 'lucide-react';
import { UserRole, UserStatus } from '@nirikshan/shared-types';

export const UserManagementView: React.FC = () => {
  const { authToken, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [tempAccessModalOpen, setTempAccessModalOpen] = useState<boolean>(false);
  const [newRole, setNewRole] = useState<string>('');
  const [newState, setNewState] = useState<string>('');
  const [newDistrict, setNewDistrict] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [authToken]);

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`/api/v1/users/${selectedUser._id || selectedUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          role: newRole || selectedUser.role,
          state: newState || selectedUser.state,
          district: newDistrict || selectedUser.district,
          reason,
        }),
      });
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSuspend = async (userToToggle: any) => {
    const isSuspended = userToToggle.status === 'SUSPENDED';
    const endpoint = isSuspended ? 'reactivate' : 'suspend';

    try {
      await fetch(`/api/v1/users/${userToToggle._id || userToToggle.id}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: 'Administrative Compliance Action' }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-bold uppercase">
              SECURITY & ACCESS CONTROL
            </span>
            <span className="text-xs text-slate-400 font-mono">GOVERNMENT RBAC DIRECTORY</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">User Administration & Jurisdictional Delegation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Server-enforced role assignments &bull; Jurisdiction bounds &bull; Instant account suspension &bull; Audit trail
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh User List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officials by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Users: <strong className="text-slate-200">{filteredUsers.length}</strong>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Official / Identity</th>
              <th className="py-3.5 px-4">Government Role</th>
              <th className="py-3.5 px-4">Jurisdiction Scope</th>
              <th className="py-3.5 px-4">Account Status</th>
              <th className="py-3.5 px-4 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                  {loading ? 'Querying user directory...' : 'No official user records found.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSuspended = u.status === 'SUSPENDED';

                return (
                  <tr key={u._id || u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      <div className="text-[10px] text-indigo-400">{u.designation || 'Official'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">
                        {u.state || 'National HQ'} {u.district ? `(${u.district})` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {u.state === 'National HQ' ? 'NATIONAL LEVEL' : u.district ? 'DISTRICT SCOPE' : 'STATE SCOPE'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isSuspended
                            ? 'bg-red-950/60 text-red-400 border-red-800'
                            : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setNewState(u.state || '');
                          setNewDistrict(u.district || '');
                          setRoleModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                      >
                        Assign Scope
                      </button>

                      <button
                        onClick={() => handleToggleSuspend(u)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                          isSuspended
                            ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80'
                        }`}
                      >
                        {isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Role & Scope Delegation Modal */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Assign Role & Jurisdiction Scope
            </h3>
            <p className="text-xs text-slate-400">
              Modifying scope for <strong>{selectedUser.name}</strong> ({selectedUser.email}). Action will be recorded in official security audit log.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Government Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value={UserRole.DOSJE_HQ_OFFICIAL}>DoSJE HQ Official (National)</option>
                  <option value={UserRole.DOSJE_STATE_OFFICIAL}>State Monitoring Officer</option>
                  <option value={UserRole.DOSJE_DISTRICT_OFFICIAL}>District Welfare Officer</option>
                  <option value={UserRole.PMU_MANAGER}>PMU Inspection Manager</option>
                  <option value={UserRole.PMU_INSPECTOR}>PMU Field Inspector</option>
                  <option value={UserRole.NGO_ADMIN}>NGO / Institution Head</option>
                  <option value={UserRole.AUDITOR}>Ministry / CAG Auditor</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">State Jurisdiction</label>
                <input
                  type="text"
                  placeholder="e.g. Tamil Nadu, Maharashtra, Delhi"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">District Jurisdiction (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Chennai, Nagpur"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason for Reassignment</label>
                <input
                  type="text"
                  placeholder="Administrative order / transfer reference"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-lg shadow-indigo-950/40"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
