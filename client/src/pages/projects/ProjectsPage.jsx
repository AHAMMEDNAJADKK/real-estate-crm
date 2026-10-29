import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/propertyService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Card from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, MapPin, Layers, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

export const ProjectsPage = () => {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [deleteProjectName, setDeleteProjectName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    developer: 'KODBRAND Realty Group',
    projectType: 'Residential',
    reraNumber: '',
    location: {
      address: '',
      locality: '',
      city: 'Bangalore',
      state: 'Karnataka'
    },
    status: 'Under Construction',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    developer: 'KODBRAND Realty Group',
    projectType: 'Residential',
    reraNumber: '',
    location: {
      address: '',
      locality: '',
      city: 'Bangalore',
      state: 'Karnataka'
    },
    status: 'Under Construction',
    description: ''
  });

  const toast = useToast();

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const res = await projectService.getProjects({ page, limit: 10 });
      if (res.success) {
        setProjects(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await projectService.createProject(form);
      toast.success('Project created successfully');
      setIsModalOpen(false);
      setForm({
        name: '',
        code: '',
        developer: 'KODBRAND Realty Group',
        projectType: 'Residential',
        reraNumber: '',
        location: {
          address: '',
          locality: '',
          city: 'Bangalore',
          state: 'Karnataka'
        },
        status: 'Under Construction',
        description: ''
      });
      fetchProjects(1);
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (project) => {
    setSelectedProject(project);
    setEditForm({
      name: project.name || '',
      code: project.code || '',
      developer: project.developer || '',
      projectType: project.projectType || 'Residential',
      reraNumber: project.reraNumber || '',
      location: {
        address: project.location?.address || '',
        locality: project.location?.locality || '',
        city: project.location?.city || 'Bangalore',
        state: project.location?.state || 'Karnataka'
      },
      status: project.status || 'Under Construction',
      description: project.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      await projectService.updateProject(selectedProject._id || selectedProject.id, editForm);
      toast.success('Project updated successfully');
      setIsEditModalOpen(false);
      fetchProjects(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (project) => {
    setDeleteProjectId(project._id || project.id);
    setDeleteProjectName(project.name);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProjectId) return;
    setActionLoading(true);
    try {
      await projectService.deleteProject(deleteProjectId);
      toast.success('Project deleted successfully');
      setIsDeleteOpen(false);
      setDeleteProjectId(null);
      fetchProjects(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Project Name & Code',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.name}</span>
          <span className="text-xs text-purple-700 dark:text-purple-300 font-bold tracking-wider">{row.code}</span>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400 dark:text-[#64748B]" /> {row.location?.locality ? `${row.location.locality}, ` : ''}{row.location?.city}
        </span>
      )
    },
    {
      header: 'Type',
      accessor: 'projectType',
      render: (row) => <Badge variant="primary">{row.projectType}</Badge>
    },
    {
      header: 'Units (Available / Total)',
      accessor: 'totalUnits',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{row.availableUnits || 0}</span> / {row.totalUnits || 0} units
        </span>
      )
    },
    {
      header: 'Development Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'RERA Number',
      accessor: 'reraNumber',
      render: (row) => <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">{row.reraNumber || 'PRM/KA/RERA/...'}</span>
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            icon={Edit3}
            onClick={() => handleOpenEdit(row)}
            title="Edit Project"
          >
            Edit
          </Button>
          {hasRole('superadmin', 'super_admin', 'admin', 'property_manager') && (
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() => handleOpenDelete(row)}
              title="Delete Project"
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#334155]">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">Real Estate Developments & Projects</h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">Manage master properties, layout configurations, and unit inventories</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Project
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchProjects(p)}
        emptyTitle="No development projects recorded"
        emptyDescription="Add residential or commercial projects to organize units and inventory."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Add Project"
      />

      {/* Add Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Master Development Project"
        subtitle="Create real estate project catalogue entry"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Prestige Lakeview"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Project Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PLV-01"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Developer / Builder</label>
              <input
                type="text"
                value={form.developer}
                onChange={(e) => setForm({ ...form, developer: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Project Type</label>
              <select
                value={form.projectType}
                onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9] cursor-pointer"
              >
                {['Residential', 'Commercial', 'Mixed Use', 'Villa Community', 'Plotted Development'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">City</label>
              <input
                type="text"
                value={form.location.city}
                onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Locality</label>
              <input
                type="text"
                value={form.location.locality}
                onChange={(e) => setForm({ ...form, location: { ...form.location, locality: e.target.value } })}
                placeholder="e.g. Whitefield"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">RERA Registration Number</label>
            <input
              type="text"
              value={form.reraNumber}
              onChange={(e) => setForm({ ...form, reraNumber: e.target.value })}
              placeholder="e.g. PRM/KA/RERA/1251/446/PR/200123/003200"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      {selectedProject && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Project: ${selectedProject.name}`}
          subtitle="Modify project development details, status, and RERA registration"
        >
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Project Code *</label>
                <input
                  type="text"
                  required
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Developer / Builder</label>
                <input
                  type="text"
                  value={editForm.developer}
                  onChange={(e) => setEditForm({ ...editForm, developer: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Project Type</label>
                <select
                  value={editForm.projectType}
                  onChange={(e) => setEditForm({ ...editForm, projectType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9] cursor-pointer"
                >
                  {['Residential', 'Commercial', 'Mixed Use', 'Villa Community', 'Plotted Development'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Development Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9] cursor-pointer"
                >
                  {['Planning', 'Under Construction', 'Ready to Move', 'Completed'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">City</label>
                <input
                  type="text"
                  value={editForm.location?.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, city: e.target.value } })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">Locality</label>
                <input
                  type="text"
                  value={editForm.location?.locality || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: { ...editForm.location, locality: e.target.value } })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] uppercase mb-1">RERA Number</label>
                <input
                  type="text"
                  value={editForm.reraNumber}
                  onChange={(e) => setEditForm({ ...editForm, reraNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#334155]">
              <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                Update Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Project Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteProjectId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Development Project"
        message={`Are you sure you want to delete project "${deleteProjectName}"? Projects with associated inventory units or bookings cannot be deleted.`}
        confirmText="Delete Project"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default ProjectsPage;
