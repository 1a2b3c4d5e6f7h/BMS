
const express = require('express');
const pool = require('./config/db');
const customerRoutes = require('./modules/customers/customer.routes');
const accountRoutes = require('./modules/accounts/account.routes'); 
const transferRoutes = require('./modules/transfers/transfer.routes');


const app = express();

app.use(express.json());
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
// Basic API health check.
app.get('/', (req, res) => {
    res.json({
        message: 'Bank Management System API is running.'
    });
});

// Database health check.
app.get('/api/health/db', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW() AS database_time'
        );

        res.status(200).json({
            status: 'success',
            database: 'connected',
            databaseTime: result.rows[0].database_time
        });
    } catch (error) {
        console.error('Database health check failed:', error.message);

        res.status(503).json({
            status: 'error',
            database: 'unavailable'
        });
    }
});

module.exports = app;
