import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Receipt, Plus, ArrowUpRight, ArrowDownRight, Scale, IndianRupee } from 'lucide-react';

export const AccountsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'EXPENSE',
    category: 'Marketing & Ads',
    amount: '',
    accountType: 'Bank Account',
    referenceNumber: '',
    description: ''
  });

  const toast = useToast();

  const fetchAccountsData = async (page = 1) => {
    setLoading(true);
    try {
      const [txRes, reconRes] = await Promise.all([
        accountService.getTransactions({ page, limit: 10, type: typeFilter }),
        accountService.getReconciliation()
      ]);
      if (txRes.success) {
        setTransactions(txRes.data);
        setPagination(txRes.meta);
      }
      if (reconRes.success) {
        setReconciliation(reconRes.data);
      }
    } catch (err) {
      toast.error('Failed to load accounts ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsData(1);
  }, [typeFilter]);

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await accountService.createTransaction(form);
      toast.success('Financial ledger entry recorded');
      setIsModalOpen(false);
      setForm({
        type: 'EXPENSE',
        category: 'Marketing & Ads',
        amount: '',
        accountType: 'Bank Account',
        referenceNumber: '',
        description: ''
      });
      fetchAccountsData(1);
    } catch (err) {
      toast.error(err.message || 'Failed to record entry');
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const columns = [
    {
      header: 'Tx Number & Date',
      accessor: 'transactionNumber',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.transactionNumber}</span>
          <span className="text-xs text-slate-400">{new Date(row.transactionDate).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) =>
        row.type === 'INCOME' ? (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Income
          </span>
        ) : (
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Expense
          </span>
        )
    },
    {
      header: 'Category & Account',
      accessor: 'category',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{row.category}</span>
          <span className="text-[11px] text-slate-500">{row.accountType} &bull; {row.referenceNumber || 'Direct'}</span>
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className={`font-extrabold text-sm ${row.type === 'INCOME' ? 'text-emerald-700' : 'text-slate-900'}`}>
          {row.type === 'INCOME' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => <div className="text-xs text-slate-600 max-w-xs truncate">{row.description || '—'}</div>
    },
    {
      header: 'Recorded By',
      accessor: 'recordedBy',
      render: (row) => <span className="text-xs text-slate-600">{row.recordedBy?.name || 'Staff'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accounts, Collections & Financial Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track real estate collections, broker commissions, operating expenses, and cash reconciliation</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Record Entry
        </Button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-emerald-200/80 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Inflow / Collections</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
                {formatCurrency(reconciliation?.totalIncome)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-rose-200/80 bg-rose-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Total Expenses & Brokerage</p>
              <h3 className="text-2xl font-extrabold text-rose-700 mt-1">
                {formatCurrency(reconciliation?.totalExpense)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-indigo-200/80 bg-indigo-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#442d82] uppercase tracking-wider">Net Operating Cash Flow</p>
              <h3 className="text-2xl font-extrabold text-[#442d82] mt-1">
                {formatCurrency(reconciliation?.netCashFlow)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-[#442d82]">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-semibold text-slate-500 uppercase">Filter:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
        >
          <option value="">All Transactions</option>
          <option value="INCOME">Income / Collections</option>
          <option value="EXPENSE">Expenses & Refunds</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchAccountsData(p)}
        emptyTitle="No financial transactions recorded"
        emptyDescription="Transactions recorded via booking payments, broker payouts, or manual entries appear here."
      />

      {/* Record Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Financial Transaction"
        subtitle="Add operating expense or income entry to ledger"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entry Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                {[
                  'Marketing & Ads',
                  'Site Maintenance',
                  'Brokerage Payout',
                  'Legal & Registration',
                  'Office Operations',
                  'Booking Collection',
                  'Customer Refund',
                  'Other'
                ].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="Amount in Rupees"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Channel</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="Bank Account">Bank Account</option>
                <option value="Escrow Account">Escrow Account</option>
                <option value="Cash in Hand">Cash in Hand</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reference / Bill / UTR</label>
            <input
              type="text"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              placeholder="e.g. BILL-9823 or UTR..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the financial transaction..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsPage;
