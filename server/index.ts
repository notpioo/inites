import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  const onlineUsers = new Map<string, string>(); // socketId -> userId

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user-online", (userId: string) => {
      onlineUsers.set(socket.id, userId);
      io.emit("online-users", Array.from(onlineUsers.values()));
      log(`User ${userId} is now online`);
    });

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(conversationId);
      log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(conversationId);
      log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    socket.on("send-message", (data: {
      conversationId: string;
      message: any;
    }) => {
      socket.to(data.conversationId).emit("new-message", data.message);
    });

    socket.on("typing", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      socket.to(data.conversationId).emit("user-typing", data);
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

  const server = await registerRoutes(app, httpServer);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
