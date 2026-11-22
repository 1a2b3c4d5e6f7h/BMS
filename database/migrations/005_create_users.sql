
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    customer_id BIGINT UNIQUE,

    email VARCHAR(254) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_users_role
        CHECK (role IN ('CUSTOMER', 'EMPLOYEE', 'ADMIN')),

    CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'DISABLED')),

    CONSTRAINT chk_users_customer_role
        CHECK (
            (role = 'CUSTOMER' AND customer_id IS NOT NULL)
            OR
            (role IN ('EMPLOYEE', 'ADMIN') AND customer_id IS NULL)
        )
);
