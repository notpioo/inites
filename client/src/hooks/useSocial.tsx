import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { 
  getFriendRequests, 
  getFriends, 
  getUserGroups, 
  getUserConversations,
  getMessages 
} from "@/lib/firestore";

interface Friend {
  id: string;
  firebaseUid: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  isOnline: boolean;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  memberCount: number;
  createdAt: any;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

interface Conversation {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  name?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: any;
  edited?: boolean;
  editedAt?: any;
}

interface SocialContextType {
  friendRequests: FriendRequest[];
  friends: Friend[];
  groups: Group[];
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  loading: {
    friends: boolean;
    groups: boolean;
    conversations: boolean;
    messages: boolean;
  };
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState({
    friends: false,
    groups: false,
    conversations: false,
    messages: false
  });

  useEffect(() => {
    if (!currentUser) return;

    setLoading(prev => ({ ...prev, friends: true }));
    const unsubscribeFriendRequests = getFriendRequests(currentUser.uid, setFriendRequests);
    const unsubscribeFriends = getFriends(currentUser.uid, (friendsData) => {
      setFriends(friendsData);
      setLoading(prev => ({ ...prev, friends: false }));
    });

    setLoading(prev => ({ ...prev, groups: true }));
    const unsubscribeGroups = getUserGroups(currentUser.uid, (groupsData) => {
      setGroups(groupsData);
      setLoading(prev => ({ ...prev, groups: false }));
    });

    setLoading(prev => ({ ...prev, conversations: true }));
    const unsubscribeConversations = getUserConversations(currentUser.uid, (conversationsData) => {
      setConversations(conversationsData);
      setLoading(prev => ({ ...prev, conversations: false }));
    });

    return () => {
      unsubscribeFriendRequests();
      unsubscribeFriends();
      unsubscribeGroups();
      unsubscribeConversations();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }

    setLoading(prev => ({ ...prev, messages: true }));
    const unsubscribeMessages = getMessages(currentConversation.id, (messagesData) => {
      setMessages(messagesData);
      setLoading(prev => ({ ...prev, messages: false }));
    });

    return () => unsubscribeMessages();
  }, [currentConversation]);

  const value: SocialContextType = {
    friendRequests,
    friends,
    groups,
    conversations,
    messages,
    currentConversation,
    setCurrentConversation,
    loading
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}