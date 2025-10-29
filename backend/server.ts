import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import pool from './db'; // <-- THE FIX IS ON THIS LINE
import { authMiddleware } from './authMiddleware';
import { adminMiddleware } from './adminMiddleware';

dotenv.config();

interface User extends RowDataPacket {
    id: number;
    name: string;  // Add this
    email: string;
    password: string;
    role: string;
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

app.get('/api/tasks/all', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        tasks.id, 
        tasks.title, 
        tasks.description, 
        tasks.user_id, 
        users.name, 
        users.email 
      FROM tasks 
      JOIN users ON tasks.user_id = users.id 
      ORDER BY tasks.id DESC
    `;
    const [tasks] = await pool.query(query);
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching all tasks' });
  }
});

// === AUTHENTICATION ROUTES ===
app.post('/api/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
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
        const tokenPayload = { 
            userId: user.id, 
            email: user.email,
            name: user.name,  // Add this
            role: user.role
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, { expiresIn: '10s' });
        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.get('/api/user/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // 1. Fetch user details
    const [users] = await pool.query<User[]>('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userDetails = users[0];

    // 2. Fetch all tasks for that user
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [userId]);

    // 3. Combine and send the response
    res.json({
      user: userDetails,
      tasks: tasks,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
});

// === PROTECTED TASK ROUTES ===

app.get('/api/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [userId]);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

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

app.get('/api/admin/all-tasks', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const [tasks] = await pool.query(`
            SELECT tasks.*, users.email 
            FROM tasks 
            JOIN users ON tasks.user_id = users.id 
            ORDER BY tasks.id DESC
        `);
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching all tasks' });
    }
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

