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
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 dark:border-white">
          <div>
            <h2 className="text-xl font-black text-[#442d82] dark:text-purple-300 tracking-tight">
              KODBRAND REAL ESTATE
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Enterprise Sales & Property Operations
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              CONFIRMED
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Date: {formatDate(payment.paymentDate || payment.createdAt)}
            </p>
          </div>
        </div>

        {/* Voucher Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px]">Received From</span>
            <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
              {payment.customer?.name || payment.booking?.customer?.name || 'Customer'}
            </strong>
            <span className="text-slate-500">
              Phone: {payment.customer?.phone || payment.booking?.customer?.phone || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px]">Property Allotment</span>
            <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
              {payment.booking?.project?.name || 'Development Complex'}
            </strong>
            <span className="text-slate-500">
              Unit {payment.booking?.property?.unitNumber || '—'}, Tower {payment.booking?.property?.tower || 'A'}
            </span>
          </div>
        </div>

        {/* Payment Line Item Table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 grid grid-cols-3">
            <span>Description</span>
            <span className="text-center">Payment Mode</span>
            <span className="text-right">Amount Paid</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-3 items-center border-t border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Allotment Advance / Installment</p>
              <p className="text-[10px] text-slate-400 font-mono">Ref: {payment.transactionReference || 'Direct Deposit'}</p>
            </div>
            <div className="text-center font-medium text-slate-600 dark:text-slate-300">
              {payment.paymentMode || 'Bank Transfer'}
            </div>
            <div className="text-right font-black text-sm text-[#442d82] dark:text-purple-300">
              {formatCurrency(payment.amount)}
            </div>
          </div>
        </div>

        {/* Balance Remaining & Authorization */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
          <div>
            <span className="text-slate-500">Remaining Balance Due:</span>
            <strong className="text-rose-600 ml-1.5 text-sm">
              {formatCurrency(payment.booking?.outstandingBalance || 0)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <ShieldCheck size={16} />
            <span>Digitally Authenticated</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 print:hidden">
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
