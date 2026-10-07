import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../../types';
import {
  Settings,
  Database,
  Building2,
  Users,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
  const { settings, updateSettings, users, resetDatabaseToDefault } = useApp();

  const [form, setForm] = useState<CompanySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupLog, setBackupLog] = useState<string | null>(null);

  const handleChange = (field: keyof CompanySettings, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleLogoUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setBackupLog('Logo upload rejected: please choose a PNG, JPG, or WebP image file.');
      return;
    }
    if (file.size > 1_500_000) {
      setBackupLog('Logo upload rejected: please use an image under 1.5 MB for browser storage.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, logoDataUrl: String(reader.result) }));
      setBackupLog('Logo loaded. Click Save Settings to apply it across login, header and receipts.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleShowBackupReadiness = () => {
    setBackupLog(
      `Production backup is not active in this frontend-only release candidate.\n` +
      `- Current data mode: browser local storage for owner review/demo.\n` +
      `- Required before live use: backend database/API, encrypted scheduled backups, restore test, and offsite replication.\n` +
      `- Planned retention setting: ${form.backupRetentionDays} days after backend backup service is enabled.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            <span>Company Settings &amp; Release Readiness</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pharmacy deployment configuration, URA EFRIS device identity, user roles, logo and production readiness checks.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Pharmacy Business Identity */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Pharmacy Commercial Identity</span>
            </h3>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md text-xs text-emerald-950">
            <span className="font-bold">Pharmacy Management System:</span> Esart Pharmacy Uganda — POS, medicine inventory, batch/expiry control, NDA register, wholesale and reports.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center p-4 border border-slate-200 rounded-md bg-slate-50 text-xs">
            <div className="bg-[#05251f] border border-emerald-900/70 rounded p-2 flex items-center justify-center min-h-28">
              <img
                src={form.logoDataUrl || '/assets/esart-pharmacy-logo.jpg'}
                alt="Current business logo"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900 block mb-1">Business Logo</label>
              <p className="text-slate-600 mb-3">
                Upload your own logo for this branch. It updates the login page, top header and printable documents after saving.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#0069a6] text-white font-semibold rounded cursor-pointer hover:bg-[#007bc2]">
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => handleLogoUpload(e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('logoDataUrl', '/assets/esart-pharmacy-logo.jpg')}
                  className="px-3 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-100"
                >
                  Restore Esart Logo
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Business Trade Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={e => handleChange('businessName', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Legal Registered Entity *</label>
              <input
                type="text"
                required
                value={form.legalEntity}
                onChange={e => handleChange('legalEntity', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Physical Address *</label>
              <input
                type="text"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={e => handleChange('country', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Tax, NDA & EFRIS Settings */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm">
              Regulatory Tax &amp; National Drug Authority Identifiers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Uganda TIN Number *</label>
              <input
                type="text"
                required
                value={form.tinNumber}
                onChange={e => handleChange('tinNumber', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">URA EFRIS Device Serial (FDN)</label>
              <input
                type="text"
                value={form.efrisDeviceNumber}
                onChange={e => handleChange('efrisDeviceNumber', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">NDA Pharmacy Operating License #</label>
              <input
                type="text"
                value={form.drugAuthorityLicense}
                onChange={e => handleChange('drugAuthorityLicense', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              80mm Thermal Receipt Footer Message
            </label>
            <input
              type="text"
              value={form.receiptFooterMessage}
              onChange={e => handleChange('receiptFooterMessage', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-xs"
            />
          </div>
        </div>

        {/* Section 3: Data Storage & Backup Readiness */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="border-b pb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Data Storage &amp; Backup Readiness</span>
            </h3>
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
              Backend Backup Pending
            </span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 space-y-1">
            <p className="font-semibold text-amber-950">Release Candidate Data Mode:</p>
            <p>
              This reviewed build is a static frontend using browser local storage. It is suitable for owner review and staff workflow validation.
              Do not enter live regulated pharmacy records until the approved backend database, scheduled encrypted backups and restore test are connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Planned Backup Retention Period (Days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={form.backupRetentionDays}
                onChange={e => handleChange('backupRetentionDays', Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleShowBackupReadiness}
                className="w-full p-2 bg-amber-700 hover:bg-amber-800 text-white rounded font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Database className="w-4 h-4 text-amber-100" />
                <span>View Backup Readiness</span>
              </button>
            </div>
          </div>

          {backupLog && (
            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded whitespace-pre-wrap">
              {backupLog}
            </div>
          )}
        </div>

        {/* Section 4: Users and RBAC */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>System Users &amp; Role-Based Access Control (RBAC)</span>
            </h3>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-2 font-semibold">User</th>
                  <th className="p-2 font-semibold">Email</th>
                  <th className="p-2 font-semibold">Role</th>
                  <th className="p-2 font-semibold">2FA Policy</th>
                  <th className="p-2 font-semibold">Permissions Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{u.name}</td>
                    <td className="p-2 text-slate-500 font-mono">{u.email}</td>
                    <td className="p-2 capitalize font-semibold text-emerald-800">{u.role}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enforced (TOTP)</span>
                      </span>
                    </td>
                    <td className="p-2 text-slate-500">
                      {u.role === 'director' || u.role === 'admin'
                        ? 'Full system governance, approvals sign-off & financial reports'
                        : u.role === 'pharmacist'
                        ? 'Controlled register, prescription dispense sign-off & stocktake'
                        : u.role === 'storekeeper'
                        ? 'GRN intake, stock transfers & count sheets'
                        : 'POS counter billing, split payments & shift close'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
