import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser && !socket) {
      console.log('Connecting socket for user:', currentUser.uid);

      // Use current domain for socket connection
      const socketUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin;

      const newSocket = io(socketUrl, {
        auth: {
          userId: currentUser.uid
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        maxReconnectionAttempts: 10,
        randomizationFactor: 0.5,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setSocket(newSocket);
        setIsConnected(true);
        // Authenticate after connection
        newSocket.emit('authenticate', currentUser.uid);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setSocket(null);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('online-users', (users: string[]) => {
        console.log('Online users:', users);
        setOnlineUsers(users);
      });

      newSocket.on('user-connected', (userId: string) => {
        console.log('User connected:', userId);
        setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      });

      newSocket.on('user-disconnected', (userId: string) => {
        console.log('User disconnected:', userId);
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.removeAllListeners();
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      };
    }

    // Cleanup when user changes or component unmounts
    return () => {
      if (socket) {
        console.log('Cleaning up existing socket');
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    };
  }, [currentUser]);

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}