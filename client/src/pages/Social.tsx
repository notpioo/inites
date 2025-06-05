
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  MessageCircle, 
  UserPlus, 
  Search, 
  Plus,
  Crown,
  Circle,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useSocial } from "@/hooks/useSocial";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { sendFriendRequest, respondToFriendRequest, searchUsers, createGroup, createConversation } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import ChatWindow from "@/components/ChatWindow";

export default function Social() {
  const { 
    friendRequests, 
    friends, 
    groups, 
    conversations, 
    currentConversation,
    setCurrentConversation,
    loading 
  } = useSocial();
  const { currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isRequestsCollapsed, setIsRequestsCollapsed] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results.filter(user => user.id !== currentUser?.uid));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (toUserId: string) => {
    if (!currentUser) return;
    
    try {
      await sendFriendRequest(currentUser.uid, toUserId);
      toast({
        title: "Success",
        description: "Friend request sent!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accepted' | 'declined') => {
    try {
      await respondToFriendRequest(requestId, action);
      toast({
        title: "Success",
        description: `Friend request ${action}!`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} friend request`,
        variant: "destructive"
      });
    }
  };

  const handleStartChat = async (friendId: string) => {
    if (!currentUser) return;
    
    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.type === 'private' && 
      conv.participants.includes(friendId) && 
      conv.participants.includes(currentUser.uid)
    );

    if (existingConv) {
      setCurrentConversation(existingConv);
    } else {
      try {
        const conversationId = await createConversation('private', [currentUser.uid, friendId]);
        
        // Create a temporary conversation object
        const tempConversation = {
          id: conversationId,
          type: 'private' as const,
          participants: [currentUser.uid, friendId],
          createdAt: new Date(),
          lastMessage: null,
          lastMessageAt: null
        };
        
        setCurrentConversation(tempConversation);
        
        toast({
          title: "Success",
          description: "Chat started!"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start chat",
          variant: "destructive"
        });
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser || !groupName.trim()) return;

    try {
      await createGroup(groupName.trim(), groupDescription.trim(), currentUser.uid);
      setGroupName("");
      setGroupDescription("");
      setShowCreateGroup(false);
      toast({
        title: "Success",
        description: "Group created successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
    }
  };

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);

  // Show chat window if conversation is selected
  if (currentConversation) {
    return <ChatWindow />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 content-with-bottom-nav">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Social</h1>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab("search")}
              className="text-xs sm:text-sm"
            >
              <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Friends</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Group</span>
                  <span className="sm:hidden">Group</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Group description (optional)"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
                      Create Group
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1" style={{backgroundColor: 'rgb(55 65 81)'}}>
            <TabsTrigger value="chats" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Chats</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm relative">
              <Users className="w-4 h-4" />
              <span>Friends</span>
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-1 text-xs min-w-[1rem] h-4 p-0 flex items-center justify-center">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span>Groups</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </TabsTrigger>
          </TabsList>

          {/* Chats Tab */}
          <TabsContent value="chats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Recent Chats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.conversations ? (
                  <div className="text-center py-8">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations yet. Start a chat with a friend!
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {conversations.map((conversation) => {
                        const isGroupChat = conversation.type === 'group';
                        const otherParticipant = !isGroupChat ? 
                          friends.find(f => f.firebaseUid === conversation.participants.find(p => p !== currentUser?.uid)) : null;
                        
                        return (
                          <div 
                            key={conversation.id} 
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setCurrentConversation(conversation)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage src={isGroupChat ? "" : otherParticipant?.profilePicture} />
                                  <AvatarFallback>
                                    {isGroupChat ? 'G' : otherParticipant?.fullName.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                {!isGroupChat && otherParticipant && isUserOnline(otherParticipant.firebaseUid) && (
                                  <Circle className="absolute -bottom-1 -right-1 w-4 h-4 fill-green-500 text-green-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {isGroupChat ? conversation.name || 'Group Chat' : otherParticipant?.fullName || 'Unknown User'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {conversation.lastMessage || 'No messages yet'}
                                </p>
                              </div>
                            </div>
                            {conversation.unreadCount && conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            {/* Friend Requests */}
            <Card>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsRequestsCollapsed(!isRequestsCollapsed)}
                >
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Friend Requests
                    {friendRequests.length > 0 && (
                      <Badge variant="destructive">{friendRequests.length}</Badge>
                    )}
                  </CardTitle>
                  {isRequestsCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </div>
              </CardHeader>
              {!isRequestsCollapsed && (
                <CardContent>
                  {loading.friends ? (
                    <div className="text-center py-8">Loading friend requests...</div>
                  ) : friendRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending friend requests
                    </div>
                  ) : (
                    <ScrollArea className="h-48">
                      <div className="space-y-3">
                        {friendRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={request.senderInfo?.profilePicture || ""} />
                                <AvatarFallback>
                                  {request.senderInfo?.fullName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {request.senderInfo?.fullName || 'Unknown User'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  @{request.senderInfo?.username || 'unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleFriendRequest(request.id, 'accepted')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFriendRequest(request.id, 'declined')}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Friends ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.friends ? (
                  <div className="text-center py-8">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No friends yet. Search for users to add them!
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={friend.profilePicture || ""} />
                                <AvatarFallback>
                                  {friend.fullName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <Circle 
                                className={`absolute -bottom-1 -right-1 w-4 h-4 fill-current ${
                                  isUserOnline(friend.firebaseUid) ? 'text-green-500' : 'text-gray-400'
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{friend.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                @{friend.username} • {isUserOnline(friend.firebaseUid) ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStartChat(friend.firebaseUid)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    My Groups ({groups.length})
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.groups ? (
                  <div className="text-center py-8">Loading groups...</div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No groups yet. Create or join a group!
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={group.avatar || ""} />
                              <AvatarFallback>
                                {group.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {group.name}
                                {group.createdBy === currentUser?.uid && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {group.memberCount} members
                              </p>
                            </div>
                          </div>
                          <Button size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profilePicture || ""} />
                              <AvatarFallback>
                                {user.fullName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSendFriendRequest(user.firebaseUid)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Friend
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
