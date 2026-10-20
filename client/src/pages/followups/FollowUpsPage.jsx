import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leadService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const FollowUpsPage = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const toast = useToast();

  const fetchFollowUps = async (page = 1) => {
    setLoading(true);
    try {
      const res = await leadService.getFollowUps({
        page,
        limit: 10,
        status: statusFilter,
        overdue: overdueFilter ? 'true' : undefined
      });
      if (res.success) {
        setFollowUps(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps(1);
  }, [statusFilter, overdueFilter]);

  const handleMarkComplete = async (e) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    try {
      await leadService.completeFollowUp(selectedFollowUp._id, { outcomeNotes });
      toast.success('Follow-up marked as completed');
      setSelectedFollowUp(null);
      setOutcomeNotes('');
      fetchFollowUps(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update follow-up');
    }
  };

  const columns = [
    {
      header: 'Lead Name & Phone',
      accessor: 'lead',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.lead?.leadName}</span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">{row.lead?.phone}</span>
        </div>
      )
    },
    {
      header: 'Scheduled Date & Time',
      accessor: 'scheduledDate',
      render: (row) => {
        const isOverdue = new Date(row.scheduledDate) < new Date() && row.status === 'Pending';
        return (
          <span className={`text-xs font-medium flex items-center gap-1.5 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-[#F8FAFC]'}`}>
            {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
            {new Date(row.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        );
      }
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <Badge>{row.priority}</Badge>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'Assigned Agent',
      accessor: 'assignedTo',
      render: (row) => <span className="text-xs text-slate-700 dark:text-[#94A3B8]">{row.assignedTo?.name || 'Staff'}</span>
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (row) => <div className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-xs truncate">{row.notes || '—'}</div>
    },
    {
      header: 'Action',
      accessor: '_id',
      render: (row) =>
        row.status === 'Pending' ? (
          <Button
            size="sm"
            variant="secondary"
            icon={CheckCircle2}
            onClick={() => {
              setSelectedFollowUp(row);
              setOutcomeNotes('');
            }}
          >
            Mark Done
          </Button>
        ) : (
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#334155]">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">Customer Follow-up Scheduler</h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">Manage scheduled reminders, overdue calls, and interaction plans</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white dark:bg-[#1E2B40] p-4 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase">Filters:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
        <button
          onClick={() => setOverdueFilter(!overdueFilter)}
          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
            overdueFilter
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
              : 'bg-slate-100 dark:bg-[#243249] border-slate-300 dark:border-[#334155] text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
          }`}
        >
          {overdueFilter ? 'Showing Overdue Only' : 'Show Overdue'}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={followUps}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchFollowUps(p)}
        emptyTitle="No follow-up reminders scheduled"
        emptyDescription="Follow-up tasks will appear here as telecallers set reminders during customer calls."
      />

      {/* Complete Followup Modal */}
      {selectedFollowUp && (
        <Modal
          isOpen={!!selectedFollowUp}
          onClose={() => setSelectedFollowUp(null)}
          title={`Complete Follow-Up: ${selectedFollowUp.lead?.leadName}`}
          subtitle="Record interaction outcome and close reminder"
        >
          <form onSubmit={handleMarkComplete} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Follow-up Outcome Notes *</label>
              <textarea
                required
                rows="3"
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="Discussed floor options, customer visiting site this weekend..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setSelectedFollowUp(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Complete Follow-up
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FollowUpsPage;
