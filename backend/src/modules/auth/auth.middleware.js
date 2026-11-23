
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // 1. Retrieve Authorization header
    const authHeader = req.headers.authorization;

    // 2. Extract token
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;
        console.log('Token received:', Boolean(token));
console.log('Token parts:', token ? token.split('.').length : 0);

    // 3. Reject requests without a token
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required.'
        });
    }
console.log('Token length:', token.length);
console.log('Token starts correctly:', token.startsWith('eyJ'));
console.log('Token contains whitespace:', /\s/.test(token));
console.log('Token format:', 
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)
);
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

module.exports = { authenticateToken };
