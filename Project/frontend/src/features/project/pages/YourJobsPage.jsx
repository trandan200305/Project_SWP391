import React, { useState, useEffect } from 'react';
import { Bookmark, Briefcase, Calendar, DollarSign, ArrowRight, ExternalLink } from 'lucide-react';
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

  const handleUnsave = (jobId) => {
    unsaveJob(jobId);
    showToast('Đã bỏ lưu việc làm');
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
    if (!deadlineDate) return 'Chưa xác định';
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diffMs = deadline - now;
    if (diffMs <= 0) return 'Đã hết hạn';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `Còn ${diffDays} ngày ${diffHours} giờ`;
    return `Còn ${diffHours} giờ`;
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
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
    <div className="pt-24 pb-12 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        
        
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => handleTabClick('saved')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'saved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Đã lưu
          </button>
          <button
            onClick={() => handleTabClick('received')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'received'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Đã nhận (Đang làm)
          </button>
          <button
            onClick={() => handleTabClick('completed')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Đã hoàn thành
          </button>
        </div>

        
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-700 hidden md:grid">
            <div className="col-span-5">Tên công việc / Hợp đồng</div>
            <div className="col-span-2 text-center">
              {activeTab === 'saved' ? 'Tổng hồ sơ' : 'Ngân sách'}
            </div>
            <div className="col-span-2 text-center">
              {activeTab === 'saved' ? 'Hạn nhận hồ sơ' : 'Ngày bắt đầu'}
            </div>
            <div className="col-span-2 text-center">Trạng thái</div>
            <div className="col-span-1 text-center"></div>
          </div>

          
          <div className="divide-y divide-slate-100">
            {/* SAVED JOBS TAB */}
            {activeTab === 'saved' && savedJobs.length === 0 && (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <Bookmark className="w-12 h-12 text-slate-300 mb-3" />
                <p>Bạn chưa lưu công việc nào.</p>
              </div>
            )}
            
            {activeTab === 'saved' && savedJobs.length > 0 && (
              savedJobs.map((job) => (
                <div key={job.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors relative group">
                  <div className="md:col-span-5">
                    <a 
                      href="#" 
                      onClick={(e) => handleJobClick(e, job)}
                      className="text-[#1e40af] hover:underline font-bold text-base leading-tight mb-1 block"
                    >
                      {job.title}
                    </a>
                    <div className="text-xs text-slate-500">
                      Khách hàng: <span className="font-semibold text-slate-600">{job.employerName}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 text-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Tổng hồ sơ:</span>
                    {job.applications || 0} hồ sơ
                  </div>

                  <div className="md:col-span-2 text-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Hạn nhận hồ sơ:</span>
                    {formatDeadline(job.deadline)}
                  </div>

                  <div className="md:col-span-2 flex justify-center items-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Trạng thái:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      Đang tuyển
                    </span>
                  </div>

                  <div className="md:col-span-1 flex justify-center items-center">
                    <button 
                      onClick={() => handleUnsave(job.id)}
                      className="text-amber-500 hover:text-slate-400 p-1 transition-colors"
                      title="Bỏ lưu"
                    >
                      <Bookmark className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* CONTRACTS TABS (RECEIVED & COMPLETED) */}
            {(activeTab === 'received' || activeTab === 'completed') && loadingContracts && (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium">Đang tải danh sách hợp đồng...</p>
              </div>
            )}

            {(activeTab === 'received' || activeTab === 'completed') && errorContracts && (
              <div className="p-10 text-center text-rose-500">
                <p className="font-bold">Đã xảy ra lỗi:</p>
                <p className="text-sm">{errorContracts}</p>
              </div>
            )}

            {(activeTab === 'received' || activeTab === 'completed') && !loadingContracts && !errorContracts && filteredContracts.length === 0 && (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <Briefcase className="w-12 h-12 text-slate-300 mb-3" />
                <p>Không tìm thấy hợp đồng nào ở trạng thái này.</p>
              </div>
            )}

            {(activeTab === 'received' || activeTab === 'completed') && !loadingContracts && !errorContracts && filteredContracts.length > 0 && (
              filteredContracts.map((contract) => (
                <div 
                  key={contract.contractId} 
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors relative group"
                >
                  <div className="md:col-span-5">
                    <a 
                      href="#" 
                      onClick={(e) => handleContractClick(e, contract.contractId)}
                      className="text-[#1e40af] hover:underline font-bold text-base leading-tight mb-1 block"
                    >
                      {contract.title}
                    </a>
                    <div className="text-xs text-slate-500">
                      Khách hàng: <span className="font-semibold text-slate-600">{contract.clientName}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 text-center text-sm font-semibold text-slate-800">
                    <span className="md:hidden font-medium text-slate-500 mr-2">Ngân sách:</span>
                    {Number(contract.agreedAmount).toLocaleString('vi-VN')} VNĐ
                  </div>

                  <div className="md:col-span-2 text-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Ngày bắt đầu:</span>
                    {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                  </div>

                  <div className="md:col-span-2 flex justify-center items-center">
                    <span className="md:hidden font-medium mr-2">Trạng thái:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getContractStatusClass(contract.status)}`}>
                      {getContractStatusText(contract.status)}
                    </span>
                  </div>

                  <div className="md:col-span-1 flex justify-center items-center">
                    <button 
                      onClick={(e) => handleContractClick(e, contract.contractId)}
                      className="text-slate-400 hover:text-blue-600 p-1.5 transition-all rounded-lg hover:bg-slate-100"
                      title="Xem chi tiết"
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
      
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
