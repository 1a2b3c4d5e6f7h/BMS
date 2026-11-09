
CREATE TABLE transfers (
    transfer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    source_account_id BIGINT NOT NULL,
    destination_account_id BIGINT NOT NULL,

    amount NUMERIC(18, 2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transfers_source_account
        FOREIGN KEY (source_account_id)
        REFERENCES bank_accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfers_destination_account
        FOREIGN KEY (destination_account_id)
        REFERENCES bank_accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_transfer_amount
        CHECK (amount > 0),

    CONSTRAINT chk_transfer_status
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),

    CONSTRAINT chk_transfer_accounts
        CHECK (source_account_id <> destination_account_id)
);
