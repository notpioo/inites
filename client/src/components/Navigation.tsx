import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { Menu, User, Gamepad2 } from "lucide-react";

interface NavigationProps {
  onHamburgerClick: () => void;
}

export const Navigation = ({ onHamburgerClick }: NavigationProps) => {
  const [location] = useLocation();
  const { isAuthenticated, userProfile } = useAuth();

  // Hide navigation on home, login, and register pages
  if (location === "/" || location === "/login" || location === "/register") {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="bg-secondary shadow-lg sticky top-0 z-30 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Hamburger */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHamburgerClick}
              className="hidden lg:flex text-orange-500 hover:text-orange-400"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">NoMercy</span>
            </Link>
          </div>

          {/* Desktop Navigation */}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && userProfile ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-white hidden sm:block">
                  {userProfile.fullName}
                </span>
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all">
                      {userProfile.profilePicture ? (
                        <img 
                          src={userProfile.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-orange-500 hover:text-orange-400"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-500 hover:text-orange-400"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
