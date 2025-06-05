import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerRoutes } from "./routes";
import { log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const httpServer = createServer(app);
  
  // Register routes first
  const server = await registerRoutes(app, httpServer);
  
  // Initialize Socket.IO after routes
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:5173", "https://*.replit.dev", "https://*.replit.app"],
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6
  });

  // Socket.IO connection handling
  const onlineUsers = new Map<string, string>(); // socketId -> userId

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle user authentication and online status
    socket.on("authenticate", (userId: string) => {
      onlineUsers.set(socket.id, userId);
      socket.join(`user_${userId}`);
      io.emit("online-users", Array.from(onlineUsers.values()));
      log(`User ${userId} is now online`);
    });

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on("send-message", (data: {
      conversationId: string;
      messageId: string;
      senderId: string;
      content: string;
      type?: string;
      createdAt: any;
    }) => {
      console.log("Broadcasting message:", data);
      
      const messagePayload = {
        id: data.messageId,
        messageId: data.messageId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: data.type || 'text',
        createdAt: data.createdAt
      };
      
      // Broadcast to other users in conversation room
      socket.to(`conversation_${data.conversationId}`).emit("new-message", messagePayload);
      
      // Also broadcast to all users in the conversation for backup
      io.to(`conversation_${data.conversationId}`).except(socket.id).emit("new-message", messagePayload);
      
      console.log(`Message ${data.messageId} broadcasted to conversation ${data.conversationId}`);
    });

    socket.on("typing", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      socket.to(`conversation_${data.conversationId}`).emit("user-typing", data);
    });

    socket.on("disconnect", () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        io.emit("online-users", Array.from(onlineUsers.values()));
        log(`User ${userId} is now offline`);
      }
      console.log("User disconnected:", socket.id);
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, httpServer);
  } else {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  // Use PORT from environment or default to 5000
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();