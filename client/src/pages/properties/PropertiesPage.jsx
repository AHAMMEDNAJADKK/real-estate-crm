import React, { useState, useEffect } from 'react';
import { propertyService, projectService } from '../../services/propertyService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Home, Plus, Layers, IndianRupee } from 'lucide-react';

export const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    unitNumber: '',
    project: '',
    blockOrTower: 'Tower A',
    floor: 1,
    propertyType: '2BHK',
    superBuiltUpAreaSqFt: 1200,
    carpetAreaSqFt: 950,
    facing: 'East',
    furnishingStatus: 'Unfurnished',
    listedPrice: 6500000,
    status: 'Available'
  });

  const toast = useToast();

  const fetchProperties = async (page = 1) => {
    setLoading(true);
    try {
      const res = await propertyService.getProperties({
        page,
        limit: 10,
        project: projectFilter,
        status: statusFilter
      });
      if (res.success) {
        setProperties(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load property inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(1);
  }, [projectFilter, statusFilter]);

  useEffect(() => {
    projectService.getProjects({ limit: 100 }).then(r => r.success && setProjects(r.data)).catch(() => {});
  }, []);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      await propertyService.createProperty(form);
      toast.success('Property unit added to inventory');
      setIsModalOpen(false);
      fetchProperties(1);
    } catch (err) {
      toast.error(err.message || 'Failed to add property unit');
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const columns = [
    {
      header: 'Unit & Tower',
      accessor: 'unitNumber',
      render: (row) => (
        <div>
          <span className="font-bold text-[#F8FAFC] block">{row.unitNumber}</span>
          <span className="text-xs text-[#94A3B8]">{row.blockOrTower} &bull; Floor {row.floor}</span>
        </div>
      )
    },
    {
      header: 'Project',
      accessor: 'project',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-[#F8FAFC] block">{row.project?.name || 'Development'}</span>
          <span className="text-[10px] text-[#64748B]">{row.project?.code}</span>
        </div>
      )
    },
    {
      header: 'Type & Specs',
      accessor: 'propertyType',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-[#F8FAFC] block">{row.propertyType}</span>
          <span className="text-xs text-[#94A3B8]">{row.superBuiltUpAreaSqFt} sq.ft ({row.facing} Facing)</span>
        </div>
      )
    },
    {
      header: 'Listed Price',
      accessor: 'listedPrice',
      render: (row) => (
        <span className="font-extrabold text-[#F8FAFC] text-sm">
          {formatCurrency(row.listedPrice)}
        </span>
      )
    },
    {
      header: 'Availability Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Property Units & Inventory Catalogue</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Track real-time unit availability, area metrics, and pricing safeguards</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Unit
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-[#1E2B40] p-4 rounded-2xl border border-[#334155] flex-wrap">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase">Filters:</span>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="text-xs bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9]"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-[#243249] border border-[#334155] text-[#F8FAFC] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D28D9]"
        >
          <option value="">All Availability Statuses</option>
          {['Available', 'Reserved', 'Booked', 'Sold', 'On Hold'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={properties}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchProperties(p)}
        emptyTitle="No property units found"
        emptyDescription="Add apartment units or plots to start tracking availability."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Add Unit"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Property Unit"
        subtitle="Configure new real estate unit under master project"
      >
        <form onSubmit={handleCreateProperty} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Select Project *</label>
            <select
              required
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            >
              <option value="">Choose Project</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Unit Number *</label>
              <input
                type="text"
                required
                value={form.unitNumber}
                onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                placeholder="e.g. 402 or B-12"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Tower / Block</label>
              <input
                type="text"
                value={form.blockOrTower}
                onChange={(e) => setForm({ ...form, blockOrTower: e.target.value })}
                placeholder="Tower A"
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Floor</label>
              <input
                type="number"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              >
                {['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Villa', 'Commercial', 'Plot'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Super Area (Sq.Ft) *</label>
              <input
                type="number"
                required
                value={form.superBuiltUpAreaSqFt}
                onChange={(e) => setForm({ ...form, superBuiltUpAreaSqFt: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-1">Listed Price (₹) *</label>
              <input
                type="number"
                required
                value={form.listedPrice}
                onChange={(e) => setForm({ ...form, listedPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[#243249] text-[#F8FAFC] placeholder-[#64748B] border border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PropertiesPage;
