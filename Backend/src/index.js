import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import pool from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Redundant static file serving removed for separate Vercel deployment

// TEST DB CONNECTION
pool.query("SELECT NOW()")
    .then(async () => {
        console.log(
            "Database connected"
        );
        try {
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT");
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)");
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP");
            
            // Create notifications table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id_notifications SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id_users) ON DELETE CASCADE,
                    task_id INT REFERENCES tasks(id_tasks) ON DELETE CASCADE,
                    type VARCHAR(50) DEFAULT 'deadline_h1',
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            console.log("Database schema updated: avatar, reset password columns, and notifications table checked/added");
        } catch (err) {
            console.error("Failed to run schema migrations:", err);
        }
    })
    .catch((err) => {
        console.log(err);
    });

app.use("/api/users", userRoutes);

// ROUTES
app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/tasks",
    taskRoutes
);

app.use("/api/notifications", notificationRoutes);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

// ROOT
app.get("/", (req, res) => {
    res.send(
        "DoneRight API Running"
    );
});

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});

app.use(
    "/api/statistics",
    statisticsRoutes
);

export default app;