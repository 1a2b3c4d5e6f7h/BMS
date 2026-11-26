
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
// Middleware to authenticate JWT token and attach user info to request

async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required.'
        });
    }

    let decoded;

    // Step 1: Verify JWT signature and expiration.
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token.'
        });
    }

    try {
        // Step 2: Retrieve the user's current database information.
        const result = await pool.query(
            `SELECT user_id, customer_id, role, status, token_version
             FROM users
             WHERE user_id = $1`,
            [decoded.userId]
        );

        // Step 3: Ensure the user still exists.
        if (result.rows.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'User account not found.'
            });
        }
         const user = result.rows[0];
        // Step 4: Check if the token version matches the current version in the database.
        if (decoded.tokenVersion !== user.token_version) {
    return res.status(401).json({
        status: 'error',
        message: 'Token has been revoked. Please log in again.'
    });
}


        // Step 4: Reject disabled accounts.
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                status: 'error',
                message: 'Your account is disabled.'
            });
        }

        // Step 5: Attach current database information.
        req.user = {
            userId: user.user_id,
            customerId: user.customer_id,
            role: user.role
        };

        // Step 6: Continue to the next middleware.
        next();

    } catch (error) {
        console.error('Authentication database check failed:', error.message);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}

// middleware to ensure the authenticated user is the owner of the account being accessed
async function authorizeAccountOwner(req, res, next) {
    const { id } = req.params;
    const customerId = req.user.customerId;

    // Validate account ID
    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid account ID.'
        });
    }

    // Ensure the authenticated user is a customer
    if (!customerId) {
        return res.status(403).json({
            status: 'error',
            message: 'Customer access required.'
        });
    }

    try {
        const result = await pool.query(
            `SELECT account_id
             FROM bank_accounts
             WHERE account_id = $1
               AND customer_id = $2`,
            [id, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Account not found.'
            });
        }

        next();

    } catch (error) {
        console.error('Account ownership verification failed:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
// Middleware to authorize based on user roles

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this operation.'
            });
        }

        next();
    };
}

function authorizeCustomerAccess(req, res, next) {
    const { id } = req.params;

    // Validate the customer ID in the URL.
    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid customer ID.'
        });
    }

    // Employees and administrators can access customer records.
    if (['EMPLOYEE', 'ADMIN'].includes(req.user.role)) {
        return next();
    }

    // Customers can access only their own records.
    if (
        req.user.role === 'CUSTOMER' &&
        String(req.user.customerId) === id
    ) {
        return next();
    }

    // Do not reveal whether another customer's record exists.
    return res.status(404).json({
        status: 'error',
        message: 'Customer not found.'
    });
}


module.exports = {
    authenticateToken,
    authorizeAccountOwner,
    authorizeRoles,
    authorizeCustomerAccess
};



