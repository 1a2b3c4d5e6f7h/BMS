
const pool = require('../../config/db');
//........Create a new bank account........!!!!

async function createAccount(req, res) {
    try {
        const {
            account_number,
            customer_id,
            account_type
        } = req.body;

        // Validate required fields.
        if (!account_number || !customer_id || !account_type) {
            return res.status(400).json({
                status: 'error',
                message: 'Account number, customer ID, and account type are required.'
            });
        }

        // Validate account type.
        if (!['SAVINGS', 'CURRENT'].includes(account_type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Account type must be SAVINGS or CURRENT.'
            });
        }

        // Check whether the customer exists.
        const customer = await pool.query(
            'SELECT customer_id FROM customers WHERE customer_id = $1',
            [customer_id]
        );

        if (customer.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found.'
            });
        }

        // Create the bank account.
        const result = await pool.query(
            `INSERT INTO bank_accounts
                (account_number, customer_id, account_type)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [account_number, customer_id, account_type]
        );

        res.status(201).json({
            status: 'success',
            message: 'Bank account created successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to create account:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                status: 'error',
                message: 'Account number already exists.'
            });
        }

        if (error.code === '23503') {
            return res.status(409).json({
                status: 'error',
                message: 'Customer reference is invalid.'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
//........getAllAccounts........!!!!
async function getAllAccounts(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM bank_accounts ORDER BY account_id'
        );

        res.status(200).json({
            status: 'success',
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error('Failed to retrieve accounts:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
//........getAccountById........!!!!
async function getAccountById(req, res) {
    try {
        const { account_id } = req.params;

        const result = await pool.query(
            'SELECT * FROM bank_accounts WHERE account_id = $1',
            [account_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Account not found.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to retrieve account:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
//.....updateAccount status........!!!!
async function updateAccountStatus(req, res) {
    try {
        const { account_id } = req.params;
        const { status } = req.body;
          // Validate the requested status.
        if (!['ACTIVE', 'FROZEN', 'CLOSED'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Status must be ACTIVE, FROZEN, or CLOSED.'
            });
        }

        const result = await pool.query(
            'UPDATE bank_accounts SET status = $1 WHERE account_id = $2 RETURNING *',
            [status, account_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Account not found.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Failed to update account status:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
}
//........Export the controller functions........!!!!
module.exports = {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccountStatus
};
