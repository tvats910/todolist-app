// backend/server.ts
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import pool from './db';
import { authMiddleware } from './authMiddleware';

dotenv.config();

interface User extends RowDataPacket {
    id: number;
    email: string;
    password: string;
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

// === AUTHENTICATION ROUTES ===
app.post('/api/register', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already in use.' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query<User[]>('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// === PROTECTED TASK ROUTES ===

// GET all tasks for the logged-in user
app.get('/api/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [userId]);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// POST a new task for the logged-in user
app.post('/api/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, description } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
      [title, description || null, userId]
    );
    const newTask = { id: result.insertId, title, description: description || null, user_id: userId };
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// PATCH a task for the logged-in user
app.patch('/api/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const [result]: any = await pool.query(
            'UPDATE tasks SET title = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, description || null, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found or user not authorized' });
        }

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error("PATCH Error:", error);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

// DELETE a task for the logged-in user
app.delete('/api/tasks/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    
    const [result]: any = await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Task not found or user not authorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});