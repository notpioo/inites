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
  senderInfo?: {
    id: string;
    firebaseUid: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
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
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  loading: {
    friends: boolean;
    groups: boolean;
    conversations: boolean;
  };
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recover current conversation from sessionStorage on page refresh
  useEffect(() => {
    // Only recover if we're not already in chat mode and no current conversation
    const isInChatMode = localStorage.getItem('inChatMode') === 'true';
    const savedConversation = sessionStorage.getItem('currentConversation');
    
    if (savedConversation && !currentConversation && isInChatMode) {
      try {
        const parsed = JSON.parse(savedConversation);
        setCurrentConversation(parsed);
      } catch (error) {
        console.error('Error parsing saved conversation:', error);
        sessionStorage.removeItem('currentConversation');
      }
    }
  }, [currentConversation]);

  // Save current conversation to sessionStorage
  useEffect(() => {
    if (currentConversation) {
      sessionStorage.setItem('currentConversation', JSON.stringify(currentConversation));
    } else {
      sessionStorage.removeItem('currentConversation');
    }
  }, [currentConversation]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState({
    friends: true,
    groups: true,
    conversations: true
  });

  useEffect(() => {
    if (!currentUser) return;

    // Listen to friend requests
    const unsubscribeFriendRequests = getFriendRequests(currentUser.uid, (requests) => {
      setFriendRequests(requests);
      setLoading(prev => ({ ...prev, friends: false }));
    });

    // Listen to friends
    const unsubscribeFriends = getFriends(currentUser.uid, (friendsList) => {
      setFriends(friendsList);
      setLoading(prev => ({ ...prev, friends: false }));
    });

    // Listen to groups
    const unsubscribeGroups = getUserGroups(currentUser.uid, (groupsList) => {
      setGroups(groupsList);
      setLoading(prev => ({ ...prev, groups: false }));
    });

    // Listen to conversations
    const unsubscribeConversations = getUserConversations(currentUser.uid, (conversationsList) => {
      setConversations(conversationsList);
      setLoading(prev => ({ ...prev, conversations: false }));
    });

    return () => {
      unsubscribeFriendRequests();
      unsubscribeFriends();
      unsubscribeGroups();
      unsubscribeConversations();
    };
  }, [currentUser]);

  // Update current conversation when conversations list changes
  useEffect(() => {
    if (currentConversation) {
      const updatedConversation = conversations.find(conv => conv.id === currentConversation.id);
      if (updatedConversation) {
        setCurrentConversation(updatedConversation);
      }
    }
  }, [conversations, currentConversation]);

  const value: SocialContextType = {
    friendRequests,
    friends,
    groups,
    conversations,
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