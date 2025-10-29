"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, Pencil, ClipboardPlus, Search, Users, Circle, MoreHorizontal } from "lucide-react";
import { Task } from "@/lib/types";
import { Navbar } from "@/components/ui/navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GroupedTasks { [userName: string]: Task[] }
interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  exp: number; // Expiration time
}

// Global variable to hold the timer reference
let logoutTimer: NodeJS.Timeout;

export default function HomePage() {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingUserTasks, setViewingUserTasks] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [name, setName] = useState("");

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUserRole(null);
    setUserName(null);
    setCurrentUserId(null);
    setLoggedInUserEmail(null);
    clearTimeout(logoutTimer);
  }, []);

  const setAutoLogout = useCallback((token: string) => {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const expirationTime = (decodedToken.exp * 1000) - new Date().getTime();

      if (expirationTime > 0) {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
          console.log("Session expired, logging out automatically.");
          handleLogout();
        }, expirationTime);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Invalid token:", error);
      handleLogout();
    }
  }, [handleLogout]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Login failed"); }
      const data = await res.json();
      const newToken = data.token;
      
      localStorage.setItem("token", newToken);
      const decodedToken = jwtDecode<JwtPayload>(newToken);
      
      setToken(newToken);
      setUserRole(decodedToken.role);
      setUserName(decodedToken.name);
      setCurrentUserId(decodedToken.userId);
      setLoggedInUserEmail(decodedToken.email);
      setShowAuthDialog(false);
      
      setAutoLogout(newToken);

    } catch (err: any) { setError(err.message); }
  };
  
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setAutoLogout(storedToken);
    }
  }, [setAutoLogout]);

  const fetchAllTasks = useCallback(async () => {
    if (isLoading) setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks/all`);
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const flatTasks: Task[] = await res.json();
      const validTasks = flatTasks.filter(task => task.name || task.email);
      const grouped = validTasks.reduce((acc, task) => {
        const key = task.name || task.email;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {} as GroupedTasks);
      setGroupedTasks(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, handleLogout]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Registration failed"); }
      alert("Registration successful! Please log in.");
      setView("login"); setName("");
    } catch (err: any) { setError(err.message); }
  };
  
  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) { setShowAuthDialog(true); setView("login"); return; }
    if (!newTaskTitle.trim()) return;
    try {
      await fetch(`${API_URL}/api/tasks`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle, description: newTaskDescription }),
      });
      await fetchAllTasks();
      setNewTaskTitle("");
      setNewTaskDescription("");
    } catch (err) { console.error(err); alert("Failed to add task"); }
  };
  
  const handleDeleteTask = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/tasks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      await fetchAllTasks();
    } catch (err) { console.error(err); alert("Failed to delete task"); }
  };

  const handleSaveChanges = async () => {
    if (!editingTask || !editedTitle.trim()) return;
    try {
      await fetch(`${API_URL}/api/tasks/${editingTask.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editedTitle, description: editedDescription }),
      });
      setEditingTask(null);
      await fetchAllTasks();
    } catch (err) { console.error(err); alert("Failed to update task"); }
  };

  useEffect(() => { fetchAllTasks(); }, [fetchAllTasks]);

  const filteredTasks = Object.keys(groupedTasks).filter(name => {
    const userTasks = groupedTasks[name];
    const nameMatches = name.toLowerCase().includes(searchTerm.toLowerCase());
    const taskTitleMatches = userTasks.some(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return nameMatches || taskTitleMatches;
  }).reduce((acc, name) => {
    acc[name] = groupedTasks[name];
    return acc;
  }, {} as GroupedTasks);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <>
      <Navbar
        token={token}
        userName={userName}
        loggedInUserEmail={loggedInUserEmail}
        handleLogout={handleLogout}
        onSwitchAccount={() => {
          handleLogout();
          setView("login");
          setShowAuthDialog(true);
        }}
        onSignIn={() => {
          setView("login");
          setShowAuthDialog(true);
        }}
      />

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{view === "login" ? "Sign In" : "Create Account"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="grid gap-4">
             {view === 'register' && (
              <Input id="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
             )}
             <Input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
             <Input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
             {error && <p className="text-sm text-red-500 text-center">{error}</p>}
             <Button type="submit">{view === 'login' ? 'Sign In' : 'Create Account'}</Button>
          </form>
          <DialogFooter className="pt-2">
             <Button variant="link" className="w-full" onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(""); }}>
                {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingUserTasks} onOpenChange={() => setViewingUserTasks(null)}>
        <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Tasks by {viewingUserTasks}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-3">
            {viewingUserTasks && groupedTasks[viewingUserTasks]?.map((task) => (
              <div key={task.id} className="p-3 rounded-md border bg-muted/50 group relative flex items-start gap-3">
                <Circle className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm leading-tight">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                </div>
                {token && currentUserId === task.user_id && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingTask(task); setEditedTitle(task.title); setEditedDescription(task.description || ""); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <main className="min-h-screen w-full bg-background pt-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-screen-xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">
            {userName ? `${userName}'s Workspace` : "Public Task Board"}
          </h1>
          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by user or task..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>Add a New Task</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <form
                      onSubmit={handleAddTask}
                      className="flex flex-col flex-1 space-y-4"
                    >
                      <div>
                        <Input
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <Input
                          placeholder="Task description..."
                          className="mt-4"
                          value={newTaskDescription}
                          onChange={(e) =>
                            setNewTaskDescription(e.target.value)
                          }
                        />
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <ClipboardPlus className="h-12 w-12 mb-4" />
                        <p className="font-semibold">Capture your thoughts</p>
                        <p className="text-sm">
                          Add tasks to your workspace to get started.
                        </p>
                      </div>

                      <Button type="submit" className="w-full">
                        Add Task
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {Object.keys(filteredTasks).map((name) => (
                    <motion.div key={name} variants={itemVariants}>
                      <Card 
                        className="flex flex-col h-full cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setViewingUserTasks(name)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Tasks by {name}</CardTitle>
                          </div>
                          <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-3 py-1">
                            {filteredTasks[name].length}
                          </span>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col space-y-2">
                          {filteredTasks[name].slice(0, 3).map((task) => (
                            <div key={task.id} className="p-2 rounded-md border bg-muted/50 flex items-center gap-2">
                              <Circle className="h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
                              <p className="font-medium text-sm truncate">{task.title}</p>
                            </div>
                          ))}
                          {filteredTasks[name].length > 3 && (
                            <div className="p-2 text-xs text-muted-foreground flex items-center justify-center">
                              <MoreHorizontal className="h-4 w-4 mr-2" />
                              {filteredTasks[name].length - 3} more tasks
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}