import React, { useState } from 'react';
import { Camera } from 'lucide-react';

export default function UserProfilePage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Thông tin cá nhân');

  const menuItems = [
    { id: 'Tài khoản', label: 'Tài khoản', active: true },
    { id: 'Cài đặt chung', label: 'Cài đặt chung', action: () => onNavigate('coming_soon') },
    { id: 'Tài khoản ngân hàng', label: 'Tài khoản ngân hàng', action: () => onNavigate('coming_soon') },
    { id: 'Giao dịch tiền', label: 'Giao dịch tiền', action: () => onNavigate('coming_soon') },
    { id: 'Rút tiền', label: 'Rút tiền', action: () => onNavigate('coming_soon') },
  ];

  const tabs = [
    'Thông tin cá nhân',
    'Hồ sơ làm việc',
    'Hồ sơ năng lực',
    'Xác thực thông tin'
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex flex-col">
                {menuItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`text-left px-5 py-4 border-b border-slate-100 last:border-0 transition-colors ${
                      item.active 
                        ? 'bg-blue-500 text-white font-bold' 
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-6 py-4 font-bold text-[15px] transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'Thông tin cá nhân' && (
                <div className="max-w-4xl space-y-10">
                  
                  {/* Section 1: Thông tin chung */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Thông tin chung</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-32 font-semibold text-slate-700 pt-2">Ảnh đại diện <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-3">
                            {user?.avatar ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            <p>1. Kích thước không quá 1MB</p>
                            <p>2. Định dạng hỗ trợ: jpg, jpeg, png</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Họ và tên <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value={user?.name || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Email <span className="text-red-500">*</span></label>
                          <input type="email" readOnly value={user?.email || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Điện thoại <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value="0123456789" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Skype</label>
                          <input type="text" readOnly value="" placeholder="Chưa cập nhật" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Thành phố <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value="Hà Nội" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Địa chỉ <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value="" placeholder="Chưa cập nhật" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  {/* Section 2: Giới thiệu chung */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Giới thiệu chung</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Tôi là <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value={user?.role === 'FREELANCER' ? 'Freelancer' : 'Khách hàng'} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Chức danh <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value="Lập trình viên React/Node" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 text-sm">Giới thiệu bản thân <span className="text-red-500">*</span></label>
                        <textarea 
                          readOnly 
                          rows={6} 
                          className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 outline-none resize-none leading-relaxed"
                          value="Tôi là một lập trình viên Fullstack với nhiều năm kinh nghiệm..."
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 text-sm">Website cá nhân</label>
                        <input type="text" readOnly placeholder="Chưa cập nhật" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  {/* Section 3: Kinh nghiệm làm việc */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Kinh nghiệm làm việc</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 text-sm">Lĩnh vực chuyên môn <span className="text-red-500">*</span></label>
                        <input type="text" readOnly value="Lập trình Web" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                      </div>
                    </div>
                  </div>

                </div>
              )}
              {activeTab !== 'Thông tin cá nhân' && (
                <div className="text-slate-500 text-center py-20">
                  Tính năng {activeTab} đang được phát triển...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
