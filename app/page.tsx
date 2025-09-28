// todolist/app/page.tsx
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Loader2, Pencil } from 'lucide-react';
import { Task } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for auth forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');

  // State for new tasks
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // State for editing tasks
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTasks([]);
  };

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      alert('Registration successful! Please log in.');
      setView('login');
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const tempId = Date.now();
    const newTask = { id: tempId, title: newTaskTitle, description: newTaskDescription };
    const previousTasks = tasks;

    setTasks(prevTasks => [...prevTasks, newTask as Task]);
    setNewTaskTitle('');
    setNewTaskDescription('');

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle, description: newTaskDescription }),
      });
      if (!res.ok) throw new Error('Failed to add task');
      const savedTask = await res.json();
      setTasks(prevTasks => prevTasks.map(task => (task.id === tempId ? savedTask : task)));
    } catch (err) {
      console.error(err);
      setTasks(previousTasks);
    }
  };

  const handleDeleteTask = async (id: number) => {
    const previousTasks = tasks;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err) {
      console.error(err);
      setTasks(previousTasks);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!editingTask) return;
    const previousTasks = tasks;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTask.id ? { ...task, title: editedTitle, description: editedDescription } : task
      )
    );
    setEditingTask(null);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: editedTitle, description: editedDescription }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
    } catch (error) {
      console.error(error);
      setTasks(previousTasks);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-rose-50">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{view === 'login' ? 'Login' : 'Register'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit">{view === 'login' ? 'Login' : 'Register'}</Button>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
            </form>
            <Button variant="link" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full mt-4">
              {view === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-4 pt-16 bg-rose-50">
      <div className="absolute top-4 right-4">
          <Button onClick={handleLogout}>Logout</Button>
      </div>
      <h1 className="text-5xl font-bold">Tushar&apos;s TodoList</h1>
      <p className="text-lg text-muted-foreground mt-2 mb-10">Stay organized and productive.</p>

      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader><CardTitle className="text-xl">Add a Task</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="flex flex-col gap-4">
            <Input type="text" placeholder="Task title..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
            <Input type="text" placeholder="Task description..." value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} />
            <Button type="submit" className="w-full">Add Task</Button>
          </form>
        </CardContent>
      </Card>

      <div className="w-full max-w-lg mt-8">
        {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.length > 0 ? tasks.map((task) => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }} className="flex items-center p-4 rounded-md border bg-white">
                  <div className="flex-1 mr-4">
                    <p className='font-medium text-base'>{task.title}</p>
                    {task.description && <p className='text-sm text-muted-foreground mt-1'>{task.description}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTask(task);
                      setEditedTitle(task.title);
                      setEditedDescription(task.description || '');
                    }}
                  >
                    <Pencil className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </motion.div>
              )) : (
                <div className="text-center p-8 bg-white rounded-md border">
                  <h3 className="text-xl font-semibold">No Tasks Yet!</h3>
                  <p className="text-muted-foreground mt-2">Add a task above to get started.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}