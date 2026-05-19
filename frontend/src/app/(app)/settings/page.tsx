"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { setTheme } = useTheme();

  return (
    <div>
      <PageHeader title="Settings" description="Workspace preferences for this device." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setTheme("light")}><Sun className="h-4 w-4" /> Light</Button>
          <Button variant="outline" onClick={() => setTheme("dark")}><Moon className="h-4 w-4" /> Dark</Button>
          <Button variant="outline" onClick={() => setTheme("system")}>System</Button>
        </CardContent>
      </Card>
    </div>
  );
}
