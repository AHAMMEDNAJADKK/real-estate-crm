import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leadService';
import { employeeService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Plus, Download, Phone, Mail, UserCheck, Calendar, Flame } from 'lucide-react';

export const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tempFilter, setTempFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    leadName: '',
    phone: '',
    email: '',
    city: '',
    source: 'Meta Ads',
    temperature: 'Warm',
    budgetMin: '',
    budgetMax: '',
    preferredLocation: '',
    preferredPropertyType: 'Apartment',
    remarks: ''
  });

  const toast = useToast();

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const res = await leadService.getLeads({
        page,
        limit: 10,
        search,
        status: statusFilter,
        temperature: tempFilter
      });
      if (res.success) {
        setLeads(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [search, statusFilter, tempFilter]);

  useEffect(() => {
    employeeService.getUsers({ limit: 100 }).then(res => {
      if (res.success) setEmployees(res.data);
    }).catch(() => {});
  }, []);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await leadService.createLead(formData);
      toast.success('Lead created successfully');
      setIsAddOpen(false);
      setFormData({
        leadName: '',
        phone: '',
        email: '',
        city: '',
        source: 'Meta Ads',
        temperature: 'Warm',
        budgetMin: '',
        budgetMax: '',
        preferredLocation: '',
        preferredPropertyType: 'Apartment',
        remarks: ''
      });
      fetchLeads(1);
    } catch (err) {
      toast.error(err.message || 'Failed to create lead');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await leadService.updateStatus(leadId, { status: newStatus });
      toast.success(`Lead status updated to ${newStatus}`);
      fetchLeads(pagination.page);
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleAssign = async (leadId, employeeId) => {
    try {
      await leadService.assignLead(leadId, employeeId);
      toast.success('Lead reassigned successfully');
      fetchLeads(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to assign lead');
    }
  };

  const handleExport = async () => {
    try {
      const res = await leadService.exportLeads();
      if (res.success && res.data) {
        const rows = res.data.map(l => ({
          Name: l.leadName,
          Phone: l.phone,
          Email: l.email,
          City: l.city,
          Source: l.source,
          Status: l.status,
          Temperature: l.temperature,
          PropertyType: l.preferredPropertyType,
          BudgetMin: l.budgetMin,
          BudgetMax: l.budgetMax,
          AssignedTo: l.assignedTo?.name || 'Unassigned',
          CreatedDate: new Date(l.createdAt).toLocaleDateString()
        }));
        const csvContent = 'data:text/csv;charset=utf-8,' +
          [Object.keys(rows[0] || {}).join(','), ...rows.map(e => Object.values(e).join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Leads exported to CSV successfully');
      }
    } catch (err) {
      toast.error('Failed to export leads');
    }
  };

  const columns = [
    {
      header: 'Lead Name & Contact',
      accessor: 'leadName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            {row.leadName}
            {row.temperature === 'Hot' && <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {row.phone}</span>
            {row.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {row.email}</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Source & City',
      accessor: 'source',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-700 block">{row.source}</span>
          <span className="text-xs text-slate-400">{row.city || 'Location N/A'}</span>
        </div>
      )
    },
    {
      header: 'Temperature',
      accessor: 'temperature',
      render: (row) => <Badge>{row.temperature}</Badge>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className="text-xs font-semibold rounded-lg border border-[#334155] px-2 py-1 bg-[#243249] text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
        >
          {['New', 'Contacted', 'Follow Up', 'Interested', 'Qualified', 'Converted', 'Lost'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    },
    {
      header: 'Assigned To',
      accessor: 'assignedTo',
      render: (row) => (
        <select
          value={row.assignedTo?._id || ''}
          onChange={(e) => handleAssign(row._id, e.target.value)}
          className="text-xs rounded-lg border border-[#334155] px-2 py-1 bg-[#243249] text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
        >
          <option value="">Select Staff</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>{emp.name} ({emp.role?.replace('_', ' ')})</option>
          ))}
        </select>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSelectedLead(row);
            setIsDetailOpen(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#334155]">
        <div>
          <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Lead Pipeline & Enquiries</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Capture, qualify, assign, and track real estate prospects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 flex-wrap bg-[#1E2B40] p-4 rounded-2xl border border-[#334155]">
        <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Filters:</div>
        <select
          value={tempFilter}
          onChange={(e) => setTempFilter(e.target.value)}
          className="text-xs bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
        >
          <option value="">All Temperatures</option>
          {['Hot', 'Warm', 'Cold', 'RNT', 'SwitchedOff', 'Call Back'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
        >
          <option value="">All Statuses</option>
          {['New', 'Contacted', 'Follow Up', 'Interested', 'Qualified', 'Converted', 'Lost'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={leads}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchLeads(p)}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search leads by name, phone, email, city..."
        emptyTitle="No leads registered yet"
        emptyDescription="Get started by creating your first buyer or investor lead."
        onEmptyAction={() => setIsAddOpen(true)}
        emptyActionLabel="Create Lead"
      />

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Lead"
        subtitle="Capture new customer enquiry into CRM pipeline"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.leadName}
                onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                placeholder="Full Name"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@domain.com"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">City / Location</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bangalore, Whitefield"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              >
                {['Meta Ads', 'Google Ads', 'Website', 'Walk-in', 'Broker Network', 'Referral', 'Cold Call'].map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Temperature Rating</label>
              <select
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              >
                {['Hot', 'Warm', 'Cold', 'RNT', 'SwitchedOff', 'Call Back'].map(temp => (
                  <option key={temp} value={temp}>{temp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Min Budget (₹)</label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                placeholder="e.g. 5000000"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Max Budget (₹)</label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                placeholder="e.g. 10000000"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1.5">Initial Remarks / Notes</label>
            <textarea
              rows="3"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Requirement summary, preferred floor, financing needs..."
              className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Lead Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Lead Details Modal */}
      {selectedLead && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Lead: ${selectedLead.leadName}`}
          subtitle={`Captured on ${new Date(selectedLead.createdAt).toLocaleDateString()}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-[#243249] p-4 rounded-xl border border-[#334155]">
              <div>
                <span className="text-xs text-[#94A3B8] block">Phone:</span>
                <span className="font-semibold text-[#F8FAFC]">{selectedLead.phone}</span>
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] block">Email:</span>
                <span className="font-semibold text-[#F8FAFC]">{selectedLead.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] block">Temperature:</span>
                <Badge>{selectedLead.temperature}</Badge>
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] block">Status:</span>
                <Badge>{selectedLead.status}</Badge>
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] block">Source:</span>
                <span className="font-medium text-[#F8FAFC]">{selectedLead.source}</span>
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] block">Budget:</span>
                <span className="font-medium text-[#F8FAFC]">₹{selectedLead.budgetMin} - ₹{selectedLead.budgetMax}</span>
              </div>
            </div>
            {selectedLead.remarks && (
              <div>
                <span className="text-xs font-bold text-[#94A3B8] block mb-1">Remarks:</span>
                <p className="bg-[#243249] p-3 rounded-xl text-[#F8FAFC] text-xs border border-[#334155]">
                  {selectedLead.remarks}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-[#334155]">
              <Button onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeadsPage;
