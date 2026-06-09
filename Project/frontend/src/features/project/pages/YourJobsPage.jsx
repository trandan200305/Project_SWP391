import React, { useState } from 'react';
import { Bookmark, AlertTriangle } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function YourJobsPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('saved'); // 'saved', 'received', 'completed'
  const [showComingSoon, setShowComingSoon] = useState(false);
  const { savedJobs, unsaveJob } = useSavedJobs();
  const [toastMessage, setToastMessage] = useState(null);

  const handleTabClick = (tab) => {
    if (tab === 'received' || tab === 'completed') {
      setShowComingSoon(true);
    } else {
      setActiveTab(tab);
    }
  };

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

  const handleEmployerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComingSoon(true);
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

  return (
    <div className="pt-24 pb-12 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Horizontal Filter Tabs */}
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
            Đã nhận
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

        {/* Content Area */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-700 hidden md:grid">
            <div className="col-span-5">Tên việc</div>
            <div className="col-span-2 text-center">Tổng hồ sơ</div>
            <div className="col-span-2 text-center">Hạn nhận hồ sơ</div>
            <div className="col-span-2 text-center">Trạng thái</div>
            <div className="col-span-1 text-center"></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {activeTab === 'saved' && savedJobs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <Bookmark className="w-12 h-12 text-slate-300 mb-3" />
                <p>Bạn chưa lưu công việc nào.</p>
              </div>
            ) : activeTab === 'saved' && savedJobs.length > 0 ? (
              savedJobs.map((job) => (
                <div key={job.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors relative group">
                  
                  {/* Job Info */}
                  <div className="md:col-span-5">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <a 
                          href="#" 
                          onClick={(e) => handleJobClick(e, job)}
                          className="text-[#1e40af] hover:underline font-bold text-base leading-tight mb-1 block"
                        >
                          {job.title}
                        </a>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          Khách hàng: 
                          <button onClick={handleEmployerClick} className="text-blue-500 hover:underline">
                            {job.employerName}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="md:col-span-2 text-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Tổng hồ sơ:</span>
                    {job.applications || 0}
                  </div>

                  <div className="md:col-span-2 text-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Hạn nhận hồ sơ:</span>
                    {formatDeadline(job.deadline)}
                  </div>

                  <div className="md:col-span-2 flex justify-center items-center text-sm text-slate-600">
                    <span className="md:hidden font-medium mr-2">Trạng thái:</span>
                    Đang nhận hồ sơ
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
            ) : null}
          </div>
        </div>
      </div>

      {showComingSoon && <ComingSoon isPopup={true} onClose={() => setShowComingSoon(false)} />}
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
