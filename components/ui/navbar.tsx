// components/layout/Navbar.tsx

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavbarProps {
  token: string | null;
  userName: string | null;
  loggedInUserEmail: string | null;
  handleLogout: () => void;
  onSwitchAccount: () => void;
  onSignIn: () => void;
}

export function Navbar({
  token,
  userName,
  loggedInUserEmail,
  handleLogout,
  onSwitchAccount,
  onSignIn,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b">
      <Link href="/" className="text-xl font-bold">
        TodoApp
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {token ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{userName}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <Link href="/dashboard" passHref>
                <DropdownMenuLabel className="cursor-pointer">
                  My Account
                </DropdownMenuLabel>
              </Link>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{userName}</p>
                <p>{loggedInUserEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onSwitchAccount}
                className="cursor-pointer"
              >
                Switch Accounts
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleLogout}
                className="cursor-pointer text-red-500 focus:text-red-500"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={onSignIn}>Sign In</Button>
        )}
      </div>
    </header>
  );
}