import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { Loader2, CheckCircle2, Search, FileText, Calendar, Gavel, User, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDisputesQueue({ adminId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    adminApi.getDisputes()
      .then(res => {
        const sorted = (res || []).sort((a, b) => {
          if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
          if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setData(sorted);
      })
      .catch(err => {
        console.error(err);
        toast.error('Lỗi khi tải dữ liệu tranh chấp');
      })
      .finally(() => setLoading(false));
  };

  const handleProcess = async (id) => {
    // Basic resolution flow: For simplicity, we just prompt for resolution type & note
    const resolutionChoice = window.prompt("Chọn hướng giải quyết (1: Bồi thường Freelancer, 2: Hoàn tiền Client, 3: Khác):", "1");
    if (!resolutionChoice) return;
    
    const note = window.prompt("Nhập ghi chú giải quyết tranh chấp (Bắt buộc):");
    if (!note || !note.trim()) {
      toast.error('Bạn phải nhập ghi chú giải quyết');
      return;
    }

    setProcessingId(id);
    try {
      await adminApi.resolveDispute(id, 'RESOLVED', note, adminId);
      toast.success('Đã giải quyết tranh chấp');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xử lý tranh chấp');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredData = data.filter(item => 
    item.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên Dự án, Freelancer, Client..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Tổng: {data.length} vụ
          </span>
          <span className="text-sm font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
            Đang xử lý: {data.filter(x => x.status === 'OPEN').length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Dự án & Ngày tạo</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Các bên liên quan</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Lý do / Mô tả</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Trạng thái</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="mt-3 text-slate-500 font-medium">Đang tải dữ liệu tranh chấp...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gavel className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Không có khiếu nại tranh chấp nào.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.projectTitle || 'Unknown Project'}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-max">
                          <User className="w-3 h-3" /> FL: {item.freelancerName || '-'}
                        </div>
                        <div className="flex items-center gap-1.5 text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded w-max">
                          <User className="w-3 h-3" /> CL: {item.clientName || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5">
                        <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700 text-xs">{item.disputeReason || 'Lý do khác'}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'OPEN' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Đang xử lý</span>}
                      {item.status === 'RESOLVED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">Đã đóng</span>}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'OPEN' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleProcess(item.id)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                          >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gavel className="w-3 h-3" />}
                            Phân xử
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-slate-400 font-medium">
                          {item.resolutionNote && (
                            <p className="max-w-[200px] truncate ml-auto" title={item.resolutionNote}>KQ: {item.resolutionNote}</p>
                          )}
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
