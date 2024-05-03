CREATE TABLE IF NOT EXISTS user_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    password VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS favorite_item (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES user_table(id) ON DELETE CASCADE,
    item_id BIGINT
);
