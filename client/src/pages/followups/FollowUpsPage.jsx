import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { followUpService } from '../../services/followUpService';
import { leadService } from '../../services/leadService';
import { employeeService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarCheck,
  Calendar,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  FileText,
  XCircle,
  Filter,
  ArrowRight
} from 'lucide-react';

export const FollowUpsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const isManagerOrAdmin = ['super_admin', 'superadmin', 'admin', 'sales_manager'].includes(user?.role);

  // Data & List state
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'upcoming', 'overdue', 'completed'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Auxiliary data for dropdowns
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingFollowUp, setViewingFollowUp] = useState(null);
  const [completingFollowUp, setCompletingFollowUp] = useState(null);
  const [reschedulingFollowUp, setReschedulingFollowUp] = useState(null);
  const [cancellingFollowUp, setCancellingFollowUp] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    leadId: '',
    scheduledDate: '',
    priority: 'Medium',
    assignedTo: '',
    notes: ''
  });

  const [completeForm, setCompleteForm] = useState({
    outcome: '',
    notes: ''
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledDate: '',
    notes: ''
  });

  const [cancelForm, setCancelForm] = useState({
    notes: ''
  });

  // Fetch follow-ups from backend
  const fetchFollowUps = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          limit: 10
        };

        if (activeTab !== 'all') {
          params.timeframe = activeTab;
        }

        if (statusFilter && statusFilter !== 'All') {
          params.status = statusFilter;
        }

        if (priorityFilter && priorityFilter !== 'All') {
          params.priority = priorityFilter;
        }

        if (employeeFilter && isManagerOrAdmin) {
          params.assignedTo = employeeFilter;
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        const res = await followUpService.getFollowUps(params);
        if (res.success) {
          setFollowUps(Array.isArray(res.data) ? res.data : []);
          if (res.meta) {
            setPagination(res.meta);
          } else {
            setPagination({
              page,
              limit: 10,
              total: Array.isArray(res.data) ? res.data.length : 0,
              totalPages: 1
            });
          }
        } else {
          throw new Error(res.message || 'Failed to retrieve follow-ups');
        }
      } catch (err) {
        console.error('Follow-ups loading error:', err);
        setError(err.message || 'Failed to load follow-up reminders');
        toast.error(err.message || 'Failed to load follow-ups');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, statusFilter, priorityFilter, employeeFilter, search, isManagerOrAdmin, toast]
  );

  // Initial load and filter change trigger
  useEffect(() => {
    fetchFollowUps(1);
  }, [fetchFollowUps]);

  // Load leads and employees for dropdowns
  useEffect(() => {
    leadService
      .getLeads({ limit: 100 })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setLeads(res.data);
        }
      })
      .catch(() => {});

    if (isManagerOrAdmin) {
      employeeService
        .getUsers({ limit: 100 })
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setEmployees(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isManagerOrAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFollowUps(pagination.page);
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setEmployeeFilter('');
  };

  // Create Follow-up submission
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!createForm.leadId) {
      toast.error('Please select a lead');
      return;
    }
    if (!createForm.scheduledDate) {
      toast.error('Please choose a scheduled date and time');
      return;
    }

    try {
      await followUpService.createFollowUp(createForm);
      toast.success('Follow-up scheduled successfully');
      setIsCreateOpen(false);
      setCreateForm({
        leadId: '',
        scheduledDate: '',
        priority: 'Medium',
        assignedTo: '',
        notes: ''
      });
      fetchFollowUps(1);
    } catch (err) {
      toast.error(err.message || 'Failed to schedule follow-up');
    }
  };

  // Mark Completed submission
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingFollowUp) return;
    if (!completeForm.outcome.trim()) {
      toast.error('Please record the outcome of this follow-up call');
      return;
    }

    try {
      await followUpService.completeFollowUp(completingFollowUp._id, {
        outcome: completeForm.outcome.trim(),
        notes: completeForm.notes ? completeForm.notes.trim() : undefined
      });
      toast.success('Follow-up marked as completed');
      setCompletingFollowUp(null);
      setCompleteForm({ outcome: '', notes: '' });
      fetchFollowUps(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to complete follow-up');
    }
  };

  // Reschedule submission
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingFollowUp) return;
    if (!rescheduleForm.scheduledDate) {
      toast.error('Please select a new scheduled date and time');
      return;
    }

    try {
      await followUpService.rescheduleFollowUp(reschedulingFollowUp._id, {
        scheduledDate: rescheduleForm.scheduledDate,
        notes: rescheduleForm.notes ? rescheduleForm.notes.trim() : undefined
      });
      toast.success('Follow-up successfully rescheduled');
      setReschedulingFollowUp(null);
      setRescheduleForm({ scheduledDate: '', notes: '' });
      fetchFollowUps(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to reschedule follow-up');
    }
  };

  // Cancel submission
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingFollowUp) return;

    try {
      await followUpService.cancelFollowUp(cancellingFollowUp._id, {
        notes: cancelForm.notes ? cancelForm.notes.trim() : undefined
      });
      toast.success('Follow-up task cancelled');
      setCancellingFollowUp(null);
      setCancelForm({ notes: '' });
      fetchFollowUps(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel follow-up');
    }
  };

  // Calculate timing status
  const getTimingStatus = (scheduledDate, status) => {
    if (status === 'Completed') {
      return { label: 'Completed', color: 'emerald' };
    }
    if (status === 'Cancelled') {
      return { label: 'Cancelled', color: 'slate' };
    }

    const scheduled = new Date(scheduledDate);
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (scheduled < now) {
      return { label: 'Overdue', color: 'rose' };
    }
    if (scheduled >= startOfToday && scheduled <= endOfToday) {
      return { label: 'Due Today', color: 'amber' };
    }
    return { label: 'Upcoming', color: 'indigo' };
  };

  // Priority color config
  const priorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      case 'Low':
      default:
        return 'default';
    }
  };

  // Table Columns Definition
  const columns = [
    {
      header: 'Lead Details',
      accessor: 'lead',
      render: (row) => {
        const lead = row.lead;
        if (!lead) {
          return <span className="text-xs text-slate-400 italic">Lead Record Removed</span>;
        }
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#6D28D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {lead.leadName ? lead.leadName.slice(0, 2).toUpperCase() : 'LE'}
            </div>
            <div>
              <Link
                to={`/leads`}
                className="font-bold text-slate-900 dark:text-[#F8FAFC] text-xs hover:text-[#6D28D9] dark:hover:text-[#A78BFA] flex items-center gap-1 group"
                title="View in Leads"
              >
                <span>{lead.leadName}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400 dark:text-[#64748B]" /> {lead.phone}
                </span>
                {lead.temperature && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#243249] text-slate-600 dark:text-slate-300">
                    {lead.temperature}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Scheduled Date & Time',
      accessor: 'scheduledDate',
      render: (row) => {
        const timing = getTimingStatus(row.scheduledDate, row.status);
        const dateObj = new Date(row.scheduledDate);
        const isValidDate = !isNaN(dateObj.getTime());

        return (
          <div>
            <div className="flex items-center gap-1.5">
              {timing.color === 'rose' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3 h-3" /> Overdue
                </span>
              )}
              {timing.color === 'amber' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" /> Due Today
                </span>
              )}
              {timing.color === 'indigo' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3" /> Upcoming
                </span>
              )}
            </div>
            <span className="text-xs text-slate-800 dark:text-[#F8FAFC] font-medium block mt-1">
              {isValidDate
                ? dateObj.toLocaleString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Invalid date'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <Badge variant={priorityBadgeVariant(row.priority)}>{row.priority || 'Medium'}</Badge>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'Pending'} />
    },
    {
      header: 'Assigned Agent',
      accessor: 'assignedTo',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] block">
            {row.assignedTo?.name || 'Unassigned'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
            {row.assignedTo?.role ? row.assignedTo.role.replace('_', ' ') : 'Staff'}
          </span>
        </div>
      )
    },
    {
      header: 'Notes & Outcome',
      accessor: 'notes',
      render: (row) => (
        <div className="max-w-xs text-xs space-y-1">
          {row.notes && (
            <p className="text-slate-600 dark:text-[#94A3B8] truncate" title={row.notes}>
              {row.notes}
            </p>
          )}
          {row.outcome && (
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold truncate" title={`Outcome: ${row.outcome}`}>
              &bull; {row.outcome}
            </p>
          )}
          {!row.notes && !row.outcome && <span className="text-slate-400">—</span>}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => {
        const canAct = row.status !== 'Completed' && row.status !== 'Cancelled';

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {canAct && (
              <Button
                size="sm"
                variant="accent"
                icon={CheckCircle2}
                onClick={() => {
                  setCompletingFollowUp(row);
                  setCompleteForm({ outcome: '', notes: row.notes || '' });
                }}
                title="Mark Follow-up as Completed"
              >
                Mark Done
              </Button>
            )}

            {canAct && (
              <Button
                size="sm"
                variant="secondary"
                icon={Edit3}
                onClick={() => {
                  setReschedulingFollowUp(row);
                  const dt = row.scheduledDate ? new Date(row.scheduledDate).toISOString().slice(0, 16) : '';
                  setRescheduleForm({ scheduledDate: dt, notes: row.notes || '' });
                }}
                title="Reschedule Reminder"
              >
                Reschedule
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              icon={FileText}
              onClick={() => setViewingFollowUp(row)}
              title="View Follow-up Details"
            >
              Details
            </Button>

            {canAct && (
              <button
                type="button"
                onClick={() => {
                  setCancellingFollowUp(row);
                  setCancelForm({ notes: '' });
                }}
                title="Cancel Follow-up"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#334155]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Customer Follow-up Scheduler
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6D28D9]/20 text-[#6D28D9] dark:text-[#A78BFA] border border-[#6D28D9]/40">
              Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            Manage scheduled customer reminders, overdue callbacks, interaction plans, and task closures
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#243249] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] border border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#334155] transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#8B5CF6]' : ''} />
            <span>Refresh</span>
          </button>

          <Button icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Schedule Follow-Up
          </Button>
        </div>
      </div>

      {/* Quick Navigation / Timeframe Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-[#334155]">
        {[
          { id: 'all', label: 'All Follow-ups' },
          { id: 'today', label: 'Due Today' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'bg-white dark:bg-[#1E2B40] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#243249] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1E2B40] p-4 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Status Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9] cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Assigned Agent Select (for Manager / Admin) */}
          {isManagerOrAdmin && employees.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Agent:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9] cursor-pointer"
              >
                <option value="">All Staff</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.name} ({emp.role?.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(search || statusFilter || priorityFilter || employeeFilter || activeTab !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Error / Loading Content */}
      {error && !loading ? (
        <ErrorState
          title="Could not load follow-up reminders"
          message={error}
          onRetry={() => fetchFollowUps(1)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={followUps}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchFollowUps(p)}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by lead name, phone, email, notes..."
          emptyTitle="No follow-up reminders scheduled"
          emptyDescription={
            search || statusFilter || priorityFilter || activeTab !== 'all'
              ? 'No follow-up records matched your active filter criteria. Try resetting filters.'
              : 'Follow-up tasks will appear here as telecallers and sales executives schedule reminders.'
          }
          onEmptyAction={() => setIsCreateOpen(true)}
          emptyActionLabel="Schedule Follow-Up"
        />
      )}

      {/* ---------------- MODAL 1: SCHEDULE NEW FOLLOW-UP ---------------- */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Customer Follow-up"
        subtitle="Set up a targeted callback or interaction reminder"
      >
        <form onSubmit={handleCreateFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
              Select Lead *
            </label>
            <select
              required
              value={createForm.leadId}
              onChange={(e) => setCreateForm({ ...createForm, leadId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            >
              <option value="">Choose a prospective lead</option>
              {leads.map((l) => (
                <option key={l._id || l.id} value={l._id || l.id}>
                  {l.leadName} ({l.phone}) &bull; {l.status} - {l.temperature}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={createForm.scheduledDate}
                onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                Priority
              </label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {isManagerOrAdmin && employees.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                Assign to Staff Member (Optional)
              </label>
              <select
                value={createForm.assignedTo}
                onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              >
                <option value="">Default to Lead's Assigned Agent or Yourself</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.name} ({emp.email}) - {emp.role?.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
              Follow-up Agenda / Notes
            </label>
            <textarea
              rows="3"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="e.g. Call to discuss payment breakdown, brochure delivery confirmation..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---------------- MODAL 2: COMPLETE FOLLOW-UP ---------------- */}
      {completingFollowUp && (
        <Modal
          isOpen={!!completingFollowUp}
          onClose={() => setCompletingFollowUp(null)}
          title={`Complete Follow-Up: ${completingFollowUp.lead?.leadName || 'Customer'}`}
          subtitle="Record interaction result and close this reminder"
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155] text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Lead: {completingFollowUp.lead?.leadName} ({completingFollowUp.lead?.phone})
              </p>
              <p className="text-slate-500 dark:text-[#94A3B8]">
                Scheduled for:{' '}
                {new Date(completingFollowUp.scheduledDate).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                Call / Interaction Outcome *
              </label>
              <textarea
                required
                rows="3"
                value={completeForm.outcome}
                onChange={(e) => setCompleteForm({ ...completeForm, outcome: e.target.value })}
                placeholder="e.g. Discussed floor options. Client is interested in a site visit this Saturday..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setCompletingFollowUp(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Mark Completed
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------- MODAL 3: RESCHEDULE FOLLOW-UP ---------------- */}
      {reschedulingFollowUp && (
        <Modal
          isOpen={!!reschedulingFollowUp}
          onClose={() => setReschedulingFollowUp(null)}
          title={`Reschedule Follow-Up: ${reschedulingFollowUp.lead?.leadName || 'Customer'}`}
          subtitle="Choose a new date and time for this reminder"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                New Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={rescheduleForm.scheduledDate}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                Reschedule Reason / Updated Notes
              </label>
              <textarea
                rows="3"
                value={rescheduleForm.notes}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
                placeholder="e.g. Prospect was driving; requested callback on Friday afternoon..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setReschedulingFollowUp(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Confirm Reschedule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------- MODAL 4: CANCEL FOLLOW-UP ---------------- */}
      {cancellingFollowUp && (
        <Modal
          isOpen={!!cancellingFollowUp}
          onClose={() => setCancellingFollowUp(null)}
          title={`Cancel Follow-Up: ${cancellingFollowUp.lead?.leadName || 'Customer'}`}
          subtitle="Are you sure you want to cancel this reminder task?"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
              Cancelling this task will mark it as Cancelled in the log and remove it from active telecaller queues.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">
                Cancellation Reason (Optional)
              </label>
              <textarea
                rows="2"
                value={cancelForm.notes}
                onChange={(e) => setCancelForm({ ...cancelForm, notes: e.target.value })}
                placeholder="e.g. Lead already visited office directly, not interested..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setCancellingFollowUp(null)}>
                Keep Reminder
              </Button>
              <Button variant="danger" type="submit">
                Cancel Follow-Up
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------- MODAL 5: VIEW DETAILS ---------------- */}
      {viewingFollowUp && (
        <Modal
          isOpen={!!viewingFollowUp}
          onClose={() => setViewingFollowUp(null)}
          title={`Follow-up Details: ${viewingFollowUp.lead?.leadName || 'Prospective Lead'}`}
          subtitle={`Task Ref: ${viewingFollowUp._id || viewingFollowUp.id}`}
        >
          <div className="space-y-4 text-xs">
            {/* Lead Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                  {viewingFollowUp.lead?.leadName}
                </span>
                <span className="text-slate-500 dark:text-[#94A3B8] flex items-center gap-2 mt-1">
                  <span>{viewingFollowUp.lead?.phone}</span>
                  {viewingFollowUp.lead?.email && <span>&bull; {viewingFollowUp.lead.email}</span>}
                </span>
              </div>
              <Link to="/leads">
                <Button size="sm" variant="secondary" icon={ExternalLink}>
                  Open Lead
                </Button>
              </Link>
            </div>

            {/* Task Overview Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155]">
                <span className="text-slate-500 dark:text-[#94A3B8] font-bold uppercase block text-[10px]">
                  Scheduled For
                </span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5 block">
                  {new Date(viewingFollowUp.scheduledDate).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155]">
                <span className="text-slate-500 dark:text-[#94A3B8] font-bold uppercase block text-[10px]">
                  Status & Priority
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <StatusBadge status={viewingFollowUp.status} />
                  <Badge variant={priorityBadgeVariant(viewingFollowUp.priority)}>
                    {viewingFollowUp.priority}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155]">
                <span className="text-slate-500 dark:text-[#94A3B8] font-bold uppercase block text-[10px]">
                  Assigned Staff
                </span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5 block">
                  {viewingFollowUp.assignedTo?.name || 'Unassigned'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  {viewingFollowUp.assignedTo?.email}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155]">
                <span className="text-slate-500 dark:text-[#94A3B8] font-bold uppercase block text-[10px]">
                  Completed At
                </span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5 block">
                  {viewingFollowUp.completedAt
                    ? new Date(viewingFollowUp.completedAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'Not yet completed'}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {viewingFollowUp.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155]">
                <span className="text-slate-500 dark:text-[#94A3B8] font-bold uppercase block text-[10px] mb-1">
                  Scheduled Notes
                </span>
                <p className="text-slate-800 dark:text-[#F8FAFC] whitespace-pre-wrap">{viewingFollowUp.notes}</p>
              </div>
            )}

            {/* Outcome Section */}
            {viewingFollowUp.outcome && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase block text-[10px] mb-1">
                  Recorded Outcome
                </span>
                <p className="text-slate-900 dark:text-[#F8FAFC] font-medium whitespace-pre-wrap">
                  {viewingFollowUp.outcome}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setViewingFollowUp(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FollowUpsPage;
