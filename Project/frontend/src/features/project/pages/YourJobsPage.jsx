import React, { useState, useEffect } from 'react';
import { Bookmark, Briefcase, Calendar, DollarSign, ArrowRight, Trash2, Users, Clock, CheckCircle } from 'lucide-react';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';
import { contractApi } from '../../../api/contractApi';

export default function YourJobsPage({ onNavigate, user }) {
  const [activeTab, setActiveTab] = useState('saved'); // 'saved', 'received', 'completed'
  const { savedJobs, unsaveJob } = useSavedJobs(user);
  
  // Contracts state
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [errorContracts, setErrorContracts] = useState(null);
  
  const [toastMessage, setToastMessage] = useState(null);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (user && (activeTab === 'received' || activeTab === 'completed')) {
      const fetchContracts = async () => {
        try {
          setLoadingContracts(true);
          setErrorContracts(null);
          const data = await contractApi.getFreelancerContracts(user.id);
          setContracts(data);
        } catch (err) {
          setErrorContracts(err.message || 'Không thể tải danh sách hợp đồng.');
        } finally {
          setLoadingContracts(false);
        }
      };
      fetchContracts();
    }
  }, [user, activeTab]);

  const handleUnsave = async (jobId) => {
    const success = await unsaveJob(jobId);
    if (success !== false) {
      showToast('Đã bỏ lưu việc làm');
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleJobClick = (e, job) => {
    e.preventDefault();
    onNavigate('job_details', { job });
  };

  const handleContractClick = (e, contractId) => {
    e.preventDefault();
    onNavigate('contract_details', { contractId });
  };

  const formatDeadline = (deadlineDate) => {
    if (!deadlineDate) return { text: 'Chưa xác định', type: 'unknown' };
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diffMs = deadline - now;
    if (diffMs <= 0) return { text: 'Đã hết hạn', type: 'expired' };
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return { text: `Còn ${diffDays} ngày`, type: 'active' };
    return { text: `Còn ${diffHours} giờ`, type: 'urgent' };
  };

  const getContractStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  };

  const getContractStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-cyan-50 text-cyan-700 border-cyan-150';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'CLOSED': return 'bg-slate-100 text-slate-650 border-slate-200';
      default: return 'bg-slate-55 text-slate-600 border-slate-200';
    }
  };

  // Filter contracts based on tab
  const filteredContracts = contracts.filter(c => {
    if (activeTab === 'received') {
      return c.status === 'ACTIVE';
    } else if (activeTab === 'completed') {
      return c.status === 'COMPLETED' || c.status === 'CLOSED';
    }
    return false;
  });

  return (
    <div className="pt-28 pb-16 bg-slate-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Title Page */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý công việc
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi tất cả dự án bạn đã lưu, đang làm việc hoặc đã hoàn tất bàn giao.
          </p>
        </div>

        {/* Tab Switcher - Pill Style */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit mb-8 gap-1.5 border border-slate-200/40">
          <button
            onClick={() => handleTabClick('saved')}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all duration-250 ${
              activeTab === 'saved'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Đã lưu ({savedJobs.length})
          </button>
          
          <button
            onClick={() => handleTabClick('received')}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all duration-250 ${
              activeTab === 'received'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Đang thực hiện ({contracts.filter(c => c.status === 'ACTIVE').length})
          </button>
          
          <button
            onClick={() => handleTabClick('completed')}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all duration-250 ${
              activeTab === 'completed'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Đã hoàn thành ({contracts.filter(c => c.status === 'COMPLETED' || c.status === 'CLOSED').length})
          </button>
        </div>

        {/* Content Container Card */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Table Header (Desktop only) */}
          <div className="grid grid-cols-12 gap-4 p-5 bg-slate-50/70 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider hidden md:grid">
            <div className="col-span-5">Tên công việc / Hợp đồng</div>
            <div className="col-span-2 text-center">
              {activeTab === 'saved' ? 'Hồ sơ ứng tuyển' : 'Ngân sách'}
            </div>
            <div className="col-span-2 text-center">
              {activeTab === 'saved' ? 'Hạn nhận hồ sơ' : 'Ngày bắt đầu'}
            </div>
            <div className="col-span-2 text-center">Trạng thái</div>
            <div className="col-span-1 text-center">Thao tác</div>
          </div>

          {/* Table Content */}
          <div className="divide-y divide-slate-100">
            
            {/* SAVED JOBS TAB */}
            {activeTab === 'saved' && savedJobs.length === 0 && (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 text-slate-350" />
                </div>
                <p className="text-sm font-bold text-slate-800">Chưa có công việc nào được lưu</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Hãy quay lại trang Tìm việc làm và nhấn lưu những công việc phù hợp với bạn nhé.
                </p>
              </div>
            )}
            
            {activeTab === 'saved' && savedJobs.length > 0 && (
              savedJobs.map((job) => {
                const dlInfo = formatDeadline(job.deadline);
                return (
                  <div key={job.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/15 transition-colors relative group">
                    
                    {/* Job Title & Client */}
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100/50">
                        {job.employerName ? job.employerName.charAt(0).toUpperCase() : 'J'}
                      </div>
                      <div className="min-w-0">
                        <a 
                          href="#" 
                          onClick={(e) => handleJobClick(e, job)}
                          className="text-slate-900 hover:text-indigo-650 hover:underline font-bold text-base leading-snug mb-0.5 block truncate"
                        >
                          {job.title}
                        </a>
                        <div className="text-xs text-slate-400">
                          Khách hàng: <span className="font-semibold text-slate-600">{job.employerName || 'Chưa cập nhật'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Applications Count */}
                    <div className="md:col-span-2 text-center text-sm text-slate-600 flex items-center justify-center gap-1.5 md:flex-row flex-row-reverse">
                      <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider mr-auto">Tổng hồ sơ:</span>
                      <Users className="w-4 h-4 text-slate-400 hidden md:inline" />
                      <span className="font-medium">{job.applications || 0} hồ sơ</span>
                    </div>

                    {/* Deadline date */}
                    <div className="md:col-span-2 text-center text-sm flex items-center justify-center gap-1.5 md:flex-row flex-row-reverse">
                      <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider mr-auto">Hạn nộp:</span>
                      <Clock className="w-4 h-4 text-slate-400 hidden md:inline" />
                      <span className={`font-semibold ${
                        dlInfo.type === 'expired' ? 'text-rose-500' :
                        dlInfo.type === 'urgent' ? 'text-amber-500' : 'text-slate-600'
                      }`}>
                        {dlInfo.text}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="md:col-span-2 flex justify-center items-center md:flex-row flex-row-reverse">
                      <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider mr-auto">Trạng thái:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Đang tuyển
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-1 flex justify-center items-center">
                      <button 
                        onClick={() => handleUnsave(job.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"
                        title="Bỏ lưu công việc này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* CONTRACTS TABS (RECEIVED & COMPLETED) */}
            {(activeTab === 'received' || activeTab === 'completed') && loadingContracts && (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm font-bold text-slate-800">Đang tải danh sách hợp đồng...</p>
              </div>
            )}

            {(activeTab === 'received' || activeTab === 'completed') && errorContracts && (
              <div className="p-16 text-center text-rose-500 flex flex-col items-center justify-center">
                <p className="font-bold">Đã xảy ra lỗi tải dữ liệu</p>
                <p className="text-sm text-rose-450 mt-1">{errorContracts}</p>
              </div>
            )}

            {(activeTab === 'received' || activeTab === 'completed') && !loadingContracts && !errorContracts && filteredContracts.length === 0 && (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-slate-350" />
                </div>
                <p className="text-sm font-bold text-slate-800">Không tìm thấy hợp đồng nào</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Bạn hiện chưa có hợp đồng nào thuộc trạng thái này trên hệ thống.
                </p>
              </div>
            )}

            {(activeTab === 'received' || activeTab === 'completed') && !loadingContracts && !errorContracts && filteredContracts.length > 0 && (
              filteredContracts.map((contract) => (
                <div 
                  key={contract.contractId} 
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/15 transition-colors relative group"
                >
                  {/* Contract Title & Client */}
                  <div className="md:col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100/50">
                      {contract.clientName ? contract.clientName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0">
                      <a 
                        href="#" 
                        onClick={(e) => handleContractClick(e, contract.contractId)}
                        className="text-slate-900 hover:text-indigo-650 hover:underline font-bold text-base leading-snug mb-0.5 block truncate"
                      >
                        {contract.title}
                      </a>
                      <div className="text-xs text-slate-450">
                        Khách hàng: <span className="font-semibold text-slate-500">{contract.clientName || 'Chưa rõ'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Agreed Budget */}
                  <div className="md:col-span-2 text-center text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5 md:flex-row flex-row-reverse">
                    <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider mr-auto">Ngân sách:</span>
                    <DollarSign className="w-4 h-4 text-slate-400 hidden md:inline" />
                    <span>{Number(contract.agreedAmount).toLocaleString('vi-VN')} VNĐ</span>
                  </div>

                  {/* Start Date */}
                  <div className="md:col-span-2 text-center text-sm text-slate-600 flex items-center justify-center gap-1.5 md:flex-row flex-row-reverse">
                    <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider mr-auto">Bắt đầu:</span>
                    <Calendar className="w-4 h-4 text-slate-400 hidden md:inline" />
                    <span className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="md:col-span-2 flex justify-center items-center md:flex-row flex-row-reverse">
                    <span className="md:hidden text-xs font-semibold text-slate-400 uppercase tracking-wider mr-auto">Trạng thái:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getContractStatusClass(contract.status)}`}>
                      {getContractStatusText(contract.status)}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="md:col-span-1 flex justify-center items-center">
                    <button 
                      onClick={(e) => handleContractClick(e, contract.contractId)}
                      className="text-slate-400 hover:text-indigo-650 p-2 hover:bg-slate-100 rounded-xl transition-all"
                      title="Xem chi tiết hợp đồng"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
