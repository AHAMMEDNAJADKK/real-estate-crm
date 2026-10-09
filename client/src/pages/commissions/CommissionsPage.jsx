import React, { useState, useEffect } from 'react';
import { commissionService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { BadgePercent, CheckCircle2, DollarSign, Wallet } from 'lucide-react';

export const CommissionsPage = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');

  // Disburse Payout Modal
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');

  const toast = useToast();
  const { hasRole } = useAuth();

  const fetchCommissions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await commissionService.getCommissions({ page, limit: 10, status: statusFilter });
      if (res.success) {
        setCommissions(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions(1);
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await commissionService.approveCommission(id);
      toast.success('Commission approved for payout');
      fetchCommissions(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to approve commission');
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!selectedCommission) return;
    try {
      await commissionService.payoutCommission(selectedCommission._id, { paymentReference: paymentRef });
      toast.success('Commission disbursed and recorded in accounts ledger');
      setSelectedCommission(null);
      setPaymentRef('');
      fetchCommissions(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to disburse commission');
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const columns = [
    {
      header: 'Sales Agent / Broker',
      accessor: 'agent',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.agent?.name}</span>
          <span className="text-xs text-slate-500">{row.agent?.email} &bull; {row.agent?.role?.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      header: 'Booking Ref & Unit',
      accessor: 'booking',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.booking?.bookingNumber}</span>
          <span className="text-xs text-slate-500">Unit {row.booking?.property?.unitNumber}</span>
        </div>
      )
    },
    {
      header: 'Sale Value',
      accessor: 'saleValue',
      render: (row) => <span className="text-xs font-semibold text-slate-800">{formatCurrency(row.saleValue)}</span>
    },
    {
      header: 'Commission Amount',
      accessor: 'commissionAmount',
      render: (row) => (
        <div>
          <span className="font-extrabold text-[#442d82] text-sm block">{formatCurrency(row.commissionAmount)}</span>
          <span className="text-[10px] text-slate-400 font-semibold">{row.rate}% {row.commissionType}</span>
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
          {row.status === 'Pending' && hasRole('super_admin', 'admin', 'sales_manager') && (
            <Button size="sm" variant="accent" icon={CheckCircle2} onClick={() => handleApprove(row._id)}>
              Approve
            </Button>
          )}
          {row.status === 'Approved' && hasRole('super_admin', 'admin', 'accountant') && (
            <Button
              size="sm"
              icon={Wallet}
              onClick={() => {
                setSelectedCommission(row);
                setPaymentRef(`UTR-${Date.now().toString().slice(-6)}`);
              }}
            >
              Pay Out
            </Button>
          )}
          {row.status === 'Paid' && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paid: {row.paymentReference}
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Commission & Brokerage Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track sales executive incentives, external broker fees, approvals, and payout records</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-semibold text-slate-500 uppercase">Status Filter:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
        >
          <option value="">All Commissions</option>
          <option value="Pending">Pending Approval</option>
          <option value="Approved">Approved for Payout</option>
          <option value="Paid">Paid Out</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={commissions}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchCommissions(p)}
        emptyTitle="No commissions recorded"
        emptyDescription="Commissions are automatically computed when bookings are confirmed."
      />

      {/* Disburse Modal */}
      {selectedCommission && (
        <Modal
          isOpen={!!selectedCommission}
          onClose={() => setSelectedCommission(null)}
          title={`Disburse Commission: ${selectedCommission.agent?.name}`}
          subtitle={`Amount Due: ${formatCurrency(selectedCommission.commissionAmount)}`}
        >
          <form onSubmit={handleDisburse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bank Payout Reference / UTR Number *
              </label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. UTR84729103"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <p className="text-xs text-slate-500">
              Confirming this payout will record an official Brokerage Expense in the Accounts Ledger.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" type="button" onClick={() => setSelectedCommission(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Confirm Disbursal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CommissionsPage;
