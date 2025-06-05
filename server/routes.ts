import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";

export async function registerRoutes(app: Express, httpServer?: any) {
  const server = httpServer || createServer(app);

  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join user to their personal room
    socket.on("join_user", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on("send_message", (data) => {
      // Broadcast to conversation room
      socket.to(`conversation_${data.conversationId}`).emit("new_message", data);
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      socket.to(`conversation_${data.conversationId}`).emit("user_typing", {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on("stop_typing", (data) => {
      socket.to(`conversation_${data.conversationId}`).emit("user_stop_typing", {
        userId: data.userId
      });
    });

    // Handle friend request notifications
    socket.on("friend_request", (data) => {
      socket.to(`user_${data.toUserId}`).emit("new_friend_request", data);
    });

    // Handle online status
    socket.on("user_online", (userId) => {
      socket.broadcast.emit("user_status_change", { userId, isOnline: true });
    });

    socket.on("user_offline", (userId) => {
      socket.broadcast.emit("user_status_change", { userId, isOnline: false });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return server;
}