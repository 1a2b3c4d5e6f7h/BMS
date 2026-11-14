
const pool = require('../../config/db');

async function createTransfer(req, res) {
    let client;
    let transactionStarted = false;

    try {
        const {
            source_account_id,
            destination_account_id,
            amount
        } = req.body ?? {};

        // 1. Validate account IDs.
        if (
            !/^[1-9]\d*$/.test(String(source_account_id ?? '')) ||
            !/^[1-9]\d*$/.test(String(destination_account_id ?? ''))
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid source or destination account ID.'
            });
        }

        // 2. Prevent transfers to the same account.
        if (source_account_id === destination_account_id ||
            String(source_account_id) === String(destination_account_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Source and destination accounts must be different.'
            });
        }

        // 3. Validate transfer amount.
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
                message: 'Transfer amount must be a valid positive number with at most two decimal places.'
            });
        }

        // 4. Get a database connection.
        client = await pool.connect();

        // 5. Start database transaction.
        await client.query('BEGIN');
        transactionStarted = true;

        // 6. Find and lock both accounts.
        const accountsResult = await client.query(
            `SELECT account_id, status, balance
             FROM bank_accounts
             WHERE account_id IN ($1, $2)
             ORDER BY account_id
             FOR UPDATE`,
            [source_account_id, destination_account_id]
        );

        if (accountsResult.rows.length !== 2) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(404).json({
                status: 'error',
                message: 'Source or destination account not found.'
            });
        }

        // 7. Identify the source and destination accounts.
        const sourceAccount = accountsResult.rows.find(
            account => account.account_id.toString() === String(source_account_id)
        );

        const destinationAccount = accountsResult.rows.find(
            account => account.account_id.toString() === String(destination_account_id)
        );

        // 8. Check source account status.
        if (sourceAccount.status !== 'ACTIVE') {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                status: 'error',
                message: 'The source account must be active.'
            });
        }

        // 9. Check destination account status.
        if (destinationAccount.status === 'CLOSED') {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                status: 'error',
                message: 'Cannot transfer money into a closed account.'
            });
        }

        // 10. Check available balance.
        const balanceResult = await client.query(
            `UPDATE bank_accounts
             SET balance = balance - $1
             WHERE account_id = $2
               AND balance >= $1
             RETURNING *`,
            [amountText, source_account_id]
        );

        if (balanceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(409).json({
                status: 'error',
                message: 'Insufficient balance. Transfer amount cannot exceed available balance.'
            });
        }

        // 11. Create transfer record.
        const transferResult = await client.query(
            `INSERT INTO transfers
                (source_account_id, destination_account_id, amount, status)
             VALUES ($1, $2, $3, 'PENDING')
             RETURNING *`,
            [source_account_id, destination_account_id, amountText]
        );

        const transferId = transferResult.rows[0].transfer_id;

        // 12. Increase destination account balance.
        const destinationBalanceResult = await client.query(
            `UPDATE bank_accounts
             SET balance = balance + $1
             WHERE account_id = $2
             RETURNING *`,
            [amountText, destination_account_id]
        );

        // 13. Record outgoing transaction.
        const outgoingResult = await client.query(
            `INSERT INTO transactions
                (account_id, transfer_id, transaction_type, amount, status)
             VALUES ($1, $2, 'TRANSFER_OUT', $3, 'COMPLETED')
             RETURNING *`,
            [source_account_id, transferId, amountText]
        );

        // 14. Record incoming transaction.
        const incomingResult = await client.query(
            `INSERT INTO transactions
                (account_id, transfer_id, transaction_type, amount, status)
             VALUES ($1, $2, 'TRANSFER_IN', $3, 'COMPLETED')
             RETURNING *`,
            [destination_account_id, transferId, amountText]
        );

        // 15. Mark transfer as completed.
        const completedTransferResult = await client.query(
            `UPDATE transfers
             SET status = 'COMPLETED'
             WHERE transfer_id = $1
             RETURNING *`,
            [transferId]
        );

        // 16. Commit all changes.
        await client.query('COMMIT');
        transactionStarted = false;

        return res.status(201).json({
            status: 'success',
            message: 'Transfer completed successfully.',
            data: {
                transfer: completedTransferResult.rows[0],
                source_account: balanceResult.rows[0],
                destination_account: destinationBalanceResult.rows[0],
                transactions: [
                    outgoingResult.rows[0],
                    incomingResult.rows[0]
                ]
            }
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError.message);
            }
        }

        console.error('Failed to process transfer:', error.message);

        if (error.code === '22003') {
            return res.status(400).json({
                status: 'error',
                message: 'Transfer amount exceeds the permitted range.'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = {
    createTransfer
};
