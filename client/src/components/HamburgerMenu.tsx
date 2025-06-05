import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Home,
  Users,
  Trophy,
  Gamepad2,
  Layers,
  Medal,
  Store,
  User,
  Settings,
  HelpCircle,
  Crown,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HamburgerMenu = ({ isOpen, onClose }: HamburgerMenuProps) => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleNavClick = (path: string) => {
    if ((path === "/dashboard" || path === "/profile") && !isAuthenticated) {
      setLocation("/login");
    } else {
      setLocation(path);
    }
    onClose();
  };

  const menuItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Gamepad2, label: "Games", path: "/dashboard" },
    { icon: Layers, label: "Division", path: "/dashboard" },
    { icon: Medal, label: "Leaderboard", path: "/dashboard" },
    { icon: Trophy, label: "Tournament", path: "/dashboard" },
    { icon: Users, label: "Social", path: "/social" },
    { icon: Store, label: "Store", path: "/dashboard" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/dashboard" },
    { icon: HelpCircle, label: "Help", path: "/dashboard" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-80 bg-gray-800 border-gray-700 p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-6 border-b border-gray-700">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NoMercy</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[calc(100vh-120px)]">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                onClick={() => handleNavClick(item.path)}
                className="w-full justify-start space-x-4 px-4 py-3 h-auto text-white hover:bg-gray-700/50 hover:text-orange-500 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}

            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => handleNavClick("/admin")}
                className="w-full justify-start space-x-4 px-4 py-3 h-auto text-orange-500 hover:bg-gray-700/50 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Admin</span>
              </Button>
            )}

            {/* Additional menu items for better scrolling test */}
            <div className="pt-4 border-t border-gray-700">
              <Button
                variant="ghost"
                onClick={() => handleNavClick("/dashboard")}
                className="w-full justify-start space-x-4 px-4 py-3 h-auto text-white hover:bg-gray-700/50 hover:text-orange-500 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-medium">Settings</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleNavClick("/dashboard")}
                className="w-full justify-start space-x-4 px-4 py-3 h-auto text-white hover:bg-gray-700/50 hover:text-orange-500 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="font-medium">Help & Support</span>
              </Button>
            </div>
          </nav>

          {/* Bottom spacing for scroll */}
          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
