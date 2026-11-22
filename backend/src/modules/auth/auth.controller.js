
const pool = require('../../config/db');
const bcrypt = require('bcrypt');

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

module.exports = { register };
