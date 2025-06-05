import React from 'react';
import { useState, useEffect } from "react";
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

  // Check if we're in chat mode and hide bottom nav
  const [isInChatMode, setIsInChatMode] = React.useState(false);

  React.useEffect(() => {
    const checkChatMode = () => {
      const inChatMode = localStorage.getItem('inChatMode') === 'true';
      setIsInChatMode(inChatMode);
    };

    // Initial check
    checkChatMode();

    const handleChatModeChange = () => {
      checkChatMode();
    };

    window.addEventListener('storage', handleChatModeChange);
    return () => window.removeEventListener('storage', handleChatModeChange);
  }, []);

  // Hide bottom nav on specific pages and chat rooms
  const hiddenPages = ['/', '/login', '/register'];
  const isInChatRoom = location.startsWith('/chat/') || location.includes('chat');
  const shouldHide = isInChatMode || hiddenPages.includes(location) || isInChatRoom;

  if (shouldHide) {
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
            isActive("/dashboard")
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
          onClick={() => handleNavClick("/social")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
            location.startsWith("/social")
              ? "text-orange-500"
              : "text-gray-400 hover:text-orange-500"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Social</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavClick("/tournament")}
          className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
            location.startsWith("/tournament")
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