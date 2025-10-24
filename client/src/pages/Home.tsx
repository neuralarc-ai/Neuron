import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = trpc.auth.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await loginMutation.mutateAsync({ username, password });
      toast.success("Login successful!");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    }
  };

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Comprehensive employee database with profiles and tracking",
    },
    {
      icon: Calendar,
      title: "Leave Tracking",
      description: "Monitor quotas and manage deductions automatically",
    },
    {
      icon: FileText,
      title: "Payment Processing",
      description: "Generate professional payment advices with TDS",
    },
  ];

  const benefits = [
    "Automated payment calculations",
    "Professional PDF generation",
    "Real-time leave monitoring",
    "Secure access control",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/neuralarc-logo.png" alt="NeuralArc" className="h-8" />
            <div>
              <h1 className="text-xl font-bold">Neuron</h1>
              <p className="text-xs text-muted-foreground">HR Management System</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                Internal HR Management for NeuralArc Inc
              </h2>
              <p className="text-lg text-muted-foreground">
                Streamline employee management, leave tracking, and payment processing all in one place.
              </p>
            </div>

            <div className="grid gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Key Features:</h3>
              <div className="grid grid-cols-2 gap-2">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Sign In</h2>
                <p className="text-sm text-muted-foreground">Access your HR dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="admin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                Default credentials: admin / admin
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Neural Arc Inc | neuralarc.ai</p>
            <p className="mt-1">India Office: AMPVC Consulting LLP, Trimurti HoneyGold, Range Hills Road, Pune 411 007</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

