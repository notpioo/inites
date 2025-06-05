
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useSocial } from "@/hooks/useSocial";
import { sendMessage, getMessages } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: any;
  senderInfo?: {
    fullName: string;
    profilePicture?: string;
  };
}

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { currentConversation, setCurrentConversation, friends } = useSocial();
  const { toast } = useToast();

  // Set chat mode when component mounts
  React.useEffect(() => {
    localStorage.setItem('inChatMode', 'true');
    return () => {
      localStorage.removeItem('inChatMode');
    };
  }, []);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation details
  const isGroupChat = currentConversation?.type === 'group';
  const otherParticipant = !isGroupChat ? 
    friends.find(f => f.firebaseUid === currentConversation?.participants.find(p => p !== currentUser?.uid)) : null;

  const conversationName = isGroupChat ? 
    currentConversation?.name || 'Group Chat' : 
    otherParticipant?.fullName || 'Unknown User';

  const isUserOnline = otherParticipant ? onlineUsers.includes(otherParticipant.firebaseUid) : false;

  // Load messages
  useEffect(() => {
    if (!currentConversation) return;

    const unsubscribe = getMessages(currentConversation.id, async (loadedMessages) => {
      // Get sender info for each message
      const messagesWithSenderInfo = await Promise.all(
        loadedMessages.map(async (message) => {
          const sender = friends.find(f => f.firebaseUid === message.senderId);
          return {
            ...message,
            senderInfo: sender ? {
              fullName: sender.fullName,
              profilePicture: sender.profilePicture
            } : {
              fullName: message.senderId === currentUser?.uid ? 'You' : 'Unknown User'
            }
          };
        })
      );
      setMessages(messagesWithSenderInfo);
    });

    return unsubscribe;
  }, [currentConversation, friends, currentUser]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !currentConversation) return;

    // Join conversation room
    socket.emit("join-conversation", currentConversation.id);
    console.log("Joined conversation:", currentConversation.id);

    // Handle new messages from other users only
    const handleNewMessage = (messageData: any) => {
      console.log("Received new message:", messageData);
      // Only add message if it's from another user to avoid duplicates
      if (messageData.senderId !== currentUser?.uid) {
        const sender = friends.find(f => f.firebaseUid === messageData.senderId);
        const messageObj = {
          id: messageData.messageId || messageData.id,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          content: messageData.content,
          type: messageData.type || 'text',
          createdAt: messageData.createdAt,
          senderInfo: {
            fullName: sender?.fullName || messageData.senderName || 'Unknown User',
            profilePicture: sender?.profilePicture
          }
        };
        setMessages(prev => [...prev, messageObj]);
      }
    };

    // Handle typing indicators
    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== currentUser?.uid) {
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev.filter(id => id !== data.userId), data.userId]
            : prev.filter(id => id !== data.userId)
        );
      }
    };

    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);
      socket.emit("leave-conversation", currentConversation.id);
    };
  }, [socket, currentConversation, currentUser, friends]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !currentConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    
    try {
      const messageId = await sendMessage(
        currentConversation.id,
        currentUser.uid,
        messageContent
      );

      // Emit to socket for real-time updates to other users
      if (socket) {
        console.log("Sending message via socket:", {
          conversationId: currentConversation.id,
          messageId,
          senderId: currentUser.uid,
          content: messageContent,
          type: 'text',
          createdAt: new Date()
        });
        
        socket.emit("send-message", {
          conversationId: currentConversation.id,
          messageId,
          senderId: currentUser.uid,
          content: messageContent,
          type: 'text',
          createdAt: new Date()
        });
      }

      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent); // Restore message on error
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleTyping = () => {
    if (!socket || !currentConversation || !currentUser) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        conversationId: currentConversation.id,
        userId: currentUser.uid,
        isTyping: true
      });

      // Stop typing after 3 seconds
      setTimeout(() => {
        setIsTyping(false);
        socket.emit("typing", {
          conversationId: currentConversation.id,
          userId: currentUser.uid,
          isTyping: false
        });
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      {/* Simplified Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem('inChatMode');
            setCurrentConversation(null);
          }}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={isGroupChat ? "" : otherParticipant?.profilePicture} />
            <AvatarFallback>
              {isGroupChat ? 'G' : otherParticipant?.fullName.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isGroupChat && isUserOnline && (
            <Circle className="absolute -bottom-1 -right-1 w-3 h-3 fill-green-500 text-green-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{conversationName}</h3>
          <p className="text-sm text-muted-foreground">
            {!isGroupChat && (isUserOnline ? 'Online' : 'Offline')}
            {typingUsers.length > 0 && (
              <span className="text-blue-500 ml-2">
                {typingUsers.length === 1 ? 'typing...' : `${typingUsers.length} people typing...`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 pb-2">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUser?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.senderInfo?.profilePicture} />
                        <AvatarFallback>
                          {message.senderInfo?.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1">
                          {message.senderInfo?.fullName || 'Unknown User'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
