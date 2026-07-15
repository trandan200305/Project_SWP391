import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, QrCode, CreditCard } from 'lucide-react';

export default function PaymentCheckoutModal({ isOpen, onClose, selectedPackage, employerId }) {
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState('PAYOS');
  const [error, setError] = useState(null);
  const [payosData, setPayosData] = useState(null);

  const gateways = [
    { id: 'PAYOS', name: 'Thanh toán qua PayOS', description: 'Chuyển khoản bằng mã QR', icon: QrCode, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'VNPAY', name: 'Cổng thanh toán VNPay', description: 'Thẻ ATM nội địa, Visa/MasterCard', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' }
  ];

  // Reset state when modal opens with a new package
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedBank('PAYOS'); // Default
      setError(null);
      setPayosData(null);
    }
  }, [isOpen, selectedPackage]);

  // Polling for transaction status (PayOS only)
  useEffect(() => {
    let poller;
    if (step === 3 && payosData?.txnRef && selectedBank === 'PAYOS') {
      poller = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8080/api/payment/payos/status/${payosData.txnRef}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'SUCCESS' || data.status === 'PAID') {
              setStep(4);
              clearInterval(poller);
              setTimeout(() => {
                onClose(true); // close and indicate success
                window.location.reload(); // Reload to update package info
              }, 3000);
            } else if (data.status === 'CANCELLED') {
              setError('Giao dịch đã bị hủy.');
              setStep(1);
              clearInterval(poller);
            }
          }
        } catch (err) {
          console.error("Lỗi khi kiểm tra trạng thái:", err);
        }
      }, 1500); // Polling every 1.5 seconds to beat PayOS's 3s redirect timer
    }
    return () => clearInterval(poller);
  }, [step, payosData, onClose, selectedBank]);

  const cancelAudioRef = React.useRef(new Audio('/dongpopupthanhtoanhoacchonhuy.mp4'));

  const playCancelSound = () => {
    cancelAudioRef.current.currentTime = 0;
    cancelAudioRef.current.play().catch(e => console.log('Autoplay prevented', e));
  };

  const stopCancelSound = () => {
    cancelAudioRef.current.pause();
    cancelAudioRef.current.currentTime = 0;
  };

  if (!isOpen || !selectedPackage) return null;

  const handleBankSelect = (bankId) => {
    setSelectedBank(bankId);
  };

  const handleContinue = async () => {
    if (!selectedBank) return;
    setStep(2);
    setError(null);

    try {
      if (selectedBank === 'PAYOS') {
        const response = await fetch(`http://localhost:8080/api/payment/payos/create-url?packageType=${selectedPackage.packageType}&employerId=${employerId}`, {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error('Có lỗi xảy ra khi tạo mã thanh toán PayOS.');
        }
        
        const data = await response.json();
        if (data.paymentUrl) {
          setPayosData(data);
          setStep(3); // Show iframe
        } else {
          throw new Error('Không nhận được link thanh toán PayOS.');
        }
      } else if (selectedBank === 'VNPAY') {
        const response = await fetch(`http://localhost:8080/api/payment/create-url?packageType=${selectedPackage.packageType}&employerId=${employerId}`, {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error('Có lỗi xảy ra khi tạo mã thanh toán VNPay.');
        }
        
        const data = await response.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          throw new Error('Không nhận được link thanh toán VNPay.');
        }
      }
    } catch (err) {
      setError(err.message);
      setStep(1); // Go back to selection
    }
  };

  const handleCancelPayos = async () => {
    if (payosData?.txnRef) {
      try {
        await fetch(`http://localhost:8080/api/payment/payos/cancel?txnRef=${payosData.txnRef}`, {
          method: 'POST'
        });
      } catch (err) {
        console.error("Lỗi khi hủy:", err);
      }
    }
    setStep(1);
    setPayosData(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full transition-all overflow-hidden relative flex flex-col max-h-[90vh] ${step === 3 ? 'max-w-4xl h-[85vh]' : 'max-w-md'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Thanh toán Gói {selectedPackage.packageType}
          </h3>
          <button 
            onMouseEnter={playCancelSound}
            onMouseLeave={stopCancelSound}
            onClick={() => {
              playCancelSound();
              if (step === 3) {
                handleCancelPayos();
              } else {
                onClose(false);
              }
            }} 
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto ${step === 3 ? 'p-0 flex-1' : 'p-6'}`}>
          {error && step !== 3 && (
            <div className="mb-6 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium flex items-start gap-2 border border-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-slate-600 text-sm mb-4">
                Vui lòng chọn cổng thanh toán để mua gói 
                <strong className="text-slate-900 ml-1">{selectedPackage.price.toLocaleString('vi-VN')} VND</strong>:
              </p>
              
              <div className="space-y-3 mb-6">
                {gateways.map(gw => {
                  const Icon = gw.icon;
                  return (
                    <button
                      key={gw.id}
                      onClick={() => handleBankSelect(gw.id)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                        selectedBank === gw.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`w-14 h-14 ${gw.bgColor} rounded-lg border border-slate-100 flex items-center justify-center shadow-sm shrink-0`}>
                        <Icon className={`w-7 h-7 ${gw.color}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-800">{gw.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{gw.description}</div>
                      </div>
                      {selectedBank === gw.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleContinue}
                disabled={!selectedBank}
                className={`w-full py-3.5 rounded-xl font-bold transition-all ${
                  selectedBank 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Tiếp tục
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <h4 className="font-bold text-slate-800 text-lg mb-1">Đang kết nối cổng thanh toán...</h4>
              <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát...</p>
            </div>
          )}

          {step === 3 && payosData && (
            <iframe 
              src={payosData.paymentUrl} 
              className="w-full h-full border-none" 
              title="PayOS Checkout"
            />
          )}

          {step === 4 && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-2xl mb-3">Thanh toán thành công!</h4>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Gói <strong className="text-slate-800">{selectedPackage.packageType}</strong> đã được kích hoạt thành công cho tài khoản của bạn.
              </p>
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-500 text-sm font-medium animate-pulse">
                Hệ thống sẽ tải lại sau 3 giây...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
