import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Aivora" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = (next: boolean) => {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aivora-theme", next ? "dark" : "light");
  };

  return (
    <>
      <AppTopbar title="Settings" subtitle="Manage your workspace" />
      <main className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-8 sm:px-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-brand-gradient text-primary-foreground">
                {email.slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">{email || "Signed in"}</div>
              <div className="text-xs text-muted-foreground">Signed in to Aivora</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose light or dark mode</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark mode</Label>
            <Switch id="dark-mode" checked={dark} onCheckedChange={toggleTheme} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Aivora is a unified AI workplace productivity assistant. Plans, research reports, and
            conversations are all saved to your account.
          </CardContent>
        </Card>
      </main>
    </>
  );
}
