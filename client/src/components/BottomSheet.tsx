
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Gamepad2, Layers, Medal, Store, User, Settings, 
  HelpCircle, Crown, X, Home, Users, Trophy
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BottomSheet = ({ isOpen, onClose }: BottomSheetProps) => {
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
    { icon: Gamepad2, label: "Games", path: "/dashboard" },
    { icon: Layers, label: "Division", path: "/dashboard" },
    { icon: Medal, label: "Leaderboard", path: "/dashboard" },
    { icon: Trophy, label: "Tournament", path: "/dashboard" },
    { icon: Users, label: "Social", path: "/dashboard" },
    { icon: Store, label: "Store", path: "/dashboard" },
    { icon: Settings, label: "Settings", path: "/dashboard" },
    { icon: HelpCircle, label: "Help", path: "/dashboard" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="bg-gray-800 border-gray-700 rounded-t-3xl max-h-[70vh] p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-gray-700">
          <SheetTitle className="text-xl font-semibold text-white text-left">
            More Options
          </SheetTitle>
        </SheetHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 max-h-[calc(70vh-80px)]">
          <div className="grid grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                onClick={() => handleNavClick(item.path)}
                className="flex flex-col items-center space-y-3 p-4 h-auto bg-gray-700/50 hover:bg-gray-700 rounded-2xl transition-all duration-200 border-none"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-white text-center leading-tight">
                  {item.label}
                </span>
              </Button>
            ))}
            
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => handleNavClick("/admin")}
                className="flex flex-col items-center space-y-3 p-4 h-auto bg-gray-700/50 hover:bg-gray-700 rounded-2xl transition-all duration-200 border-none"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-white text-center leading-tight">
                  Admin
                </span>
              </Button>
            )}
          </div>
          
          {/* Bottom spacing for scroll */}
          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
