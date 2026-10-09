import React, { useState, useEffect } from 'react';
import { telecallerService } from '../../services/telecallerService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const FollowUpsPage = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);

  // Complete Followup Modal
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const toast = useToast();

  const fetchFollowUps = async (page = 1) => {
    setLoading(true);
    try {
      const res = await telecallerService.getFollowUps({
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
      toast.error(err.message || 'Failed to fetch follow-ups');
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
      await telecallerService.updateFollowUp(selectedFollowUp._id, {
        status: 'Completed',
        outcome: outcomeNotes
      });
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
          <span className="font-semibold text-[#F8FAFC] block">{row.lead?.leadName}</span>
          <span className="text-xs text-[#94A3B8]">{row.lead?.phone}</span>
        </div>
      )
    },
    {
      header: 'Scheduled Date & Time',
      accessor: 'scheduledDate',
      render: (row) => {
        const isOverdue = new Date(row.scheduledDate) < new Date() && row.status === 'Pending';
        return (
          <span className={`text-xs font-medium flex items-center gap-1.5 ${isOverdue ? 'text-rose-400 font-bold' : 'text-[#F8FAFC]'}`}>
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
      render: (row) => <span className="text-xs text-slate-600">{row.assignedTo?.name || 'Staff'}</span>
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (row) => <div className="text-xs text-slate-500 max-w-xs truncate">{row.notes || '—'}</div>
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
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Customer Follow-up Scheduler</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Manage scheduled reminders, overdue calls, and interaction plans</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[#1E2B40] p-4 rounded-2xl border border-[#334155] flex-wrap">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase">Filters:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9]"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
        <button
          onClick={() => setOverdueFilter(!overdueFilter)}
          className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${
            overdueFilter
              ? 'bg-rose-950/40 border-rose-800 text-rose-400'
              : 'bg-[#243249] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
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
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Follow-up Outcome Notes *</label>
              <textarea
                required
                rows="3"
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                placeholder="Discussed floor options, customer visiting site this weekend..."
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#334155]">
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
