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
// ...........Get a specific customer by ID.......!!!!
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
        // ....CREATE A NEW CUSTOMER.....!!!

async function createCustomer(req, res) {
    try {
        const { full_name, phone, email } = req.body;

        //.... Validate required information..........
        if (!full_name || !full_name.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'Full name is required.'
            });
        }

        //....... Insert the customer into PostgreSQL.......
        const result = await pool.query(
            `INSERT INTO customers (full_name, phone, email)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [full_name.trim(), phone || null, email || null]
        );

        res.status(201).json({
            status: 'success',
            message: 'Customer created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to create customer:', error.message);

        // ......Handle duplicate email........
        if (error.code === '23505') {
            return res.status(409).json({
                status: 'error',
                message: 'Email already exists.'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
// ......update a customer by ID........!!!

async function updateCustomer(req, res) {
    try {
        const { id } = req.params;
        const { full_name, phone, email } = req.body;

        // Validate required information.
        if (!full_name || !full_name.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'Full name is required.'
            });
        }

        const result = await pool.query(
            `UPDATE customers
             SET full_name = $1,
                 phone = $2,
                 email = $3
             WHERE customer_id = $4
             RETURNING *`,
            [full_name.trim(), phone || null, email || null, id]
        );

        // Check whether the customer exists.
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found.'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Customer updated successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to update customer:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                status: 'error',
                message: 'Email already exists.'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
//....Delete a customer by ID........!!!

async function deleteCustomer(req, res) {
    try {
        const { id } = req.params;
       

        const result = await pool.query(
            `DELETE FROM customers
             WHERE customer_id = $1
             RETURNING *`,
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
            message: 'Customer deleted successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to delete customer:', error.message);

        // PostgreSQL foreign-key violation.
        if (error.code === '23503') {
            return res.status(409).json({
                status: 'error',
                message: 'Cannot delete customer because associated records exist.'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}


//......... Exported Controller Functions.........!!!
module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer

};