
import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { SocialProvider } from "@/hooks/useSocial";
import { SocketProvider } from "@/hooks/useSocket";
import { Navigation } from "@/components/Navigation";
import { BottomNav } from "@/components/BottomNav";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { BottomSheet } from "@/components/BottomSheet";
import { PWAPrompt } from "@/components/PWAPrompt";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import Social from "@/pages/Social";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/social">
        <ProtectedRoute>
          <Social />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [location] = useLocation();

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }

  // Check if we're in a chat room (when ChatWindow is displayed)
  const isInChatMode = localStorage.getItem('inChatMode') === 'true';
  const showNavigation = location !== "/" && !isInChatMode;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <SocialProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground">
                {showNavigation && (
                  <Navigation onHamburgerClick={() => setIsHamburgerOpen(true)} />
                )}

                <main>
                  <Router />
                </main>

                {showNavigation && (
                  <BottomNav onMoreClick={() => setIsBottomSheetOpen(true)} />
                )}

                <HamburgerMenu 
                  isOpen={isHamburgerOpen} 
                  onClose={() => setIsHamburgerOpen(false)} 
                />

                <BottomSheet 
                  isOpen={isBottomSheetOpen} 
                  onClose={() => setIsBottomSheetOpen(false)} 
                />

                <PWAPrompt />
                <Toaster />
              </div>
            </TooltipProvider>
          </SocialProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
