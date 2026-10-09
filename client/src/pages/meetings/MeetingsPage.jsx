import React, { useState, useEffect } from 'react';
import { meetingService } from '../../services/meetingService';
import { employeeService } from '../../services/dashboardService';
import { leadService } from '../../services/leadService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Calendar, Plus, Clock, MapPin, Video, CheckCircle2 } from 'lucide-react';

export const MeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);

  const [form, setForm] = useState({
    title: '',
    lead: '',
    meetingType: 'Office Meeting',
    scheduledDate: '',
    time: '11:00 AM',
    location: 'Head Office',
    assignedEmployee: '',
    notes: ''
  });

  const toast = useToast();

  const fetchMeetings = async (page = 1) => {
    setLoading(true);
    try {
      const res = await meetingService.getMeetings({ page, limit: 10 });
      if (res.success) {
        setMeetings(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings(1);
    employeeService.getUsers({ limit: 100 }).then(r => r.success && setEmployees(r.data)).catch(() => {});
    leadService.getLeads({ limit: 100 }).then(r => r.success && setLeads(r.data)).catch(() => {});
  }, []);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      await meetingService.createMeeting(form);
      toast.success('Meeting scheduled successfully');
      setIsModalOpen(false);
      setForm({
        title: '',
        lead: '',
        meetingType: 'Office Meeting',
        scheduledDate: '',
        time: '11:00 AM',
        location: 'Head Office',
        assignedEmployee: '',
        notes: ''
      });
      fetchMeetings(1);
    } catch (err) {
      toast.error(err.message || 'Failed to schedule meeting');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await meetingService.updateMeeting(id, { status });
      toast.success(`Meeting status changed to ${status}`);
      fetchMeetings(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update meeting');
    }
  };

  const columns = [
    {
      header: 'Title & Client',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.title}</span>
          <span className="text-xs text-slate-500">
            {row.lead?.leadName || row.customer?.name || 'Prospective Client'} &bull; {row.lead?.phone || row.customer?.phone}
          </span>
        </div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'scheduledDate',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            {new Date(row.scheduledDate).toLocaleDateString()}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> {row.time}
          </span>
        </div>
      )
    },
    {
      header: 'Type & Location',
      accessor: 'meetingType',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
            {row.meetingType.includes('Online') ? <Video className="w-3 h-3 text-blue-500" /> : <MapPin className="w-3 h-3 text-slate-400" />}
            {row.meetingType}
          </span>
          <span className="text-[11px] text-slate-500 block truncate max-w-xs">{row.location}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusUpdate(row._id, e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none"
        >
          {['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    },
    {
      header: 'Assigned Agent',
      accessor: 'assignedEmployee',
      render: (row) => <span className="text-xs text-slate-700">{row.assignedEmployee?.name || 'Staff'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Client Consultation & Meetings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Schedule and record office discussions, zoom calls, and negotiation sessions</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Schedule Meeting
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={meetings}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchMeetings(p)}
        emptyTitle="No meetings scheduled yet"
        emptyDescription="Create meeting consultations with prospective buyers and investors."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Schedule Meeting"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Client Meeting"
        subtitle="Book appointment with prospect and assign sales executive"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Skyline 3BHK Price Discussion"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Lead</label>
              <select
                value={form.lead}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                <option value="">Select Existing Lead</option>
                {leads.map(l => (
                  <option key={l._id} value={l._id}>{l.leadName} ({l.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Meeting Type</label>
              <select
                value={form.meetingType}
                onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                {['Office Meeting', 'Online (Google Meet/Zoom)', 'Client Location', 'Site Discussion'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time</label>
              <input
                type="text"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="11:00 AM"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location / Meeting Link</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Boardroom 2 or Google Meet URL"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Executive</label>
            <select
              value={form.assignedEmployee}
              onChange={(e) => setForm({ ...form, assignedEmployee: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
            >
              <option value="">Select Executive</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.role?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MeetingsPage;
