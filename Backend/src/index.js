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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.json());

// Serve Frontend static files
app.use(express.static(path.join(__dirname, "../../Frontend-React/dist")));
app.use(express.static(path.join(__dirname, "../../Frontend")));

// TEST DB CONNECTION
pool.query("SELECT NOW()")
    .then(() => {
        console.log(
            "Database connected"
        );
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