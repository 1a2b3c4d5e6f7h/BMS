
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
// Middleware to authenticate JWT token and attach user info to request
function authenticateToken(req, res, next) {
    // 1. Retrieve Authorization header
    const authHeader = req.headers.authorization;

    // 2. Extract token
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;
       
    // 3. Reject requests without a token
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required.'
        });
    }

    // 4. Verify token
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 5. Attach authenticated user to request
        req.user = decoded;

        // 6. Continue to the next middleware or controller
        next();

    } catch (error) {
    console.error('JWT verification error:', error.message);

    return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token.'
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

module.exports = {
    authenticateToken,
    authorizeAccountOwner
};


