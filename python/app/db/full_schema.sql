BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> fd5110a08963

CREATE TABLE categories (
    id SERIAL NOT NULL, 
    name VARCHAR NOT NULL, 
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_categories_id ON categories (id);

CREATE TYPE paymenttype AS ENUM ('CASH');

CREATE TABLE payment (
    id SERIAL NOT NULL, 
    type paymenttype NOT NULL, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_payment_id ON payment (id);

CREATE TYPE usertype AS ENUM ('ADMIN', 'USER', 'DELIVERY', 'STORE_MANAGER');

CREATE TABLE users (
    id SERIAL NOT NULL, 
    email VARCHAR NOT NULL, 
    mobile VARCHAR NOT NULL, 
    secondary_phone VARCHAR, 
    active BOOLEAN NOT NULL, 
    type usertype NOT NULL, 
    "referredBy" INTEGER, 
    "referralId" VARCHAR NOT NULL, 
    "cognitoId" VARCHAR NOT NULL, 
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY("referredBy") REFERENCES users (id), 
    UNIQUE ("cognitoId"), 
    UNIQUE (email), 
    UNIQUE (mobile)
);

CREATE INDEX ix_users_id ON users (id);

CREATE TABLE address (
    id SERIAL NOT NULL, 
    address VARCHAR NOT NULL, 
    "userId" INTEGER NOT NULL, 
    "isPrimary" BOOLEAN, 
    PRIMARY KEY (id), 
    FOREIGN KEY("userId") REFERENCES users (id)
);

CREATE INDEX ix_address_id ON address (id);

CREATE TABLE products (
    id SERIAL NOT NULL, 
    name VARCHAR NOT NULL, 
    description VARCHAR, 
    "categoryId" INTEGER NOT NULL, 
    image VARCHAR, 
    PRIMARY KEY (id), 
    FOREIGN KEY("categoryId") REFERENCES categories (id)
);

CREATE INDEX ix_products_id ON products (id);

CREATE TABLE store (
    id SERIAL NOT NULL, 
    name VARCHAR NOT NULL, 
    address VARCHAR NOT NULL, 
    radius FLOAT, 
    "managerUserId" INTEGER NOT NULL, 
    email VARCHAR NOT NULL, 
    mobile VARCHAR, 
    is_active BOOLEAN NOT NULL, 
    disabled BOOLEAN NOT NULL, 
    description VARCHAR, 
    pincodes VARCHAR[], 
    tnc VARCHAR, 
    "storeDeliveryFee" FLOAT, 
    "taxPercentage" FLOAT, 
    section_headers VARCHAR[], 
    display_field VARCHAR NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY("managerUserId") REFERENCES users (id), 
    UNIQUE (display_field), 
    UNIQUE (email), 
    UNIQUE (mobile)
);

CREATE INDEX ix_store_id ON store (id);

CREATE TYPE feetype AS ENUM ('DELIVERY', 'PICKUP');

CREATE TABLE fees (
    id SERIAL NOT NULL, 
    store_id INTEGER NOT NULL, 
    fee_rate FLOAT NOT NULL, 
    fee_currency VARCHAR NOT NULL, 
    type feetype NOT NULL, 
    "limit" FLOAT, 
    PRIMARY KEY (id), 
    FOREIGN KEY(store_id) REFERENCES store (id)
);

CREATE INDEX ix_fees_id ON fees (id);

CREATE TABLE inventory (
    id SERIAL NOT NULL, 
    "storeId" INTEGER NOT NULL, 
    "productId" INTEGER NOT NULL, 
    price FLOAT, 
    quantity INTEGER, 
    measurement INTEGER, 
    unit VARCHAR, 
    is_listed BOOLEAN NOT NULL, 
    is_available BOOLEAN NOT NULL, 
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE, 
    PRIMARY KEY (id), 
    FOREIGN KEY("productId") REFERENCES products (id), 
    FOREIGN KEY("storeId") REFERENCES store (id)
);

CREATE INDEX ix_inventory_id ON inventory (id);

CREATE TABLE pickup_addresses (
    id SERIAL NOT NULL, 
    store_id INTEGER NOT NULL, 
    address VARCHAR NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(store_id) REFERENCES store (id)
);

CREATE INDEX ix_pickup_addresses_id ON pickup_addresses (id);

CREATE TABLE store_driver (
    id SERIAL NOT NULL, 
    "userId" INTEGER NOT NULL, 
    "storeId" INTEGER NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY("storeId") REFERENCES store (id), 
    FOREIGN KEY("userId") REFERENCES users (id), 
    CONSTRAINT unique_store_driver UNIQUE ("userId", "storeId")
);

CREATE INDEX ix_store_driver_id ON store_driver (id);

CREATE TABLE store_location_codes (
    id SERIAL NOT NULL, 
    store_id INTEGER NOT NULL, 
    location VARCHAR NOT NULL, 
    code VARCHAR NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(store_id) REFERENCES store (id)
);

CREATE INDEX ix_store_location_codes_id ON store_location_codes (id);

CREATE TYPE orderstatus AS ENUM ('PENDING', 'ORDER_PLACED', 'ACCEPTED', 'CANCELLED', 'READY_FOR_DELIVERY', 'SCHEDULED', 'PICKED_UP', 'DELIVERED');

CREATE TABLE orders (
    id SERIAL NOT NULL, 
    "createdByUserId" INTEGER NOT NULL, 
    "addressId" INTEGER, 
    "pickupId" INTEGER, 
    type feetype, 
    "storeId" INTEGER NOT NULL, 
    status orderstatus NOT NULL, 
    "paymentId" INTEGER, 
    "totalAmount" FLOAT NOT NULL, 
    "deliveryDate" TIMESTAMP WITHOUT TIME ZONE, 
    "deliveryInstructions" VARCHAR, 
    bill_url VARCHAR, 
    "deliveryFee" FLOAT, 
    "tipAmount" FLOAT, 
    "orderTotalAmount" FLOAT NOT NULL, 
    "taxAmount" FLOAT, 
    display_code VARCHAR, 
    custom_order VARCHAR, 
    "cancelMessage" VARCHAR, 
    "cancelledByUserId" INTEGER, 
    "cancelledAt" TIMESTAMP WITHOUT TIME ZONE, 
    PRIMARY KEY (id), 
    FOREIGN KEY("addressId") REFERENCES address (id), 
    FOREIGN KEY("cancelledByUserId") REFERENCES users (id), 
    FOREIGN KEY("createdByUserId") REFERENCES users (id), 
    FOREIGN KEY("paymentId") REFERENCES payment (id), 
    FOREIGN KEY("pickupId") REFERENCES pickup_addresses (id), 
    FOREIGN KEY("storeId") REFERENCES store (id)
);

CREATE INDEX ix_orders_id ON orders (id);

CREATE TABLE delivery (
    id SERIAL NOT NULL, 
    "orderId" INTEGER NOT NULL, 
    "driverId" INTEGER, 
    "pickedUpTime" TIMESTAMP WITHOUT TIME ZONE, 
    "deliveredTime" TIMESTAMP WITHOUT TIME ZONE, 
    photo VARCHAR, 
    comments VARCHAR, 
    PRIMARY KEY (id), 
    FOREIGN KEY("driverId") REFERENCES users (id), 
    FOREIGN KEY("orderId") REFERENCES orders (id)
);

CREATE INDEX ix_delivery_id ON delivery (id);

CREATE TABLE order_items (
    id SERIAL NOT NULL, 
    "productId" INTEGER NOT NULL, 
    "inventoryId" INTEGER NOT NULL, 
    quantity INTEGER NOT NULL, 
    "orderId" INTEGER NOT NULL, 
    "orderAmount" FLOAT NOT NULL, 
    "updatedOrderitemsId" INTEGER, 
    PRIMARY KEY (id), 
    FOREIGN KEY("inventoryId") REFERENCES inventory (id), 
    FOREIGN KEY("orderId") REFERENCES orders (id), 
    FOREIGN KEY("productId") REFERENCES products (id), 
    FOREIGN KEY("updatedOrderitemsId") REFERENCES order_items (id)
);

CREATE INDEX ix_order_items_id ON order_items (id);

INSERT INTO alembic_version (version_num) VALUES ('fd5110a08963') RETURNING alembic_version.version_num;

-- Running upgrade fd5110a08963 -> 969fab48c25a

UPDATE alembic_version SET version_num='969fab48c25a' WHERE alembic_version.version_num = 'fd5110a08963';

COMMIT;

