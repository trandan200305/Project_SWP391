import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, ArrowLeft, Copy, Check, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

export default function CheckoutPage({ pageParams, onNavigate }) {
  const { 
    projectId, 
    paymentUrl, 
    amount, 
    txnRef, 
    bankName = 'Techcombank', 
    bankAccountNo = '19031234567890', 
    bankAccountName = 'TRAN DUC AN',
    projectTitle = 'Dự án LancerPro'
  } = pageParams || {};

  const [paymentMethod, setPaymentMethod] = useState('vietqr'); // default to VietQR
  const [copiedField, setCopiedField] = useState(null);

  // Format currency
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 50000);

  // Generate VietQR URL
  const vietQrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccountNo}-compact2.png?amount=${amount || 50000}&addInfo=${encodeURIComponent(txnRef || '')}&accountName=${encodeURIComponent(bankAccountName)}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBack = () => {
    if (onNavigate) onNavigate('your_jobs');
  };

  const handleRedirectVnpay = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      alert('Không tìm thấy đường dẫn thanh toán VNPay!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100/80 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Column: Order details & Payment Method Selector */}
          <div className="md:col-span-7 p-8 border-b md:border-b-0 md:border-r border-slate-100">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại dự án của tôi
            </button>

            <h1 className="font-display text-2xl font-extrabold text-slate-900 mb-2">Thanh toán phí đăng tin</h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Vui lòng lựa chọn phương thức thanh toán bên dưới để kích hoạt bài viết tuyển dụng trực tuyến của bạn.
            </p>

            {/* Project Summary Card */}
            <div className="bg-slate-50 border border-slate-150/50 rounded-2xl p-5 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dự án cần thanh toán</span>
              <h3 className="font-bold text-slate-800 text-[15px] truncate mt-1">{projectTitle}</h3>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                <span className="text-sm font-semibold text-slate-500">Tổng phí dịch vụ:</span>
                <span className="text-xl font-extrabold text-emerald-600">{formattedAmount}</span>
              </div>
            </div>

            {/* Payment Method Option List */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chọn phương thức</span>
              
              {/* VietQR Bank Transfer Option */}
              <div 
                onClick={() => setPaymentMethod('vietqr')}
                className={`border rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'vietqr' 
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'vietqr' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-bold text-slate-800 text-[14px]">Chuyển khoản Ngân hàng (VietQR)</h4>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                    Quét mã QR bằng ứng dụng ngân hàng di động của bạn để thanh toán ngay lập tức.
                  </p>
                </div>
              </div>

              {/* VNPay Gateway Option */}
              <div 
                onClick={() => setPaymentMethod('vnpay')}
                className={`border rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'vnpay' 
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  paymentMethod === 'vnpay' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-bold text-slate-800 text-[14px]">Cổng thanh toán điện tử VNPay</h4>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                    Thanh toán qua cổng VNPay với thẻ quốc tế Visa/Master, thẻ ATM nội địa hoặc ví điện tử.
                  </p>
                </div>
              </div>

            </div>

            {paymentMethod === 'vnpay' && (
              <div className="mt-8 animate-in fade-in duration-300">
                <button
                  onClick={handleRedirectVnpay}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg shadow-emerald-600/15 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Thanh toán qua VNPay
                  <ExternalLink className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mt-3 text-slate-400 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-[11px]">Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán VNPay Sandbox an toàn.</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic VietQR presentation OR VNPay Info */}
          <div className="md:col-span-5 bg-slate-50/80 p-8 flex flex-col items-center justify-center">
            {paymentMethod === 'vietqr' ? (
              <div className="w-full space-y-6 text-center animate-in fade-in duration-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mã QR Thanh Toán</span>
                
                {/* QR Code Frame */}
                <div className="inline-block bg-white p-4 border border-slate-200 rounded-3xl shadow-lg relative group">
                  <img 
                    src={vietQrUrl} 
                    alt="Mã VietQR" 
                    className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl">
                    <QrCode className="w-10 h-10 text-emerald-500 animate-bounce mb-2" />
                    <span className="text-[11px] font-bold text-slate-700">Mở app Ngân hàng để quét</span>
                  </div>
                </div>

                {/* Transfer Info Fields with Quick Copy */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Ngân hàng:</span>
                    <span className="font-extrabold text-slate-800">{bankName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="font-mono">{bankAccountNo}</span>
                      <button 
                        onClick={() => handleCopy(bankAccountNo, 'acc')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800 uppercase">{bankAccountName}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Số tiền:</span>
                    <div className="flex items-center gap-1.5 font-extrabold text-emerald-600">
                      <span>{formattedAmount}</span>
                      <button 
                        onClick={() => handleCopy(amount || 50000, 'amt')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {copiedField === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Nội dung chuyển:</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{txnRef}</span>
                      <button 
                        onClick={() => handleCopy(txnRef || '', 'ref')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 text-left">
                  <div className="flex gap-2 text-amber-700">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs">Lưu ý đối với thử nghiệm:</h5>
                      <p className="text-[11px] leading-relaxed mt-1">
                        Do đây là hệ thống thử nghiệm, sau khi chuyển khoản, bạn có thể thông báo cho Ban quản trị phê duyệt. Admin sẽ vào trang Dashboard quản lý giao dịch để nhấn nút <strong>Duyệt thủ công</strong> để kích hoạt bài đăng lập tức.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-[15px]">Cổng thanh toán VNPay</h4>
                <p className="text-[12px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                  Nhấn nút bên trái để được chuyển hướng an toàn qua hệ thống cổng thanh toán VNPay thực hiện quét QR động hoặc nhập thông tin thẻ.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
