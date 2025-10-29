// In app/dashboard/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Loader2, User as UserIcon, Mail, Shield, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Define types for the data we expect
interface UserDetails {
  id: number;
  name: string;
  email: string;
  role: string;
}
interface Task {
  id: number;
  title: string;
  description: string | null;
}
interface UserData {
  user: UserDetails;
  tasks: Task[];
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // If no token, redirect to homepage
      router.push('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // If token is invalid, log out and redirect
          localStorage.removeItem("token");
          router.push('/');
          return;
        }

        const data: UserData = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return null; // Or a message saying "Could not load data"
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-8">
        &larr; Back to Board
      </Button>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">My Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>{userData.user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userData.user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{userData.user.role.toLowerCase()}</span>
              </div>
            </CardContent>
          </Card>

          {/* User Tasks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                My Tasks ({userData.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {userData.tasks.length > 0 ? (
                userData.tasks.map(task => (
                  <div key={task.id} className="p-3 rounded-md border bg-muted/50">
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You have not created any tasks yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}