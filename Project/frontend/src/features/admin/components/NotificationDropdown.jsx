import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle, Briefcase, Check } from 'lucide-react';
import { adminApi } from '../api/adminApi.js';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default function NotificationDropdown({ userId, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!userId || !role) return;
    try {
      const response = await adminApi.getNotifications(role, userId);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000); // Polling every minute
    
    // WebSocket for Real-time Notifications
    if (!userId || !role) return;
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws"),
      reconnectDelay: 5000,
    });
    client.onConnect = () => {
      const handleMessage = (message) => {
        try {
          const newNotif = JSON.parse(message.body);
          fetchNotifications(); // Refresh notifications when a new one arrives
          window.dispatchEvent(new CustomEvent('newNotification', { detail: newNotif }));
        } catch (err) {
          console.error("Error parsing notification message", err);
        }
      };

      // Subscribe to user-specific notifications
      client.subscribe(`/topic/notifications/${role.toUpperCase()}/${userId}`, handleMessage);
      
      // Subscribe to global role notifications
      client.subscribe(`/topic/notifications/${role.toUpperCase()}/0`, handleMessage);
    };
    client.activate();

    return () => {
      clearInterval(intervalId);
      client.deactivate();
    };
  }, [userId, role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return; // already read
    try {
      await adminApi.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminApi.markAllNotificationsAsRead(role, userId);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>;
      case 'WARNING': return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>;
      case 'ERROR': return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100"><AlertCircle className="w-4 h-4 text-rose-600" /></div>;
      case 'TASK_ASSIGNED': return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100"><Briefcase className="w-4 h-4 text-indigo-600" /></div>;
      default: return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50"><Info className="w-4 h-4 text-blue-500" /></div>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ba1a1a] text-[9px] font-bold text-white border border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] sm:w-[420px] bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden flex flex-col max-h-[500px] origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
            <h3 className="font-bold text-slate-800 text-[16px]">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-[14px] font-medium text-slate-500">Chưa có thông báo nào</p>
                <p className="text-[12px] mt-1 text-slate-400">Khi có thông báo mới, chúng sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id, notification.read)}
                    className={`group flex items-start gap-3.5 p-4 cursor-pointer transition-all hover:bg-slate-50 ${!notification.read ? 'bg-blue-50/40' : 'bg-white'}`}
                  >
                    <div className="shrink-0 mt-0.5 transition-transform group-hover:scale-105">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[14px] leading-tight ${!notification.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50 mt-1"></div>
                        )}
                      </div>
                      <p className={`text-[13px] mt-1.5 leading-relaxed line-clamp-2 ${!notification.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
