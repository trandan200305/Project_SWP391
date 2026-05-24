import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, HelpCircle, MessageSquare, Users, 
  FolderKanban, Settings, LifeBuoy, Plus, MessageCircle,
  MoreVertical, CheckCheck, Send, ArrowLeft, Shield, Clock,
  ChevronRight, RefreshCw, AlertCircle, Paperclip, Image, 
  FileText, X, Download
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function Messenger({ user, onNavigateHome }) {
  const [activeTab, setActiveTab] = useState('active'); // Admin defaults to 'active' tab
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const ticketSubscriptionRef = useRef(null);
  const activeTicketIdRef = useRef(null);

  // States & Refs for file attachments
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // States & Refs for system users filtering
  const [navSection, setNavSection] = useState('chat'); // 'chat' | 'freelancer' | 'employer'
  const [systemUsers, setSystemUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Keep ref updated to access latest active ticket in subscription callbacks
  useEffect(() => {
    activeTicketIdRef.current = activeTicket?.ticket_id || activeTicket?.ticketId;
  }, [activeTicket]);

  // Connect to WebSocket and initialize subscriptions
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/api/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log(str);
      }
    });

    client.onConnect = (frame) => {
      console.log('STOMP connected', frame);
      setIsConnected(true);

      if (user?.role === 'ADMIN') {
        // Admins listen to global topic for ticket and message updates
        client.subscribe('/topic/admin', (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log('Received on /topic/admin', receivedMessage);

          // Update tickets list dynamically in real-time
          setTickets(prevTickets => {
            const ticketIndex = prevTickets.findIndex(t => t.ticket_id === receivedMessage.ticketId);
            
            if (ticketIndex !== -1) {
              // Update existing ticket with latest message
              const updatedTickets = [...prevTickets];
              const isAdminRealReply =
                receivedMessage.senderRole === 'ADMIN' &&
                receivedMessage.messageText &&
                !receivedMessage.messageText.startsWith('\uD83D\uDC4B Xin ch\u00e0o');
              updatedTickets[ticketIndex] = {
                ...updatedTickets[ticketIndex],
                last_message: receivedMessage.messageText,
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // If admin just replied for the first time, mark as replied
                has_admin_replied: updatedTickets[ticketIndex].has_admin_replied || isAdminRealReply
              };
              // Sort tickets: latest updated on top
              return updatedTickets.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            } else {
              // Refetch ticket list to include new ticket details
              fetchTickets();
              return prevTickets;
            }
          });

          // Append message if it belongs to the currently active ticket
          if (activeTicketIdRef.current === receivedMessage.ticketId) {
            setMessages(prev => {
              if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
              return [...prev, receivedMessage];
            });
          }
        });
      } else {
        // Standard users listen to their private channel for replies
        client.subscribe(`/topic/user.${user?.id}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log('Received on user private channel', receivedMessage);

          if (activeTicketIdRef.current === receivedMessage.ticketId) {
            setMessages(prev => {
              if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
              return [...prev, receivedMessage];
            });
          }
        });
      }
    };

    client.onDisconnect = () => {
      console.log('STOMP disconnected');
      setIsConnected(false);
    };

    client.activate();
    stompClientRef.current = client;

    // Fetch initial ticket data depending on user role
    if (user?.role === 'ADMIN') {
      fetchTickets();
    } else {
      getOrCreateUserTicket();
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all open tickets for admin
  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/chat/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch open support tickets', err);
    }
  };

  // Get or create active support ticket for normal Freelancer / Employer
  const getOrCreateUserTicket = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/chat/tickets/get-or-create?userId=${user.id}&role=${user.role}`);
      if (response.ok) {
        const ticketData = await response.json();
        const ticketId = ticketData.ticketId;
        
        const activeT = {
          ticket_id: ticketId,
          subject: 'Hỗ trợ kỹ thuật',
          sender_name: 'Hỗ trợ kỹ thuật',
          sender_role: 'ADMIN',
          status: 'OPEN'
        };
        setActiveTicket(activeT);
        
        // Fetch chat messages and subscribe to the ticket channel
        await fetchMessages(ticketId);
        subscribeToTicket(ticketId);
      }
    } catch (err) {
      console.error('Failed to get/create ticket', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chat history for a selected ticket
  const fetchMessages = async (ticketId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/chat/messages/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  // Subscribe to a ticket room
  const subscribeToTicket = (ticketId) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;

    // Unsubscribe from previous ticket topic if any exists
    if (ticketSubscriptionRef.current) {
      ticketSubscriptionRef.current.unsubscribe();
    }

    // Subscribe to current ticket topic
    ticketSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/ticket.${ticketId}`, (message) => {
      const receivedMessage = JSON.parse(message.body);
      setMessages(prev => {
        // Prevent duplicate messages
        if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
        return [...prev, receivedMessage];
      });
    });
  };

  // Admin selects a customer ticket to chat
  const handleSelectTicket = async (ticket) => {
    setIsLoading(true);
    setActiveTicket(ticket);
    const ticketId = ticket.ticket_id || ticket.ticketId;
    await fetchMessages(ticketId);
    subscribeToTicket(ticketId);
    setIsLoading(false);
  };

  const handleFileChange = async (e, isImageOnly = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newAttachments = [...attachedFiles];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8080/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            newAttachments.push({
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileSize: data.fileSize
            });
          } else {
            alert(`Tải file thất bại: ${data.message || 'Lỗi không xác định'}`);
          }
        } else {
          alert('Tải file thất bại. Vui lòng thử lại.');
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        alert('Lỗi kết nối khi tải file.');
      }
    }

    setAttachedFiles(newAttachments);
    setUploading(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle sending chat message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;

    const ticketId = activeTicket?.ticket_id || activeTicket?.ticketId;
    if (!ticketId) return;

    if (!stompClientRef.current || !stompClientRef.current.connected) {
      alert('Kết nối chat bị gián đoạn. Đang thử kết nối lại...');
      return;
    }

    let msgText = inputText.trim();
    if (!msgText && attachedFiles.length > 0) {
      const allImages = attachedFiles.every(att => /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileUrl));
      msgText = allImages ? '[Hình ảnh]' : '[Tệp đính kèm]';
    }

    const payload = {
      ticketId: ticketId,
      senderId: user.id,
      senderRole: user.role,
      senderName: user.name,
      senderAvatar: user.avatar || '',
      messageText: msgText,
      attachments: attachedFiles
    };

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });

    setInputText('');
    setAttachedFiles([]);
  };

  const fetchSystemUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setSystemUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch system users', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleNavSectionChange = (section) => {
    setNavSection(section);
    setUserSearchQuery('');
    if (section === 'freelancer' || section === 'employer') {
      fetchSystemUsers();
    }
  };

  const handleStartChatWithUser = async (clickedUser, role) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/chat/tickets/get-or-create?userId=${clickedUser.id}&role=${role}`);
      if (response.ok) {
        const data = await response.json();
        const ticketId = data.ticketId;

        const activeT = {
          ticket_id: ticketId,
          subject: 'Hỗ trợ kỹ thuật',
          sender_name: clickedUser.name,
          sender_avatar: clickedUser.avatarUrl || `https://ui-avatars.com/api/?name=${clickedUser.name || 'User'}&background=3b82f6&color=fff`,
          sender_role: role.toUpperCase(),
          sender_id: clickedUser.id,
          status: 'OPEN'
        };
        
        setActiveTicket(activeT);
        await fetchMessages(ticketId);
        subscribeToTicket(ticketId);
        await fetchTickets();
        setNavSection('chat');
      }
    } catch (err) {
      console.error('Failed to start chat with user', err);
      alert('Không thể tạo phòng chat với người dùng này.');
    } finally {
      setIsLoading(false);
    }
  };

  const systemUsersList = systemUsers || [];
  const filteredSystemUsers = systemUsersList.filter(u => {
    const roleMatch = navSection === 'freelancer' ? u.role === 'FREELANCER' : u.role === 'EMPLOYER';
    if (!roleMatch) return false;
    
    const query = userSearchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query);
  });

  // Split tickets into two groups based on whether admin has replied
  const matchesSearch = (ticket) =>
    (ticket.sender_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.sender_email || '').toLowerCase().includes(searchQuery.toLowerCase());

  // Chờ phản hồi: admin chưa reply thực tế VÀ user đã gửi ít nhất 1 tin nhắn
  const pendingTickets = tickets.filter(t => !t.has_admin_replied && t.user_message_count > 0 && matchesSearch(t));
  // Đang xử lý: admin đã reply ít nhất 1 lần
  const activeTickets = tickets.filter(t => t.has_admin_replied && matchesSearch(t));

  // For tab filtering
  const filteredTickets = activeTab === 'pending'
    ? pendingTickets
    : activeTab === 'active'
    ? activeTickets
    : [...activeTickets, ...pendingTickets]; // 'all' shows active first then pending

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 font-sans overflow-hidden">
      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="w-[260px] border-r border-slate-200 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo */}
          <div 
            className="p-6 flex items-center gap-3 cursor-pointer border-b border-slate-800/80"
            onClick={onNavigateHome}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/30 shrink-0">
              L
            </div>
            <div className="overflow-hidden">
              <h1 className="font-extrabold text-lg leading-tight tracking-tight text-white truncate">LancerPro</h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Support Portal</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 mt-6 flex flex-col gap-1.5">
            <button 
              onClick={() => setNavSection('chat')}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-semibold transition-all border ${
                navSection === 'chat'
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Hỗ Trợ Trực Tuyến</span>
              </span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
            </button>
            {user?.role === 'ADMIN' ? (
              <>
                <button 
                  onClick={() => handleNavSectionChange('freelancer')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all border ${
                    navSection === 'freelancer'
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-semibold'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <span>Tìm Freelancer</span>
                </button>
                <button 
                  onClick={() => handleNavSectionChange('employer')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all border ${
                    navSection === 'employer'
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-semibold'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <span>Tìm Employer</span>
                </button>
              </>
            ) : (
              <button 
                onClick={onNavigateHome}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800/50 rounded-xl font-medium hover:text-white transition-all text-slate-400"
              >
                <Users className="w-5 h-5 shrink-0" />
                <span>{user?.role === 'FREELANCER' ? 'Tìm Employer' : 'Tìm Freelancer'}</span>
              </button>
            )}
            <button 
              onClick={onNavigateHome}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800/50 rounded-xl font-medium hover:text-white transition-all text-slate-400"
            >
              <FolderKanban className="w-5 h-5 shrink-0" />
              <span>Dự Án Đăng Tuyển</span>
            </button>
          </nav>
        </div>

        {/* Support Link */}
        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800/50 hover:text-white text-slate-400 font-medium rounded-xl transition-all"
          >
            <LifeBuoy className="w-5 h-5 shrink-0" />
            <span>Trang Chủ LancerPro</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              onClick={onNavigateHome}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                {user?.role === 'ADMIN' ? 'Admin Support Console' : 'Kênh Hỗ Trợ Kỹ Thuật'}
              </h2>
            </div>
            
            {/* Connection status badge */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <button 
                onClick={fetchTickets}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">{user?.role}</p>
              </div>
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=3b82f6&color=fff`} 
                alt="Avatar" 
                className="w-9 h-9 rounded-xl border border-slate-200 shadow-sm object-cover shrink-0"
              />
            </div>
          </div>
        </header>

        {/* WORK AREA: SIDEBAR + CONVERSATION */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* CONVERSATIONS LIST COLUMN */}
          <div className={`w-full md:w-[360px] border-r border-slate-200 flex flex-col bg-white shrink-0 ${
            activeTicket && 'hidden md:flex'
          }`}>
            <div className="p-5 border-b border-slate-100">
              {navSection === 'chat' ? (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Hộp thư hỗ trợ</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {user?.role === 'ADMIN' 
                      ? 'Quản lý các yêu cầu kỹ thuật trực tiếp'
                      : 'Trò chuyện bảo mật trực tiếp với Kỹ thuật viên'
                    }
                  </p>
                </>
              ) : navSection === 'freelancer' ? (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Tìm kiếm Freelancer</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Chọn freelancer để bắt đầu cuộc trò chuyện mới
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Tìm kiếm Employer</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Chọn employer để bắt đầu cuộc trò chuyện mới
                  </p>
                </>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  <div className="relative mt-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Tìm theo tên hoặc email..." 
                      value={navSection === 'chat' ? searchQuery : userSearchQuery}
                      onChange={(e) => navSection === 'chat' ? setSearchQuery(e.target.value) : setUserSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium w-full transition-all outline-none"
                    />
                  </div>

                  {navSection === 'chat' && (
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => setActiveTab('active')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${
                          activeTab === 'active'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Đang xử lý
                        {activeTickets.length > 0 && (
                          <span className={`w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center ${
                            activeTab === 'active' ? 'bg-white/25' : 'bg-blue-500 text-white'
                          }`}>{activeTickets.length}</span>
                        )}
                      </button>
                      <button 
                        onClick={() => setActiveTab('pending')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${
                          activeTab === 'pending'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Chờ phản hồi
                        {pendingTickets.length > 0 && (
                          <span className={`w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center ${
                            activeTab === 'pending' ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'
                          }`}>{pendingTickets.length}</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Support list content */}
            <div className="flex-1 overflow-y-auto">
              {user?.role === 'ADMIN' && navSection === 'chat' && (
                <>
                  {/* ACTIVE TICKETS (admin đã reply) - Hiển thị trên giao diện chính */}
                  {activeTab === 'active' && (
                    <>
                      {activeTickets.length > 0 ? (
                        <div>
                          {activeTickets.map(ticket => {
                            const isSelected = activeTicket?.ticket_id === ticket.ticket_id;
                            const date = ticket.last_message_at ? new Date(ticket.last_message_at) : new Date(ticket.updated_at);
                            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div 
                                key={ticket.ticket_id} 
                                onClick={() => handleSelectTicket(ticket)}
                                className={`flex gap-3.5 p-4 cursor-pointer transition-all border-l-4 border-b border-slate-100 ${
                                  isSelected 
                                    ? 'bg-blue-50/50 border-l-blue-600' 
                                    : 'border-l-transparent hover:bg-slate-50'
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <img 
                                    src={ticket.sender_avatar || `https://ui-avatars.com/api/?name=${ticket.sender_name || 'Client'}&background=eff6ff&color=3b82f6`} 
                                    alt={ticket.sender_name} 
                                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm"
                                  />
                                  {(() => {
                                    const status = ticket.sender_status;
                                    const isLocked = status === 'LOCKED' || status === 'locked';
                                    const isBanned = status === 'BANNED' || status === 'banned';
                                    
                                    const lastLoginStr = ticket.sender_last_login;
                                    const lastLoginTime = lastLoginStr ? new Date(lastLoginStr).getTime() : 0;
                                    const isOnline = lastLoginTime > 0 && (Date.now() - lastLoginTime < (5 * 60 * 1000));

                                    if (isLocked) {
                                      return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>;
                                    } else if (isBanned) {
                                      return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></div>;
                                    } else if (isOnline) {
                                      return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>;
                                    } else {
                                      return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white"></div>;
                                    }
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <h4 className="font-extrabold text-slate-900 truncate pr-2 text-sm">{ticket.sender_name}</h4>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{formattedTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                      ticket.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>{ticket.sender_role}</span>
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100">Đang xử lý</span>
                                  </div>
                                  <p className={`text-xs truncate font-medium ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {ticket.last_message || 'Chưa có tin nhắn'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : activeTab === 'active' ? (
                        <div className="p-8 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-semibold">Chưa có ticket nào đang xử lý</p>
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* PENDING TICKETS (admin chưa reply) - Danh sách chờ */}
                  {(activeTab === 'pending' || activeTab === 'all') && pendingTickets.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Đang chờ phản hồi ({pendingTickets.length})</p>
                      </div>
                      {pendingTickets.map(ticket => {
                        const date = ticket.last_message_at ? new Date(ticket.last_message_at) : new Date(ticket.updated_at);
                        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isSelected = activeTicket?.ticket_id === ticket.ticket_id;
                        return (
                          <div 
                            key={ticket.ticket_id} 
                            onClick={() => handleSelectTicket(ticket)}
                            className={`flex gap-3.5 p-4 cursor-pointer transition-all border-l-4 border-b border-slate-100 ${
                              isSelected 
                                ? 'bg-amber-50/80 border-l-amber-500' 
                                : 'border-l-transparent hover:bg-amber-50/40'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={ticket.sender_avatar || `https://ui-avatars.com/api/?name=${ticket.sender_name || 'Client'}&background=fff7ed&color=d97706`} 
                                  alt={ticket.sender_name} 
                                className="w-11 h-11 rounded-xl object-cover border border-amber-200/80 shadow-sm"
                              />
                              {(() => {
                                const status = ticket.sender_status;
                                const isLocked = status === 'LOCKED' || status === 'locked';
                                const isBanned = status === 'BANNED' || status === 'banned';
                                
                                const lastLoginStr = ticket.sender_last_login;
                                const lastLoginTime = lastLoginStr ? new Date(lastLoginStr).getTime() : 0;
                                const isOnline = lastLoginTime > 0 && (Date.now() - lastLoginTime < (5 * 60 * 1000));

                                if (isLocked) {
                                  return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>;
                                } else if (isBanned) {
                                  return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></div>;
                                } else if (isOnline) {
                                  return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>;
                                } else {
                                  return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white"></div>;
                                }
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <h4 className="font-extrabold text-slate-800 truncate pr-2 text-sm">{ticket.sender_name}</h4>
                                <span className="text-[10px] font-bold text-amber-600 whitespace-nowrap">{formattedTime}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                  ticket.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>{ticket.sender_role}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-amber-50 text-amber-600 border-amber-200">Chờ xử lý</span>
                              </div>
                              <p className="text-xs truncate font-medium text-slate-500">
                                {ticket.last_message || 'Chưa có tin nhắn'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Empty state for pending tab with no results */}
                  {activeTab === 'pending' && pendingTickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Không có ticket nào đang chờ xử lý</p>
                    </div>
                  )}

                  {/* Empty state for all tab */}
                  {activeTab === 'all' && tickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Chưa có yêu cầu hỗ trợ nào</p>
                    </div>
                  )}
                </>
              )}

              {user?.role === 'ADMIN' && navSection === 'freelancer' && (
                <div className="flex flex-col">
                  {isUsersLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                      <p className="text-xs font-semibold">Đang tải danh sách...</p>
                    </div>
                  ) : filteredSystemUsers.length > 0 ? (
                    <div>
                      {filteredSystemUsers.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => handleStartChatWithUser(u, 'FREELANCER')}
                          className="flex gap-3.5 p-4 cursor-pointer hover:bg-slate-50 transition-all border-b border-slate-100"
                        >
                          <img 
                            src={`https://ui-avatars.com/api/?name=${u.name}&background=eff6ff&color=3b82f6`}
                            alt={u.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 truncate text-sm">{u.name}</h4>
                            <p className="text-xs text-slate-400 truncate font-semibold mb-1">{u.email}</p>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-blue-50 text-blue-600 border-blue-100">FREELANCER</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Không tìm thấy freelancer nào</p>
                    </div>
                  )}
                </div>
              )}

              {user?.role === 'ADMIN' && navSection === 'employer' && (
                <div className="flex flex-col">
                  {isUsersLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                      <p className="text-xs font-semibold">Đang tải danh sách...</p>
                    </div>
                  ) : filteredSystemUsers.length > 0 ? (
                    <div>
                      {filteredSystemUsers.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => handleStartChatWithUser(u, 'EMPLOYER')}
                          className="flex gap-3.5 p-4 cursor-pointer hover:bg-slate-50 transition-all border-b border-slate-100"
                        >
                          <img 
                            src={`https://ui-avatars.com/api/?name=${u.name}&background=fdf2f8&color=db2777`}
                            alt={u.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-900 truncate text-sm">{u.name}</h4>
                            <p className="text-xs text-slate-400 truncate font-semibold mb-1">{u.email}</p>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-pink-50 text-pink-600 border-pink-100">EMPLOYER</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Không tìm thấy employer nào</p>
                    </div>
                  )}
                </div>
              )}

              {user?.role !== 'ADMIN' && (
                /* Regular User view: Persistent support item */
                <div 
                  onClick={() => {}}
                  className="flex gap-3.5 p-4.5 bg-blue-50/30 border-l-4 border-blue-600 cursor-default"
                >
                  <div className="relative shrink-0">
                    <img 
                      src="https://ui-avatars.com/api/?name=Technical+Support&background=eff6ff&color=3b82f6" 
                      alt="Technical Support" 
                      className="w-12 h-12 rounded-xl object-cover border border-blue-200/80 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-extrabold text-slate-900 text-sm">Hỗ Trợ Kỹ Thuật LancerPro</h4>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Online
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        CHUYÊN VIÊN
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-medium">
                      Thời gian phản hồi thông thường: 1 - 2 phút
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CHAT DISPLAY PANEL */}
          <div className={`flex-1 bg-slate-50/50 flex flex-col h-full overflow-hidden ${
            !activeTicket && 'hidden md:flex'
          }`}>
            {activeTicket ? (
              <>
                {/* CHAT PANEL HEADER */}
                <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveTicket(null)}
                      className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative shrink-0">
                      <img 
                        src={user?.role === 'ADMIN' 
                          ? (activeTicket.sender_avatar || `https://ui-avatars.com/api/?name=${activeTicket.sender_name || 'Client'}&background=3b82f6&color=fff`)
                          : 'https://ui-avatars.com/api/?name=Technical+Support&background=eff6ff&color=3b82f6'
                        } 
                        alt="Active chat" 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      {(() => {
                        if (user?.role !== 'ADMIN') {
                          return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>;
                        }
                        const status = activeTicket.sender_status;
                        const isLocked = status === 'LOCKED' || status === 'locked';
                        const isBanned = status === 'BANNED' || status === 'banned';
                        
                        const lastLoginStr = activeTicket.sender_last_login;
                        const lastLoginTime = lastLoginStr ? new Date(lastLoginStr).getTime() : 0;
                        const isOnline = lastLoginTime > 0 && (Date.now() - lastLoginTime < (5 * 60 * 1000));

                        if (isLocked) {
                          return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>;
                        } else if (isBanned) {
                          return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></div>;
                        } else if (isOnline) {
                          return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>;
                        } else {
                          return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white"></div>;
                        }
                      })()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {user?.role === 'ADMIN' ? activeTicket.sender_name : 'Kỹ thuật viên LancerPro'}
                      </h3>
                      {user?.role !== 'ADMIN' ? (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          Sẵn sàng giải đáp thắc mắc của bạn
                        </p>
                      ) : (() => {
                        const status = activeTicket.sender_status;
                        const isLocked = status === 'LOCKED' || status === 'locked';
                        const isBanned = status === 'BANNED' || status === 'banned';
                        
                        const lastLoginStr = activeTicket.sender_last_login;
                        const lastLoginTime = lastLoginStr ? new Date(lastLoginStr).getTime() : 0;
                        const isOnline = lastLoginTime > 0 && (Date.now() - lastLoginTime < (5 * 60 * 1000));

                        return (
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            {activeTicket.sender_role === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Freelancer'}
                            {isLocked ? ' • Tài khoản bị khóa' : isBanned ? ' • Tài khoản bị chặn' : isOnline ? ' • Đang trực tuyến' : ' • Ngoại tuyến'}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.role === 'ADMIN' && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border tracking-wider">
                        TICKET #{activeTicket.ticket_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* MESSAGES LOG VIEWER */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <p className="text-xs font-semibold">Đang tải lịch sử tin nhắn...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isMe = msg.senderRole === user.role && msg.senderId === user.id;
                      const date = msg.sentAt ? new Date(msg.sentAt) : new Date();
                      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div 
                          key={msg.messageId || index} 
                          className={`flex items-end gap-2.5 max-w-[80%] ${
                            isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          {!isMe && (
                            <img 
                              src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${msg.senderName || 'Staff'}&background=3b82f6&color=fff`} 
                              alt={msg.senderName} 
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                            />
                          )}
                          <div>
                            {!isMe && (
                              <p className="text-[10px] font-extrabold text-slate-400 mb-0.5 ml-1 flex items-center gap-1">
                                {msg.senderName}
                                <span className="bg-slate-200/80 text-[8px] font-extrabold text-slate-500 px-1 py-0.2 rounded uppercase">
                                  {msg.senderRole}
                                </span>
                              </p>
                            )}
                            {/* Message text bubble */}
                            {msg.messageText && msg.messageText.trim() !== '' && !(msg.attachments && msg.attachments.length > 0 && (msg.messageText === '[Hình ảnh]' || msg.messageText === '[Tệp đính kèm]')) && (
                              <div className={`p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium ${
                                isMe 
                                  ? 'bg-blue-600 text-white rounded-br-none border border-blue-500 shadow-blue-500/10' 
                                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                              }`}>
                                {msg.messageText}
                              </div>
                            )}

                            {/* Message attachments rendering */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className={`mt-2 flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`}>
                                {msg.attachments.map((att, attIdx) => {
                                  const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileUrl);
                                  if (isImg) {
                                    return (
                                      <a 
                                        key={attIdx} 
                                        href={att.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group relative block overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 max-w-xs md:max-w-md border border-slate-200 bg-slate-100"
                                      >
                                        <img 
                                          src={att.fileUrl} 
                                          alt={att.fileName || "Image"} 
                                          className="max-h-60 object-cover w-full group-hover:scale-[1.03] transition-all duration-300 rounded-2xl"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full transition-all duration-300">Xem ảnh gốc</span>
                                        </div>
                                      </a>
                                    );
                                  } else {
                                    return (
                                      <a 
                                        key={attIdx} 
                                        href={att.fileUrl} 
                                        download={att.fileName}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-3 p-3 rounded-2xl border text-sm max-w-xs sm:max-w-sm transition-all shadow-sm ${
                                          isMe 
                                            ? 'bg-blue-700/35 border-blue-500/50 text-white hover:bg-blue-700/50' 
                                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                          isMe ? 'bg-blue-500/25 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-semibold truncate text-xs">{att.fileName}</p>
                                          <p className={`text-[10px] ${isMe ? 'text-blue-200/80' : 'text-slate-400'} font-medium`}>
                                            {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : 'Tệp tin'}
                                          </p>
                                        </div>
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                          isMe ? 'hover:bg-blue-600/30 text-white' : 'hover:bg-slate-100 text-slate-500'
                                        }`}>
                                          <Download className="w-4 h-4" />
                                        </div>
                                      </a>
                                    );
                                  }
                                })}
                              </div>
                            )}
                            <p className={`text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1 ${
                              isMe ? 'justify-end mr-1' : 'ml-1'
                            }`}>
                              <Clock className="w-2.5 h-2.5" />
                              {formattedTime}
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500 ml-0.5" />}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center max-w-md mx-auto py-12">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm mb-1">Bắt đầu cuộc trò chuyện</h4>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        {user?.role === 'ADMIN'
                          ? 'Gửi tin nhắn chào mừng để hỗ trợ khách hàng của bạn ngay bây giờ.'
                          : 'Nhập tin nhắn bên dưới và chuyên viên hỗ trợ của chúng tôi sẽ phản hồi trong giây lát.'
                        }
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ATTACHMENT PREVIEW BAR */}
                {(attachedFiles.length > 0 || uploading) && (
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 items-center shrink-0">
                    {attachedFiles.map((file, idx) => {
                      const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileUrl);
                      return (
                        <div key={idx} className="relative flex items-center gap-2 bg-white pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 shadow-sm max-w-xs group">
                          {isImg ? (
                            <img src={file.fileUrl} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{file.fileName}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Tệp tin'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-slate-400 hover:text-rose-500 transition-colors ml-1 shrink-0"
                            title="Xóa tệp đính kèm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {uploading && (
                      <div className="flex items-center gap-2 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
                        <span>Đang tải tệp lên...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTTOM CHAT INPUT BOX */}
                <form 
                  onSubmit={handleSendMessage}
                  className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3 shrink-0"
                >
                  {/* Hidden file inputs */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, false)}
                    className="hidden"
                    multiple
                  />
                  <input 
                    type="file" 
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    className="hidden"
                    multiple
                  />

                  <button 
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                    title="Đính kèm hình ảnh"
                  >
                    <Image className="w-5 h-5 shrink-0" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                    title="Đính kèm tệp tin"
                  >
                    <Paperclip className="w-5 h-5 shrink-0" />
                  </button>

                  <input 
                    type="text" 
                    placeholder={user?.role === 'ADMIN' ? 'Trả lời yêu cầu kỹ thuật của khách hàng...' : 'Nhập tin nhắn gửi kỹ thuật hỗ trợ...'}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4.5 py-3 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-blue-100 bg-slate-50 focus:bg-white"
                  />
                  
                  {(() => {
                    const canSend = (inputText.trim() !== '' || attachedFiles.length > 0) && !uploading;
                    return (
                      <button 
                        type="submit"
                        disabled={!canSend}
                        className={`p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center transition-all ${
                          !canSend ? 'opacity-50 cursor-not-allowed bg-slate-300 shadow-none' : ''
                        }`}
                      >
                        <Send className="w-5 h-5 shrink-0" />
                      </button>
                    );
                  })()}
                </form>
              </>
            ) : (
              /* EMPTY VIEW (FOR ADMINS WITH NO ACTIVE TICKET CHOSEN) */
              <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-1">Admin Support Hub</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">
                  Chọn một trong các cuộc hội thoại ở danh sách bên trái để phản hồi và giải quyết yêu cầu kỹ thuật của khách hàng trực tuyến.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
