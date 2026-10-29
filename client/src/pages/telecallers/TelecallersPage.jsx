import React, { useState, useEffect } from 'react';
import { telecallerService } from '../../services/telecallerService';
import { leadService } from '../../services/leadService';
import { employeeService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PhoneCall, Clock, CheckCircle2, Calendar, MessageSquare, PhoneForwarded, Filter, User } from 'lucide-react';

export const TelecallersPage = () => {
  const { user, hasRole } = useAuth();
  const isManagerOrAdmin = hasRole('superadmin', 'super_admin', 'admin', 'sales_manager');

  const [callLogs, setCallLogs] = useState([]);
  const [queue, setQueue] = useState({ pendingFollowUps: [], freshLeads: [] });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [telecallers, setTelecallers] = useState([]);

  // Call Logging Modal
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [logForm, setLogForm] = useState({
    callOutcome: 'Connected',
    temperature: 'Warm',
    notes: '',
    callDurationSeconds: 120,
    nextFollowUpDate: ''
  });

  const toast = useToast();

  const fetchTelecallerData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (selectedTelecaller) {
        params.telecallerId = selectedTelecaller;
      }
      const [logsRes, queueRes] = await Promise.all([
        telecallerService.getCallLogs(params),
        telecallerService.getCallingQueue(selectedTelecaller ? { telecallerId: selectedTelecaller } : {})
      ]);
      if (logsRes.success) {
        setCallLogs(logsRes.data);
        setPagination(logsRes.meta);
      }
      if (queueRes.success) {
        setQueue(queueRes.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load telecaller data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelecallerData(1);
  }, [selectedTelecaller]);

  useEffect(() => {
    if (isManagerOrAdmin) {
      employeeService.getUsers({ limit: 100 }).then(res => {
        if (res.success && Array.isArray(res.data)) {
          const callers = res.data.filter(u => ['telecaller', 'sales_executive'].includes(u.role));
          setTelecallers(callers.length > 0 ? callers : res.data);
        }
      }).catch(() => {});
    }
  }, [isManagerOrAdmin]);

  const handleOpenLogModal = (lead) => {
    setSelectedLead(lead);
    setLogForm({
      callOutcome: 'Connected',
      temperature: lead.temperature || 'Warm',
      notes: '',
      callDurationSeconds: 60,
      nextFollowUpDate: ''
    });
    setIsLogOpen(true);
  };

  const handleSaveCallLog = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await telecallerService.recordCallLog({
        leadId: selectedLead._id || selectedLead.id,
        ...logForm
      });
      toast.success('Call log recorded and lead status updated!');
      setIsLogOpen(false);
      fetchTelecallerData(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to save call log');
    }
  };

  const columns = [
    {
      header: 'Lead Name & Number',
      accessor: 'lead',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">{row.lead?.leadName || 'Lead'}</span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">{row.lead?.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Call Outcome',
      accessor: 'callOutcome',
      render: (row) => <Badge>{row.callOutcome}</Badge>
    },
    {
      header: 'Temperature Tag',
      accessor: 'temperature',
      render: (row) => <Badge>{row.temperature}</Badge>
    },
    {
      header: 'Duration',
      accessor: 'callDurationSeconds',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-[#94A3B8] flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400 dark:text-[#64748B]" /> {Math.floor((row.callDurationSeconds || 0) / 60)}m {(row.callDurationSeconds || 0) % 60}s
        </span>
      )
    },
    {
      header: 'Telecaller',
      accessor: 'telecaller',
      render: (row) => <span className="text-xs font-medium text-slate-800 dark:text-[#F8FAFC]">{row.telecaller?.name || 'Staff'}</span>
    },
    {
      header: 'Notes & Follow-up',
      accessor: 'notes',
      render: (row) => (
        <div className="max-w-xs truncate text-xs text-slate-600 dark:text-[#94A3B8]">
          {row.notes || 'No call notes recorded'}
        </div>
      )
    },
    {
      header: 'Call Date & Time',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
          {new Date(row.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#334155]">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">Telecaller Workspace & Calling Desk</h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">Dial through assigned leads, log call outcomes, and set next reminders</p>
        </div>
        {isManagerOrAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Staff Queue:
            </span>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="text-xs bg-white dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6D28D9] cursor-pointer"
            >
              <option value="">All Telecallers (Global Queue)</option>
              {telecallers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.role?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Calling Queue Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Due Follow-Up Calls"
          subtitle="Scheduled callbacks requiring attention"
          action={<Badge variant="warning">{queue.pendingFollowUps.length} Pending</Badge>}
        >
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {queue.pendingFollowUps.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] text-center py-6">No scheduled follow-ups pending right now</p>
            ) : (
              queue.pendingFollowUps.map((fu) => (
                <div key={fu._id} className="p-3 bg-slate-50 dark:bg-[#243249]/60 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] block">{fu.lead?.leadName}</span>
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-slate-400 dark:text-[#64748B]" /> {fu.lead?.phone}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="accent"
                    icon={PhoneForwarded}
                    onClick={() => handleOpenLogModal(fu.lead)}
                  >
                    Log Call
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card
          title="Fresh Lead Queue"
          subtitle="New assigned leads needing first contact"
          action={<Badge variant="primary">{queue.freshLeads.length} Fresh</Badge>}
        >
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {queue.freshLeads.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] text-center py-6">All assigned fresh leads have been contacted</p>
            ) : (
              queue.freshLeads.map((ld) => (
                <div key={ld._id} className="p-3 bg-slate-50 dark:bg-[#243249]/60 border border-purple-200 dark:border-purple-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] block">{ld.leadName}</span>
                    <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                      {ld.phone} &bull; {ld.source} {ld.assignedTo?.name ? `(${ld.assignedTo.name})` : ''}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    icon={PhoneCall}
                    onClick={() => handleOpenLogModal(ld)}
                  >
                    Call & Log
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Complete Call History Table */}
      <DataTable
        columns={columns}
        data={callLogs}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchTelecallerData(p)}
        emptyTitle="No call interactions logged yet"
        emptyDescription="Calls recorded by telecallers will appear here with timestamps and duration."
      />

      {/* Log Call Modal */}
      {selectedLead && (
        <Modal
          isOpen={isLogOpen}
          onClose={() => setIsLogOpen(false)}
          title={`Log Call: ${selectedLead.leadName}`}
          subtitle={`Phone: ${selectedLead.phone}`}
        >
          <form onSubmit={handleSaveCallLog} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Call Outcome *</label>
              <select
                required
                value={logForm.callOutcome}
                onChange={(e) => setLogForm({ ...logForm, callOutcome: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9] cursor-pointer"
              >
                {['Connected', 'Interested', 'Not Interested', 'Busy', 'RNT', 'Switched Off', 'Call Back', 'Wrong Number'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Temperature Rating *</label>
              <select
                required
                value={logForm.temperature}
                onChange={(e) => setLogForm({ ...logForm, temperature: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9] cursor-pointer"
              >
                {['Hot', 'Warm', 'Cold', 'RNT', 'SwitchedOff', 'Call Back'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Call Duration (Seconds)</label>
              <input
                type="number"
                min="0"
                value={logForm.callDurationSeconds}
                onChange={(e) => setLogForm({ ...logForm, callDurationSeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Schedule Next Follow-Up (Optional)</label>
              <input
                type="datetime-local"
                value={logForm.nextFollowUpDate}
                onChange={(e) => setLogForm({ ...logForm, nextFollowUpDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Call Notes / Discussion Summary</label>
              <textarea
                rows="3"
                value={logForm.notes}
                onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                placeholder="Client requested brochure, scheduled site visit for Saturday..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] border border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setIsLogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Interaction Log
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TelecallersPage;
