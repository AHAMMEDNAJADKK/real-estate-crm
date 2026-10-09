import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/dashboardService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Spinner } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { BarChart3, Download, TrendingUp, Users, PhoneCall, Building2 } from 'lucide-react';

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('lead-source');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getReport(reportType);
      if (res.success) {
        setReportData(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleExport = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No report data to export');
      return;
    }
    const rows = reportData.map(r => {
      const flat = { ...r };
      if (flat._id && typeof flat._id === 'object') {
        flat.Entity = flat._id.name || flat._id.code || JSON.stringify(flat._id);
      } else {
        flat.Category = flat._id || 'General';
      }
      delete flat._id;
      return flat;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [Object.keys(rows[0] || {}).join(','), ...rows.map(e => Object.values(e).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded to CSV');
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Executive Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Measurable insight into lead conversion funnels, calling efficiency, and sales revenue</p>
        </div>
        <Button variant="secondary" icon={Download} onClick={handleExport}>
          Export CSV Report
        </Button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'lead-source', label: 'Lead Source & Conversions', icon: Users },
          { id: 'lead-temperature', label: 'Temperature Distribution', icon: TrendingUp },
          { id: 'sales-summary', label: 'Sales & Collections by Project', icon: Building2 },
          { id: 'telecaller-performance', label: 'Telecaller Performance', icon: PhoneCall }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                reportType === tab.id
                  ? 'bg-[#442d82] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Display Container */}
      <Card title={`Analytical Report: ${reportType.replace('-', ' ').toUpperCase()}`}>
        {loading ? (
          <Spinner size="lg" />
        ) : reportData.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-12">No data recorded for this report category</p>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'lead-source' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Lead Source</th>
                    <th className="py-3 px-4">Total Inquiries</th>
                    <th className="py-3 px-4">Converted</th>
                    <th className="py-3 px-4">Lost</th>
                    <th className="py-3 px-4">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => {
                    const convRate = r.totalLeads > 0 ? ((r.convertedLeads / r.totalLeads) * 100).toFixed(1) : '0';
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{r._id || 'Unknown'}</td>
                        <td className="py-3 px-4">{r.totalLeads}</td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">{r.convertedLeads}</td>
                        <td className="py-3 px-4 text-rose-500">{r.lostLeads}</td>
                        <td className="py-3 px-4 font-extrabold text-[#442d82]">{convRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {reportType === 'lead-temperature' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Temperature Classification</th>
                    <th className="py-3 px-4">Total Leads Count</th>
                    <th className="py-3 px-4">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{r._id || 'Unassigned'}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">{r.count}</td>
                      <td className="py-3 px-4"><Badge>{r._id}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'sales-summary' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Project Development</th>
                    <th className="py-3 px-4">Total Bookings</th>
                    <th className="py-3 px-4">Sales Value</th>
                    <th className="py-3 px-4">Total Collections</th>
                    <th className="py-3 px-4">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{r._id?.name || 'Development'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.totalBookings}</td>
                      <td className="py-3 px-4 font-extrabold text-[#442d82]">{formatCurrency(r.totalSalesValue)}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(r.totalCollected)}</td>
                      <td className="py-3 px-4 text-rose-500 font-bold">{formatCurrency(r.totalOutstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'telecaller-performance' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Telecaller Staff</th>
                    <th className="py-3 px-4">Total Calls Made</th>
                    <th className="py-3 px-4">Connected / Interested</th>
                    <th className="py-3 px-4">Total Talk Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{r._id?.name || 'Staff'}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{r.totalCalls}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{r.connectedCalls}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {Math.floor((r.totalDurationSeconds || 0) / 60)} minutes
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
