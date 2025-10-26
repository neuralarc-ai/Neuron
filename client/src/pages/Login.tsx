import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { APP_TITLE, APP_LOGO } from "@/const";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  // Auto-login when PIN is complete (6 digits)
  useEffect(() => {
    if (pin.length === 6 && !isLoading) {
      const attemptLogin = async () => {
        try {
          await login(pin);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Invalid PIN");
          setPin(""); // Clear PIN on error
        }
      };
      attemptLogin();
    }
  }, [pin, login, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (pin.length === 6 && !isLoading) {
      try {
        await login(pin);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid PIN");
        setPin(""); // Clear PIN on error
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <img
              src={APP_LOGO}
              className="h-fit w-16 rounded-lg object-cover"
              alt="Logo"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{APP_TITLE}</CardTitle>
            <CardDescription>
              Enter your PIN to access the system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPin(value);
                  }}
                  onKeyDown={(e) => {
                    // Allow backspace, delete, arrow keys, tab, enter
                    if (
                      e.key === 'Backspace' ||
                      e.key === 'Delete' ||
                      e.key === 'ArrowLeft' ||
                      e.key === 'ArrowRight' ||
                      e.key === 'Tab' ||
                      e.key === 'Enter' ||
                      (e.key >= '0' && e.key <= '9')
                    ) {
                      return;
                    }
                    e.preventDefault();
                  }}
                  placeholder="Enter your PIN"
                  className="pl-10 pr-8 py-6 text-center text-2xl tracking-widest"
                  disabled={isLoading}
                  autoComplete="off"
                  maxLength={6}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
