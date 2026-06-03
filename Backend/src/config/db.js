import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pkg;

// Force pg driver to return TIMESTAMP (OID 1114) as a raw string without parsing to Date object.
// This prevents server timezone offset issues.
types.setTypeParser(1114, function(stringValue) {
    return stringValue;
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.on("connect", () => {
    console.log("Database connected");
});

pool.on("error", (err) => {
    console.error(
        "Database connection error:",
        err
    );
});

export default pool;