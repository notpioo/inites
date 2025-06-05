import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Users, User, Trophy, Gamepad2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavProps {
  onMoreClick: () => void;
}

export const BottomNav = ({ onMoreClick }: BottomNavProps) => {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isInChatMode, setIsInChatMode] = useState(false);

  // Check chat mode state
  useEffect(() => {
    const checkChatMode = () => {
      setIsInChatMode(localStorage.getItem('inChatMode') === 'true');
    };

    checkChatMode();

    // Listen for storage changes
    window.addEventListener('storage', checkChatMode);

    // Polling for local storage changes (for same tab)
    const interval = setInterval(checkChatMode, 100);

    return () => {
      window.removeEventListener('storage', checkChatMode);
      clearInterval(interval);
    };
  }, []);

  // Hide on specific pages and when in chat mode
  const shouldHideBottomNav = location === "/" || location === "/login" || location === "/register" || isInChatMode;

  if (shouldHideBottomNav) {
    return null;
  }

  const handleNavClick = (path: string) => {
    if (path === "/dashboard" && !isAuthenticated) {
      setLocation("/login");
    } else {
      setLocation(path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Check if we're in chat mode and hide bottom nav
  useEffect(() => {
    const checkChatMode = () => {
      const isInChatMode = localStorage.getItem('inChatMode') === 'true';
      const bottomNavElement = document.querySelector('.bottom-nav') as HTMLElement;
      if (bottomNavElement) {
        bottomNavElement.style.display = isInChatMode ? 'none' : 'flex';
      }
    };

    checkChatMode();

    // Check on storage changes (when chat mode changes)
    window.addEventListener('storage', checkChatMode);

    // Check on location changes
    const checkOnLocationChange = () => {
      setTimeout(checkChatMode, 100); // Small delay to ensure state is updated
    };

    // Listen for location changes
    window.addEventListener('popstate', checkOnLocationChange);

    // Also check periodically in case localStorage changes from same window
    const interval = setInterval(checkChatMode, 500);

    return () => {
      window.removeEventListener('storage', checkChatMode);
      window.removeEventListener('popstate', checkOnLocationChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-border lg:hidden z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavClick("/dashboard")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
            isActive("/")
              ? "text-orange-500"
              : "text-gray-400 hover:text-orange-500"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavClick("/social")} // Modified: Link to /social
          className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
            location.includes("social")
              ? "text-orange-500"
              : "text-gray-400 hover:text-orange-500"
          }`}
        >
          <Users className="w-5 h-5" /> {/* Modified: Use Users icon for Social */}
          <span className="text-xs">Social</span> {/* Modified: Label as Social */}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavClick("/dashboard")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
            location.includes("tournament")
              ? "text-orange-500"
              : "text-gray-400 hover:text-orange-500"
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs">Tournament</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMoreClick}
          className="flex flex-col items-center space-y-1 px-3 py-2 h-auto text-gray-400 hover:text-orange-500"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-xs">More</span>
        </Button>
      </div>
    </nav>
  );
};