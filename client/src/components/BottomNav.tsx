import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Users, Trophy, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavProps {
  onMoreClick: () => void;
}

export const BottomNav = ({ onMoreClick }: BottomNavProps) => {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide bottom navigation on login, register pages, and when in chat mode
  const isInChatMode = localStorage.getItem('inChatMode') === 'true';
  if (location === "/login" || location === "/register" || isInChatMode) {
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