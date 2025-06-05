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
    if (!currentUser) return;

    const newSocket = io(window.location.origin, {
      auth: {
        userId: currentUser.uid
      }
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      // Authenticate user when connected
      newSocket.emit("authenticate", currentUser.uid);
      console.log("Connected to socket server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from socket server");
    });

    newSocket.on("online-users", (users: string[]) => {
      setOnlineUsers(users);
      console.log("Online users updated:", users);
    });

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
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