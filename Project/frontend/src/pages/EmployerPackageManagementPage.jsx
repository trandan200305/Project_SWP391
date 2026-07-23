import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, ShieldCheck, CreditCard, RefreshCw, Loader2, Award, Calendar, CheckCircle2, Briefcase } from 'lucide-react';
import EmployerPackages from '../components/EmployerPackages.jsx';
import { getImageUrl } from '../utils/imageHelper.js';

export default function EmployerPackageManagementPage({ user, onNavigateHome, onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user || (!user.id && !user.employerId)) {
      setLoading(false);
      return;
    }
    const empId = user.employerId || user.id;
    try {
      const res = await fetch(`http://localhost:8080/api/employers/${empId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu gói cước:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const { tier = 'ĐỒNG', packageInfo = {} } = dashboardData || {};

  const formatCurrency = (val) => {
    if (!val) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate ? onNavigate('employer_dashboard') : onNavigateHome()}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 text-xs font-bold"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="w-5 h-5" /> Quay lại Dashboard
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản lý Gói cước & Lịch sử Nâng cấp</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Hạng {tier}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi chi tiết gói dịch vụ đang dùng, số lượt đăng bài còn lại và lịch sử thanh toán
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Current Active Package Status Banner Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              
              {/* Left Package Info */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ĐANG KÍCH HOẠT</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Bạn đang dùng gói <span className="text-emerald-400">{packageInfo?.currentPackageName || (tier !== 'ĐỒNG' ? `Gói Thành Viên Hạng ${tier}` : 'Gói Tiêu Chuẩn (Miễn phí)')}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Ngày hết hạn: <strong className="text-white font-bold">{packageInfo?.currentPackageExpiry || 'Không giới hạn'}</strong></span>
                </p>
              </div>

              {/* Remaining Job Posts Indicator */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:px-6 sm:py-4 border border-white/15 flex items-center gap-4 shrink-0">
                <div className="p-3 rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Số lượt đăng bài còn lại</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-400">
                    {packageInfo?.remainingPostsDisplay || 'Không giới hạn'}
                  </p>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="shrink-0">
                <a
                  href="#upgrade-packages-section"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>NÂNG CẤP GÓI CƯỚC</span>
                </a>
              </div>

            </div>
          </div>

          {/* Package History Table */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Lịch sử các gói cước đã đăng ký
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Tên gói</th>
                    <th className="py-3.5 px-4">Thông tin gói</th>
                    <th className="py-3.5 px-4 text-center">Số lượng</th>
                    <th className="py-3.5 px-4">Bắt đầu</th>
                    <th className="py-3.5 px-4">Kết thúc</th>
                    <th className="py-3.5 px-4">Thành tiền</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {packageInfo?.packageHistory && packageInfo.packageHistory.length > 0 ? (
                    packageInfo.packageHistory.map((pkg, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{pkg.packageName}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">{pkg.packageInfo}</td>
                        <td className="py-3.5 px-4 text-center font-bold">{pkg.quantity}</td>
                        <td className="py-3.5 px-4 text-slate-600">{pkg.startDate}</td>
                        <td className="py-3.5 px-4 text-slate-600">{pkg.endDate}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{formatCurrency(pkg.amount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            pkg.isActive 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {pkg.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">Gói Tiêu Chuẩn Doanh Nghiệp</td>
                      <td className="py-3.5 px-4 text-slate-600">Quyền lợi thành viên vLance Hạng {tier} & Đăng dự án tuyển dụng</td>
                      <td className="py-3.5 px-4 text-center font-bold">1</td>
                      <td className="py-3.5 px-4 text-slate-600">Hôm nay</td>
                      <td className="py-3.5 px-4 text-slate-600">Không giới hạn</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">0 đ</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Hoạt động
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upgrade Packages Selection Component */}
        <div id="upgrade-packages-section" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Chọn gói cước nâng cấp</h2>
            <p className="text-xs text-slate-500 mt-1">Đăng ký các gói dịch vụ cao cấp để nhận ưu đãi chiết khấu và tăng tỉ lệ tiếp cận ứng viên xuất sắc</p>
          </div>

          <EmployerPackages user={user} />
        </div>

      </div>
    </div>
  );
}
