import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import {
  Users,
  Flame,
  PhoneCall,
  CalendarCheck,
  Calendar,
  MapPin,
  FileCheck,
  CreditCard,
  Building2,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar: Page Title, Date, Refresh & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#334155]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
              Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6D28D9]/20 text-[#A78BFA] border border-[#6D28D9]/40">
              Operations Center
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-2">
            <span>{currentDateStr}</span>
            <span>•</span>
            <span>Real-time real estate pipeline & inventory</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#243249] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#334155] hover:bg-[#334155] transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#8B5CF6]' : ''} />
            <span>Refresh</span>
          </button>

          <Link
            to="/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#6D28D9] text-white hover:bg-[#5B21B6] shadow-md shadow-[#6D28D9]/30 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>New Lead</span>
          </Link>

          <Link
            to="/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#243249] text-[#F8FAFC] border border-[#334155] hover:border-[#6D28D9] transition-all cursor-pointer"
          >
            <CreditCard size={14} />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards Grid (Matching Screenshot 2 layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-[#1E2B40] rounded-2xl p-5 border border-[#334155] shadow-sm hover:border-[#6D28D9]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Total Leads
            </span>
            <div className="p-2.5 rounded-xl bg-[#6D28D9]/15 text-[#A78BFA] border border-[#6D28D9]/30">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
              {formatIndianNumber(summary?.leads?.total || 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-bold text-[#84CC16]">
                +{summary?.leads?.new || 0}
              </span>
              <span className="text-[#94A3B8]">fresh inquiries</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Calling Queue */}
        <div className="bg-[#1E2B40] rounded-2xl p-5 border border-[#334155] shadow-sm hover:border-[#6D28D9]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Today's Call Queue
            </span>
            <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
              <PhoneCall size={20} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
              {formatIndianNumber(summary?.operations?.todayCalls || 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-bold text-[#F59E0B]">
                {summary?.operations?.pendingFollowups || 0}
              </span>
              <span className="text-[#94A3B8]">callbacks due</span>
            </div>
          </div>
        </div>

        {/* Card 3: Confirmed Bookings */}
        <div className="bg-[#1E2B40] rounded-2xl p-5 border border-[#334155] shadow-sm hover:border-[#6D28D9]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Confirmed Bookings
            </span>
            <div className="p-2.5 rounded-xl bg-[#84CC16]/15 text-[#84CC16] border border-[#84CC16]/30">
              <FileCheck size={20} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
              {formatIndianNumber(summary?.sales?.confirmedBookings || 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-bold text-[#84CC16]">
                {summary?.sales?.totalBookings || 0} total
              </span>
              <span className="text-[#94A3B8]">reservations closed</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Collections */}
        <div className="bg-[#1E2B40] rounded-2xl p-5 border border-[#334155] shadow-sm hover:border-[#6D28D9]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Total Collections
            </span>
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
              {formatCurrency(summary?.sales?.totalCollected || 0)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-bold text-[#EF4444]">
                {formatCurrency(summary?.sales?.outstandingBalance || 0)}
              </span>
              <span className="text-[#94A3B8]">due</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Lead Temperature Distribution & Inventory Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Temperature Distribution */}
        <div className="bg-[#1E2B40] rounded-2xl p-6 border border-[#334155] shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Lead Temperature Distribution
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Active buyer interest segmentation across marketing channels
              </p>
            </div>
            <Link
              to="/leads"
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
            >
              View Leads <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {/* Hot */}
            <div className="bg-[#243249] border border-[#EF4444]/30 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center mx-auto mb-2 font-bold">
                <Flame size={16} />
              </div>
              <span className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider block">
                Hot
              </span>
              <span className="text-2xl font-black text-[#F8FAFC] mt-1 block">
                {summary?.leads?.hot || 0}
              </span>
            </div>

            {/* Warm */}
            <div className="bg-[#243249] border border-[#F59E0B]/30 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                W
              </div>
              <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider block">
                Warm
              </span>
              <span className="text-2xl font-black text-[#F8FAFC] mt-1 block">
                {summary?.leads?.warm || 0}
              </span>
            </div>

            {/* Cold */}
            <div className="bg-[#243249] border border-[#3B82F6]/30 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                C
              </div>
              <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider block">
                Cold
              </span>
              <span className="text-2xl font-black text-[#F8FAFC] mt-1 block">
                {summary?.leads?.cold || 0}
              </span>
            </div>

            {/* RNT */}
            <div className="bg-[#243249] border border-[#8B5CF6]/30 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                RNT
              </div>
              <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider block">
                RNT
              </span>
              <span className="text-2xl font-black text-[#F8FAFC] mt-1 block">
                {summary?.leads?.rnt || 0}
              </span>
            </div>

            {/* Switched Off */}
            <div className="bg-[#243249] border border-[#64748B]/30 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#64748B]/20 text-[#94A3B8] flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                OFF
              </div>
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Switched Off
              </span>
              <span className="text-2xl font-black text-[#F8FAFC] mt-1 block">
                {summary?.leads?.switchedOff || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Availability */}
        <div className="bg-[#1E2B40] rounded-2xl p-6 border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Inventory Status
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Total unit availability & bookings
              </p>
            </div>
            <Link
              to="/properties"
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
            >
              Units <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#243249] border border-[#334155]">
              <span className="text-xs font-semibold text-[#84CC16] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" /> Available Units
              </span>
              <span className="text-sm font-extrabold text-[#F8FAFC]">
                {summary?.inventory?.Available || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#243249] border border-[#334155]">
              <span className="text-xs font-semibold text-[#F59E0B] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Reserved Units
              </span>
              <span className="text-sm font-extrabold text-[#F8FAFC]">
                {summary?.inventory?.Reserved || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#243249] border border-[#334155]">
              <span className="text-xs font-semibold text-[#A78BFA] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D28D9]" /> Confirmed Booked
              </span>
              <span className="text-sm font-extrabold text-[#F8FAFC]">
                {summary?.inventory?.Booked || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#243249] border border-[#334155]">
              <span className="text-xs font-semibold text-[#94A3B8] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" /> Sold & Handed Over
              </span>
              <span className="text-sm font-extrabold text-[#F8FAFC]">
                {summary?.inventory?.Sold || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Sales Pipeline Breakdown & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline by Stage */}
        <div className="bg-[#1E2B40] rounded-2xl p-6 border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Sales Pipeline by Stage
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Active opportunity volume & forecast revenue
              </p>
            </div>
            <Link
              to="/opportunities"
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
            >
              Kanban <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[#334155] max-h-72 overflow-y-auto custom-scrollbar">
            {pipeline.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-8">
                No active sales opportunities recorded
              </p>
            ) : (
              pipeline.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
                    <span className="text-sm font-semibold text-[#F8FAFC]">
                      {item._id || 'Stage'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#F8FAFC] block">
                      {item.count} deals
                    </span>
                    <span className="text-xs text-[#8B5CF6]">
                      {formatCurrency(item.expectedValue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Sales Performers */}
        <div className="bg-[#1E2B40] rounded-2xl p-6 border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Top Sales Performers
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Closing executives by booking volume & revenue
              </p>
            </div>
            <Link
              to="/employees"
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
            >
              Directory <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[#334155] max-h-72 overflow-y-auto custom-scrollbar">
            {!performance?.topSalesExecutives || performance.topSalesExecutives.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-8">
                No closed sales recorded for this period
              </p>
            ) : (
              performance.topSalesExecutives.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#F8FAFC]">
                        {p.user?.name || 'Executive'}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {p.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#84CC16] block">
                      {formatCurrency(p.salesValue)}
                    </span>
                    <span className="text-xs text-[#94A3B8]">
                      {p.totalBookings} units booked
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
