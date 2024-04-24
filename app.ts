import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json()); 
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "")
});

const setupDB = async () => {
    try {
        await pool.connect();
        await pool.query("CREATE TABLE IF NOT EXISTS user_table (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE, password VARCHAR(100))");
        const setupUser = await pool.query("SELECT * FROM user_table WHERE name='test_user'");
        if (setupUser.rows.length === 0) {
            await pool.query("INSERT INTO user_table (name, password) VALUES ('test_user', 'test_password')");
        }
        await pool.query("CREATE TABLE IF NOT EXISTS favorite_item (id SERIAL PRIMARY KEY, user_id INT, item_id BIGINT)");
    } catch (err) {
        console.log(err);
    }
};

setupDB();

app.get("/api/test", (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: "hello world" });
});

app.get("/api/displayFavorites", async (req: Request, res: Response, next: NextFunction) => {
    const result = await pool.query("SELECT * FROM favorite_item WHERE user_id=1");
    res.json(result.rows);
});

app.post("/api/addToFavorites", async (req: Request, res: Response, next: NextFunction) => {
    const {item_id} = req.body;
    await pool.query("INSERT INTO favorite_item (user_id, item_id) VALUES (1, $1)", [item_id]);
    console.log(`req to add ${item_id} to favorites`);
    res.status(201).json({ message: "added to favorites" });
});
  
app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`);
});
