import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueDashboard({ user }) {
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.id) {
      fetchRevenueData();
    }
  }, [user?.id, selectedYear]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Vì hiện tại chưa có apiService hỗ trợ getRevenue, ta dùng fetch hoặc apiService.get
      // Ở đây ta dùng fetch tương tự các component khác để tránh lỗi import apiService thiếu
      const [overviewRes, chartRes, historyRes] = await Promise.all([
        fetch(`http://localhost:8080/api/freelancers/${user.id}/revenue/overview`),
        fetch(`http://localhost:8080/api/freelancers/${user.id}/revenue/chart?year=${selectedYear}`),
        fetch(`http://localhost:8080/api/freelancers/${user.id}/revenue/history`)
      ]);

      setOverview(await overviewRes.json());
      setChartData(await chartRes.json());
      setHistory(await historyRes.json());
    } catch (err) {
      console.error("Lỗi lấy dữ liệu doanh thu:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
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
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng doanh thu</p>
            <h3 className="text-2xl font-black text-gray-900">{formatCurrency(overview?.totalEarnings)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Đang chờ xử lý</p>
            <h3 className="text-2xl font-black text-gray-900">{formatCurrency(overview?.pendingClearance)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Dự án hoàn thành</p>
            <h3 className="text-2xl font-black text-gray-900">{overview?.completedProjects || 0} <span className="text-sm font-medium text-gray-500 normal-case">dự án</span></h3>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Biểu đồ thu nhập
          </h3>
          <select 
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            <option value={new Date().getFullYear()}>Năm {new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>Năm {new Date().getFullYear() - 1}</option>
          </select>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [formatCurrency(value), 'Doanh thu']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
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
