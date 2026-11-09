
CREATE TABLE transactions (
    transaction_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    account_id BIGINT NOT NULL,

    transfer_id BIGINT,

    transaction_type VARCHAR(20) NOT NULL,

    amount NUMERIC(18, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',

    transaction_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES bank_accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transactions_transfer
        FOREIGN KEY (transfer_id)
        REFERENCES transfers(transfer_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_transaction_type
        CHECK (
            transaction_type IN (
                'DEPOSIT',
                'WITHDRAWAL',
                'TRANSFER_IN',
                'TRANSFER_OUT'
            )
        ),

    CONSTRAINT chk_transaction_amount
        CHECK (amount > 0),

    CONSTRAINT chk_transaction_status
        CHECK (status IN ('COMPLETED', 'REVERSED'))
);
