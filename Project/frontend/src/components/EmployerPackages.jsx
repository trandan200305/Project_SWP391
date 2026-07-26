import React, { useState, useEffect } from 'react';
import { Briefcase, Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import PaymentCheckoutModal from './employer/PaymentCheckoutModal.jsx';
import { api } from '../api/apiClient.js';

const DEFAULT_PACKAGES = [
  { packageType: 'MEDIUM', price: 250000, durationDays: 10 },
  { packageType: 'REGULAR', price: 100000, durationDays: 20 },
  { packageType: 'PREMIUM', price: 500000, durationDays: 30 }
];

export default function EmployerPackages({ user }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPkg, setProcessingPkg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    api.get('/admin/service-packages')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          data.sort((a, b) => a.price - b.price);
          setPackages(data);
        } else {
          setPackages(DEFAULT_PACKAGES);
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải gói dịch vụ:', err);
        setPackages(DEFAULT_PACKAGES);
      })
      .finally(() => setLoading(false));
  }, []);

  const [selectedPkgForModal, setSelectedPkgForModal] = useState(null);

  const handleSubscribe = (pkg) => {
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập tài khoản Nhà tuyển dụng để mua gói dịch vụ.');
      return;
    }
    const roleUpper = user.role?.toUpperCase();
    if (roleUpper !== 'EMPLOYER' && roleUpper !== 'ADMIN') {
      setErrorMsg('Tính năng mua gói dành cho Nhà tuyển dụng. Bạn đang đăng nhập bằng tài khoản ' + (user.role || 'khác') + '.');
      return;
    }
    setErrorMsg(null);
    setSelectedPkgForModal(pkg);
  };

  const audioRefs = React.useRef({
    REGULAR: new Audio('/thuong.mp4'),
    MEDIUM: new Audio('/trungbinh.mp4'),
    PREMIUM: new Audio('/premium.mp4')
  });

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500 font-semibold mb-2">Hệ thống đang bảo trì hoặc chưa cấu hình các gói dịch vụ.</p>
        <p className="text-sm text-slate-400">Vui lòng liên hệ Admin để được hỗ trợ.</p>
      </div>
    );
  }

  const handleMouseEnter = (pkgType) => {
    const audio = audioRefs.current[pkgType];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Autoplay prevented', e));
    }
  };

  const handleMouseLeave = (pkgType) => {
    const audio = audioRefs.current[pkgType];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  return (
    <div className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex items-center gap-2 text-slate-700">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Chọn gói dịch vụ tin đăng *
          </h2>
        </div>

        {errorMsg && (
          <div className="max-w-3xl mb-8 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-semibold flex items-center justify-center gap-2">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isPremium = pkg.packageType === 'PREMIUM';
            const isMedium = pkg.packageType === 'MEDIUM';
            const isRegular = pkg.packageType === 'REGULAR';
            const isSingle = pkg.packageType === 'SINGLE';
            
            let label = 'Trung bình';
            let description = 'Hiển thị tối đa 10 ngày. Phù hợp tin tuyển dụng quy mô nhỏ.';
            let iconColor = 'text-blue-500 bg-blue-50';
            
            if (isRegular) {
              label = 'Thường';
              description = 'Hiển thị tối đa 20 ngày, tiếp cận lượng lớn Freelancer.';
              iconColor = 'text-indigo-500 bg-indigo-50';
            } else if (isPremium) {
              label = 'Cao cấp';
              description = 'Hiển thị tối đa 30 ngày. Đóng dấu nổi bật thu hút Freelancer chuyên nghiệp nhất.';
              iconColor = 'text-amber-500 bg-amber-50';
            } else if (isSingle) {
              label = 'Gói Lẻ';
              description = 'Đăng 1 bài tuyển dụng. Không giới hạn thời gian hiển thị.';
              iconColor = 'text-rose-500 bg-rose-50';
            }

            return (
              <div 
                key={pkg.packageType}
                onMouseEnter={() => handleMouseEnter(pkg.packageType)}
                onMouseLeave={() => handleMouseLeave(pkg.packageType)}
                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-200 bg-white border ${
                  isMedium ? 'border-cyan-400 shadow-sm' : isSingle ? 'border-rose-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3 right-6">
                    <span className="bg-[#F97316] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm">
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    {isSingle ? 'Không giới hạn' : `Hạn ${pkg.durationDays} ngày`}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {label}
                </h3>
                
                <p className="text-sm text-slate-500 mb-8 min-h-[40px]">
                  {description}
                </p>

                <div className="mt-auto mb-6">
                  <p className="text-xs text-slate-400 font-medium mb-1">Giá gói</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {pkg.price.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      VND
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(pkg)}
                  disabled={processingPkg !== null}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                    processingPkg === pkg.packageType
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isMedium
                        ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                        : isPremium
                          ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20'
                          : isSingle
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {processingPkg === pkg.packageType ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      Mua Gói Này
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>

      <PaymentCheckoutModal 
        isOpen={selectedPkgForModal !== null}
        onClose={(success) => {
          setSelectedPkgForModal(null);
          if (success) {
            // Optional: you can refresh user data here or show a toast
            window.location.reload(); // Simple way to refresh UI state for now
          }
        }}
        selectedPackage={selectedPkgForModal}
        employerId={user?.employerId || user?.id}
      />
    </div>
  );
}
