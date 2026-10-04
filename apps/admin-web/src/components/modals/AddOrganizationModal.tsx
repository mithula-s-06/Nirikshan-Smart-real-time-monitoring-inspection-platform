import React, { useState } from 'react';
import { X, Building, CheckCircle, AlertTriangle, ShieldCheck, Mail, Phone, MapPin, Hash, FileText } from 'lucide-react';
import { OrganizationType } from '@nirikshan/shared-types';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOrg: any) => void;
  authToken?: string;
}

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Delhi', 'Gujarat', 'Tamil Nadu',
  'Uttar Pradesh', 'Telangana', 'Rajasthan', 'Madhya Pradesh', 'Kerala',
  'West Bengal', 'Bihar', 'Punjab', 'Haryana', 'Odisha', 'Assam'
];

export const AddOrganizationModal: React.FC<AddOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  authToken,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<string>(OrganizationType.NGO);
  const [darpanId, setDarpanId] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+91-');
  const [contactPerson, setContactPerson] = useState('');
  const [bankPfmsCode, setBankPfmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code.startsWith('NGO-') || code.startsWith('INST-')) {
      const acronym = val
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 5);
      setCode(`${type === OrganizationType.NGO ? 'NGO' : 'INST'}-${acronym || 'ORG'}-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        code: code.trim().toUpperCase(),
        type,
        state,
        district,
        address: address || `${district}, ${state} - Center Head Office`,
        contactEmail: contactEmail || `contact@${code.toLowerCase().replace(/[^a-z0-9]/g, '') || 'ngo'}.org.in`,
        contactPhone: contactPhone.length > 5 ? contactPhone : '+91-9876500000',
      };

      const res = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Failed to create organization');
      }

      onSuccess(data.data.organization);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Add NGO / Partner Institution</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Register verified non-governmental organization, training institute, or state execution partner.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Name */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Organization / NGO Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Samarthya Rural Skill Foundation"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Code */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Unique Entity Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. NGO-SRSF-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-indigo-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Entity Classification *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={OrganizationType.NGO}>Non-Governmental Organization (NGO)</option>
                <option value={OrganizationType.INSTITUTE}>Vocational Training Institute (VTI/ITI)</option>
                <option value={OrganizationType.STATE_DEPARTMENT}>State Skill Development Mission (SSDM)</option>
                <option value={OrganizationType.DISTRICT_OFFICE}>District Welfare Office (DWO)</option>
                <option value={OrganizationType.BENEFICIARY_ENTITY}>Beneficiary Welfare Consortium</option>
                <option value={OrganizationType.GOVERNMENT_MINISTRY}>Central Ministry / Department</option>
              </select>
            </div>

            {/* NGO Darpan ID */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">NITI Aayog NGO Darpan ID</label>
              <input
                type="text"
                placeholder="e.g. MH/2023/0342911"
                value={darpanId}
                onChange={(e) => setDarpanId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">State / UT Jurisdiction *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">District *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pune"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Director / Incharge Name</label>
              <input
                type="text"
                placeholder="e.g. Sunita Deshmukh"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Official Contact Phone *</label>
              <input
                type="text"
                required
                placeholder="+91-9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Contact Email */}
            <div className="md:col-span-2">
              <label className="text-slate-300 block mb-1 font-medium">Official Email Address *</label>
              <input
                type="email"
                required
                placeholder="director@samarthya-ngo.org"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-slate-300 block mb-1 font-medium">Headquarters / Center Address *</label>
              <textarea
                rows={2}
                required
                placeholder="Building No, Street, Landmark, Pin Code..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 flex items-center gap-2 text-indigo-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>
              All registered NGOs are cross-indexed against the Ministry Gazette Blacklist (Rule 14) and PFMS central database.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition shadow-lg shadow-indigo-950/40 disabled:opacity-50"
            >
              <Building className="w-3.5 h-3.5" />
              {loading ? 'Registering...' : 'Register NGO / Institution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
