import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { superAdminService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Activity,
  Database,
  Building2,
  Lock,
  Power,
  Trash2,
  Edit3,
  RefreshCw,
  FileCheck,
  Mail,
  Phone,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const ROLE_OPTIONS = [
  { id: 'superadmin', label: 'Super Admin' },
  { id: 'admin', label: 'Admin' },
  { id: 'sales_manager', label: 'Sales Manager' },
  { id: 'telecaller', label: 'Telecaller' },
  { id: 'sales_executive', label: 'Sales Executive' },
  { id: 'property_manager', label: 'Property Manager' },
  { id: 'accountant', label: 'Accountant' }
];

const formatRoleLabel = (role = '') => {
  if (role === 'superadmin' || role === 'super_admin') return 'Super Admin';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const SuperAdminPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('users');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    department: 'Management'
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
    department: '',
    isActive: true,
    password: ''
  });

  const loadData = useCallback(
    async (page = 1) => {
      if (!isSuperAdmin) return;
      setLoading(true);
      try {
        const [overviewRes, usersRes, logsRes] = await Promise.all([
          superAdminService.getOverview(),
          superAdminService.getUsers({
            page,
            limit: 15,
            search: search || undefined,
            role: roleFilter || undefined
          }),
          superAdminService.getAuditLogs({ page: 1, limit: 30 })
        ]);

        if (overviewRes.success) {
          setOverview(overviewRes.data);
        }
        if (usersRes.success) {
          setUsers(usersRes.data || []);
          if (usersRes.meta) setUsersPagination(usersRes.meta);
        }
        if (logsRes.success) {
          setAuditLogs(logsRes.data || []);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load Super Admin console data');
      } finally {
        setLoading(false);
      }
    },
    [isSuperAdmin, search, roleFilter, toast]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  // Strict frontend route guard: only authenticated Super Admin users can view this page
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await superAdminService.createUser(createForm);
      toast.success(`Created ${formatRoleLabel(createForm.role)} account (${createForm.email})`);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin',
        department: 'Management'
      });
      loadData(1);
    } catch (err) {
      toast.error(err.message || 'Failed to create user account');
    }
  };

  const openEditModal = (target) => {
    setEditingUser(target);
    setEditForm({
      name: target.name || '',
      email: target.email || '',
      phone: target.phone || '',
      role: target.role === 'super_admin' ? 'superadmin' : target.role || 'sales_executive',
      department: target.department || 'Management',
      isActive: Boolean(target.isActive),
      password: ''
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        department: editForm.department,
        isActive: editForm.isActive
      };
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
      }
      await superAdminService.updateUser(editingUser._id || editingUser.id, payload);
      toast.success(`Updated account for ${editForm.name}`);
      setEditingUser(null);
      loadData(usersPagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update user account');
    }
  };

  const handleToggleActive = async (target) => {
    const targetId = target._id || target.id;
    const currentUserId = user?._id || user?.id;
    if (targetId === currentUserId) {
      toast.error('You cannot deactivate your own active Super Admin session');
      return;
    }
    try {
      await superAdminService.updateUser(targetId, { isActive: !target.isActive });
      toast.success(
        `${target.name} has been ${!target.isActive ? 'activated' : 'deactivated'}`
      );
      loadData(usersPagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update account status');
    }
  };

  const handleDeleteUser = async (target) => {
    const targetId = target._id || target.id;
    const currentUserId = user?._id || user?.id;
    if (targetId === currentUserId) {
      toast.error('You cannot delete your own active Super Admin account');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently remove ${target.name} (${target.email})?`)) {
      return;
    }
    try {
      await superAdminService.deleteUser(targetId);
      toast.success(`Removed account ${target.email}`);
      loadData(usersPagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user account');
    }
  };

  const userColumns = [
    {
      header: 'Account Identity',
      accessor: 'name',
      render: (row) => {
        const isRowSuper = row.role === 'superadmin' || row.role === 'super_admin';
        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow ${
                isRowSuper ? 'bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6]' : 'bg-slate-200 dark:bg-[#243249] text-slate-700 dark:text-white'
              }`}
            >
              {row.name ? row.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">{row.name}</span>
              <span className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 dark:text-[#64748B]" /> {row.email}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Role & Privilege',
      accessor: 'role',
      render: (row) => {
        const isRowSuper = row.role === 'superadmin' || row.role === 'super_admin';
        return (
          <Badge variant={isRowSuper ? 'primary' : row.role === 'admin' ? 'info' : 'default'}>
            {formatRoleLabel(row.role)}
          </Badge>
        );
      }
    },
    {
      header: 'Department & Phone',
      accessor: 'department',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] block">
            {row.department || 'Operations'}
          </span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400 dark:text-[#64748B]" /> {row.phone || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            row.isActive
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#84CC16] border border-emerald-500/30'
              : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
          }`}
        >
          {row.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {row.isActive ? 'Active' : 'Suspended'}
        </span>
      )
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleString() : 'Never logged in'}
        </span>
      )
    },
    {
      header: 'Governance Actions',
      accessor: '_id',
      render: (row) => {
        const isSelf = (row._id || row.id) === (user?._id || user?.id);
        return (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" icon={Edit3} onClick={() => openEditModal(row)}>
              Manage
            </Button>
            {!isSelf && (
              <>
                <Button
                  size="sm"
                  variant={row.isActive ? 'secondary' : 'primary'}
                  icon={Power}
                  onClick={() => handleToggleActive(row)}
                >
                  {row.isActive ? 'Suspend' : 'Activate'}
                </Button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(row)}
                  title="Delete User"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#243249] text-slate-600 dark:text-[#94A3B8] hover:text-red-500 hover:bg-red-500/10 border border-slate-200 dark:border-[#334155] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  const auditColumns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actor',
      accessor: 'user',
      render: (row) => (
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] block">
            {row.user?.name || 'System'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
            {row.user?.email || ''} {row.user?.role ? `(${formatRoleLabel(row.user.role)})` : ''}
          </span>
        </div>
      )
    },
    {
      header: 'Event Action',
      accessor: 'action',
      render: (row) => <Badge variant="primary">{row.action}</Badge>
    },
    {
      header: 'Entity',
      accessor: 'entity',
      render: (row) => <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">{row.entity}</span>
    },
    {
      header: 'Metadata Details',
      accessor: 'details',
      render: (row) => (
        <code className="text-[11px] text-purple-700 dark:text-[#A78BFA] bg-slate-100 dark:bg-[#243249] px-2 py-1 rounded-lg block max-w-md truncate">
          {JSON.stringify(row.details || {})}
        </code>
      )
    }
  ];

  const userStats = overview?.userStats || {};
  const crmStats = overview?.crmStats || {};
  const systemHealth = overview?.systemHealth || {};

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-[#1E2B40] dark:via-[#243249] dark:to-[#1E2B40] border border-slate-200 dark:border-[#334155] rounded-2xl p-6 shadow-sm dark:shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-[#6D28D9]/30 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                Super Admin Command & Governance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6D28D9]/20 dark:bg-[#6D28D9]/30 text-[#6D28D9] dark:text-[#A78BFA] border border-[#6D28D9]/40 uppercase tracking-wider">
                Super Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Full enterprise access control, administrator provisioning, role governance, and system security audit logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#182437] border border-slate-200 dark:border-[#334155] flex items-center gap-2 text-xs">
            <Database className="w-4 h-4 text-emerald-600 dark:text-[#84CC16]" />
            <span className="text-slate-500 dark:text-[#94A3B8]">DB:</span>
            <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
              {systemHealth.dbName || 'realestate_crm'} ({systemHealth.database || 'connected'})
            </span>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadData(usersPagination.page)}>
            Refresh
          </Button>
          <Button icon={UserPlus} onClick={() => setIsCreateOpen(true)}>
            Create Admin / User
          </Button>
        </div>
      </div>

      {/* System-Wide KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E2B40] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Total Accounts</span>
            <Users className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-2">
            {userStats.totalUsers || 0}
          </p>
          <p className="text-xs text-emerald-600 dark:text-[#84CC16] mt-1">
            {userStats.activeUsers || 0} Active &bull; {userStats.inactiveUsers || 0} Suspended
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E2B40] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Privileged Admins</span>
            <Lock className="w-4 h-4 text-emerald-600 dark:text-[#84CC16]" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-2">
            {(userStats.superAdmins || 0) + (userStats.admins || 0)}
          </p>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            {userStats.superAdmins || 0} Super Admin &bull; {userStats.admins || 0} Admin
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E2B40] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Projects & Inventory</span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-2">
            {crmStats.totalProjects || 0} Projects / {crmStats.totalProperties || 0} Units
          </p>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            {crmStats.availableProperties || 0} Available Units
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E2B40] border border-slate-200 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Leads & Bookings</span>
            <FileCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-2">
            {crmStats.totalLeads || 0} Leads / {crmStats.totalBookings || 0} Bookings
          </p>
          <p className="text-xs text-emerald-600 dark:text-[#84CC16] mt-1">
            {crmStats.totalCustomers || 0} Verified Customers
          </p>
        </div>
      </div>

      {/* Navigation Tabs & Role Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#334155] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/30'
                : 'bg-slate-100 dark:bg-[#1E2B40] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            User & Admin Directory ({userStats.totalUsers || users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/30'
                : 'bg-slate-100 dark:bg-[#1E2B40] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            Security Audit Logs ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-[#94A3B8] font-semibold">Filter by Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-[#1E2B40] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'users' ? (
        <DataTable
          columns={userColumns}
          data={users}
          loading={loading}
          pagination={usersPagination}
          onPageChange={(p) => loadData(p)}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search users by name, email, phone, or department..."
          emptyTitle="No matching accounts found"
          emptyDescription="Create an administrator or employee account to get started."
          onEmptyAction={() => setIsCreateOpen(true)}
          emptyActionLabel="Create Account"
        />
      ) : (
        <DataTable
          columns={auditColumns}
          data={auditLogs}
          loading={loading}
          emptyTitle="No security audit events recorded"
          emptyDescription="Authentication and administrative actions will appear here automatically."
        />
      )}

      {/* Create Admin / User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New Administrator or Staff Account"
        subtitle="Super Admin privilege: create accounts with any role including Super Admin and Admin"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Full Name"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@kodbrand.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                System Role *
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                Department
              </label>
              <input
                type="text"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                placeholder="e.g. Executive Management, Sales"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User / Role / Password Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Manage Account: ${editingUser.name}`}
          subtitle="Modify role permissions, profile details, active status, or reset password"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                  System Role *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-[#94A3B8] uppercase mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep existing"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-200 dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminPage;
