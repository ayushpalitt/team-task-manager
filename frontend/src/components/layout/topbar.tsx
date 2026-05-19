"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { disconnectSocket } from "@/lib/socket";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const signOut = () => {
    disconnectSocket();
    logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-6">
      <Button className="lg:hidden" variant="ghost" size="icon" onClick={onMenu} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden text-sm text-muted-foreground lg:block">Plan, assign, and ship work with clarity.</div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: user?.avatarColor || "#2563eb" }}>
              {initials(user?.name || "User")}
            </span>
            <span className="hidden text-left text-sm sm:block">
              <span className="block font-medium">{user?.name}</span>
              <span className="block text-xs text-muted-foreground">{user?.email}</span>
            </span>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" className="z-50 mt-2 min-w-48 rounded-md border bg-card p-1 shadow-md">
              <DropdownMenu.Item onClick={signOut} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-secondary">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
