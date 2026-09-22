import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import notificationApi from '../api/notificationApi';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (res.success && res.data) {
          const formatted = res.data.map((n) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt),
            read: n.read,
          }));
          setNotifications(formatted);
          setUnreadCount(formatted.filter((n) => !n.read).length);
        }
      } catch (err) {
        console.error('[NOTIF FETCH ERROR]', err);
      }
    };

    fetchNotifications();

    // Connect to Socket.IO server
    const socketBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketBase, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('[SOCKET CONNECTED] Socket ID:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[SOCKET CONNECT ERROR]', err.message);
    });

    const handleNewNotification = (data) => {
      console.log('[SOCKET NOTIF] New Notification:', data);
      const newNotif = {
        id: data.id,
        type: data.type || 'task',
        title: data.title || 'Notification',
        message: data.message,
        timestamp: new Date(data.timestamp || Date.now()),
        read: data.read || false,
      };
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    newSocket.on('task:assigned', handleNewNotification);
    newSocket.on('report:reviewed', handleNewNotification);
    newSocket.on('task:submitted', handleNewNotification);
    newSocket.on('task:completed', handleNewNotification);
    newSocket.on('task:changes_requested', handleNewNotification);
    newSocket.on('project:assigned', handleNewNotification);
    newSocket.on('report:submitted', handleNewNotification);
    newSocket.on('task:due_soon', handleNewNotification);
    newSocket.on('task:overdue', handleNewNotification);
    newSocket.on('pr:created', handleNewNotification);
    newSocket.on('user:registered', handleNewNotification);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[MARK ALL READ ERROR]', err);
    }
  };

  const clearNotification = async (id) => {
    try {
      await notificationApi.clearNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((notif) => notif.id !== id);
      });
    } catch (err) {
      console.error('[CLEAR NOTIF ERROR]', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
