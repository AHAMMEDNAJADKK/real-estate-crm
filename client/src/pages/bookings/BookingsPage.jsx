import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { customerService } from '../../services/customerService';
import { propertyService } from '../../services/propertyService';
import { paymentService } from '../../services/bookingService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Plus, CheckCircle2, XCircle, Calendar, IndianRupee } from 'lucide-react';

export const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);

  const [form, setForm] = useState({
    customerId: '',
    propertyId: '',
    discountAmount: 0,
    tokenAmount: 200000,
    reservationHours: 72,
    remarks: ''
  });

  const toast = useToast();
  const { hasRole } = useAuth();

  const fetchBookings = async (page = 1) => {
    setLoading(true);
    try {
      const res = await bookingService.getBookings({ page, limit: 10 });
      if (res.success) {
        setBookings(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
    customerService.getCustomers({ limit: 100 }).then(r => r.success && setCustomers(r.data)).catch(() => {});
    propertyService.getProperties({ status: 'Available', limit: 100 }).then(r => r.success && setProperties(r.data)).catch(() => {});
  }, []);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      await bookingService.createReservation(form);
      toast.success('Property reservation created and locked');
      setIsModalOpen(false);
      fetchBookings(1);
      propertyService.getProperties({ status: 'Available', limit: 100 }).then(r => r.success && setProperties(r.data)).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Failed to create reservation');
    }
  };

  const handleConfirm = async (id) => {
    if (!window.confirm('Confirm this property booking and generate milestone schedule?')) return;
    try {
      await bookingService.confirmBooking(id);
      toast.success('Booking confirmed! Milestone schedule initialized.');
      fetchBookings(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to confirm booking');
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Please enter the reason for booking cancellation:');
    if (!reason) return;
    try {
      await bookingService.cancelBooking(id, reason);
      toast.success('Booking cancelled. Property released back to inventory.');
      fetchBookings(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

  const handleViewSchedule = async (id) => {
    try {
      const res = await paymentService.getPaymentSchedule(id);
      if (res.success) {
        setSchedule(res.data);
        setIsScheduleOpen(true);
      }
    } catch (err) {
      toast.error('Milestone schedule not found for this reservation yet.');
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const columns = [
    {
      header: 'Booking Ref',
      accessor: 'bookingNumber',
      render: (row) => (
        <div>
          <span className="font-bold text-[#F8FAFC] block">{row.bookingNumber}</span>
          <span className="text-[11px] text-[#94A3B8]">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: 'Customer & Unit',
      accessor: 'customer',
      render: (row) => (
        <div>
          <span className="font-semibold text-[#F8FAFC] block">{row.customer?.name}</span>
          <span className="text-xs text-[#94A3B8]">
            {row.project?.name} &bull; Unit {row.property?.unitNumber}
          </span>
        </div>
      )
    },
    {
      header: 'Financial Summary',
      accessor: 'finalAgreedPrice',
      render: (row) => (
        <div>
          <span className="font-extrabold text-[#F8FAFC] text-sm block">
            {formatCurrency(row.finalAgreedPrice)}
          </span>
          <span className="text-xs text-[#94A3B8]">
            Paid: <span className="text-emerald-400 font-semibold">{formatCurrency(row.totalPaidAmount)}</span> | Due: <span className="text-rose-400 font-semibold">{formatCurrency(row.outstandingBalance)}</span>
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'Actions & Workflow',
      accessor: '_id',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.status === 'Reserved' && hasRole('super_admin', 'admin', 'sales_manager') && (
            <Button size="sm" variant="accent" icon={CheckCircle2} onClick={() => handleConfirm(row._id)}>
              Confirm
            </Button>
          )}
          {row.status !== 'Cancelled' && hasRole('super_admin', 'admin', 'sales_manager') && (
            <Button size="sm" variant="danger" icon={XCircle} onClick={() => handleCancel(row._id)}>
              Cancel
            </Button>
          )}
          {row.status === 'Confirmed' && (
            <Button size="sm" variant="secondary" onClick={() => handleViewSchedule(row._id)}>
              Schedule
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
          <h1 className="text-xl font-bold text-[#F8FAFC]">Property Bookings & Reservations</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Manage unit locks, confirmation approvals, discount permissions, and milestone plans</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Create Reservation
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchBookings(p)}
        emptyTitle="No bookings registered"
        emptyDescription="Create unit reservations for interested buyers to lock inventory."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Create Reservation"
      />

      {/* Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Reserve Property Unit"
        subtitle="Lock available inventory unit for customer"
      >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Select Customer *</label>
            <select
              required
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            >
              <option value="">Select Buyer</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Select Available Unit *</label>
            <select
              required
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            >
              <option value="">Choose Available Unit</option>
              {properties.map(p => (
                <option key={p._id} value={p._id}>
                  {p.project?.name} - Unit {p.unitNumber} ({p.propertyType} - ₹{p.listedPrice?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Discount (₹)</label>
              <input
                type="number"
                value={form.discountAmount}
                onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Token Advance (₹)</label>
              <input
                type="number"
                value={form.tokenAmount}
                onChange={(e) => setForm({ ...form, tokenAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Reservation Lock (Hours)</label>
            <input
              type="number"
              value={form.reservationHours}
              onChange={(e) => setForm({ ...form, reservationHours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Remarks</label>
            <textarea
              rows="2"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Special payment terms or approval notes..."
              className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Lock & Reserve Unit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Milestone Schedule Modal */}
      {schedule && (
        <Modal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          title={`Milestone Payment Schedule: ${schedule.booking?.bookingNumber}`}
          subtitle={`Total Deal Value: ${formatCurrency(schedule.totalAmount)}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="border border-[#334155] rounded-xl overflow-hidden divide-y divide-[#334155] bg-[#243249] text-xs">
              {schedule.installments?.map((inst, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F8FAFC] block">{inst.milestoneName}</span>
                    <span className="text-[#94A3B8]">
                      Due: {new Date(inst.dueDate).toLocaleDateString()} &bull; {inst.percentage}% of sale value
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#F8FAFC] block">{formatCurrency(inst.amountDue)}</span>
                    <Badge>{inst.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsScheduleOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BookingsPage;
