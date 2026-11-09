
CREATE TABLE bank_accounts (
    account_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    account_number VARCHAR(34) NOT NULL UNIQUE,

    customer_id BIGINT NOT NULL,

    account_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bank_accounts_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_account_type
        CHECK (account_type IN ('SAVINGS', 'CURRENT')),

    CONSTRAINT chk_account_status
        CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),

    CONSTRAINT chk_account_balance
        CHECK (balance >= 0)
);
