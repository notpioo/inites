
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Gamepad2, Star, Zap, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background to-secondary py-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto glow-effect">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              No<span className="text-primary">Mercy</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Join the ultimate gaming community where legends are born and champions rise. 
              No mercy, no limits, just pure gaming excellence.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-orange-600 text-white px-8 py-3 text-lg glow-effect">
                <Zap className="w-5 h-5 mr-2" />
                Join NoMercy
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">Why Choose NoMercy?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience gaming like never before with our cutting-edge platform designed for true champions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:glow-effect transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Elite Community</h3>
                <p className="text-muted-foreground">
                  Connect with like-minded gamers, form teams, and build lasting friendships in our exclusive community.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:glow-effect transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Competitive Tournaments</h3>
                <p className="text-muted-foreground">
                  Compete in regular tournaments with exciting prizes and recognition for top performers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:glow-effect transition-all">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Multi-Game Support</h3>
                <p className="text-muted-foreground">
                  From FPS to MOBA, we support multiple game genres with dedicated divisions and teams.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className="text-muted-foreground">Active Players</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">Tournaments</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">50+</div>
              <div className="text-muted-foreground">Games Supported</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">$100K+</div>
              <div className="text-muted-foreground">Prize Pool</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            Ready to Show <span className="text-primary">No Mercy</span>?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of gamers who have already chosen excellence. Your legend starts here.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-orange-600 text-white px-12 py-4 text-xl glow-effect">
              <Shield className="w-6 h-6 mr-3" />
              Enter the Arena
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
