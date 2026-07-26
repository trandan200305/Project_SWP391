import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi.js';
import { Loader2, CheckCircle2, XCircle, Search, FileText, BadgeDollarSign, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminWithdrawalsQueue({ adminId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    adminApi.getWithdrawals()
      .then(res => {
        // Sort pending first, then by date descending
        const sorted = (res || []).sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setData(sorted);
      })
      .catch(err => {
        console.error(err);
        toast.error('Lỗi khi tải dữ liệu rút tiền');
      })
      .finally(() => setLoading(false));
  };

  const handleProcess = async (id, status) => {
    let reason = '';
    if (status === 'REJECTED') {
      reason = window.prompt('Nhập lý do từ chối:');
      if (reason === null) return; // User cancelled
      if (!reason.trim()) {
        toast.error('Vui lòng nhập lý do từ chối');
        return;
      }
    } else {
      if (!window.confirm('Bạn chắc chắn muốn duyệt lệnh rút tiền này?')) return;
    }

    setProcessingId(id);
    try {
      await adminApi.processWithdrawal(id, status, adminId, reason);
      toast.success(status === 'APPROVED' ? 'Đã duyệt lệnh rút tiền' : 'Đã từ chối lệnh rút tiền');
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xử lý lệnh');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredData = data.filter(item => 
    item.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên Freelancer hoặc Ngân hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Tổng: {data.length} lệnh
          </span>
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
            Chờ duyệt: {data.filter(x => x.status === 'PENDING').length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Thông tin Freelancer</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Ngân hàng nhận</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Số tiền</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Trạng thái</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Thao tác (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                    <p className="mt-3 text-slate-500 font-medium">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Không tìm thấy lệnh rút tiền nào.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {item.freelancerName ? item.freelancerName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.freelancerName || 'Unknown User'}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{item.bankName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{item.accountNumber}</p>
                      <p className="text-[11px] text-slate-400">{item.accountName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-max border border-emerald-100">
                        <BadgeDollarSign className="w-4 h-4" />
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Chờ duyệt</span>}
                      {item.status === 'APPROVED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Đã duyệt</span>}
                      {item.status === 'REJECTED' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Đã từ chối</span>}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={processingId === item.id}
                            onClick={() => handleProcess(item.id, 'APPROVED')}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Duyệt lệnh"
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
                        <div className="text-right text-xs text-slate-400 font-medium">
                          {item.status === 'REJECTED' && item.rejectionReason && (
                            <p className="max-w-[200px] truncate ml-auto" title={item.rejectionReason}>Lý do: {item.rejectionReason}</p>
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
