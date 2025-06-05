
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit3, Save, Trophy, Gamepad2, Upload, Camera } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ImageCropModal } from "@/components/ImageCropModal";

export default function Profile() {
  const { userProfile, isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [loading, isAuthenticated]);
  const [profileImage, setProfileImage] = useState(userProfile?.profilePicture || null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || "",
    username: userProfile?.username || "",
    email: userProfile?.email || "",
    birthDate: userProfile?.birthDate || "",
    city: userProfile?.city || "",
    gender: userProfile?.gender || "",
    bio: userProfile?.bio || ""
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImageSrc(e.target?.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setProfileImage(croppedImageUrl);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!userProfile?.firebaseUid) return;
    
    try {
      const { updateUserProfile } = await import("@/lib/firestore");
      await updateUserProfile(userProfile.firebaseUid, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        profilePicture: profileImage,
        birthDate: formData.birthDate,
        city: formData.city,
        gender: formData.gender,
        bio: formData.bio
      });
      
      console.log("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl text-foreground">
                    {formData.fullName || "Gaming Legend"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    @{formData.username || "player"}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
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
              <p className="text-2xl font-bold text-foreground">{userProfile?.points || 0}</p>
              <p className="text-sm text-muted-foreground">Points</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Profile Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your account details and personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={!isEditing}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-foreground">Tanggal Lahir</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  disabled={!isEditing}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground">Asal Kota</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Masukkan asal kota"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-foreground">Jenis Kelamin</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Ceritakan tentang diri Anda..."
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
      
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
