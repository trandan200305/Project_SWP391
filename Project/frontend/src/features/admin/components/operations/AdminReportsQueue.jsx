import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { Loader2, Search, AlertTriangle, Calendar, Flag, User, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdminReportsQueue({ adminId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    adminApi.getReports()
      .then(res => {
        const sorted = (res || []).sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setData(sorted);
      })
      .catch(err => {
        console.error(err);
        alert('Lỗi khi tải dữ liệu báo cáo vi phạm');
      })
      .finally(() => setLoading(false));
  };

  const handleProcess = async (id, actionStatus) => {
    if (!window.confirm(`Xác nhận xử lý báo cáo này với hành động: ${actionStatus}?`)) return;

    setProcessingId(id);
    try {
      await adminApi.resolveReport(id, actionStatus, adminId);
      alert('Đã xử lý báo cáo vi phạm');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi xử lý báo cáo');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredData = data.filter(item => 
    item.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo người báo cáo, đối tượng, lý do..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Tổng: {data.length} báo cáo
          </span>
          <span className="text-sm font-semibold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
            Chờ xử lý: {data.filter(x => x.status === 'PENDING').length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Đối tượng bị báo cáo</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Người báo cáo (Reporter)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Lý do / Bằng chứng</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Trạng thái</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto" />
                    <p className="mt-3 text-slate-500 font-medium">Đang tải dữ liệu báo cáo...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Hệ thống an toàn, không có báo cáo vi phạm.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.targetName || 'Unknown Target'}</p>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded w-max">
                        {item.targetType || 'USER'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-700 text-xs">{item.reporterName || 'Anonymous'}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5">
                        <Flag className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-rose-700 text-xs">{item.reason || 'Vi phạm chính sách'}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-700">Chờ xử lý</span>}
                      {item.status === 'RESOLVED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Đã giải quyết</span>}
                      {item.status === 'REJECTED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">Bỏ qua</span>}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleProcess(item.id, 'RESOLVED')}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                            title="Có vi phạm - Đã xử lý"
                          >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                            Xử lý
                          </button>
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleProcess(item.id, 'REJECTED')}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                            title="Không có vi phạm - Bỏ qua"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Bỏ qua
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-slate-400 font-medium">
                          Đã thao tác
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
