import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { Loader2, CheckCircle2, XCircle, Search, FileText, ArrowRightLeft, Calendar, User, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminTransfersQueue({ adminId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    adminApi.getTransferRequests()
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
        alert('Lỗi khi tải dữ liệu yêu cầu điều chuyển');
      })
      .finally(() => setLoading(false));
  };

  const handleProcess = async (id, status) => {
    let reason = '';
    if (status === 'REJECTED') {
      reason = window.prompt('Nhập lý do từ chối yêu cầu điều chuyển:');
      if (reason === null) return;
      if (!reason.trim()) {
        alert('Vui lòng nhập lý do từ chối');
        return;
      }
    } else {
      if (!window.confirm('Bạn chắc chắn muốn duyệt yêu cầu điều chuyển này? Nhân sự sẽ lập tức được chuyển sang phòng ban mới.')) return;
    }

    setProcessingId(id);
    try {
      await adminApi.approveTransferRequest(id, status, reason, adminId);
      alert(status === 'APPROVED' ? 'Đã duyệt yêu cầu điều chuyển' : 'Đã từ chối yêu cầu điều chuyển');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredData = data.filter(item => 
    item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.fromDepartmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.toDepartmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên nhân sự, phòng ban..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Tổng: {data.length} yêu cầu
          </span>
          <span className="text-sm font-semibold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
            Chờ duyệt: {data.filter(x => x.status === 'PENDING').length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Nhân sự</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Điều chuyển</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Lý do xin chuyển</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Trạng thái</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto" />
                    <p className="mt-3 text-slate-500 font-medium">Đang tải dữ liệu yêu cầu...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ArrowRightLeft className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Chưa có yêu cầu điều chuyển nào.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold">
                          {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            {item.userName || 'Unknown'}
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">{item.userType}</span>
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Từ phòng ban</span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-0.5 border border-slate-200">
                            {item.fromDepartmentName || 'N/A'}
                          </span>
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-slate-300 mt-3" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Đến phòng ban</span>
                          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded mt-0.5 border border-sky-100">
                            {item.toDepartmentName || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 max-w-xs">{item.reason || 'Không có lý do'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Chờ duyệt</span>}
                      {item.status === 'APPROVED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Đã duyệt</span>}
                      {item.status === 'REJECTED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Từ chối</span>}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleProcess(item.id, 'APPROVED')}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Đồng ý chuyển"
                          >
                            {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleProcess(item.id, 'REJECTED')}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-[11px] text-slate-400 font-medium">
                          {item.rejectionReason && item.status === 'REJECTED' ? (
                            <p className="max-w-[150px] truncate ml-auto" title={item.rejectionReason}>Lý do: {item.rejectionReason}</p>
                          ) : (
                            <span>Đã thao tác</span>
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
