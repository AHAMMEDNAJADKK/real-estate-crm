import React, { useState, useEffect } from 'react';
import { settingService } from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { Settings, Shield, History, Upload, CheckCircle2 } from 'lucide-react';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const toast = useToast();

  const fetchSettingsAndLogs = async (page = 1) => {
    setLoading(true);
    try {
      const [settRes, auditRes] = await Promise.all([
        settingService.getSettings(),
        settingService.getAuditLogs({ page, limit: 10 })
      ]);
      if (settRes.success) setSettings(settRes.data);
      if (auditRes.success) {
        setAuditLogs(auditRes.data);
        setAuditPagination(auditRes.meta);
      }
    } catch (err) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs(1);
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingService.updateSettings(settings);
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    }
  };

  const handleUploadTest = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const res = await settingService.uploadFile(fd);
      if (res.success) {
        toast.success(`File uploaded safely: ${res.data.originalName}`);
        setUploadFile(null);
      }
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-[#94A3B8] font-mono">
          {new Date(row.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
        </span>
      )
    },
    {
      header: 'Actor / User',
      accessor: 'user',
      render: (row) => (
        <div>
          <span className="font-semibold text-[#F8FAFC] text-xs block">{row.user?.name || 'System / Auto'}</span>
          <span className="text-[11px] text-[#94A3B8] capitalize">{row.user?.role?.replace('_', ' ') || 'Process'}</span>
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => <Badge variant="primary">{row.action}</Badge>
    },
    {
      header: 'Target Entity',
      accessor: 'entity',
      render: (row) => <span className="font-medium text-[#F8FAFC] text-xs">{row.entity}</span>
    },
    {
      header: 'Audit Metadata Details',
      accessor: 'details',
      render: (row) => (
        <pre className="text-[10px] bg-[#182437] p-1.5 rounded-lg border border-[#334155] text-[#94A3B8] max-w-sm overflow-x-auto">
          {JSON.stringify(row.details || {}, null, 1)}
        </pre>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Settings, RBAC Matrix & Audit Logs</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Enterprise company configurations, permission guards, and traceable audit trails</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#334155] pb-2">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'config'
              ? 'bg-[#6D28D9] text-white shadow-xs'
              : 'bg-[#243249] text-[#94A3B8] border border-[#334155] hover:bg-[#1E2B40] hover:text-[#F8FAFC]'
          }`}
        >
          <Settings className="w-4 h-4" /> Company & Parameters
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rbac'
              ? 'bg-[#6D28D9] text-white shadow-xs'
              : 'bg-[#243249] text-[#94A3B8] border border-[#334155] hover:bg-[#1E2B40] hover:text-[#F8FAFC]'
          }`}
        >
          <Shield className="w-4 h-4" /> Role Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-[#6D28D9] text-white shadow-xs'
              : 'bg-[#243249] text-[#94A3B8] border border-[#334155] hover:bg-[#1E2B40] hover:text-[#F8FAFC]'
          }`}
        >
          <History className="w-4 h-4" /> System Audit Trail
        </button>
      </div>

      {activeTab === 'config' && settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Company Information & Financial Rules">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Standard Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.standardCommissionPercentage}
                    onChange={(e) => setSettings({ ...settings, standardCommissionPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Default Unit Lock (Hours)</label>
                <input
                  type="number"
                  value={settings.reservationExpiryHours}
                  onChange={(e) => setSettings({ ...settings, reservationExpiryHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                />
              </div>

              <div className="pt-2">
                <Button type="submit">
                  Save Configurations
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Document & Photo Uploads Storage">
            <form onSubmit={handleUploadTest} className="space-y-4">
              <p className="text-xs text-[#94A3B8]">
                Test the secure backend upload gateway for property blueprints, floor plans, and scanned receipts.
              </p>
              <div className="border-2 border-dashed border-[#334155] bg-[#182437]/50 rounded-2xl p-6 text-center">
                <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="text-xs text-[#94A3B8] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#6D28D9] file:text-white hover:file:bg-[#5B21B6]"
                />
              </div>
              <Button type="submit" isLoading={uploading} disabled={!uploadFile}>
                Upload Test Document
              </Button>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'rbac' && (
        <Card title="Role-Based Access Control (RBAC) Matrix" subtitle="Backend-enforced permission authorization hierarchy">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#334155] bg-[#182437] text-[#94A3B8] font-semibold uppercase">
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Leads & Calls</th>
                  <th className="py-3 px-4">Properties & Inventory</th>
                  <th className="py-3 px-4">Discounts & Confirmations</th>
                  <th className="py-3 px-4">Payments & Receipts</th>
                  <th className="py-3 px-4">Ledger & Audit Trail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {[
                  { role: 'Super Admin', l: 'Full', p: 'Full', c: 'Full', py: 'Full', lg: 'Full' },
                  { role: 'Admin', l: 'Full', p: 'Full', c: 'Full', py: 'Full', lg: 'Full' },
                  { role: 'Sales Manager', l: 'Team Reassign', p: 'View & Edit', c: 'Approve & Confirm', py: 'View', lg: 'Restricted' },
                  { role: 'Telecaller', l: 'Assigned Only', p: 'View Only', c: 'No Access', py: 'No Access', lg: 'No Access' },
                  { role: 'Sales Executive', l: 'Assigned Only', p: 'View Only', c: 'Reserve Only', py: 'No Access', lg: 'No Access' },
                  { role: 'Property Manager', l: 'No Access', p: 'Add & Manage', c: 'No Access', py: 'No Access', lg: 'No Access' },
                  { role: 'Accountant', l: 'View Converted', p: 'View', c: 'No Access', py: 'Record, Verify, Refund', lg: 'Ledger Reconcile' }
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-[#243249]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#F8FAFC]">{r.role}</td>
                    <td className="py-3 px-4"><Badge>{r.l}</Badge></td>
                    <td className="py-3 px-4"><Badge>{r.p}</Badge></td>
                    <td className="py-3 px-4"><Badge>{r.c}</Badge></td>
                    <td className="py-3 px-4"><Badge>{r.py}</Badge></td>
                    <td className="py-3 px-4"><Badge>{r.lg}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'audit' && (
        <DataTable
          columns={auditColumns}
          data={auditLogs}
          loading={loading}
          pagination={auditPagination}
          onPageChange={(p) => fetchSettingsAndLogs(p)}
          emptyTitle="No audit records"
          emptyDescription="Sensitive operations across the ERP are securely recorded in the audit trail."
        />
      )}
    </div>
  );
};

export default SettingsPage;
