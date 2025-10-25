import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff } from "lucide-react";
import { APP_TITLE, APP_LOGO } from "@/const";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await login(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setPin(""); // Clear PIN on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={APP_LOGO}
              className="h-16 w-16 rounded-lg object-cover ring-2 ring-border"
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
              <label htmlFor="pin" className="text-sm font-medium">
                PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
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
                  className="pl-10 pr-10 text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                  autoComplete="off"
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPin(!showPin)}
                  disabled={isLoading}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || pin.length === 0}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
