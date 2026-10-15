import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Clock, Calendar, AlertCircle, FileText, X } from 'lucide-react';
import notificationService from '../services/notificationService';

export default function NotificationBell({ onSelectPaper }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeNotice, setActiveNotice] = useState(null);

  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unreadCount || res.count || 0);
    } catch (err) {
      // Non-intrusive polling failure
      console.warn('[NotificationBell] Failed to fetch unread count:', err.message);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for unread notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load full notification list when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setActiveNotice(null);
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, status: 'READ' } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('[NotificationBell] Mark read error:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, status: 'READ' }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationBell] Mark all read error:', err.message);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    if (notif.questionPaper) {
      const qp = notif.questionPaper;
      const today = new Date().toISOString().split('T')[0];
      const deliveryDate = qp.scheduledDeliveryDate;

      if (deliveryDate && today < deliveryDate) {
        setActiveNotice({
          paperTitle: qp.title,
          deliveryDate,
          message: `Question paper is scheduled for delivery on ${deliveryDate} and is not accessible yet.`,
        });
        return;
      }

      // If deliverable, invoke onSelectPaper callback if provided
      if (onSelectPaper && typeof onSelectPaper === 'function') {
        onSelectPaper(qp);
        setIsOpen(false);
      }
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Delivery Schedule Alert Modal inside Dropdown */}
          {activeNotice && (
            <div className="m-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-amber-300">Delivery Scheduled</div>
                  <div className="mt-0.5 text-amber-200/90 leading-relaxed">{activeNotice.message}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveNotice(null)}
                className="text-amber-400 hover:text-amber-300 p-0.5 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-red-400">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-800/50 ${
                    !notif.isRead ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        )}
                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                          {notif.subject || 'Question Paper Notification'}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Question Paper details if present */}
                      {notif.questionPaper && (
                        <div className="mt-2 p-2 rounded-md bg-slate-800/70 border border-slate-700/50 flex flex-col space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                            <FileText className="w-3 h-3 text-indigo-400" />
                            <span className="font-medium truncate">{notif.questionPaper.title}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>Delivery: {notif.questionPaper.scheduledDeliveryDate}</span>
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                notif.questionPaper.isDeliverable
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {notif.questionPaper.isDeliverable ? 'Available' : 'Scheduled'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 flex items-center space-x-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(notif.createdAt)}</span>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
