import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { UserCheck, Plus, Phone, Mail, Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 360 Modal
  const [is360Open, setIs360Open] = useState(false);
  const [profile360, setProfile360] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    customerType: 'Buyer',
    panNumber: '',
    preferences: {
      propertyType: '3BHK',
      preferredLocation: 'Bangalore East'
    }
  });

  const toast = useToast();

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({ page, limit: 10, search });
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await customerService.createCustomer(form);
      toast.success('Customer profile created successfully');
      setIsModalOpen(false);
      fetchCustomers(1);
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    }
  };

  const handleView360 = async (id) => {
    setProfileLoading(true);
    setIs360Open(true);
    try {
      const res = await customerService.getCustomer360(id);
      if (res.success) {
        setProfile360(res.data);
      }
    } catch (err) {
      toast.error('Failed to load 360 profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name & Phone',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" /> {row.phone}
            {row.email && <span>&bull; {row.email}</span>}
          </span>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'customerType',
      render: (row) => <Badge variant="primary">{row.customerType}</Badge>
    },
    {
      header: 'Relationship Status',
      accessor: 'status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      header: 'Preferences',
      accessor: 'preferences',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.preferences?.propertyType || 'Apartment'} ({row.preferences?.preferredLocation || 'Any'})
        </span>
      )
    },
    {
      header: 'Assigned Agent',
      accessor: 'assignedAgent',
      render: (row) => <span className="text-xs text-slate-700">{row.assignedAgent?.name || 'Staff'}</span>
    },
    {
      header: '360° View',
      accessor: '_id',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => handleView360(row._id)}>
          Customer 360°
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer 360° Profiles & Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive view linking enquiries, interactions, property visits, and bookings</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Customer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchCustomers(p)}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer by name, phone, email..."
        emptyTitle="No customer profiles registered"
        emptyDescription="Convert qualified leads or manually onboard new buyers and investors."
        onEmptyAction={() => setIsModalOpen(true)}
        emptyActionLabel="Add Customer"
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer Profile"
        subtitle="Create dedicated buyer or investor record"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full Legal Name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Mobile Number"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Type</label>
              <select
                value={form.customerType}
                onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              >
                {['Buyer', 'Investor', 'Broker', 'Tenant'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PAN Card Number</label>
              <input
                type="text"
                value={form.panNumber}
                onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. ABCDE1234F"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Location</label>
              <input
                type="text"
                value={form.preferences.preferredLocation}
                onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, preferredLocation: e.target.value } })}
                placeholder="Location"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#442d82]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer 360-Degree Modal */}
      <Modal
        isOpen={is360Open}
        onClose={() => setIs360Open(false)}
        title={profile360?.customer?.name ? `Customer 360°: ${profile360.customer.name}` : 'Customer 360°'}
        subtitle="Complete lifecycle history of enquiries, calls, visits, and bookings"
        maxWidth="max-w-3xl"
      >
        {profileLoading ? (
          <div className="py-12 text-center"><span className="text-sm text-slate-500">Loading 360 data...</span></div>
        ) : profile360 ? (
          <div className="space-y-6 text-sm">
            {/* Header Bio */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-xs text-slate-400 block">Phone</span>
                <span className="font-bold text-slate-900">{profile360.customer?.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Email</span>
                <span className="font-bold text-slate-900">{profile360.customer?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Customer Type</span>
                <Badge variant="primary">{profile360.customer?.customerType}</Badge>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">PAN Number</span>
                <span className="font-mono text-xs font-semibold text-slate-700">{profile360.customer?.panNumber || 'Pending'}</span>
              </div>
            </div>

            {/* Interaction Summary Tabs */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#442d82]" /> Linked Enquiries & Leads ({profile360.interactions?.leads?.length || 0})
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-36 overflow-y-auto">
                  {profile360.interactions?.leads?.map(l => (
                    <div key={l._id} className="p-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{l.source} &bull; {l.preferredPropertyType}</span>
                      <Badge>{l.temperature}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" /> Bookings & Contracts ({profile360.interactions?.bookings?.length || 0})
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-36 overflow-y-auto">
                  {profile360.interactions?.bookings?.map(b => (
                    <div key={b._id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{b.bookingNumber}</span>
                        <span className="text-slate-500">{b.project?.name} &bull; Unit {b.property?.unitNumber}</span>
                      </div>
                      <div className="text-right">
                        <Badge>{b.status}</Badge>
                        <span className="text-slate-600 font-semibold block mt-1">₹{b.finalAgreedPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button onClick={() => setIs360Open(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CustomersPage;
