import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  UserPlus, 
  Users, 
  MessageCircle, 
  Check, 
  X, 
  Plus,
  Crown,
  Circle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocial } from "@/hooks/useSocial";
import { useSocket } from "@/hooks/useSocket";
import ChatWindow from "@/components/ChatWindow";
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest,
  searchUsers,
  createConversation,
  createGroup,
  joinGroup,
  searchGroups
} from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

export default function Social() {
  const { currentUser } = useAuth();
  const { 
    friends, 
    friendRequests, 
    groups, 
    conversations, 
    currentConversation, 
    setCurrentConversation,
    loading 
  } = useSocial();
  const { onlineUsers } = useSocket();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<any[]>([]);

  // Ensure bottom navigation is visible when on social page
  useEffect(() => {
    localStorage.removeItem('inChatMode');
    const bottomNav = document.querySelector('.bottom-nav') as HTMLElement;
    if (bottomNav) {
      bottomNav.style.display = 'flex';
    }
  }, []);

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

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast({
        title: "Success",
        description: "Friend request accepted!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      toast({
        title: "Success",
        description: "Friend request declined!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive"
      });
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
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

  const handleCreateConversation = async (friendId: string) => {
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
    if (!currentUser || !newGroupName.trim()) return;

    try {
      await createGroup(newGroupName.trim(), newGroupDescription.trim(), currentUser.uid);
      setNewGroupName('');
      setNewGroupDescription('');
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

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      await joinGroup(groupId, currentUser.uid);
      toast({
        title: "Success",
        description: "Joined group successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive"
      });
    }
  };

  const handleSearchGroups = async () => {
    if (!groupSearchQuery.trim()) return;

    try {
      const results = await searchGroups(groupSearchQuery);
      setGroupSearchResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search groups",
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
            <Dialog>
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
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Textarea 
                    placeholder="Group description (optional)" 
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={handleCreateGroup}>Create Group</Button>
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
            <TabsTrigger value="friends" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span>Friends</span>
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

          <TabsContent value="friends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Friend Requests
                </CardTitle>
              </CardHeader>
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
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                              onClick={() => handleAcceptFriendRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineFriendRequest(request.id)}
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
            </Card>

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
                            onClick={() => handleCreateConversation(friend.firebaseUid)}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                  />
                  <Button onClick={handleSearchUsers} disabled={isSearching}>
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