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
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();

  // Set chat mode on mount
  useEffect(() => {
    localStorage.setItem('inChatMode', 'true');

    // Force re-render of BottomNav by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'inChatMode',
      newValue: 'true'
    }));

    return () => {
      // Clean up on unmount
      localStorage.removeItem('inChatMode');

      // Force re-render of BottomNav
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'inChatMode',
        newValue: null
      }));
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

    console.log('Loading messages for conversation:', currentConversation.id);

    const unsubscribe = getMessages(currentConversation.id, async (loadedMessages) => {
      console.log('Loaded messages:', loadedMessages);

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

      console.log('Messages with sender info:', messagesWithSenderInfo);
      setMessages(messagesWithSenderInfo);
    });

    return unsubscribe;
  }, [currentConversation, friends, currentUser]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !currentConversation || !currentUser) return;

    console.log('Setting up socket listeners for conversation:', currentConversation.id);

    // Wait for socket to be connected before joining
    const joinConversation = () => {
      if (socket.connected) {
        socket.emit("join-conversation", currentConversation.id);
        console.log("Joined conversation:", currentConversation.id);
      }
    };

    // Join conversation when connected
    if (socket.connected) {
      joinConversation();
    }

    // Handle new messages from other users only
    const handleNewMessage = (messageData: any) => {
      console.log("Received new message via socket:", messageData);

      // Only add message if it's from another user and for this conversation
      if (messageData.senderId !== currentUser.uid && messageData.conversationId === currentConversation.id) {
        const sender = friends.find(f => f.firebaseUid === messageData.senderId);
        const messageObj = {
          id: messageData.messageId || messageData.id || `socket_${Date.now()}_${Math.random()}`,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          content: messageData.content,
          type: messageData.type || 'text',
          createdAt: messageData.createdAt ? new Date(messageData.createdAt) : new Date(),
          senderInfo: {
            fullName: sender?.fullName || messageData.senderName || 'Unknown User',
            profilePicture: sender?.profilePicture
          }
        };

        console.log('Adding new message to state:', messageObj);
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => 
            (msg.id === messageObj.id) || 
            (msg.senderId === messageObj.senderId && 
             msg.content === messageObj.content && 
             Math.abs(new Date(msg.createdAt).getTime() - new Date(messageObj.createdAt).getTime()) < 1000)
          );
          if (exists) {
            console.log('Message already exists, skipping');
            return prev;
          }
          return [...prev, messageObj];
        });
      }
    };

    // Handle typing indicators
    const handleUserTyping = (data: { userId: string; isTyping: boolean; conversationId: string }) => {
      console.log('User typing event:', data);

      if (data.userId !== currentUser.uid && data.conversationId === currentConversation.id) {
        setTypingUsers(prev => 
          data.isTyping 
            ? [...prev.filter(id => id !== data.userId), data.userId]
            : prev.filter(id => id !== data.userId)
        );
      }
    };

    // Handle connection status
    const handleConnect = () => {
      console.log('Socket connected, rejoining conversation');
      socket.emit("join-conversation", currentConversation.id);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);

      if (socket.connected) {
        socket.emit("leave-conversation", currentConversation.id);
      }
    };
  }, [socket, currentConversation, currentUser?.uid, friends]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !currentConversation) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${currentUser.uid}`;

    // Add message optimistically to UI
    const optimisticMessage = {
      id: tempId,
      conversationId: currentConversation.id,
      senderId: currentUser.uid,
      content: messageContent,
      type: 'text' as const,
      createdAt: new Date(),
      senderInfo: {
        fullName: 'You'
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(""); // Clear input immediately for better UX

    try {
      console.log('Sending message to Firestore...');
      const messageId = await sendMessage(
        currentConversation.id,
        currentUser.uid,
        messageContent
      );

      console.log('Message saved to Firestore with ID:', messageId);

      // Update the optimistic message with real ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, id: messageId }
          : msg
      ));

      // Emit to socket for real-time updates to other users
      if (socket && socket.connected) {
        const socketData = {
          conversationId: currentConversation.id,
          messageId,
          senderId: currentUser.uid,
          content: messageContent,
          type: 'text',
          createdAt: new Date().toISOString()
        };

        console.log("Sending message via socket:", socketData);
        socket.emit("send-message", socketData);
      } else {
        console.warn('Socket not connected, message will not be sent in real-time');

        // Try to reconnect socket if not connected
        if (socket && !socket.connected) {
          socket.connect();
        }
      }

      setIsTyping(false);

      // Stop typing indicator
      if (socket && socket.connected) {
        socket.emit("typing", {
          conversationId: currentConversation.id,
          userId: currentUser.uid,
          isTyping: false
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageContent); // Restore message on error

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
            // Clean up chat mode
            localStorage.removeItem('inChatMode');

            // Show bottom navigation
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
              (bottomNav as HTMLElement).style.display = 'flex';
            }

            // Leave conversation room
            if (socket && socket.connected && currentConversation) {
              socket.emit("leave-conversation", currentConversation.id);
            }

            // Clear conversation
            setCurrentConversation(null);

            // Navigate without refresh
            setLocation('/social');
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
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1">
                          {message.senderInfo?.fullName || 'Unknown User'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-300'}`}>
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