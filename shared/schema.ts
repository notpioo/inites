import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("member"), // "member" or "admin"
  rank: serial("rank"),
  wins: serial("wins").default(0),
  totalGames: serial("total_games").default(0),
  points: serial("points").default(0),
  profilePicture: text("profile_picture"),
  birthDate: text("birth_date"),
  city: text("city"),
  gender: text("gender"), // "male", "female", "other"
  bio: text("bio"),
  isOnline: boolean("is_online").default(false),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  email: true,
  username: true,
  fullName: true,
  role: true,
  profilePicture: true,
  birthDate: true,
  city: true,
  gender: true,
  bio: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Friend System Types
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'active' | 'blocked';
  createdAt: Date;
}

// Group System Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  type: 'public' | 'private';
  createdBy: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
}

// Chat System Types
export interface Conversation {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  groupId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageBy?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyTo?: string;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: { [userId: string]: Date };
  createdAt: Date;
  updatedAt: Date;
}
