import React, { useState, useEffect, useRef } from 'react';
import { messengerApi } from '../api/messengerApi.js';
import { 
  Search, Bell, HelpCircle, MessageSquare, Users, 
  FolderKanban, Settings, LifeBuoy, Plus, MessageCircle,
  MoreVertical, CheckCheck, Check, Send, ArrowLeft, Shield, Clock,
  ChevronRight, RefreshCw, AlertCircle, Paperclip, Image, 
  FileText, X, Download, Trash2
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function Messenger({ user, onNavigateHome }) {
  const [activeTab, setActiveTab] = useState('active'); 
  const [tickets, setTickets] = useState([]);
  const [deletedTickets, setDeletedTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  
  const [directChats, setDirectChats] = useState([]);
  const [activeDirectChat, setActiveDirectChat] = useState(null);
  const directChatSubscriptionRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ message: '', title: '', confirmText: 'Xác nhận', cancelText: 'Hủy', type: 'danger', onConfirm: null });

  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const ticketSubscriptionRef = useRef(null);
  const activeTicketIdRef = useRef(null);
  const activeDirectChatIdRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [navSection, setNavSection] = useState('chat'); // 'chat' | 'freelancer' | 'employer'
  const [systemUsers, setSystemUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  useEffect(() => {
    const ticketId = activeTicket?.ticket_id || activeTicket?.ticketId;
    activeTicketIdRef.current = ticketId;
    if (isConnected && ticketId) {
      subscribeToTicket(ticketId);
    }
  }, [activeTicket, isConnected]);

  useEffect(() => {
    const chatId = activeDirectChat?.chatId;
    activeDirectChatIdRef.current = chatId;
    if (isConnected && chatId) {
      subscribeToDirectChat(chatId);
    }
  }, [activeDirectChat, isConnected]);
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
        client.subscribe('/topic/admin', (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log('Received on /topic/admin', receivedMessage);
          setTickets(prevTickets => {
            const ticketIndex = prevTickets.findIndex(t => t.ticket_id === receivedMessage.ticketId);
            
            if (ticketIndex !== -1) {
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
                has_admin_replied: updatedTickets[ticketIndex].has_admin_replied || isAdminRealReply
              };
              return updatedTickets.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            } else {
              fetchTickets();
              return prevTickets;
            }
          });
          if (activeTicketIdRef.current === receivedMessage.ticketId) {
            setMessages(prev => {
              if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
              return [...prev, receivedMessage];
            });
          }
        });
      } else {
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

        // Subscribe to direct message channel
        client.subscribe(`/topic/user.${user?.id}.direct`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log('Received on user direct channel', receivedMessage);
          
          if (activeDirectChatIdRef.current === receivedMessage.chatId) {
            setMessages(prev => {
              if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
              return [...prev, receivedMessage];
            });
          } else {
            fetchDirectChats(); // Refresh list to show unread count
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
    if (user?.role === 'ADMIN') {
      fetchTickets();
    } else {
      getOrCreateUserTicket();
      fetchDirectChats();
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const fetchTickets = async () => {
    try {
      const data = await messengerApi.getTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch open support tickets', err);
    }
  };

  const fetchDeletedTickets = async () => {
    try {
      const data = await messengerApi.getDeletedTickets();
      setDeletedTickets(data);
    } catch (err) {
      console.error('Failed to fetch deleted support tickets', err);
    }
  };

  const fetchDirectChats = async () => {
    if (!user || user.role === 'ADMIN') return;
    try {
      const data = await messengerApi.getUserDirectChats(user.id, user.role);
      setDirectChats(data);
    } catch (err) {
      console.error('Failed to fetch direct chats', err);
    }
  };

  const getOrCreateUserTicket = async () => {
    setIsLoading(true);
    try {
      const ticketData = await messengerApi.getOrCreateTicket(user.id, user.role);
      const ticketId = ticketData.ticketId;
      
      const activeT = {
        ticket_id: ticketId,
        subject: 'Hỗ trợ kỹ thuật',
        sender_name: 'Hỗ trợ kỹ thuật',
        sender_role: 'ADMIN',
        status: 'OPEN',
        blocked_until: ticketData.blockedUntil
      };
      setActiveTicket(activeT);
      activeTicketIdRef.current = ticketId;
      activeDirectChatIdRef.current = null;
      
      await fetchMessages(ticketId);
      subscribeToTicket(ticketId);

      // Emit read receipt immediately on load
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: `/app/chat.read`,
          body: JSON.stringify({ ticketId: ticketId, readerRole: user?.role?.toUpperCase() })
        });
      }
    } catch (err) {
      console.error('Failed to get/create ticket', err);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchMessages = async (ticketId) => {
    try {
      const data = await messengerApi.getMessages(ticketId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const subscribeToTicket = (ticketId) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;
    if (ticketSubscriptionRef.current) {
      ticketSubscriptionRef.current.unsubscribe();
    }

    ticketSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/ticket.${ticketId}`, (message) => {
      const receivedMessage = JSON.parse(message.body);
      
      if (receivedMessage.readerRole) {
        setMessages(prev => prev.map(msg => 
          (msg.senderRole?.toUpperCase() !== receivedMessage.readerRole?.toUpperCase()) ? { ...msg, isRead: true, read: true } : msg
        ));
        return;
      }

      if (receivedMessage.senderRole === "SYSTEM") {
        if (receivedMessage.messageText && receivedMessage.messageText.startsWith("BLOCK_UPDATE:")) {
          const days = parseInt(receivedMessage.messageText.split(":")[1]);
          const blockedUntil = days === -1 ? '9999-12-31T23:59:59' : days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString();
          
          setSystemUsers(prev => prev.map(u => 
            u.id === receivedMessage.senderId ? { ...u, blockedUntil } : u
          ));
          
          setTickets(prev => prev.map(t => 
            t.ticket_id === ticketId || t.ticketId === ticketId
              ? { ...t, blocked_until: blockedUntil } 
              : t
          ));
          setActiveTicket(prev => {
            if (prev && (prev.ticket_id === ticketId || prev.ticketId === ticketId)) {
              return { ...prev, blocked_until: blockedUntil };
            }
            return prev;
          });
        }
        return; // Do not add SYSTEM messages to the chat view
      }

      // If active ticket, emit read receipt for new incoming message
      const isMyMessage = receivedMessage.senderId === user?.id && receivedMessage.senderRole?.toUpperCase() === user?.role?.toUpperCase();
      if (activeTicketIdRef.current === ticketId && !isMyMessage) {
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.publish({
            destination: `/app/chat.read`,
            body: JSON.stringify({ ticketId: ticketId, readerRole: user?.role?.toUpperCase() })
          });
        }
      }

      setMessages(prev => {
        if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
        return [...prev, receivedMessage];
      });
    });
  };

  const handleSelectTicket = async (ticket) => {
    setIsLoading(true);
    setActiveTicket(ticket);
    setActiveDirectChat(null);
    const ticketId = ticket.ticket_id || ticket.ticketId;
    activeTicketIdRef.current = ticketId;
    activeDirectChatIdRef.current = null;
    await fetchMessages(ticketId);
    subscribeToTicket(ticketId);
    
    // Mark as read immediately when opening
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/chat.read`,
        body: JSON.stringify({ ticketId: ticketId, readerRole: user?.role?.toUpperCase() })
      });
    }

    setIsLoading(false);
  };

  const fetchDirectMessages = async (chatId) => {
    try {
      const data = await messengerApi.getDirectMessages(chatId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load direct chat history', err);
    }
  };

  const subscribeToDirectChat = (chatId) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;
    if (directChatSubscriptionRef.current) {
      directChatSubscriptionRef.current.unsubscribe();
    }

    directChatSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/directChat.${chatId}`, (message) => {
      const receivedMessage = JSON.parse(message.body);
      
      if (receivedMessage.readerRole) {
        setMessages(prev => prev.map(msg => 
          (msg.senderRole?.toUpperCase() !== receivedMessage.readerRole?.toUpperCase()) ? { ...msg, isRead: true, read: true } : msg
        ));
        return;
      }

      // Emit read receipt if active chat
      const isMyMessage = receivedMessage.senderId === user?.id && receivedMessage.senderRole?.toUpperCase() === user?.role?.toUpperCase();
      if (activeDirectChatIdRef.current === chatId && !isMyMessage) {
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.publish({
            destination: `/app/direct.chat.read`,
            body: JSON.stringify({ ticketId: chatId, readerRole: user?.role?.toUpperCase() })
          });
        }
      }

      setMessages(prev => {
        if (prev.some(msg => msg.messageId === receivedMessage.messageId)) return prev;
        return [...prev, receivedMessage];
      });
    });
  };

  const handleSelectDirectChat = async (chat) => {
    setIsLoading(true);
    setActiveDirectChat(chat);
    setActiveTicket(null);
    setNavSection('direct_chats');
    activeDirectChatIdRef.current = chat.chatId;
    activeTicketIdRef.current = null;
    await fetchDirectMessages(chat.chatId);
    
    // Mark as read immediately when opening
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/direct.chat.read`,
        body: JSON.stringify({ ticketId: chat.chatId, readerRole: user?.role?.toUpperCase() })
      });
    }
    
    subscribeToDirectChat(chat.chatId);
    // Refresh chats to reset unread count
    fetchDirectChats();
    setIsLoading(false);
  };

  const handleStartDirectChat = async (partnerId, partnerRole) => {
    if (!user || user.role === 'ADMIN') return;
    setIsLoading(true);
    try {
      const data = await messengerApi.getOrCreateDirectChat(
        user.role === 'FREELANCER' ? user.id : partnerId,
        user.role === 'EMPLOYER' ? user.id : partnerId
      );
      
      const chatObj = {
        chatId: data.chatId,
        partnerId: partnerId,
        partnerRole: partnerRole.toUpperCase(),
        partnerName: selectedProfile?.name || 'User',
        partnerAvatar: selectedProfile?.avatarUrl,
        unreadCount: 0
      };
      
      await handleSelectDirectChat(chatObj);
      await fetchDirectChats(); // Refresh list to include new chat
    } catch (err) {
      console.error('Failed to get/create direct chat', err);
      alert('Không thể tạo phiên chat ngay lúc này.');
    } finally {
      setIsLoading(false);
    }
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
        const data = await messengerApi.uploadFile(formData);
        if (data.success) {
          newAttachments.push({
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize
          });
        } else {
          alert(`Tải file thất bại: ${data.message || 'Lỗi không xác định'}`);
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

  const handleBlockUser = async (days) => {
    if (!activeTicket) return;
    
    let confirmMsg = '';
    let titleMsg = '';
    let confirmBtn = '';
    let typeBtn = 'warning';
    
    if (days === 0) {
      titleMsg = 'Xác nhận gỡ chặn';
      confirmMsg = 'Bạn có chắc chắn muốn gỡ chặn tài khoản này?';
      confirmBtn = 'Gỡ chặn';
      typeBtn = 'success';
    } else if (days === -1) {
      titleMsg = 'Xác nhận chặn vĩnh viễn';
      confirmMsg = 'Bạn có chắc chắn muốn chặn tài khoản này vĩnh viễn?';
      confirmBtn = 'Chặn vĩnh viễn';
      typeBtn = 'danger';
    } else {
      titleMsg = `Xác nhận chặn ${days} ngày`;
      confirmMsg = `Bạn có chắc chắn muốn chặn tài khoản này trong ${days} ngày?`;
      confirmBtn = 'Chặn tài khoản';
      typeBtn = 'warning';
    }
    
    setConfirmConfig({
      title: titleMsg,
      message: confirmMsg,
      confirmText: confirmBtn,
      cancelText: 'Hủy',
      type: typeBtn,
      onConfirm: async () => {
        try {
          await messengerApi.blockUser(activeTicket.ticket_id, days);
          setTickets(prev => prev.map(t => 
            t.ticket_id === activeTicket.ticket_id 
              ? { ...t, blocked_until: days === -1 ? '9999-12-31T23:59:59' : days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString() } 
              : t
          ));
          setActiveTicket(prev => ({ ...prev, blocked_until: days === -1 ? '9999-12-31T23:59:59' : days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString() }));
          setShowConfirmModal(false);
        } catch (err) {
          console.error('Failed to block user', err);
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteTicket = async () => {
    if (!activeTicket) return;
    setConfirmConfig({
      title: 'Xóa cuộc trò chuyện',
      message: 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Người dùng sẽ không biết cuộc trò chuyện đã bị xóa.',
      confirmText: 'Xóa hội thoại',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        try {
          await messengerApi.deleteTicket(activeTicket.ticket_id);
          setTickets(prev => prev.filter(t => t.ticket_id !== activeTicket.ticket_id));
          setActiveTicket(null);
          setShowUserInfo(false);
          fetchDeletedTickets();
          setShowConfirmModal(false);
        } catch (err) {
          console.error('Failed to delete ticket', err);
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleRestoreTicket = async () => {
    if (!activeTicket) return;
    setConfirmConfig({
      title: 'Khôi phục cuộc trò chuyện',
      message: 'Bạn có chắc chắn muốn khôi phục cuộc trò chuyện này?',
      confirmText: 'Khôi phục',
      cancelText: 'Hủy',
      type: 'success',
      onConfirm: async () => {
        try {
          await messengerApi.restoreTicket(activeTicket.ticket_id);
          setDeletedTickets(prev => prev.filter(t => t.ticket_id !== activeTicket.ticket_id));
          setActiveTicket(null);
          setShowUserInfo(false);
          fetchTickets();
          setShowConfirmModal(false);
        } catch (err) {
          console.error('Failed to restore ticket', err);
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };


  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;
    
    const ticketId = activeTicket?.ticket_id || activeTicket?.ticketId;
    if (!ticketId) return;

    if (activeTicket?.blocked_until && new Date(activeTicket.blocked_until) > new Date()) {
      alert(user?.role === 'ADMIN' ? 'Tài khoản này đang bị chặn, bạn không thể gửi tin nhắn.' : 'Bạn đã bị chặn gửi tin nhắn trong cuộc hội thoại này.');
      return;
    }

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
      const data = await messengerApi.getUsers();
      setSystemUsers(data);
    } catch (err) {
      console.error('Failed to fetch system users', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleNavSectionChange = (section) => {
    setNavSection(section);
    setUserSearchQuery('');
    
    if (section === 'chat') {
      if (user?.role !== 'ADMIN') {
        setActiveDirectChat(null);
        getOrCreateUserTicket();
      }
    } else if (section === 'direct_chats') {
      setActiveTicket(null);
      setActiveDirectChat(null);
    } else if (section === 'freelancer' || section === 'employer') {
      fetchSystemUsers();
    }
  };

  const handleViewProfile = async (userProfile) => {
    setSelectedProfile(userProfile);
    setProfileDetails(null);
    setNavSection('user_profile');
    setIsProfileLoading(true);
    
    try {
      let data;
      if (userProfile.role === 'EMPLOYER') {
        data = await messengerApi.getEmployerProfile(userProfile.id);
        setProfileDetails(data.data || data); // handle standard response
      } else if (userProfile.role === 'FREELANCER') {
        data = await messengerApi.getFreelancerProfile(userProfile.id);
        setProfileDetails(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch profile details', err);
      // Fallback details if API fails or doesn't exist
      setProfileDetails({
        ...userProfile,
        bio: 'Chưa có thông tin giới thiệu.',
        skills: [],
        rating: 0
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleStartChatWithUser = async (clickedUser, role) => {
    setIsLoading(true);
    try {
      const data = await messengerApi.getOrCreateTicket(clickedUser.id, role);
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

  const matchesSearch = (ticket) =>
    (ticket.sender_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.sender_email || '').toLowerCase().includes(searchQuery.toLowerCase());

  const pendingTickets = tickets.filter(t => !t.has_admin_replied && t.user_message_count > 0 && matchesSearch(t));
  const activeTickets = tickets.filter(t => t.has_admin_replied && matchesSearch(t));

  const filteredTickets = activeTab === 'pending'
    ? pendingTickets
    : activeTab === 'active'
    ? activeTickets
    : [...activeTickets, ...pendingTickets]; 

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 font-sans overflow-hidden">
      <div className="w-[260px] border-r border-slate-200 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {}
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
          <nav className="px-3 mt-6 flex flex-col gap-1.5">
            <button 
              onClick={() => handleNavSectionChange('chat')}
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
            {user?.role !== 'ADMIN' && (
              <button 
                onClick={() => handleNavSectionChange('direct_chats')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold transition-all border ${
                  navSection === 'direct_chats'
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Tin nhắn riêng</span>
              </button>
            )}
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
                onClick={() => handleNavSectionChange(user?.role === 'FREELANCER' ? 'employer' : 'freelancer')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all border ${
                  (navSection === 'employer' || navSection === 'freelancer')
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-semibold'
                    : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
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

        <div className="flex-1 flex overflow-hidden">
          
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
              ) : navSection === 'direct_chats' ? (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Tin nhắn riêng</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {user?.role === 'ADMIN' 
                      ? 'Tin nhắn riêng tư (Không có quyền truy cập)'
                      : 'Trò chuyện trực tiếp với đối tác'
                    }
                  </p>
                </>
              ) : navSection === 'freelancer' ? (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Tìm kiếm Freelancer</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Chọn freelancer để xem hồ sơ
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Tìm kiếm Employer</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Chọn employer để xem hồ sơ
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
                      <button 
                        onClick={() => { setActiveTab('deleted'); fetchDeletedTickets(); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${
                          activeTab === 'deleted'
                            ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Đã xoá
                        {deletedTickets.length > 0 && (
                          <span className={`w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center ${
                            activeTab === 'deleted' ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'
                          }`}>{deletedTickets.length}</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {user?.role === 'ADMIN' && navSection === 'chat' && (
                <>
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
                  {activeTab === 'pending' && pendingTickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Không có ticket nào đang chờ xử lý</p>
                    </div>
                  )}
                  {activeTab === 'deleted' && deletedTickets.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                        <p className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">Đã xoá ({deletedTickets.length})</p>
                      </div>
                      {deletedTickets.map(ticket => {
                        const date = new Date(ticket.deleted_at_admin);
                        const formattedTime = date.toLocaleDateString('vi-VN');
                        const isSelected = activeTicket?.ticket_id === ticket.ticket_id;
                        return (
                          <div 
                            key={ticket.ticket_id} 
                            onClick={() => handleSelectTicket(ticket)}
                            className={`flex gap-3.5 p-4 cursor-pointer transition-all border-l-4 border-b border-slate-100 ${
                              isSelected 
                                ? 'bg-rose-50/80 border-l-rose-500' 
                                : 'border-l-transparent hover:bg-rose-50/40'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={ticket.sender_avatar || `https://ui-avatars.com/api/?name=${ticket.sender_name || 'Client'}&background=ffe4e6&color=e11d48`} 
                                  alt={ticket.sender_name} 
                                className="w-11 h-11 rounded-xl object-cover border border-rose-200/80 shadow-sm opacity-70 grayscale"
                              />
                            </div>
                            <div className="flex-1 min-w-0 opacity-80">
                              <div className="flex justify-between items-center mb-0.5">
                                <h4 className="font-extrabold text-slate-800 truncate pr-2 text-sm line-through decoration-slate-400">{ticket.sender_name}</h4>
                                <span className="text-[10px] font-bold text-rose-600 whitespace-nowrap">{formattedTime}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                  ticket.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>{ticket.sender_role}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-rose-50 text-rose-600 border-rose-200">Đã xoá</span>
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
                  {activeTab === 'deleted' && deletedTickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Không có cuộc trò chuyện nào trong thùng rác</p>
                    </div>
                  )}
                  {activeTab === 'all' && tickets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Chưa có yêu cầu hỗ trợ nào</p>
                    </div>
                  )}
                </>
              )}

              {navSection === 'direct_chats' && (
                <div className="flex flex-col">
                  {directChats.length > 0 ? (
                    <div>
                      {directChats.map(chat => {
                        const isSelected = activeDirectChat?.chatId === chat.chatId;
                        const date = new Date(chat.updatedAt);
                        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div 
                            key={chat.chatId} 
                            onClick={() => handleSelectDirectChat(chat)}
                            className={`flex gap-3.5 p-4 cursor-pointer transition-all border-l-4 border-b border-slate-100 ${
                              isSelected 
                                ? 'bg-blue-50/50 border-l-blue-600' 
                                : 'border-l-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={chat.partnerAvatar || `https://ui-avatars.com/api/?name=${chat.partnerName || 'User'}&background=eff6ff&color=3b82f6`} 
                                alt={chat.partnerName} 
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <h4 className={`font-extrabold truncate pr-2 text-sm ${chat.unreadCount > 0 ? 'text-blue-900' : 'text-slate-900'}`}>{chat.partnerName}</h4>
                                <span className={`text-[10px] font-bold whitespace-nowrap ${chat.unreadCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{formattedTime}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                  chat.partnerRole === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>{chat.partnerRole}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className={`text-xs truncate font-medium ${chat.unreadCount > 0 ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                                  {chat.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                                </p>
                                {chat.unreadCount > 0 && (
                                  <span className="w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center bg-blue-500 text-white shrink-0">
                                    {chat.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">Chưa có tin nhắn riêng nào</p>
                    </div>
                  )}
                </div>
              )}

              {navSection === 'freelancer' && (
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
                          onClick={() => handleViewProfile(u)}
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

              {navSection === 'employer' && (
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
                          onClick={() => handleViewProfile(u)}
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

              {navSection === 'user_profile' && selectedProfile && (
                <div className="flex flex-col h-full bg-white">
                  <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
                    <button 
                      onClick={() => setNavSection(selectedProfile.role === 'FREELANCER' ? 'freelancer' : 'employer')}
                      className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-slate-800">Hồ sơ chi tiết</h3>
                  </div>

                  {isProfileLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 flex-1">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-sm font-semibold">Đang tải hồ sơ...</p>
                    </div>
                  ) : profileDetails && (
                    <div className="flex flex-col flex-1 overflow-y-auto p-6 items-center">
                      <div className="relative mb-4 group">
                        <img 
                          src={profileDetails.avatarUrl || `https://ui-avatars.com/api/?name=${profileDetails.name || selectedProfile.name}&background=${selectedProfile.role === 'EMPLOYER' ? 'fdf2f8' : 'eff6ff'}&color=${selectedProfile.role === 'EMPLOYER' ? 'db2777' : '3b82f6'}&size=128`}
                          alt={profileDetails.name || selectedProfile.name}
                          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg shrink-0 transition-transform group-hover:scale-105"
                        />
                        <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${profileDetails.status === 'OFFLINE' ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                      </div>
                      
                      <h2 className="text-xl font-extrabold text-slate-900 mb-1">{profileDetails.name || selectedProfile.name}</h2>
                      <p className="text-sm text-slate-500 mb-2 font-medium">{profileDetails.email || selectedProfile.email}</p>
                      
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase tracking-widest mb-6 ${
                        selectedProfile.role === 'EMPLOYER' 
                          ? 'bg-pink-50 text-pink-600 border-pink-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {selectedProfile.role}
                      </span>

                      <div className="w-full bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          Giới thiệu
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {profileDetails.bio || profileDetails.description || 'Chưa có thông tin giới thiệu chi tiết về người dùng này.'}
                        </p>
                      </div>

                      <button 
                        onClick={() => {
                          if (user?.role === 'ADMIN') {
                            handleStartChatWithUser(selectedProfile, selectedProfile.role);
                          } else {
                            handleStartDirectChat(selectedProfile.id, selectedProfile.role);
                          }
                        }}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Chat ngay
                      </button>
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>
          <div className={`flex-1 flex h-full overflow-hidden ${
            (!activeTicket && !activeDirectChat) && 'hidden md:flex'
          }`}>
            <div className="flex-1 flex flex-col bg-slate-50/50 h-full overflow-hidden relative">
            {navSection === 'chat' && activeTicket ? (
              <>
                <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all"
                    onClick={() => {
                      if (user?.role === 'ADMIN') {
                        setShowUserInfo(!showUserInfo);
                      }
                    }}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTicket(null); }}
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
                            {msg.messageText && msg.messageText.trim() !== '' && !(msg.attachments && msg.attachments.length > 0 && (msg.messageText === '[Hình ảnh]' || msg.messageText === '[Tệp đính kèm]')) && (
                              <div className={`p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium transition-all duration-300 ${
                                isMe 
                                  ? 'bg-blue-600 text-white rounded-br-none border border-blue-500 shadow-blue-500/10' 
                                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                              } ${activeTab === 'deleted' ? 'blur-md opacity-50 select-none pointer-events-none' : ''}`}>
                                {activeTab === 'deleted' ? 'Tin nhắn đã bị xóa' : msg.messageText}
                              </div>
                            )}
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
                                          className={`max-h-60 object-cover w-full group-hover:scale-[1.03] transition-all duration-300 rounded-2xl ${activeTab === 'deleted' ? 'blur-md opacity-50' : ''}`}
                                        />
                                        <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center ${activeTab === 'deleted' ? 'bg-black/10 pointer-events-none' : 'bg-black/0 group-hover:bg-black/10'}`}>
                                          <span className={`text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full transition-all duration-300 ${activeTab === 'deleted' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {activeTab === 'deleted' ? 'Nội dung đã bị xóa' : 'Xem ảnh gốc'}
                                          </span>
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
                                        } ${activeTab === 'deleted' ? 'blur-md opacity-50 select-none pointer-events-none' : ''}`}
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
                              {isMe && (
                                (msg.isRead || msg.read) 
                                  ? <span className="ml-1 text-[9px] text-blue-500 font-bold">Đã xem</span>
                                  : <span className="ml-1 text-[9px] text-slate-400 font-bold">Đã gửi</span>
                              )}
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
                {activeTicket?.blocked_until && new Date(activeTicket.blocked_until) > new Date() ? (
                  <div className="flex items-center justify-center p-4 bg-slate-100 border-t border-slate-200 h-[76px]">
                    <AlertCircle className="w-5 h-5 text-rose-500 mr-2 shrink-0" />
                    <span className="text-sm font-semibold text-slate-600">
                      {user?.role === 'ADMIN' ? 'Tài khoản này đang bị chặn gửi tin nhắn' : 'Bạn đã bị chặn gửi tin nhắn tạm thời'}
                    </span>
                  </div>
                ) : (
                  <form 
                    onSubmit={handleSendMessage}
                    className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3 shrink-0"
                  >
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
                )}
              </>
            ) : navSection === 'direct_chats' && activeDirectChat ? (
              <>
                <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveDirectChat(null); setNavSection('direct_chats'); }}
                      className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img 
                      src={activeDirectChat.partnerAvatar || `https://ui-avatars.com/api/?name=${activeDirectChat.partnerName || 'User'}&background=eff6ff&color=3b82f6`} 
                      alt="Partner" 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {activeDirectChat.partnerName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {activeDirectChat.partnerRole === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Freelancer'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageCircle className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="text-sm font-semibold">Chưa có tin nhắn nào</p>
                      <p className="text-xs mt-1">Bắt đầu cuộc trò chuyện với {activeDirectChat.partnerName}</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMine = msg.senderId === user?.id && msg.senderRole === user?.role?.toUpperCase();
                      return (
                        <div key={index} className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                          <div className={`p-3.5 rounded-2xl ${
                            isMine 
                              ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/20' 
                              : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.messageText}</p>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1.5 px-1">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMine && (
                              (msg.isRead || msg.read) 
                                ? <span className="ml-1 text-[9px] text-blue-500 font-bold">Đã xem</span>
                                : <span className="ml-1 text-[9px] text-slate-400 font-bold">Đã gửi</span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputText.trim() === '') return;
                    
                    const messageDto = {
                      chatId: activeDirectChat.chatId,
                      senderId: user.id,
                      senderRole: user.role,
                      messageText: inputText
                    };
                    
                    if (stompClientRef.current && stompClientRef.current.connected) {
                      stompClientRef.current.publish({
                        destination: `/app/direct.chat.send`,
                        body: JSON.stringify(messageDto)
                      });
                      setInputText('');
                    } else {
                      alert('Mất kết nối server, vui lòng thử lại sau.');
                    }
                  }}
                  className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0"
                >
                  <input 
                    type="text" 
                    placeholder="Nhập tin nhắn..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4.5 py-3 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-blue-100 bg-slate-50 focus:bg-white"
                  />
                  <button 
                    type="submit"
                    disabled={inputText.trim() === ''}
                    className={`p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center transition-all ${
                      inputText.trim() === '' ? 'opacity-50 cursor-not-allowed bg-slate-300 shadow-none' : ''
                    }`}
                  >
                    <Send className="w-5 h-5 shrink-0" />
                  </button>
                </form>
              </>
            ) : (
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
            
            {showUserInfo && activeTicket && user?.role === 'ADMIN' && (
              <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shrink-0 overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex flex-col items-center">
                  <div className="relative mb-4">
                    <img 
                      src={activeTicket.sender_avatar || `https://ui-avatars.com/api/?name=${activeTicket.sender_name || 'Client'}&background=eff6ff&color=3b82f6`} 
                      alt="User avatar" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-1">{activeTicket.sender_name}</h3>
                  <p className="text-sm text-slate-500 font-semibold mb-3">{activeTicket.sender_email}</p>
                  <span className={`text-[10px] font-extrabold px-2 py-1 rounded border uppercase tracking-wider ${
                    activeTicket.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>{activeTicket.sender_role}</span>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* Status Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin tài khoản</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">Trạng thái</span>
                        {(() => {
                          const status = activeTicket.sender_status;
                          if (status === 'LOCKED' || status === 'locked') return <span className="text-xs font-bold text-amber-600">Bị khóa</span>;
                          if (status === 'BANNED' || status === 'banned') return <span className="text-xs font-bold text-rose-600">Bị chặn</span>;
                          return <span className="text-xs font-bold text-emerald-600">Hoạt động</span>;
                        })()}
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">Ngày tham gia</span>
                        <span className="text-xs font-bold text-slate-800">
                          {new Date(activeTicket.sender_created_at || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quản lý phiên bản</h4>
                    
                    {/* Blocking features */}
                    <div className="flex flex-col gap-2 mb-4">
                      {activeTicket.blocked_until && new Date(activeTicket.blocked_until) > new Date() ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-amber-800 mb-2">
                            Đang bị chặn tin nhắn đến: <br/> 
                            {new Date(activeTicket.blocked_until).toLocaleString('vi-VN')}
                          </p>
                          <button 
                            onClick={() => handleBlockUser(0)} // Pass 0 days to unblock
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Gỡ chặn ngay
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Chặn liên hệ</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleBlockUser(1)} className="py-2 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">1 ngày</button>
                            <button onClick={() => handleBlockUser(3)} className="py-2 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">3 ngày</button>
                            <button onClick={() => handleBlockUser(7)} className="py-2 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">7 ngày</button>
                            <button onClick={() => handleBlockUser(-1)} className="py-2 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-all">Vĩnh viễn</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete / Restore features */}
                    {activeTab === 'deleted' ? (
                      <button 
                        onClick={handleRestoreTicket}
                        className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Khôi phục hội thoại
                      </button>
                    ) : (
                      <button 
                        onClick={handleDeleteTicket}
                        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa hội thoại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* CONFIRM MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in text-center">
              <div className={`mx-auto w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
                confirmConfig.type === 'danger' ? 'bg-rose-100 text-rose-600' : 
                confirmConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmConfig.title}</h3>
              <p className="text-sm text-slate-600 mb-6">{confirmConfig.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  {confirmConfig.cancelText || 'Hủy'}
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-md transition-all ${
                    confirmConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 
                    confirmConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  }`}
                >
                  {confirmConfig.confirmText || 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}