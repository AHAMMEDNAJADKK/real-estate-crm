import React, { useState, useEffect } from 'react';
import { paymentService, bookingService } from '../../services/bookingService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { CreditCard, Plus, Receipt as ReceiptIcon, RefreshCw, Printer } from 'lucide-react';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [form, setForm] = useState({
    bookingId: '',
    amount: '',
    paymentMethod: 'Bank Transfer (NEFT/RTGS)',
    transactionReference: '',
    notes: ''
  });

  const [refundForm, setRefundForm] = useState({
    refundAmount: '',
    reason: ''
  });

  const toast = useToast();

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments({ page, limit: 10 });
      if (res.success) {
        setPayments(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
    bookingService.getBookings({ limit: 100 }).then(r => r.success && setBookings(r.data)).catch(() => {});
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await paymentService.recordPayment(form);
      toast.success('Payment recorded and official receipt generated');
      setIsModalOpen(false);
      setForm({
        bookingId: '',
        amount: '',
        paymentMethod: 'Bank Transfer (NEFT/RTGS)',
        transactionReference: '',
        notes: ''
      });
      fetchPayments(1);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  const handleOpenReceipt = async (payment) => {
    try {
      const res = await paymentService.getReceipt(payment._id);
      if (res.success) {
        setReceiptData(res.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      toast.error('Receipt not found');
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      await paymentService.refundPayment(selectedPayment._id, refundForm);
      toast.success('Payment refund processed and accounting ledger updated');
      setIsRefundOpen(false);
      fetchPayments(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to process refund');
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const columns = [
    {
      header: 'Payment No & Receipt',
      accessor: 'paymentNumber',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.paymentNumber}</span>
          <span className="text-xs text-[#442d82] font-semibold">{row.receiptNumber || 'No receipt'}</span>
        </div>
      )
    },
    {
      header: 'Booking Ref & Customer',
      accessor: 'booking',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.booking?.bookingNumber}</span>
          <span className="text-xs text-slate-500">{row.customer?.name} ({row.customer?.phone})</span>
        </div>
      )
    },
    {
      header: 'Amount Collected',
      accessor: 'amount',
      render: (row) => (
        <span className="font-extrabold text-slate-900 text-sm">
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: 'Method & Reference',
      accessor: 'paymentMethod',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block">{row.paymentMethod}</span>
          <span className="text-[11px] text-slate-500 font-mono">{row.transactionReference || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" icon={ReceiptIcon} onClick={() => handleOpenReceipt(row)}>
            Receipt
          </Button>
          {row.status === 'Successful' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedPayment(row);
                setRefundForm({ refundAmount: row.amount, reason: '' });
                setIsRefundOpen(true);
              }}
            >
              Refund
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments, Collections & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Collect milestone installments, issue official payment receipts, and manage refunds</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Record Payment
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchPayments(p)}
        emptyTitle="No payments recorded"
        emptyDescription="Record customer token deposits or milestone installment payments."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Record Payment"
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Booking Payment"
        subtitle="Apply funds to booking and issue official receipt"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Booking *</label>
            <select
              required
              value={form.bookingId}
              onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            >
              <option value="">Select Booking</option>
              {bookings.map(b => (
                <option key={b._id} value={b._id}>
                  {b.bookingNumber} - {b.customer?.name} (Due: ₹{b.outstandingBalance?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                {['Bank Transfer (NEFT/RTGS)', 'Cheque', 'UPI', 'Credit Card', 'Cash', 'Demand Draft'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bank Reference / UTR Number</label>
            <input
              type="text"
              value={form.transactionReference}
              onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
              placeholder="e.g. UTR1289384729"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Notes</label>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Installment 1 payment notes..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Modal */}
      {receiptData && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          title={`Receipt: ${receiptData.receiptNumber}`}
          subtitle="Official Real Estate Payment Acknowledgement"
          maxWidth="max-w-xl"
        >
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">KODBRAND REALTY</h3>
                <p className="text-slate-500">Bangalore Headquarters</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700">Receipt No:</span>
                <span className="font-mono text-[#442d82] block">{receiptData.receiptNumber}</span>
                <span className="text-slate-400">{new Date(receiptData.issuedDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Received From:</span>
                <span className="font-bold text-slate-800 text-sm">{receiptData.customer?.name}</span>
                <span className="text-slate-500 block">{receiptData.customer?.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Booking Reference:</span>
                <span className="font-bold text-slate-800">{receiptData.booking?.bookingNumber}</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700 text-sm">Total Amount Paid</span>
              <span className="font-extrabold text-lg text-emerald-600">
                {formatCurrency(receiptData.amount)}
              </span>
            </div>

            <p className="text-slate-500 italic text-center">
              "{receiptData.remarks || 'Thank you for your business. This is an electronically generated payment receipt.'}"
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print Receipt
              </Button>
              <Button size="sm" onClick={() => setIsReceiptOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {selectedPayment && (
        <Modal
          isOpen={isRefundOpen}
          onClose={() => setIsRefundOpen(false)}
          title={`Process Refund: ${selectedPayment.paymentNumber}`}
          subtitle={`Original Amount: ${formatCurrency(selectedPayment.amount)}`}
        >
          <form onSubmit={handleProcessRefund} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Refund Amount (₹) *</label>
              <input
                type="number"
                required
                max={selectedPayment.amount}
                value={refundForm.refundAmount}
                onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Refund *</label>
              <textarea
                required
                rows="3"
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                placeholder="Booking adjustment, loan rejection, cancellation refund..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" type="button" onClick={() => setIsRefundOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" type="submit">
                Execute Refund
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PaymentsPage;
