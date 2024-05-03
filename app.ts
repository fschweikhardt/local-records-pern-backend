import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
// @ts-ignore
// import { Client, OAuthCallbackAuth } from "disconnect";
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

var Discogs = require('disconnect').Client;
app.get("/api/testDis", async (req: Request, res: Response, next: NextFunction) => {
    var db = new Discogs().database();
    try {
        const data = await db.getRelease(176126);
        res.json(data);
    } catch (err) {
        console.log(err);
    }
});

// this is redirecting in Postman, 
// but getting a CORS error in the browser
// code for this package is at https://github.com/bartve/disconnect
// https://github.com/vivster7/myRecs/blob/46d05f582584f2aea7414ea00b49c345f1245e37/server.js#L21
app.get('/api/authorize', async (req: Request, res: Response, next: NextFunction) => {
    console.log('hit');

    try {
        var oAuth = await new Discogs().oauth();

        return await oAuth.getRequestToken(
            process.env.CONSUMER_KEY, 
            process.env.CONSUMER_SECRET, 
            'http://127.0.0.1:8000/api/callback',
            async (err: any, requestData: any) => {
                // setCookie('requestData', requestData);
                res.redirect(requestData.authorizeUrl);
            }
        );
      } catch (err) {
        res.send(err);
      }
});
  
app.listen(process.env.PORT, () => {
    console.log(`Server is running at ${process.env.PORT}`);
});
