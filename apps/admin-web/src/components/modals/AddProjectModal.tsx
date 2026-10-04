import React, { useState } from 'react';
import { X, Briefcase, MapPin, CheckCircle, AlertTriangle, ShieldAlert, Building, Navigation } from 'lucide-react';
import { ProjectStatus, RiskLevel } from '@nirikshan/shared-types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProject: any) => void;
  organizations: any[];
  defaultOrgId?: string;
  authToken?: string;
}

const SCHEMES = [
  'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
  'Ayushman Bharat Digital Mission (ABDM)',
  'Jal Jeevan Mission (JJM)',
  'Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)',
  'Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)',
  'Pradhan Mantri Awas Yojana (PMAY-Urban)',
  'National Rural Livelihood Mission (NRLM)',
];

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Pune, Maharashtra': [73.8567, 18.5204],
  'Mumbai, Maharashtra': [72.8777, 19.0760],
  'Bengaluru, Karnataka': [77.5946, 12.9716],
  'New Delhi, Delhi': [77.2090, 28.6139],
  'Ahmedabad, Gujarat': [72.5714, 23.0225],
  'Chennai, Tamil Nadu': [80.2707, 13.0827],
  'Hyderabad, Telangana': [78.4867, 17.3850],
  'Jaipur, Rajasthan': [75.7873, 26.9124],
};

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizations,
  defaultOrgId,
  authToken,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [scheme, setScheme] = useState(SCHEMES[0]);
  const [organizationId, setOrganizationId] = useState(defaultOrgId || organizations[0]?._id || organizations[0]?.id || '');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(18.5204);
  const [longitude, setLongitude] = useState<number>(73.8567);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(250);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.LOW);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+91-');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code.startsWith('PRJ-')) {
      const acronym = val
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      setCode(`PRJ-${district.slice(0, 3).toUpperCase()}-${acronym || '001'}-${Math.floor(10 + Math.random() * 90)}`);
    }
  };

  const handleCitySelect = (cityState: string) => {
    const coords = CITY_COORDINATES[cityState];
    if (coords) {
      setLongitude(coords[0]);
      setLatitude(coords[1]);
      const [dist, st] = cityState.split(', ');
      setDistrict(dist);
      setState(st);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedOrg = organizations.find((o) => (o._id || o.id) === organizationId) || organizations[0];
      const payload = {
        name,
        code: code.trim().toUpperCase(),
        organizationId: organizationId || selectedOrg?._id || selectedOrg?.id,
        scheme,
        description: description || `Government monitored project facility under ${scheme}.`,
        address: address || `${district}, ${state} Facility Center`,
        district,
        state,
        location: {
          type: 'Point' as const,
          coordinates: [Number(longitude), Number(latitude)],
        },
        geofenceRadiusMeters: Number(geofenceRadius),
        status: ProjectStatus.ACTIVE,
        riskLevel,
        riskScore: riskLevel === RiskLevel.CRITICAL ? 85 : riskLevel === RiskLevel.HIGH ? 65 : riskLevel === RiskLevel.MEDIUM ? 40 : 15,
        contactName: contactName || 'Project Director',
        contactEmail: contactEmail || `project.${code.toLowerCase()}@nirikshan.gov.in`,
        contactPhone: contactPhone.length > 5 ? contactPhone : '+91-9876543210',
      };

      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Failed to create project');
      }

      onSuccess(data.data.project);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating project');
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
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Add Geofenced Project Facility</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Register a new monitoring site, scheme unit, or institutional training center with Haversine geofence.
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
            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="text-slate-300 block mb-1 font-medium">Project Facility Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. PMKVY Solar & Electric Vehicle Training Facility"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Project Code */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Facility Project Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. PRJ-PUN-010"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sky-400 placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>

            {/* Central Scheme */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Associated Government Scheme *</label>
              <select
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {SCHEMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Linked Implementing NGO / Organization */}
            <div className="md:col-span-2">
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                Linked Implementing NGO / Organization *
              </label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
              >
                {organizations.map((org) => (
                  <option key={org._id || org.id} value={org._id || org.id}>
                    [{org.type}] {org.name} ({org.code}) &bull; {org.state}
                  </option>
                ))}
              </select>
            </div>

            {/* City Preset Shortcuts */}
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">Quick Location Presets:</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(CITY_COORDINATES).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCitySelect(c)}
                    className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* State & District */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">District *</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>

            {/* Coordinates */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> Latitude (GPS) *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-sky-400" /> Longitude (GPS) *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 focus:outline-none"
              />
            </div>

            {/* Geofence Radius */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Geofence Radius (Meters)</label>
              <select
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 focus:outline-none"
              >
                <option value={100}>100 meters (High Precision Site)</option>
                <option value={200}>200 meters (Standard Facility)</option>
                <option value={250}>250 meters (Standard Government Radius)</option>
                <option value={500}>500 meters (Sprawling Institute Campus)</option>
                <option value={1000}>1000 meters (Large Rural Project)</option>
              </select>
            </div>

            {/* Initial Risk Level */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Initial Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                <option value={RiskLevel.LOW}>LOW (Routine Monitoring)</option>
                <option value={RiskLevel.MEDIUM}>MEDIUM (Quarterly Review)</option>
                <option value={RiskLevel.HIGH}>HIGH (Prioritized for Surprise Audits)</option>
                <option value={RiskLevel.CRITICAL}>CRITICAL (Immediate Vigilance Oversight)</option>
              </select>
            </div>

            {/* Incharge Name */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Facility Director / Incharge Name</label>
              <input
                type="text"
                placeholder="e.g. Er. Vikram Joshi"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>

            {/* Incharge Phone */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Incharge Phone</label>
              <input
                type="text"
                placeholder="+91-9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-slate-300 block mb-1 font-medium">Complete Physical Site Address</label>
              <input
                type="text"
                placeholder="Plot No 45, MIDC Industrial Area, Pune 411019"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>
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
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 transition shadow-lg shadow-sky-950/40 disabled:opacity-50"
            >
              <Briefcase className="w-3.5 h-3.5" />
              {loading ? 'Creating Project...' : 'Register Project Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
