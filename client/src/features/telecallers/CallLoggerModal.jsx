import React, { useState } from 'react';
import { Phone, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import telecallerService from '../../services/telecallerService.js';
import { useToast } from '../../hooks/useToast.js';

const CALL_OUTCOMES = [
  'Connected',
  'Busy',
  'Switched Off',
  'Ringing No Answer',
  'Wrong Number',
  'Follow-up Requested'
];

export const CallLoggerModal = ({
  isOpen,
  onClose,
  lead,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [outcome, setOutcome] = useState('Connected');
  const [duration, setDuration] = useState('60');
  const [remarks, setRemarks] = useState('');
  const [temperature, setTemperature] = useState('Hot');
  const [nextCallback, setNextCallback] = useState('');
  const [loading, setLoading] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await telecallerService.logCall({
        leadId: lead._id || lead.id,
        callOutcome: outcome,
        durationSeconds: Number(duration) || 0,
        notes: remarks,
        temperature,
        nextFollowUpDate: nextCallback || undefined
      });

      showToast(`Call logged successfully for ${lead.name || lead.leadName}`, 'success');
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record call log', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Log Telecaller Call"
      subtitle={`Recording call outcome for ${lead.name || lead.leadName} (${lead.phone})`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Call Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            options={CALL_OUTCOMES}
            required
          />
          <Input
            label="Duration (Seconds)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Lead Temperature"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            options={['Hot', 'Warm', 'Cold', 'RNT', 'SwitchedOff', 'Call Back']}
            required
          />
          <Input
            label="Next Callback Date"
            type="datetime-local"
            value={nextCallback}
            onChange={(e) => setNextCallback(e.target.value)}
            icon={Calendar}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Call Remarks & Next Action
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Key discussion points, budget updates, preferred unit details..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#442d82]/50 focus:border-[#442d82]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={CheckCircle}>
            Save Call Log
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default CallLoggerModal;
