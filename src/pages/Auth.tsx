import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmedEmail(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (/confirm/i.test(error.message) || /not confirmed/i.test(error.message)) {
          setUnconfirmedEmail(email);
          toast.error("Please verify your email before signing in.");
        } else {
          toast.error(error.message);
        }
      } else navigate("/");
    } else if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) toast.error(error.message);
      else {
        // If email confirmation is required, session will be null
        if (!data.session) {
          toast.success("Account created! Check your inbox to verify your email before signing in.");
          setUnconfirmedEmail(email);
          setMode("login");
        } else {
          navigate("/");
        }
      }
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("If an account exists, a reset link has been sent to your email.");
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!unconfirmedEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email resent. Please check your inbox.");
  };

  const title =
    mode === "login" ? "Sign in to your account"
    : mode === "signup" ? "Create a new account"
    : "Reset your password";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Delta Industries</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..."
              : mode === "login" ? "Sign In"
              : mode === "signup" ? "Sign Up"
              : "Send reset link"}
          </Button>
        </form>

        {unconfirmedEmail && mode === "login" && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{unconfirmedEmail}</span> is not verified yet.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full"
            >
              Resend verification email
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <>
              Remembered your password?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Sign In
              </button>
            </>
          ) : mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
