import React, { useState, useEffect } from 'react';
import { opportunityService, customerService } from '../../services/customerService';
import { projectService } from '../../services/propertyService';
import { employeeService } from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Spinner } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Kanban, Plus, DollarSign, Calendar, User, MoveRight } from 'lucide-react';

const STAGES = [
  'Qualified',
  'Property Shortlisted',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiation',
  'Booking Initiated',
  'Closed Won',
  'Closed Lost'
];

export const OpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    title: '',
    customer: '',
    project: '',
    expectedRevenue: 8500000,
    expectedCloseDate: '',
    stage: 'Qualified',
    nextAction: 'Discuss available floor inventory'
  });

  const toast = useToast();

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await opportunityService.getOpportunities();
      if (res.success) {
        setOpportunities(res.data);
      }
    } catch (err) {
      toast.error('Failed to load sales pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    customerService.getCustomers({ limit: 100 }).then(r => r.success && setCustomers(r.data)).catch(() => {});
    projectService.getProjects({ limit: 100 }).then(r => r.success && setProjects(r.data)).catch(() => {});
    employeeService.getUsers({ limit: 100 }).then(r => r.success && setEmployees(r.data)).catch(() => {});
  }, []);

  const handleStageMove = async (id, nextStage) => {
    try {
      await opportunityService.updateOpportunity(id, { stage: nextStage });
      toast.success(`Deal moved to ${nextStage}`);
      fetchOpportunities();
    } catch (err) {
      toast.error(err.message || 'Failed to update deal stage');
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    try {
      await opportunityService.createOpportunity(form);
      toast.success('Sales opportunity created');
      setIsModalOpen(false);
      fetchOpportunities();
    } catch (err) {
      toast.error(err.message || 'Failed to create opportunity');
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Pipeline & Kanban Deals</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track opportunities through qualification, negotiation, and contract closure</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Opportunity
        </Button>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const stageDeals = opportunities.filter((o) => o.stage === stage);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.expectedRevenue || 0), 0);

          return (
            <div key={stage} className="min-w-[280px] max-w-[280px] bg-slate-100/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{stage}</h3>
                  <span className="text-[11px] text-slate-500">{formatCurrency(stageTotal)}</span>
                </div>
                <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-[10px] font-bold text-slate-700 flex items-center justify-center">
                  {stageDeals.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {stageDeals.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-8">No deals in this stage</p>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal._id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all text-xs space-y-2"
                    >
                      <div className="font-bold text-slate-900 text-sm">{deal.title}</div>
                      <div className="text-slate-600 flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-slate-400" /> {deal.customer?.name}
                      </div>
                      <div className="font-extrabold text-[#442d82] text-sm">
                        {formatCurrency(deal.expectedRevenue)}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {deal.project?.name || 'Development deal'}
                      </div>

                      {/* Stage Progression Selector */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageMove(deal._id, e.target.value)}
                          className="w-full text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Opportunity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Sales Opportunity"
        subtitle="Track potential buyer property deal"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Skyline 3BHK Deal - Vikram"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Customer *</label>
              <select
                required
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project</label>
              <select
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Revenue (₹)</label>
              <input
                type="number"
                value={form.expectedRevenue}
                onChange={(e) => setForm({ ...form, expectedRevenue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Pipeline Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OpportunitiesPage;
