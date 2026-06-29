import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  FileText, 
  Check, 
  X, 
  Clock, 
  ExternalLink, 
  AlertCircle,
  Briefcase,
  User,
  Paperclip
} from 'lucide-react';
import { contractApi } from '../../../api/contractApi';

export default function ContractDetailPage({ contractId, user, onNavigate }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState(null); // For submit work form
  
  // Submit work form state
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  
  // Review form state
  const [reviewFeedback, setReviewFeedback] = useState({});
  const [submittingReview, setSubmittingReview] = useState({});
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isClient = user && contract && contract.clientId === user.id;
  const isFreelancer = user && contract && contract.freelancerId === user.id;

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractApi.getContractDetails(contractId, user.id);
      setContract(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId && user) {
      fetchContractDetails();
    }
  }, [contractId, user]);

  const handleGoBack = () => {
    if (isClient) {
      onNavigate('employer_profile');
    } else {
      onNavigate('your_jobs');
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleWorkSubmit = async (e, milestoneId) => {
    e.preventDefault();
    if (!submitTitle.trim()) {
      setActionError('Vui lòng nhập tiêu đề sản phẩm.');
      return;
    }
    
    try {
      setSubmittingWork(true);
      setActionError(null);
      
      const submitData = {
        title: submitTitle,
        notes: submitNotes,
        attachments: submitUrl.trim() ? [{
          fileUrl: submitUrl.trim(),
          fileName: submitUrl.split('/').pop() || 'Tài liệu đính kèm',
          fileSize: 0
        }] : []
      };

      await contractApi.submitDeliverable(milestoneId, user.id, submitData);
      
      // Reset form
      setSubmitTitle('');
      setSubmitNotes('');
      setSubmitUrl('');
      setActiveMilestoneId(null);
      showSuccess('Nộp sản phẩm thành công! Đang chờ nhà tuyển dụng duyệt.');
      
      // Reload details
      fetchContractDetails();
    } catch (err) {
      setActionError(err.message || 'Lỗi khi nộp sản phẩm.');
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleReview = async (deliverableId, approve) => {
    const feedback = reviewFeedback[deliverableId] || '';
    if (!approve && !feedback.trim()) {
      setActionError('Vui lòng nhập lý do từ chối vào ô nhận xét.');
      return;
    }

    try {
      setSubmittingReview(prev => ({ ...prev, [deliverableId]: true }));
      setActionError(null);

      await contractApi.reviewDeliverable(deliverableId, user.id, approve, feedback);
      
      showSuccess(approve ? 'Đã duyệt sản phẩm và mốc công việc thành công!' : 'Đã từ chối sản phẩm.');
      
      // Reset feedback
      setReviewFeedback(prev => ({ ...prev, [deliverableId]: '' }));
      
      // Reload details
      fetchContractDetails();
    } catch (err) {
      setActionError(err.message || 'Lỗi khi gửi đánh giá.');
    } finally {
      setSubmittingReview(prev => ({ ...prev, [deliverableId]: false }));
    }
  };

  const handleCompleteContract = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn thành hợp đồng này? Thao tác này sẽ đóng dự án.')) {
      return;
    }

    try {
      setActionError(null);
      await contractApi.completeContract(contractId, user.id);
      showSuccess('Hợp đồng đã được hoàn thành thành công!');
      fetchContractDetails();
    } catch (err) {
      setActionError(err.message || 'Lỗi khi đóng hợp đồng.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'COMPLETED':
      case 'CLOSED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Đang hoạt động';
      case 'PENDING': return 'Chưa thực hiện';
      case 'SUBMITTED': return 'Đã nộp - Chờ duyệt';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'REJECTED': return 'Yêu cầu làm lại';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="pt-28 pb-12 flex justify-center items-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-slate-500 font-medium">Đang tải thông tin hợp đồng...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-28 pb-12 min-h-screen bg-slate-50 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={handleGoBack}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  // Check if all milestones are approved to allow project completion
  const allMilestonesApproved = contract.milestones && contract.milestones.length > 0 && 
    contract.milestones.every(m => m.status === 'APPROVED');

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Navigation & Alert messages */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại trang danh sách</span>
          </button>

          {isClient && contract.status === 'ACTIVE' && allMilestonesApproved && (
            <button
              onClick={handleCompleteContract}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Hoàn thành Hợp đồng</span>
            </button>
          )}
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{successMessage}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold text-sm">{actionError}</span>
          </div>
        )}

        {/* Contract Core Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8 overflow-hidden relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadgeClass(contract.status)}`}>
                  {getStatusText(contract.status)}
                </span>
                <span className="text-slate-400 text-sm">Hợp đồng #{contract.contractId}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">{contract.title}</h1>
              <div className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mt-1">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>Dự án: {contract.projectTitle}</span>
              </div>
            </div>
            
            <div className="text-left md:text-right shrink-0">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Tổng ngân sách</span>
              <div className="text-2xl font-black text-blue-600 flex items-center md:justify-end">
                <DollarSign className="w-6 h-6 -mr-1" />
                {Number(contract.agreedAmount).toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
          </div>

          {/* Partner & Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-sm">
            {/* Employer / Client Info */}
            <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                {contract.clientAvatar ? (
                  <img src={contract.clientAvatar} alt="client" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Khách hàng</span>
                <span className="font-extrabold text-slate-800">{contract.clientName}</span>
              </div>
            </div>

            {/* Freelancer Info */}
            <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                {contract.freelancerAvatar ? (
                  <img src={contract.freelancerAvatar} alt="freelancer" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Freelancer thuê</span>
                <span className="font-extrabold text-slate-800">{contract.freelancerName}</span>
              </div>
            </div>

            {/* Timing Info */}
            <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thời hạn thực hiện</span>
                <span className="font-extrabold text-slate-800">
                  Từ {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                  {contract.endDate ? ` - Đến ${new Date(contract.endDate).toLocaleDateString('vi-VN')}` : ' (Chưa có kết thúc)'}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          {contract.terms && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Thỏa thuận công việc & Đơn báo giá</span>
              <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm whitespace-pre-wrap leading-relaxed border border-slate-100">
                {contract.terms}
              </div>
            </div>
          )}
        </div>

        {/* Milestones / Progress Section */}
        <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <span>Tiến độ và các Mốc công việc</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {contract.milestones ? contract.milestones.length : 0} mốc
          </span>
        </h2>

        <div className="space-y-6">
          {(!contract.milestones || contract.milestones.length === 0) ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              Không có mốc công việc nào được định nghĩa cho hợp đồng này.
            </div>
          ) : (
            contract.milestones.map((milestone, index) => {
              const showSubmitForm = activeMilestoneId === milestone.milestoneId;
              const hasDeliverables = milestone.deliverables && milestone.deliverables.length > 0;
              
              return (
                <div 
                  key={milestone.milestoneId}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Milestone Header */}
                  <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">{milestone.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngân sách mốc</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {Number(milestone.amount).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(milestone.status)}`}>
                          {getStatusText(milestone.status)}
                        </span>
                        
                        {isFreelancer && contract.status === 'ACTIVE' && milestone.status !== 'APPROVED' && milestone.status !== 'SUBMITTED' && (
                          <button
                            onClick={() => {
                              setActiveMilestoneId(showSubmitForm ? null : milestone.milestoneId);
                              setActionError(null);
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            {showSubmitForm ? 'Hủy' : 'Nộp sản phẩm'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission & Review Body */}
                  <div className="p-5 space-y-5">
                    
                    {/* Date Details */}
                    {milestone.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Hạn hoàn thành mốc: {new Date(milestone.dueDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}

                    {/* Freelancer Submit Work Form */}
                    {showSubmitForm && (
                      <form 
                        onSubmit={(e) => handleWorkSubmit(e, milestone.milestoneId)}
                        className="bg-slate-50/70 p-4 rounded-xl border border-blue-100 space-y-4 animate-in slide-in-from-top-3 duration-200"
                      >
                        <h4 className="font-extrabold text-slate-800 text-sm">Nộp sản phẩm cho mốc này</h4>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Tiêu đề sản phẩm <span className="text-rose-500">*</span></label>
                          <input 
                            type="text" 
                            value={submitTitle}
                            onChange={(e) => setSubmitTitle(e.target.value)}
                            placeholder="Ví dụ: Báo cáo thiết kế giai đoạn 1, Mã nguồn hoàn thiện..."
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Link tài liệu/sản phẩm đính kèm (URL)</label>
                          <input 
                            type="url" 
                            value={submitUrl}
                            onChange={(e) => setSubmitUrl(e.target.value)}
                            placeholder="Ví dụ: Figma link, Github link, Google Drive link..."
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Ghi chú gửi Nhà tuyển dụng</label>
                          <textarea 
                            value={submitNotes}
                            onChange={(e) => setSubmitNotes(e.target.value)}
                            rows={3}
                            placeholder="Mô tả tóm tắt những công việc bạn đã hoàn thành trong mốc này..."
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setActiveMilestoneId(null)}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            type="submit"
                            disabled={submittingWork}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {submittingWork ? 'Đang gửi...' : 'Xác nhận nộp'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Historical Deliverables List */}
                    {hasDeliverables && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Các sản phẩm đã nộp</span>
                        
                        {milestone.deliverables.map((deliverable) => (
                          <div 
                            key={deliverable.deliverableId}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-3"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="font-extrabold text-slate-800 text-sm">{deliverable.title}</h5>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Nộp lúc: {new Date(deliverable.submittedAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase ${getStatusBadgeClass(deliverable.status)}`}>
                                {getStatusText(deliverable.status)}
                              </span>
                            </div>

                            {deliverable.notes && (
                              <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                                <strong className="text-slate-700">Mô tả:</strong> {deliverable.notes}
                              </p>
                            )}

                            {/* Attachments */}
                            {deliverable.files && deliverable.files.length > 0 && (
                              <div className="flex flex-wrap gap-2.5 pt-1">
                                {deliverable.files.map((file) => (
                                  <a 
                                    key={file.fileId}
                                    href={file.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition-colors"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[200px]">{file.fileName || 'Xem liên kết đính kèm'}</span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Review Feedback */}
                            {deliverable.feedback && (
                              <div className="bg-slate-100/60 p-3 rounded-lg border border-slate-200 text-xs">
                                <span className="font-bold text-slate-700 block mb-0.5">Phản hồi từ khách hàng:</span>
                                <span className="text-slate-600 leading-relaxed italic">"{deliverable.feedback}"</span>
                              </div>
                            )}

                            {/* Employer Review Action Form */}
                            {isClient && contract.status === 'ACTIVE' && deliverable.status === 'SUBMITTED' && (
                              <div className="pt-2 border-t border-slate-100 space-y-3 bg-white p-3 rounded-lg border border-slate-100">
                                <span className="text-xs font-bold text-slate-700 block">Đánh giá sản phẩm nộp này:</span>
                                
                                <textarea 
                                  value={reviewFeedback[deliverable.deliverableId] || ''}
                                  onChange={(e) => setReviewFeedback(prev => ({ 
                                    ...prev, 
                                    [deliverable.deliverableId]: e.target.value 
                                  }))}
                                  rows={2}
                                  placeholder="Nhập nhận xét của bạn... (Bắt buộc nếu từ chối)"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />

                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleReview(deliverable.deliverableId, false)}
                                    disabled={submittingReview[deliverable.deliverableId]}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Yêu cầu làm lại</span>
                                  </button>
                                  <button
                                    onClick={() => handleReview(deliverable.deliverableId, true)}
                                    disabled={submittingReview[deliverable.deliverableId]}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Duyệt & Đạt mốc</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
