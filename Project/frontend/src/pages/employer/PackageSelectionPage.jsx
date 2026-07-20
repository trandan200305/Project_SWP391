import React from 'react';
import EmployerPackages from '../../components/EmployerPackages.jsx';

export default function PackageSelectionPage({ user, onNavigate }) {
  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <EmployerPackages user={user} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📜 Điều Khoản Gói Dịch Vụ</h3>
          <div className="text-sm text-slate-600 space-y-4">
            <p>
              <strong>1. Hiệu lực của gói:</strong> Gói dịch vụ sẽ được kích hoạt ngay lập tức sau khi thanh toán thành công và tự động hết hạn sau số ngày quy định kể từ ngày kích hoạt.
            </p>
            <p>
              <strong>2. Quy định hoàn tiền:</strong> LancerPro không hỗ trợ hoàn tiền cho các gói dịch vụ đã mua và kích hoạt thành công, trừ trường hợp lỗi kỹ thuật từ phía hệ thống không thể cung cấp dịch vụ như cam kết.
            </p>
            <p>
              <strong>3. Cập nhật và nâng cấp:</strong> Nếu bạn đang sử dụng một gói và tiếp tục mua gói khác, thời hạn và số lượng bài đăng sẽ được cộng dồn hoặc áp dụng theo chính sách gói cao cấp hơn. Vui lòng liên hệ bộ phận hỗ trợ nếu có thắc mắc.
            </p>
            <p>
              <strong>4. Thanh toán QR:</strong> Mã QR thanh toán chỉ có hiệu lực trong vòng 30 phút. Nếu quá thời gian, giao dịch sẽ bị hủy, bạn có thể tạo lại mã thanh toán mới miễn phí.
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => onNavigate('home')}
            className="text-blue-600 font-semibold hover:underline"
          >
            &larr; Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
