import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { Pool, Client } from "pg";

const app = express();
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "")
});

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "")
});

const setupDB = async () => {
    try {
        await client.connect();
        await client.query("CREATE TABLE IF NOT EXISTS user_table (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE, password VARCHAR(100))");
        const setupUser = await client.query("SELECT * FROM user_table WHERE name='test_user'");
        if (setupUser.rows.length === 0) {
            await client.query("INSERT INTO user_table (name, password) VALUES ('test_user', 'test_password')");
        }
        await client.query("CREATE TABLE IF NOT EXISTS favorite_item (id SERIAL PRIMARY KEY, user_id INT, item_id INT)");
    } catch (err) {
        console.log(err);
    }
};

setupDB();

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("hello express");
});
  
app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`);
});
