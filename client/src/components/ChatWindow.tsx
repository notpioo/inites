import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical,
  ArrowLeft,
  Phone,
  Video,
  Info
} from "lucide-react";
import { useSocial } from "@/hooks/useSocial";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ChatWindow() {
  const { 
    currentConversation, 
    messages, 
    setCurrentConversation,
    friends 
  } = useSocial();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation || !currentUser) return;

    try {
      await sendMessage(currentConversation.id, currentUser.uid, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
        
      });
    }
  };

  const getConversationName = () => {
    if (!currentConversation) return "";

    if (currentConversation.type === 'group') {
      return currentConversation.name || "Group Chat";
    }

    // For private chats, find the other participant
    const otherParticipantId = currentConversation.participants.find(
      id => id !== currentUser?.uid
    );
    const friend = friends.find(f => f.firebaseUid === otherParticipantId);
    return friend?.fullName || "Unknown User";
  };

  const getMessageSender = (senderId: string) => {
    if (senderId === currentUser?.uid) return "You";
    const friend = friends.find(f => f.firebaseUid === senderId);
    return friend?.fullName || "Unknown";
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
          <p>Choose a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentConversation(null)}
            className="md:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <Avatar>
            <AvatarFallback>
              {currentConversation.type === 'group' ? 'G' : getConversationName().charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-medium">{getConversationName()}</h3>
            <p className="text-sm text-muted-foreground">
              {currentConversation.type === 'group' 
                ? `${currentConversation.participants.length} members`
                : "Online"
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser?.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwnMessage && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {getMessageSender(message.senderId).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`space-y-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {!isOwnMessage && currentConversation.type === 'group' && (
                      <p className="text-xs text-muted-foreground">
                        {getMessageSender(message.senderId)}
                      </p>
                    )}

                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.edited && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Edited
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {message.createdAt && format(message.createdAt.toDate(), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          Someone is typing...
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}