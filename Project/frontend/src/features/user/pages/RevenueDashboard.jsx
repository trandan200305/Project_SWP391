import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueDashboard({ user }) {
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [viewMode, setViewMode] = useState('month'); // 'month' (tháng trong năm) | 'day' (ngày trong tháng)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (user?.id) {
      fetchRevenueData();
    }
  }, [user?.id, selectedYear]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const [overviewRes, chartRes, historyRes] = await Promise.all([
        fetch(`http://localhost:8080/api/freelancers/${user.id}/revenue/overview`),
        fetch(`http://localhost:8080/api/freelancers/${user.id}/revenue/chart?year=${selectedYear}`),
        fetch(`http://localhost:8080/api/freelancers/${user.id}/revenue/history`)
      ]);

      const overviewData = overviewRes.ok ? await overviewRes.json().catch(() => null) : null;
      const chartJson = chartRes.ok ? await chartRes.json().catch(() => []) : [];
      const historyJson = historyRes.ok ? await historyRes.json().catch(() => []) : [];

      setOverview(overviewData || { totalEarnings: 0, pendingClearance: 0, completedProjects: 0 });
      setChartData(Array.isArray(chartJson) ? chartJson : []);
      setHistory(Array.isArray(historyJson) ? historyJson : []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu doanh thu:", err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency cleanly without trailing .00
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Compact tick formatter for YAxis to prevent clipping numbers
  const formatYAxisTick = (val) => {
    if (!val || val === 0) return '$0';
    if (val >= 1000000) {
      const num = val / 1000000;
      return `$${num % 1 === 0 ? num : num.toFixed(1)}M`;
    }
    if (val >= 1000) {
      const num = val / 1000;
      return `$${num % 1 === 0 ? num : num.toFixed(1)}K`;
    }
    return `$${val}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  // Compute daily chart data when viewMode === 'day'
  const getDailyChartData = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }

    if (Array.isArray(history)) {
      history.forEach((item) => {
        if (!item.completedAt) return;
        const d = new Date(item.completedAt);
        if (d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth) {
          const dayNum = d.getDate();
          if (dailyMap[dayNum] !== undefined) {
            dailyMap[dayNum] += Number(item.amount || 0);
          }
        }
      });
    }

    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const padDay = String(d).padStart(2, '0');
      const padMonth = String(selectedMonth).padStart(2, '0');
      result.push({
        month: `${padDay}/${padMonth}`,
        amount: dailyMap[d]
      });
    }
    return result;
  };

  const displayChartData = viewMode === 'day' ? getDailyChartData() : chartData;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Thống kê doanh thu</h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi thu nhập và lịch sử các dự án đã hoàn thành.</p>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng doanh thu</p>
            <h3 className="text-2xl font-black text-gray-900 truncate" title={formatCurrency(overview?.totalEarnings)}>
              {formatCurrency(overview?.totalEarnings)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Đang chờ xử lý</p>
            <h3 className="text-2xl font-black text-gray-900 truncate" title={formatCurrency(overview?.pendingClearance)}>
              {formatCurrency(overview?.pendingClearance)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Dự án hoàn thành</p>
            <h3 className="text-2xl font-black text-gray-900">
              {overview?.completedProjects || 0} <span className="text-sm font-medium text-gray-500 normal-case">dự án</span>
            </h3>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Biểu đồ thu nhập
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Theo ngày
              </button>
            </div>

            {/* Select Year */}
            <select 
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              <option value={new Date().getFullYear()}>Năm {new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() - 1}>Năm {new Date().getFullYear() - 1}</option>
            </select>

            {/* Select Month (only when viewMode === 'day') */}
            {viewMode === 'day' && (
              <select
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer animate-fade-in"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayChartData} margin={{ top: 15, right: 20, left: 25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#6b7280' }} 
                dy={10} 
                interval={viewMode === 'day' ? 1 : 0}
              />
              <YAxis 
                width={80}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#6b7280' }} 
                tickFormatter={formatYAxisTick} 
              />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.12)' }}
                formatter={(value) => [formatCurrency(value), 'Doanh thu']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={viewMode === 'day' ? 22 : 45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Lịch sử thu nhập</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Chưa có dự án nào hoàn thành để ghi nhận thu nhập.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-gray-100 text-gray-400 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tên dự án</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Ngày hoàn thành</th>
                  <th className="px-6 py-4 text-right">Số tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 max-w-[250px] truncate" title={item.projectTitle}>
                      {item.projectTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.clientName}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(item.completedAt)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-600">
                      +{formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle className="w-3 h-3" /> {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
