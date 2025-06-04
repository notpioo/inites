import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export const PWAPrompt = () => {
  const { showPrompt, installApp, dismissPrompt } = useInstallPrompt();

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 bg-secondary border-border shadow-2xl glow-effect z-30">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground">Install NoMercy</h4>
            <p className="text-muted-foreground text-xs mt-1">
              Get the full app experience with offline access and push notifications.
            </p>
            <div className="flex space-x-2 mt-3">
              <Button 
                onClick={installApp}
                className="px-3 py-1 h-auto text-xs font-medium"
              >
                Install
              </Button>
              <Button 
                variant="ghost" 
                onClick={dismissPrompt}
                className="px-3 py-1 h-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Later
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissPrompt}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
