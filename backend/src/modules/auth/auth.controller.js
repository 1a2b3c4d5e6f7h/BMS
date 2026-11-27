
const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Middleware to authenticate JWT token and attach user info to request
async function register(req, res) {
    const { full_name, phone, email, password } = req.body;

    // 1. Validate required fields
    if (!full_name || !email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Full name, email and password are required.'
        });
    }

    const name = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!name || name.length > 150) {
        return res.status(400).json({
            status: 'error',
            message: 'Full name must contain 1 to 150 characters.'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        normalizedEmail.length > 254) {
        return res.status(400).json({
            status: 'error',
            message: 'Please provide a valid email address.'
        });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
            status: 'error',
            message: 'Password must contain at least 8 characters.'
        });
    }

    // 2. Hash password before database operations
    const passwordHash = await bcrypt.hash(password, 12);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 3. Create customer record
        const customerResult = await client.query(
            `INSERT INTO customers (full_name, phone, email)
             VALUES ($1, $2, $3)
             RETURNING customer_id, full_name, phone, email`,
            [name, phone?.trim() || null, normalizedEmail]
        );

        const customer = customerResult.rows[0];

        // 4. Create login account
        const userResult = await client.query(
            `INSERT INTO users
                (customer_id, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING user_id, customer_id, email, role, status`,
            [
                customer.customer_id,
                normalizedEmail,
                passwordHash,
                'CUSTOMER'
            ]
        );

        await client.query('COMMIT');

        // 5. Return successful registration
        return res.status(201).json({
            status: 'success',
            message: 'Customer registered successfully.',
            data: {
                customer,
                user: userResult.rows[0]
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');

        if (error.code === '23505') {
            return res.status(409).json({
                status: 'error',
                message: 'An account with this email already exists.'
            });
        }

        console.error('Registration failed:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });

    } finally {
        client.release();
    }
}
//.....Login Path.....

async function login(req, res) {
    const { email, password } = req.body;

    // 1. Validate input
    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Email and password are required.'
        });
    }

    try {
        // 2. Find user by email
        const result = await pool.query(
            `SELECT user_id, customer_id, email,
                    password_hash, role, status, token_version
             FROM users
             WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        const user = result.rows[0];

        // 3. Verify credentials
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.'
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password.'
            });
        }

        // 4. Check account status
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                status: 'error',
                message: 'Your account is disabled.'
            });
        }

        // 5. Generate JWT
        const token = jwt.sign(
            {
                userId: user.user_id,
                customerId: user.customer_id,
                role: user.role,
                tokenVersion: user.token_version
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        // 6. Return token and safe user information
        return res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            data: {
                token,
                user: {
                    user_id: user.user_id,
                    customer_id: user.customer_id,
                    email: user.email,
                    role: user.role

                }
            }
        });

    } catch (error) {
        console.error('Login failed:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
// Logout function to invalidate all existing sessions by incrementing the token version
async function logout(req, res) {
    try {
        const result = await pool.query(
            `UPDATE users
             SET token_version = token_version + 1
             WHERE user_id = $1
             RETURNING user_id`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User account not found.'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Logged out successfully. All existing sessions have been invalidated.'
        });

    } catch (error) {
        console.error('Logout failed:', error.message);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}

module.exports = { register, login, logout };
