import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Gamepad2, TrendingUp, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { currentUser, userProfile, loading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeTournaments: 0,
    onlineUsers: 0,
    userPoints: 0
  });

  useEffect(() => {
    // Simulate fetching stats - replace with actual API calls
    setStats({
      totalMembers: 1247, // Total registered members
      activeTournaments: 8, // Active tournaments
      onlineUsers: 156, // Currently online users
      userPoints: userProfile?.points || 0 // User's personal points
    });
  }, [userProfile]);

  // This is now handled by ProtectedRoute, so we can remove this useEffect

  // Render loading state
  if (loading) {
    return <div className="min-h-screen bg-background text-foreground p-4 pb-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{userProfile?.fullName || userProfile?.username}!</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to dominate today's challenges?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Member</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalMembers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktif Tournament</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeTournaments}</p>
                </div>
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold text-foreground">{stats.onlineUsers}</p>
                </div>
                <Globe className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="text-2xl font-bold text-foreground">{stats.userPoints.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your latest gaming sessions and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity yet</p>
              <Button className="mt-4 bg-primary hover:bg-orange-600 text-white">
                Start Your First Game
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-card border-border hover:glow-effect transition-all">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Join Tournament</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Compete with other players in exciting tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-orange-600 text-white">
                View Tournaments
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:glow-effect transition-all">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Find Players</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Connect with other gamers and form teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-orange-600 text-white">
                Browse Players
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}