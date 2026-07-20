import React, { useEffect, useState } from 'react';
import { CreditCard, Package, DollarSign, Calendar, CheckCircle2, Clock, XCircle, FileText, ArrowUpRight, Award, RefreshCw } from 'lucide-react';
import { userApi } from '../api/userApi';

const formatCurrency = (val) => {
  if (val === null || val === undefined) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';
};

export default function EmployerExpensesTab({ employerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getEmployerExpenses(employerId);
      setData(res);
    } catch (err) {
      console.error('Failed to load employer expenses:', err);
      setError('Không thể tải lịch sử chi tiêu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employerId) {
      fetchExpenses();
    }
  }, [employerId]);

  if (loading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-500">Đang tải dữ liệu chi tiêu & lịch sử giao dịch...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 my-4">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{error || 'Không tìm thấy dữ liệu.'}</p>
        <button
          onClick={fetchExpenses}
          className="mt-4 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors"
        >
          Tải lại
        </button>
      </div>
    );
  }

  const { totalSpent, currentPackageType, packagePostQuota, packageExpiryDate, projectsPosted, tier, tierDiscount, transactions } = data;

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Thành công</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Đang chờ</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Thất bại</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Spent */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Tổng tiền đã chi</span>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{formatCurrency ? formatCurrency(totalSpent) : `${totalSpent || 0} VNĐ`}</h3>
            <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Hạng thành viên: <strong className="text-amber-300">{tier || 'BRONZE'}</strong> (Ưu đãi {tierDiscount || 0}%)
            </p>
          </div>
        </div>

        {/* Card 2: Current Package & Quota */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gói bài đăng hiện tại</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 font-extrabold text-xs rounded-full border border-blue-200">
                {currentPackageType || 'CHƯA DÙNG GÓI'}
              </span>
              <span className="text-sm font-black text-emerald-600">
                Còn {packagePostQuota || 0} bài
              </span>
            </div>
            <p className="text-[12px] font-semibold text-gray-500 mt-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Hạn dùng: {packageExpiryDate ? new Date(packageExpiryDate).toLocaleDateString('vi-VN') : 'Không có'}
            </p>
          </div>
        </div>

        {/* Card 3: Projects Posted */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng bài đã đăng</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">{projectsPosted || 0} <span className="text-sm font-bold text-gray-500">dự án</span></h3>
            <p className="text-[11px] font-medium text-gray-400 mt-1">Đã khấu trừ lượt từ gói đã mua</p>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-gray-900 text-base">Lịch sử Giao dịch & Thanh toán</h4>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            {transactions?.length || 0} giao dịch
          </span>
        </div>

        {!transactions || transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">Chưa có giao dịch thanh toán nào được ghi nhận.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Mã Giao dịch</th>
                  <th className="px-6 py-4">Loại Gói / Mục đích</th>
                  <th className="px-6 py-4">Số tiền</th>
                  <th className="px-6 py-4">Cổng Thanh toán</th>
                  <th className="px-6 py-4">Ngày giao dịch</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.transactionId || tx.txnRef} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-gray-900">
                      {tx.txnRef || `#${tx.transactionId}`}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {tx.packageType ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                          GÓI {tx.packageType}
                        </span>
                      ) : tx.projectId ? (
                        <span>Thanh toán Dự án #{tx.projectId}</span>
                      ) : (
                        <span>Dịch vụ Nền tảng</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      {formatCurrency ? formatCurrency(tx.amount) : `${tx.amount} VNĐ`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-gray-100 text-gray-700 border border-gray-200">
                        {tx.paymentMethod || 'PayOS / VNPay'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '---'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(tx.status)}
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
