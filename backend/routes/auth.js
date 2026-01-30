import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        // Generate token
        const token = jwt.sign(
            { userId: result.insertId, username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: result.insertId, username, email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await pool.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// Update user profile (username and/or password)
router.put('/update', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { username, password, currentPassword } = req.body;

        // Get current user
        const [users] = await pool.execute(
            'SELECT id, username, email, password_hash FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const updates = [];
        const values = [];

        // Update username if provided
        if (username && username !== user.username) {
            // Check if new username is already taken
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, user.id]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            updates.push('username = ?');
            values.push(username);
        }

        // Update password if provided
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to change password' });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            values.push(passwordHash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        // Update user
        values.push(user.id);
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const [updatedUsers] = await pool.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [user.id]
        );

        res.json({
            message: 'Profile updated successfully',
            user: updatedUsers[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
