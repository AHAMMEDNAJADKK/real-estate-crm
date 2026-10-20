import React from 'react';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const ReceiptModal = ({
  isOpen,
  onClose,
  payment
}) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      subtitle={`Receipt #${payment.receiptNumber || payment._id?.slice(-8).toUpperCase()}`}
      maxWidth="max-w-xl"
    >
      <div id="printable-receipt" className="space-y-6 print:p-8">
        {/* Receipt Header Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#334155]">
          <div>
            <h2 className="text-xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
              KODBRAND REAL ESTATE
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest font-semibold">
              Enterprise Sales & Property Operations
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
              CONFIRMED
            </span>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Date: {formatDate(payment.paymentDate || payment.createdAt)}
            </p>
          </div>
        </div>

        {/* Voucher Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-[#243249] p-4 rounded-xl border border-slate-200 dark:border-[#334155]">
          <div>
            <span className="text-slate-500 dark:text-[#94A3B8] block font-semibold uppercase text-[10px]">Received From</span>
            <strong className="text-sm text-slate-900 dark:text-[#F8FAFC] block mt-0.5">
              {payment.customer?.name || payment.booking?.customer?.name || 'Customer'}
            </strong>
            <span className="text-slate-500 dark:text-[#94A3B8]">
              Phone: {payment.customer?.phone || payment.booking?.customer?.phone || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-[#94A3B8] block font-semibold uppercase text-[10px]">Property Allotment</span>
            <strong className="text-sm text-slate-900 dark:text-[#F8FAFC] block mt-0.5">
              {payment.booking?.project?.name || 'Development Complex'}
            </strong>
            <span className="text-slate-500 dark:text-[#94A3B8]">
              Unit {payment.booking?.property?.unitNumber || '—'}, Tower {payment.booking?.property?.tower || 'A'}
            </span>
          </div>
        </div>

        {/* Payment Line Item Table */}
        <div className="border border-slate-200 dark:border-[#334155] rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-100 dark:bg-[#182437] px-4 py-2 font-bold text-slate-600 dark:text-[#94A3B8] grid grid-cols-3">
            <span>Description</span>
            <span className="text-center">Payment Mode</span>
            <span className="text-right">Amount Paid</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-3 items-center border-t border-slate-200 dark:border-[#334155] bg-white dark:bg-[#243249]">
            <div>
              <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Allotment Advance / Installment</p>
              <p className="text-[10px] text-slate-500 dark:text-[#64748B] font-mono">Ref: {payment.transactionReference || 'Direct Deposit'}</p>
            </div>
            <div className="text-center font-medium text-slate-800 dark:text-[#F8FAFC]">
              {payment.paymentMode || 'Bank Transfer'}
            </div>
            <div className="text-right font-black text-sm text-purple-700 dark:text-purple-300">
              {formatCurrency(payment.amount)}
            </div>
          </div>
        </div>

        {/* Balance Remaining & Authorization */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#243249] border border-slate-200 dark:border-[#334155] rounded-xl text-xs">
          <div>
            <span className="text-slate-500 dark:text-[#94A3B8]">Remaining Balance Due:</span>
            <strong className="text-rose-600 dark:text-rose-400 ml-1.5 text-sm font-bold">
              {formatCurrency(payment.booking?.outstandingBalance || 0)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
            <ShieldCheck size={16} />
            <span>Digitally Authenticated</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#334155] print:hidden">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint}>
            Print Receipt
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ReceiptModal;
