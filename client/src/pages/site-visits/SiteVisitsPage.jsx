import React, { useState, useEffect } from 'react';
import { siteVisitService } from '../../services/meetingService';
import { projectService } from '../../services/propertyService';
import { leadService } from '../../services/leadService';
import { employeeService } from '../../services/dashboardService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { MapPin, Plus, Clock, Car, Star } from 'lucide-react';

export const SiteVisitsPage = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    project: '',
    lead: '',
    assignedExecutive: '',
    visitDate: '',
    visitTime: '02:00 PM',
    pickupRequired: false,
    pickupLocation: '',
    visitorsCount: 2
  });

  const [feedbackForm, setFeedbackForm] = useState({
    status: 'Completed',
    interestRating: 'High',
    feedback: '',
    nextActionPlan: ''
  });

  const toast = useToast();

  const fetchVisits = async (page = 1) => {
    setLoading(true);
    try {
      const res = await siteVisitService.getSiteVisits({ page, limit: 10 });
      if (res.success) {
        setVisits(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load site visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(1);
    projectService.getProjects({ limit: 100 }).then(r => r.success && setProjects(r.data)).catch(() => {});
    leadService.getLeads({ limit: 100 }).then(r => r.success && setLeads(r.data)).catch(() => {});
    employeeService.getUsers({ limit: 100 }).then(r => r.success && setEmployees(r.data)).catch(() => {});
  }, []);

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    try {
      await siteVisitService.createSiteVisit(form);
      toast.success('Site visit scheduled successfully');
      setIsModalOpen(false);
      fetchVisits(1);
    } catch (err) {
      toast.error(err.message || 'Failed to schedule site visit');
    }
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    try {
      await siteVisitService.updateSiteVisit(selectedVisit._id, feedbackForm);
      toast.success('Visit feedback recorded successfully');
      setIsFeedbackOpen(false);
      fetchVisits(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to record feedback');
    }
  };

  const columns = [
    {
      header: 'Project & Client',
      accessor: 'project',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.project?.name || 'Project'}</span>
          <span className="text-xs text-slate-500">
            {row.lead?.leadName || row.customer?.name || 'Client'} &bull; {row.lead?.phone || row.customer?.phone}
          </span>
        </div>
      )
    },
    {
      header: 'Visit Schedule',
      accessor: 'visitDate',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            {new Date(row.visitDate).toLocaleDateString()}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> {row.visitTime}
          </span>
        </div>
      )
    },
    {
      header: 'Pickup & Visitors',
      accessor: 'pickupRequired',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-700 flex items-center gap-1">
            {row.pickupRequired ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Pickup Required</span>
            ) : (
              <span className="text-slate-400">Direct Arrival</span>
            )}
          </span>
          <span className="text-[11px] text-slate-500 block">{row.visitorsCount} Visitors</span>
        </div>
      )
    },
    {
      header: 'Interest Rating',
      accessor: 'interestRating',
      render: (row) => <Badge>{row.interestRating}</Badge>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'Executive & Action',
      accessor: 'assignedExecutive',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700">{row.assignedExecutive?.name || 'Staff'}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedVisit(row);
              setFeedbackForm({
                status: row.status || 'Completed',
                interestRating: row.interestRating || 'High',
                feedback: row.feedback || '',
                nextActionPlan: row.nextActionPlan || ''
              });
              setIsFeedbackOpen(true);
            }}
          >
            Feedback
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Property Site Visits & Tours</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage on-site property walkthroughs, pickup arrangements, and customer feedback</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Schedule Site Visit
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={visits}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchVisits(p)}
        emptyTitle="No site visits scheduled"
        emptyDescription="Schedule client walkthroughs to showcase show-apartments and villa models."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Schedule Visit"
      />

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Site Walkthrough"
        subtitle="Book physical property visit for client"
      >
        <form onSubmit={handleCreateVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Project *</label>
            <select
              required
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.location?.city || ''})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Lead *</label>
              <select
                required
                value={form.lead}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="">Select Lead</option>
                {leads.map(l => (
                  <option key={l._id} value={l._id}>{l.leadName} ({l.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Executive *</label>
              <select
                required
                value={form.assignedExecutive}
                onChange={(e) => setForm({ ...form, assignedExecutive: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="">Select Executive</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Visit Date *</label>
              <input
                type="date"
                required
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time</label>
              <input
                type="text"
                value={form.visitTime}
                onChange={(e) => setForm({ ...form, visitTime: e.target.value })}
                placeholder="02:00 PM"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pickupRequired"
              checked={form.pickupRequired}
              onChange={(e) => setForm({ ...form, pickupRequired: e.target.checked })}
              className="rounded text-[#442d82]"
            />
            <label htmlFor="pickupRequired" className="text-xs font-semibold text-slate-700">
              Customer cab / vehicle pickup required
            </label>
          </div>

          {form.pickupRequired && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pickup Address</label>
              <input
                type="text"
                value={form.pickupLocation}
                onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                placeholder="Hotel / Residential address"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Visit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Feedback Modal */}
      {selectedVisit && (
        <Modal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          title={`Record Visit Feedback: ${selectedVisit.project?.name}`}
          subtitle="Log customer walkthrough reaction and next steps"
        >
          <form onSubmit={handleSaveFeedback} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Visit Status</label>
                <select
                  value={feedbackForm.status}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
                >
                  {['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Interest Rating</label>
                <select
                  value={feedbackForm.interestRating}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, interestRating: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
                >
                  {['Very High', 'High', 'Moderate', 'Low', 'Not Interested'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Feedback Notes</label>
              <textarea
                rows="3"
                value={feedbackForm.feedback}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                placeholder="Liked master bedroom and terrace, requested discount on Tower B..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Next Action Plan</label>
              <input
                type="text"
                value={feedbackForm.nextActionPlan}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, nextActionPlan: e.target.value })}
                placeholder="e.g. Issue formal quotation by Monday morning"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" type="button" onClick={() => setIsFeedbackOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Feedback
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SiteVisitsPage;
