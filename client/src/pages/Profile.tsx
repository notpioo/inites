
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Edit3, Save, Trophy, Gamepad2 } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-foreground">
                    {userProfile?.fullName || "Gaming Legend"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    @{userProfile?.username || "player"}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">42</p>
              <p className="text-sm text-muted-foreground">Rank</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">156</p>
              <p className="text-sm text-muted-foreground">Games</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">89</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-primary hover:glow-effect transition-all">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">2,450</p>
              <p className="text-sm text-muted-foreground">Points</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Profile Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your account details and gaming preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  defaultValue={userProfile?.fullName || ""}
                  disabled={!isEditing}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <Input
                  id="username"
                  defaultValue={userProfile?.username || ""}
                  disabled={!isEditing}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={userProfile?.email || ""}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gaming Preferences */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Gaming Preferences</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your favorite games and preferred play styles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Configure your gaming preferences</p>
              <Button className="mt-4 bg-primary hover:bg-orange-600 text-white">
                Set Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
