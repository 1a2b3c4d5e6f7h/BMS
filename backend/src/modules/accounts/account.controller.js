
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
//........Deposit into an account........!!!!

async function deposit(req, res) {
    let client;
    let transactionStarted = false;

    try {
        const { id } = req.params;
        const { amount } = req.body ?? {};

        // 1. Validate account ID.
        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid account ID.'
            });
        }

        // 2. Validate deposit amount.
        const amountText =
            typeof amount === 'string'
                ? amount.trim()
                : typeof amount === 'number' && Number.isFinite(amount)
                    ? String(amount)
                    : '';

        if (
            !/^\d+(\.\d{1,2})?$/.test(amountText) ||
            !Number.isFinite(Number(amountText)) ||
            Number(amountText) <= 0
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Deposit amount must be a valid positive number with at most two decimal places.'
            });
        }

        // 3. Get a database connection.
        client = await pool.connect();

        // 4. Start the database transaction.
        await client.query('BEGIN');
        transactionStarted = true;

        // 5. Find and lock the account.
        const accountResult = await client.query(
            `SELECT account_id, status
             FROM bank_accounts
             WHERE account_id = $1
             FOR UPDATE`,
            [id]
        );

        if (accountResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(404).json({
                status: 'error',
                message: 'Account not found.'
            });
        }

        const account = accountResult.rows[0];

        // 6. Prevent deposits into closed accounts.
        if (account.status === 'CLOSED') {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                status: 'error',
                message: 'Cannot deposit into a closed account.'
            });
        }

        // 7. Update the account balance.
        const balanceResult = await client.query(
            `UPDATE bank_accounts
             SET balance = balance + $1
             WHERE account_id = $2
             RETURNING *`,
            [amountText, id]
        );

        // 8. Record the deposit in transaction history.
        const transactionResult = await client.query(
            `INSERT INTO transactions
                (account_id, transaction_type, amount, status)
             VALUES ($1, 'DEPOSIT', $2, 'COMPLETED')
             RETURNING *`,
            [id, amountText]
        );

        // 9. Commit both database changes.
        await client.query('COMMIT');
        transactionStarted = false;

        // 10. Return the result.
        return res.status(201).json({
            status: 'success',
            message: 'Deposit completed successfully.',
            data: {
                account: balanceResult.rows[0],
                transaction: transactionResult.rows[0]
            }
        });

    } catch (error) {
        // Roll back if a database operation fails.
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError.message);
            }
        }

        console.error('Failed to process deposit:', error.message);

        if (error.code === '22003') {
            return res.status(400).json({
                status: 'error',
                message: 'Deposit amount exceeds the permitted range.'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });

    } finally {
        // Return the connection to the pool.
        if (client) {
            client.release();
        }
    }
}

//........Export the controller functions........!!!!
module.exports = {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccountStatus,
    deposit
};

