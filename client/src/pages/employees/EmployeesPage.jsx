import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { UserCog, Plus, Shield, Activity, Phone, Mail } from 'lucide-react';

export const EmployeesPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [workloadUser, setWorkloadUser] = useState(null);
  const [workloadData, setWorkloadData] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'sales_executive',
    department: 'Sales'
  });

  const toast = useToast();

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await employeeService.getUsers({ page, limit: 10, search });
      if (res.success) {
        setUsers(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [search]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await employeeService.createUser(form);
      toast.success('Employee onboarded successfully');
      setIsAddOpen(false);
      setForm({ name: '', email: '', phone: '', password: '', role: 'sales_executive', department: 'Sales' });
      fetchUsers(1);
    } catch (err) {
      toast.error(err.message || 'Failed to onboard employee');
    }
  };

  const handleViewWorkload = async (user) => {
    setWorkloadUser(user);
    try {
      const res = await employeeService.getUserWorkload(user._id);
      if (res.success) {
        setWorkloadData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load workload');
    }
  };

  const columns = [
    {
      header: 'Employee Name & Role',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-bold text-[#F8FAFC] block">{row.name}</span>
          <span className="text-xs text-purple-300 font-semibold capitalize">{row.role?.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      header: 'Contact Information',
      accessor: 'email',
      render: (row) => (
        <div>
          <span className="text-xs text-[#F8FAFC] flex items-center gap-1"><Mail className="w-3 h-3 text-[#64748B]" /> {row.email}</span>
          <span className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-[#64748B]" /> {row.phone}</span>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <Badge variant="primary">{row.department || 'Operations'}</Badge>
    },
    {
      header: 'Account Status',
      accessor: 'isActive',
      render: (row) => <Badge>{row.isActive ? 'Active' : 'Inactive'}</Badge>
    },
    {
      header: 'Workload & Metrics',
      accessor: '_id',
      render: (row) => (
        <Button size="sm" variant="secondary" icon={Activity} onClick={() => handleViewWorkload(row)}>
          Workload
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Staff & Team Management</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Manage employee roles, system permissions, and operational workloads</p>
        </div>
        <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
          Onboard Employee
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchUsers(p)}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff by name, email, phone..."
        emptyTitle="No staff registered"
        emptyDescription="Onboard administrators, sales executives, and telecallers."
        onEmptyAction={() => setIsAddOpen(true)}
        emptyActionLabel="Onboard Employee"
      />

      {/* Onboard Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Onboard New Employee"
        subtitle="Create user account with enterprise role assignment"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Employee Name"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@kodbrand.com"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Mobile Number"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">System Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              >
                {[
                  { id: 'super_admin', label: 'Super Admin' },
                  { id: 'admin', label: 'Admin' },
                  { id: 'sales_manager', label: 'Sales Manager' },
                  { id: 'telecaller', label: 'Telecaller' },
                  { id: 'sales_executive', label: 'Sales Executive' },
                  { id: 'property_manager', label: 'Property Manager' },
                  { id: 'accountant', label: 'Accountant' }
                ].map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Sales, Telecalling, Finance"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Complete Onboarding
            </Button>
          </div>
        </form>
      </Modal>

      {/* Workload Modal */}
      {workloadUser && (
        <Modal
          isOpen={!!workloadUser}
          onClose={() => setWorkloadUser(null)}
          title={`Workload Analytics: ${workloadUser.name}`}
          subtitle={`Role: ${workloadUser.role?.replace('_', ' ')} &bull; ${workloadUser.department}`}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
              <span className="text-xs text-indigo-700 font-semibold block uppercase">Assigned Leads</span>
              <span className="text-3xl font-extrabold text-[#442d82] mt-1 block">{workloadData?.assignedLeads || 0}</span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <span className="text-xs text-emerald-700 font-semibold block uppercase">Active Opportunities</span>
              <span className="text-3xl font-extrabold text-emerald-800 mt-1 block">{workloadData?.activeOpportunities || 0}</span>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <span className="text-xs text-amber-700 font-semibold block uppercase">Completed Site Visits</span>
              <span className="text-3xl font-extrabold text-amber-800 mt-1 block">{workloadData?.completedSiteVisits || 0}</span>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-center">
              <span className="text-xs text-purple-700 font-semibold block uppercase">Closed Bookings</span>
              <span className="text-3xl font-extrabold text-purple-900 mt-1 block">{workloadData?.totalBookings || 0}</span>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setWorkloadUser(null)}>Close</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeesPage;
