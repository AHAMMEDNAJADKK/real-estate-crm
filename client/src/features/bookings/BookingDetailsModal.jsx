import React from 'react';
import { Building, User, Calendar, DollarSign, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const BookingDetailsModal = ({
  isOpen,
  onClose,
  booking,
  onPrintReceipt
}) => {
  if (!isOpen || !booking) return null;

  const totalPaid = booking.totalPaidAmount || 0;
  const agreedPrice = booking.finalAgreedPrice || booking.agreedPrice || 1;
  const paidPercent = Math.min(100, Math.round((totalPaid / agreedPrice) * 100));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Contract & Payment Status"
      subtitle={`Booking Ref: ${booking.bookingNumber || booking._id?.slice(-8)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Status & Overview */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#4C2A8A]/20 border border-[#6D28D9]/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#1E2B40] rounded-xl shadow-xs text-purple-300 border border-[#334155]">
              <Building size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[#F8FAFC]">
                {booking.project?.name || 'Development Project'}
              </h4>
              <p className="text-xs text-[#94A3B8]">
                Tower {booking.property?.tower || 'A'} • Unit {booking.property?.unitNumber || '—'} ({booking.property?.unitType || 'Apartment'})
              </p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Financial Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#243249] border border-[#334155] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#94A3B8]">Collection Progress</span>
            <span className="font-bold text-purple-300">{paidPercent}% Paid</span>
          </div>
          <div className="w-full bg-[#182437] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#6D28D9] to-[#84CC16] h-full rounded-full transition-all duration-500"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
            <span>Collected: <strong className="text-[#F8FAFC]">{formatCurrency(totalPaid)}</strong></span>
            <span>Balance: <strong className="text-rose-400">{formatCurrency(booking.outstandingBalance || 0)}</strong></span>
          </div>
        </div>

        {/* Pricing Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#243249] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Listed Price</span>
            <span className="text-sm font-bold text-[#F8FAFC]">{formatCurrency(booking.listedPrice)}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#243249] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Discount</span>
            <span className="text-sm font-bold text-emerald-400">-{formatCurrency(booking.discountAmount || 0)}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#243249] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Final Sale Price</span>
            <span className="text-sm font-bold text-[#F8FAFC]">{formatCurrency(agreedPrice)}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#243249] border border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Token Advance</span>
            <span className="text-sm font-bold text-purple-300">{formatCurrency(booking.bookingTokenAmount || 0)}</span>
          </div>
        </div>

        {/* Customer & Agent Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#334155] bg-[#243249] space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Buyer Details</span>
            <p className="font-bold text-[#F8FAFC] text-sm">{booking.customer?.name || 'Valued Customer'}</p>
            <p className="text-[#94A3B8]">Phone: {booking.customer?.phone || '—'}</p>
            <p className="text-[#94A3B8]">Email: {booking.customer?.email || '—'}</p>
          </div>

          <div className="p-4 rounded-xl border border-[#334155] bg-[#243249] space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Sales Closing Executive</span>
            <p className="font-bold text-[#F8FAFC] text-sm">{booking.bookedBy?.name || 'Executive'}</p>
            <p className="text-[#94A3B8]">Department: {booking.bookedBy?.department || 'Sales'}</p>
            <p className="text-[#94A3B8]">Booking Date: {formatDate(booking.createdAt, true)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#334155]">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onPrintReceipt && (
            <Button variant="primary" icon={Printer} onClick={() => onPrintReceipt(booking)}>
              Print Official Receipt
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default BookingDetailsModal;
