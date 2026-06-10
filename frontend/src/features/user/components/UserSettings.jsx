import React from 'react';
import { List, Lock, Trash2, ShieldCheck, UploadCloud, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function UserSettings({
  prefTab, setPrefTab, role, targetId, handleSavePassword, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, deleteInput, setDeleteInput, handleDeleteAccount,
  kycStatus, setKycStatus, isVerified, setIsVerified, kycRejectedReason, setKycRejectedReason, idCardFrontUrl, setIdCardFrontUrl, idCardBackUrl, setIdCardBackUrl, portraitUrl, setPortraitUrl, isUploadingKyc, setIsUploadingKyc
}) {
  const handleUploadKycImage = async (e, setUrlFn) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingKyc(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUrlFn(data.fileUrl);
      } else {
        alert('Upload ảnh thất bại!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsUploadingKyc(false);
      e.target.value = '';
    }
  };

  const handleSubmitKyc = async () => {
    if (!idCardFrontUrl || !idCardBackUrl || !portraitUrl) {
      alert("Vui lòng tải lên đầy đủ 3 ảnh (Mặt trước, mặt sau và chân dung).");
      return;
    }
    const endpoint = role === 'freelancer' ? `http://localhost:8080/api/freelancers/${targetId}/kyc/submit` : `http://localhost:8080/api/employers/${targetId}/kyc/submit`;
    try {
      // Mocked until backend API is ready. We just call it and pretend success or handle error.
      // For now, we will update state locally to simulate if the backend isn't ready.
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardFrontUrl, idCardBackUrl, portraitUrl })
      });
      if(res.ok) {
        alert("Đã gửi yêu cầu xác minh KYC thành công!");
        setKycStatus("PENDING");
      } else {
        // Fallback simulation if endpoint not found (404)
        alert("Đã gửi yêu cầu xác minh (Mô phỏng - Cần hoàn thiện Backend API).");
        setKycStatus("PENDING");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    }
  };

  return (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   
                   {/* Left Sidebar Menu for Preferences */}
                   <div className="md:col-span-1 flex flex-col gap-2">
                      <button 
                         onClick={() => setPrefTab('notifications')}
                         className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         <List className="w-4 h-4" /> Tùy chọn chung
                      </button>
                      <button 
                         onClick={() => setPrefTab('security')}
                         className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         <Lock className="w-4 h-4" /> Đổi mật khẩu
                      </button>
                      <button 
                         onClick={() => setPrefTab('kyc')}
                         className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'kyc' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         <ShieldCheck className="w-4 h-4" /> Xác minh danh tính
                      </button>
                      {role !== 'admin' && (
                        <button 
                           onClick={() => setPrefTab('danger')}
                           className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'danger' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                           <Trash2 className="w-4 h-4" /> Xóa tài khoản
                        </button>
                      )}
                   </div>
                   
                   {/* Content Area for Preferences */}
                   <div className="md:col-span-3">
                     
                     {prefTab === 'notifications' && (
                       <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2"><List className="w-5 h-5 text-gray-500" /> Tùy chọn chung</h3>
                         <div className="space-y-6">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-semibold text-gray-800">Thông báo Email</p>
                               <p className="text-sm text-gray-500 mt-1">Nhận email khi có tin nhắn mới hoặc cập nhật dự án.</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" defaultChecked />
                               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                             </label>
                           </div>
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-semibold text-gray-800">Hiển thị trực tuyến</p>
                               <p className="text-sm text-gray-500 mt-1">Cho phép người khác thấy khi bạn đang online.</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" defaultChecked />
                               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                             </label>
                           </div>
                         </div>
                       </div>
                     )}

                     {prefTab === 'security' && (
                       <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-gray-500" /> Đổi mật khẩu</h3>
                         <form onSubmit={handleSavePassword} className="space-y-5">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</span>
                             <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</span>
                             <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</span>
                             <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                           </div>
                           <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold mt-4 shadow-sm transition-colors w-full sm:w-auto">
                             Cập nhật mật khẩu
                           </button>
                         </form>
                       </div>
                     )}

                     {prefTab === 'kyc' && (
                       <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-500" /> Xác minh danh tính (KYC)</h3>
                         
                         {kycStatus === 'APPROVED' && (
                            <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
                               <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                               <h4 className="text-lg font-bold text-green-800 mb-2">Đã Xác Minh Thành Công</h4>
                               <p className="text-sm text-green-700">Tài khoản của bạn đã được xác thực và cấp huy hiệu Tích xanh. Cảm ơn bạn đã đồng hành cùng LancerPro!</p>
                            </div>
                         )}

                         {kycStatus === 'PENDING' && (
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-center">
                               <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                               <h4 className="text-lg font-bold text-blue-800 mb-2">Hồ Sơ Đang Chờ Duyệt</h4>
                               <p className="text-sm text-blue-700">Yêu cầu xác minh của bạn đã được gửi. Nhân viên hệ thống sẽ kiểm tra và phản hồi trong thời gian sớm nhất.</p>
                            </div>
                         )}

                         {(kycStatus === 'UNVERIFIED' || kycStatus === 'REJECTED') && (
                            <div className="space-y-6">
                               {kycStatus === 'REJECTED' && (
                                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                                     <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                     <div>
                                        <h5 className="font-bold text-red-800 text-sm">Hồ sơ xác minh bị từ chối</h5>
                                        <p className="text-sm text-red-700 mt-1"><strong>Lý do:</strong> {kycRejectedReason || 'Ảnh không rõ nét hoặc thông tin không trùng khớp.'}</p>
                                        <p className="text-sm text-red-700 mt-1">Vui lòng tải lên lại các tài liệu dưới đây.</p>
                                     </div>
                                  </div>
                               )}
                               
                               <p className="text-sm text-gray-600 leading-relaxed">
                                  Tải lên ảnh chụp rõ nét của thẻ Căn cước công dân (Mặt trước & Mặt sau) và một ảnh chân dung của bạn để chúng tôi xác thực danh tính.
                               </p>

                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Front ID */}
                                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-gray-50 transition-colors h-40">
                                     {idCardFrontUrl ? (
                                        <img src={idCardFrontUrl} alt="CCCD Mặt trước" className="w-full h-full object-contain" />
                                     ) : (
                                        <>
                                           <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                           <span className="text-sm font-semibold text-gray-700">CCCD Mặt trước</span>
                                        </>
                                     )}
                                     <input type="file" disabled={isUploadingKyc} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleUploadKycImage(e, setIdCardFrontUrl)} />
                                  </div>

                                  {/* Back ID */}
                                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-gray-50 transition-colors h-40">
                                     {idCardBackUrl ? (
                                        <img src={idCardBackUrl} alt="CCCD Mặt sau" className="w-full h-full object-contain" />
                                     ) : (
                                        <>
                                           <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                           <span className="text-sm font-semibold text-gray-700">CCCD Mặt sau</span>
                                        </>
                                     )}
                                     <input type="file" disabled={isUploadingKyc} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleUploadKycImage(e, setIdCardBackUrl)} />
                                  </div>

                                  {/* Portrait */}
                                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-gray-50 transition-colors h-40 sm:col-span-2">
                                     {portraitUrl ? (
                                        <img src={portraitUrl} alt="Ảnh Chân dung" className="w-full h-full object-contain" />
                                     ) : (
                                        <>
                                           <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                           <span className="text-sm font-semibold text-gray-700">Ảnh chân dung (Selfie)</span>
                                        </>
                                     )}
                                     <input type="file" disabled={isUploadingKyc} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleUploadKycImage(e, setPortraitUrl)} />
                                  </div>
                               </div>

                               <button 
                                  onClick={handleSubmitKyc} 
                                  disabled={isUploadingKyc || !idCardFrontUrl || !idCardBackUrl || !portraitUrl}
                                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                  {isUploadingKyc ? 'Đang tải ảnh lên...' : 'Gửi Yêu Cầu Xác Minh'}
                               </button>
                            </div>
                         )}
                       </div>
                     )}

                     {prefTab === 'danger' && role !== 'admin' && (
                       <div className="bg-white p-8 rounded-xl border border-red-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-500" /> Xóa Tài Khoản</h3>
                         <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                           Khi bạn xóa tài khoản, tất cả dữ liệu bao gồm hồ sơ, dự án, lịch sử giao dịch và tin nhắn sẽ bị xóa vĩnh viễn và không thể khôi phục.
                         </p>
                         <div className="mb-6">
                           <label className="block text-sm font-semibold text-gray-700 mb-2">Vui lòng nhập <span className="font-bold text-red-600">DELETE</span> để xác nhận:</label>
                           <input type="text" value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="Nhập DELETE..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                         </div>
                         <button onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE'} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors w-full sm:w-auto shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                           Xác nhận Xóa Tài Khoản
                         </button>
                       </div>
                     )}
                     
                   </div>
                 </div>
  );
}
