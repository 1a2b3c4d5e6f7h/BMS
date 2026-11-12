const pool = require('../../config/db');
async function getAllCustomers(req, res) {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY customer_id');
        res.status(200).json({
            status: 'success',
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching customers:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching customers.'
        });
    }
}
// Get a specific customer by ID
async function getCustomerById(req, res) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM customers WHERE customer_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to retrieve customer:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}

module.exports = {
    getAllCustomers,
    getCustomerById
};