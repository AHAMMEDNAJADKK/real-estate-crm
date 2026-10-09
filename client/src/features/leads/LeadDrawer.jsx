import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Clock,
  Building,
  DollarSign,
  Tag,
  CheckCircle,
  PhoneCall
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import CallLoggerModal from '../telecallers/CallLoggerModal.jsx';

export const LeadDrawer = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated
}) => {
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#442d82]/10 text-[#442d82] dark:text-purple-300 flex items-center justify-center font-bold text-lg">
                {(lead.name || lead.leadName || 'L').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lead.name || lead.leadName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {lead.leadNumber || 'ID: ' + lead._id?.slice(-6)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={lead.temperature} />
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={PhoneCall}
              onClick={() => setIsCallModalOpen(true)}
            >
              Log Call
            </Button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="default">{lead.status || 'New'}</Badge>
              <Badge variant="accent">{lead.source || 'Direct'}</Badge>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Contact Details */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Phone size={16} className="text-slate-400" />
                  <span className="font-semibold">{lead.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 truncate">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{lead.email || '—'}</span>
                </div>
              </div>
            </div>

            {/* Property Interest & Budget */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Interest & Budget
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Target Budget</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(lead.budget)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Unit Preference</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {lead.preferredPropertyType || 'Any'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment & Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Assignment Details
              </h4>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Assigned Executive:</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {lead.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Remarks & Notes
                </h4>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-sm text-slate-700 dark:text-slate-300">
                  {lead.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-400 text-center">
              Created on {formatDate(lead.createdAt, true)}
            </p>
          </div>
        </div>
      </div>

      <CallLoggerModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        lead={lead}
        onSuccess={() => {
          onLeadUpdated && onLeadUpdated();
          onClose();
        }}
      />
    </div>
  );
};

export default LeadDrawer;
