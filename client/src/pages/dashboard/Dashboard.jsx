import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Spinner } from '../../components/common/EmptyState';
import {
  Users,
  Flame,
  PhoneCall,
  CalendarCheck,
  Calendar,
  MapPin,
  FileCheck,
  CreditCard,
  Building,
  TrendingUp,
  Award
} from 'lucide-react';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, pipeRes, perfRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getPipeline(),
          dashboardService.getPerformance()
        ]);
        if (sumRes.success) setSummary(sumRes.data);
        if (pipeRes.success) setPipeline(pipeRes.data || []);
        if (perfRes.success) setPerformance(perfRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Spinner size="lg" />;

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#442d82] to-[#25174f] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Real Estate Operations Command Center</h1>
          <p className="text-sm text-purple-200 mt-1">
            Real-time pipeline overview, lead classification, and inventory performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs border border-white/10">
          <TrendingUp className="w-5 h-5 text-[#b7d333]" />
          <div>
            <span className="text-xs text-purple-200 block">Total Sales Value</span>
            <span className="text-base font-bold text-white">{formatCurrency(summary?.sales?.totalSalesValue)}</span>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.leads?.total || 0}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">+{summary?.leads?.new || 0} fresh enquiries</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#442d82]">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Calling Queue</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.operations?.todayCalls || 0}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">{summary?.operations?.pendingFollowups || 0} follow-ups due</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <PhoneCall className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Bookings</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.sales?.confirmedBookings || 0}</h3>
              <p className="text-xs text-indigo-600 font-medium mt-1">{summary?.sales?.totalBookings || 0} total created</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collections</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(summary?.sales?.totalCollected)}</h3>
              <p className="text-xs text-rose-500 font-medium mt-1">{formatCurrency(summary?.sales?.outstandingBalance)} balance</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Lead Temperature Funnel & Operations Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Lead Temperature Distribution" subtitle="Pipeline interest classification" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-2">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-rose-800 uppercase block">Hot Lead</span>
              <span className="text-2xl font-extrabold text-rose-900 mt-1 block">{summary?.leads?.hot || 0}</span>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-amber-800 uppercase block">Warm Lead</span>
              <span className="text-2xl font-extrabold text-amber-900 mt-1 block">{summary?.leads?.warm || 0}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-800 uppercase block">Cold Lead</span>
              <span className="text-2xl font-extrabold text-blue-900 mt-1 block">{summary?.leads?.cold || 0}</span>
            </div>

            <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#442d82] text-white flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                RNT
              </div>
              <span className="text-xs font-bold text-purple-800 uppercase block">RNT Lead</span>
              <span className="text-2xl font-extrabold text-purple-900 mt-1 block">{summary?.leads?.rnt || 0}</span>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-slate-500 text-white flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                OFF
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase block">Switched Off</span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{summary?.leads?.switchedOff || 0}</span>
            </div>
          </div>
        </Card>

        {/* Inventory Summary */}
        <Card title="Inventory Availability" subtitle="Real estate units status">
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available Units
              </span>
              <span className="text-base font-extrabold text-emerald-700">{summary?.inventory?.Available || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved Units
              </span>
              <span className="text-base font-extrabold text-amber-700">{summary?.inventory?.Reserved || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Confirmed Booked
              </span>
              <span className="text-base font-extrabold text-indigo-700">{summary?.inventory?.Booked || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Sold / Handover
              </span>
              <span className="text-base font-extrabold text-slate-800">{summary?.inventory?.Sold || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Sales Pipeline Breakdown & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sales Pipeline by Stage" subtitle="Active deal volume & expected revenue">
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {pipeline.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No pipeline data recorded yet</p>
            ) : (
              pipeline.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#442d82]" />
                    <span className="text-sm font-semibold text-slate-800">{item._id || 'Stage'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 block">{item.count} deals</span>
                    <span className="text-xs text-slate-500">{formatCurrency(item.expectedValue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Top Sales Performers" subtitle="Bookings and closed sales value">
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {!performance?.topSalesExecutives || performance.topSalesExecutives.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No booking records yet</p>
            ) : (
              performance.topSalesExecutives.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#442d82] to-[#b7d333] text-white flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.user?.name || 'Executive'}</p>
                      <p className="text-xs text-slate-500">{p.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#442d82] block">{formatCurrency(p.salesValue)}</span>
                    <span className="text-xs text-slate-500 font-medium">{p.totalBookings} units booked</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
