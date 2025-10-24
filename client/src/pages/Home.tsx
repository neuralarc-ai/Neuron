import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, Calendar, FileText, Settings, ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Comprehensive employee database with detailed profiles, designations, and status tracking.",
      color: "bg-[rgb(var(--lavander))]"
    },
    {
      icon: Calendar,
      title: "Leave Tracking",
      description: "Monitor monthly leave quotas, track absences, and manage leave deductions automatically.",
      color: "bg-[rgb(var(--tea))]"
    },
    {
      icon: FileText,
      title: "Payroll Processing",
      description: "Generate professional payslips with automatic TDS calculations and leave-based deductions.",
      color: "bg-[rgb(var(--tangerine))]"
    },
    {
      icon: Settings,
      title: "Flexible Configuration",
      description: "Customize leave quotas, TDS rates, and working days to match your company policies.",
      color: "bg-[rgb(var(--mustard))]"
    }
  ];

  const benefits = [
    "Automated salary calculations with TDS compliance",
    "Professional PDF payslip generation",
    "Real-time leave quota monitoring",
    "Comprehensive employee records",
    "Secure role-based access control",
    "Responsive design for all devices"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/neuralarc-logo.png" 
                alt="NeuralArc" 
                className="h-10"
              />
            </div>
            <Button 
              onClick={() => setLocation("/login")}
              className="bg-[rgb(var(--lavander))] hover:bg-[rgb(var(--tea))] text-white"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--lavander))]/10 via-[rgb(var(--sky))]/10 to-[rgb(var(--seashell))]" />
        <div className="container mx-auto px-6 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--lavander))]/10 border border-[rgb(var(--lavander))]/20">
              <Shield className="h-4 w-4 text-[rgb(var(--lavander))]" />
              <span className="text-sm font-medium text-[rgb(var(--lavander))]">Internal Tool</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[rgb(var(--lavander))] to-[rgb(var(--tea))] bg-clip-text text-transparent">
                Neuron
              </span>
              <br />
              <span className="text-foreground">HR Management System</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A comprehensive internal tool for NeuralArc Inc to streamline employee management, 
              leave tracking, and payroll processing—all in one unified platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                size="lg"
                onClick={() => setLocation("/login")}
                className="bg-[rgb(var(--lavander))] hover:bg-[rgb(var(--tea))] text-white text-lg px-8 h-12"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12 border-[rgb(var(--lavander))]/30 hover:bg-[rgb(var(--lavander))]/5"
                onClick={() => window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[rgb(var(--lavander))]">100%</div>
                <div className="text-sm text-muted-foreground mt-1">Automated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[rgb(var(--tea))]">Secure</div>
                <div className="text-sm text-muted-foreground mt-1">Data Protection</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[rgb(var(--tangerine))]">24/7</div>
                <div className="text-sm text-muted-foreground mt-1">Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to manage your workforce efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bento-card group hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className={`${feature.color} p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-[rgb(var(--seashell))] to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Why Choose Neuron?</h2>
              <p className="text-lg text-muted-foreground">
                Built specifically for NeuralArc Inc's operational needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-white/80 hover:bg-white transition-colors"
                >
                  <CheckCircle2 className="h-5 w-5 text-[rgb(var(--tea))] shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[rgb(var(--lavander))] to-[rgb(var(--tea))] text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Zap className="h-12 w-12 mx-auto" />
            <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-white/90">
              Access the Neuron HR Management System and streamline your employee operations today.
            </p>
            <Button 
              size="lg"
              onClick={() => setLocation("/login")}
              className="bg-white text-[rgb(var(--lavander))] hover:bg-white/90 text-lg px-8 h-12 mt-4"
            >
              Sign In Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/neuralarc-logo.png" 
                alt="NeuralArc" 
                className="h-8"
              />
            </div>
            
            <div className="text-center md:text-left space-y-1">
              <p className="text-sm font-medium">Neural Arc Inc</p>
              <p className="text-sm text-muted-foreground">neuralarc.ai</p>
            </div>

            <div className="text-center md:text-right text-sm text-muted-foreground max-w-xs">
              <p>India Office: AMPVC Consulting LLP</p>
              <p>Trimurti HoneyGold, Range Hills Road</p>
              <p>Pune 411 007</p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Neural Arc Inc. All rights reserved. Internal use only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

