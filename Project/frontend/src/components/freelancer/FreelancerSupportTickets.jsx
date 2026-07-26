import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Paperclip,
  Send,
  Loader2,
  X,
  FileText,
  MessageSquare,
  RefreshCw,
  HelpCircle,
  DollarSign,
  Laptop,
  Briefcase
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper.js';

export default function FreelancerSupportTickets({ user, defaultOpenModal = false }) {
  const freelancerId = user?.id || user?.freelancerId || user?.userId || user?.profileId;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OPEN, RESOLVED
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(defaultOpenModal);
  const [category, setCategory] = useState('SYSTEM'); // SYSTEM, CONTRACT, OTHER
  const [priority, setPriority] = useState('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);

  // Detail / Chat Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch Tickets
  const fetchTickets = async () => {
    if (!freelancerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/chat/tickets/freelancer/${freelancerId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || 'Không thể tải danh sách ticket hỗ trợ.');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.content || []);
      setTickets(list);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [freelancerId]);

  // Fetch chat messages when selecting a ticket
  const fetchChatMessages = async (ticketId) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`http://localhost:8080/api/chat/messages/${ticketId}`);
      if (!res.ok) throw new Error('Không thể tải lịch sử trao đổi.');
      const data = await res.json();
      setChatMessages(data || []);
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId ? { ...t, unread_count: 0 } : t))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      fetchChatMessages(selectedTicket.ticket_id);
    }
  }, [selectedTicket?.ticket_id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Upload Attachment Helper
  const handleFileUpload = async (e, setTargetAttachments) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];

    setUploading(true);
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          alert(`Định dạng tệp .${ext} không được hỗ trợ. Vui lòng chọn ảnh (PNG, JPG, WEBP) hoặc tài liệu (PDF, DOC).`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          alert(`Dung lượng tệp "${file.name}" quá lớn (tối đa 10MB).`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('http://localhost:8080/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setTargetAttachments((prev) => {
            if (prev.length >= 5) {
              alert('Bạn chỉ có thể đính kèm tối đa 5 tệp tin.');
              return prev;
            }
            return [
              ...prev,
              {
                fileUrl: data.fileUrl,
                fileName: file.name,
                fileSize: file.size,
              },
            ];
          });
        } else {
          alert('Tải file thất bại: ' + (data.message || 'Lỗi không xác định'));
        }
      }
    } catch (err) {
      alert('Lỗi tải file: ' + err.message);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Create Ticket Submit
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject) {
      alert('Vui lòng nhập tiêu đề sự cố.');
      return;
    }

    if (cleanSubject.length < 5) {
      alert('Tiêu đề sự cố phải có ít nhất 5 ký tự.');
      return;
    }

    if (cleanSubject.length > 255) {
      alert('Tiêu đề sự cố vượt quá 255 ký tự cho phép.');
      return;
    }

    if (!cleanDescription) {
      alert('Vui lòng nhập mô tả chi tiết sự cố.');
      return;
    }

    if (cleanDescription.length < 10) {
      alert('Mô tả chi tiết sự cố phải có ít nhất 10 ký tự.');
      return;
    }

    if (cleanDescription.length > 4000) {
      alert('Mô tả chi tiết sự cố vượt quá 4000 ký tự cho phép.');
      return;
    }

    setSubmitting(true);
    const categoryPrefixMap = {
      SYSTEM: '[Lỗi kỹ thuật / Hệ thống]',
      CONTRACT: '[Hợp đồng & Công việc]',
      OTHER: '[Khác]'
    };

    const fullSubject = `${categoryPrefixMap[category] || ''} ${cleanSubject}`;

    try {
      const res = await fetch('http://localhost:8080/api/chat/tickets/freelancer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancerId,
          subject: fullSubject,
          description: cleanDescription,
          priority,
          attachments,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || 'Tạo ticket thất bại.');
      }

      alert(data.message || 'Tạo ticket hỗ trợ thành công!');
      setShowCreateModal(false);
      setSubject('');
      setDescription('');
      setAttachments([]);
      setCategory('SYSTEM');
      setPriority('MEDIUM');
      fetchTickets();
    } catch (err) {
      alert('Lỗi khi gửi ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Send Reply Submit
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && replyAttachments.length === 0) return;
    if (!selectedTicket) return;

    setSendingReply(true);
    try {
      const payload = {
        ticketId: selectedTicket.ticket_id,
        senderId: freelancerId,
        senderRole: 'FREELANCER',
        senderName: user?.displayName || user?.fullName || 'Freelancer',
        senderAvatar: user?.avatarUrl || '',
        messageText: replyText.trim() || '(Đã gửi tệp đính kèm)',
        attachments: replyAttachments,
      };

      const res = await fetch('http://localhost:8080/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gửi phản hồi thất bại.');

      setReplyText('');
      setReplyAttachments([]);
      fetchChatMessages(selectedTicket.ticket_id);
      fetchTickets();
    } catch (err) {
      alert('Lỗi phản hồi: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  // Close / Resolve Ticket by Freelancer
  const handleMarkResolved = async (ticketId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xác nhận sự cố này đã được giải quyết xong?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/chat/tickets/${ticketId}/status-employer?status=RESOLVED`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Cập nhật trạng thái thất bại.');

      if (selectedTicket) {
        setSelectedTicket((prev) => ({ ...prev, status: 'RESOLVED' }));
      }
      fetchTickets();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Filtering
  const filteredTickets = tickets.filter((t) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'OPEN'
        ? t.status === 'OPEN' || t.status === 'IN_PROGRESS'
        : t.status === 'RESOLVED' || t.status === 'CLOSED';

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      String(t.ticket_id).includes(query) ||
      (t.subject && t.subject.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Đã gửi - Chờ Staff
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            Staff đang xử lý
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Đã giải quyết
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            Đã đóng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">🔥 Khẩn cấp</span>;
      case 'HIGH':
        return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">⚠️ Cao</span>;
      case 'LOW':
        return <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Bình thường</span>;
      default:
        return <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Trung bình</span>;
    }
  };

  return (
    <div className="pt-28 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-900 rounded-2xl p-6 text-white shadow-level-2 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-center">
          <LifeBuoy className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-400/30">
              <LifeBuoy className="w-3.5 h-3.5" />
              Trung tâm Hỗ trợ kỹ thuật & Sự cố Freelancer
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Hỗ trợ & Xử lý Sự cố Freelancer</h2>
            <p className="text-sm text-emerald-100 mt-1 max-w-xl leading-relaxed">
              Gửi ticket yêu cầu khi bạn gặp sự cố rút tiền, lỗi nộp sản phẩm, thắc mắc hợp đồng hoặc sự cố kỹ thuật. Đội ngũ Staff sẽ tiếp nhận và phản hồi trực tiếp dữ liệu tới CSDL.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            Gửi Ticket Hỗ trợ mới
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OPEN')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'OPEN' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang xử lý ({tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RESOLVED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã hoàn thành ({tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã ticket, Tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={fetchTickets}
            title="Làm mới dữ liệu"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket List Section */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
          <p className="text-sm font-semibold">Đang tải danh sách ticket hỗ trợ...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchTickets}
            className="mt-3 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Không tìm thấy ticket hỗ trợ nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'Không có kết quả phù hợp với từ khóa tìm kiếm của bạn.'
              : 'Bạn chưa tạo ticket hỗ trợ nào. Khi cần giải quyết sự cố rút tiền hoặc thắc mắc công việc, hãy tạo ticket hỗ trợ mới.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              Gửi Ticket Hỗ trợ
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.ticket_id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all hover:shadow-level-1 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    #TK-{ticket.ticket_id}
                  </span>
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                  {ticket.unread_count > 0 && (
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-bounce">
                      💬 Có {ticket.unread_count} tin nhắn mới
                    </span>
                  )}
                </div>

                <h4
                  className="text-base font-extrabold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  {ticket.subject}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>

                <div className="flex items-center flex-wrap gap-4 text-xs text-slate-400 font-medium pt-1">
                  <span>Tạo ngày: {new Date(ticket.created_at || Date.now()).toLocaleString('vi-VN')}</span>
                  <span>•</span>
                  <span>
                    Staff phụ trách:{' '}
                    {ticket.staff_name ? (
                      <strong className="text-slate-700 font-bold">{ticket.staff_name}</strong>
                    ) : (
                      <em className="text-amber-600 font-semibold">Chờ Staff nhận duyệt</em>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Xem chi tiết & Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Gửi Ticket Hỗ trợ kỹ thuật & Sự cố Freelancer</h3>
              <p className="text-xs text-slate-500 mt-1">
                Gửi thông tin sự cố để nhân viên Staff giải quyết. Dữ liệu sẽ được lưu trực tiếp vào CSDL hệ thống.
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phân loại sự cố</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('SYSTEM')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      category === 'SYSTEM'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Lỗi kỹ thuật / Hệ thống</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('CONTRACT')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      category === 'CONTRACT'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Hợp đồng & Công việc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('OTHER')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      category === 'OTHER'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Khác</span>
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mức độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="LOW">Bình thường (Xử lý theo hàng đợi)</option>
                  <option value="MEDIUM">Trung bình (Ưu tiên chuẩn)</option>
                  <option value="HIGH">Cao (Cần hỗ trợ gấp)</option>
                  <option value="URGENT">Khẩn cấp (Sự cố nghiêm trọng)</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tiêu đề yêu cầu <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nộp sản phẩm dự án bị lỗi không đẩy được file..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả chi tiết sự cố <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể thời gian gặp lỗi, ảnh minh họa hoặc chi tiết sự cố..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tệp đính kèm (Ảnh/Bằng chứng)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, setAttachments)}
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4 text-slate-500" />}
                    <span>Đính kèm tệp / ảnh</span>
                  </button>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[240px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Gửi Ticket lên CSDL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL / CHAT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    #TK-{selectedTicket.ticket_id}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedTicket.subject}</h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={() => handleMarkResolved(selectedTicket.ticket_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận đã xử lý xong</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicket(null);
                    fetchTickets();
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Stream Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {/* Original Ticket Description Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6 space-y-2">
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  📌 Nội dung sự cố ban đầu
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
                <div className="text-[10px] text-slate-400 font-medium">
                  Gửi vào: {new Date(selectedTicket.created_at || Date.now()).toLocaleString('vi-VN')}
                </div>
              </div>

              {loadingChat ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  <span className="text-xs">Đang tải cuộc trao đổi...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có phản hồi mới. Nhân viên Staff sẽ sớm tiếp nhận ticket này.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isFreelancer = msg.senderRole === 'FREELANCER';
                  return (
                    <div
                      key={msg.messageId || Math.random()}
                      className={`flex gap-3 max-w-[80%] ${isFreelancer ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 text-xs font-bold shadow-xs">
                        {msg.senderAvatar ? (
                          <img src={getImageUrl(msg.senderAvatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          msg.senderName?.charAt(0) || (isFreelancer ? 'F' : 'S')
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-[11px] font-bold ${isFreelancer ? 'justify-end text-emerald-900' : 'text-slate-700'}`}>
                          <span>{msg.senderName || (isFreelancer ? 'Bạn (Freelancer)' : 'Staff Hỗ trợ')}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isFreelancer
                              ? 'bg-slate-900 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.messageText}</p>

                          {/* Attachments inside chat bubble */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-700/30 space-y-1">
                              {msg.attachments.map((att, aIdx) => (
                                <a
                                  key={aIdx}
                                  href={getImageUrl(att.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 text-[11px] hover:underline ${isFreelancer ? 'text-emerald-200' : 'text-emerald-700'}`}
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px]">{att.fileName || 'Tệp đính kèm'}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Reply Form */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
              <form onSubmit={handleSendReply} className="space-y-2">
                {replyAttachments.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pb-2">
                    {replyAttachments.map((att, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg border">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{att.fileName}</span>
                        <button type="button" onClick={() => setReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    onChange={(e) => handleFileUpload(e, setReplyAttachments)}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => replyFileInputRef.current?.click()}
                    title="Đính kèm tệp"
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    placeholder="Nhập phản hồi gửi Staff..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm disabled:opacity-50 transition-all"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Gửi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
