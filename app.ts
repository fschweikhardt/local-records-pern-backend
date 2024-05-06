import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import pg from "pg";
import Postgrator from "postgrator";

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json()); 
dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "")
});

const dbSeed = async () => {
    try {
        const setupUser = await pool.query("SELECT * FROM user_table WHERE name='test_user'");
        if (setupUser.rows.length === 0) {
            await pool.query("INSERT INTO user_table (name, password) VALUES ('test_user', 'test_password')");
            console.log("Created test user on user_table");
        } else {
            console.error("Something went wrong; seed data should already be complete in dbSeed");
        }
    } catch (err) {
        console.error(err);
    }
};

const dbMigration = async () => {
    const client = new pg.Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || "")
    });
    await client.connect();

    try {
        const dbSetupCheck = await client.query("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'user_table');");
        if (dbSetupCheck.rows[0].exists) {
            console.log("Database is already setup");
            return;
        } else {
            console.log("Database is not setup");
            const postgrator = new Postgrator({
                migrationPattern: "migrations/*",
                driver: "pg",
                database: process.env.DB_NAME,
                execQuery: (query) => client.query(query),
            });
            await postgrator.migrate();
            console.log("Tables user_tables & favorite_item created");
            await client.end();
        
            dbSeed();
        } 
    } catch (err) {
        console.error("Error on dbMigration: ", err);
    } 
}

// Start server, create and seed tables
dbMigration();

// API routes
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
