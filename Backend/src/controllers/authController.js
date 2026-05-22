import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";

import {
    createUser,
    findUserByEmail,
} from "../models/userModel.js";

// REGISTER
export const register = async (
    req,
    res
) => {
    try {
        const {
            username,
            email,
            password,
        } = req.body;

        // validasi kosong
        if (
            !username ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "All fields are required",
            });
        }

        // cek email sudah ada
        const existingUser =
            await findUserByEmail(email);

        if (existingUser) {
            return res.status(400).json({
                message:
                    "Email already exists",
            });
        }

        // hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // create user
        const user = await createUser(
            username,
            email,
            hashedPassword
        );

        res.status(201).json({
            message:
                "Register success",
            user,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Internal server error",
        });
    }
};

// LOGIN
export const login = async (
    req,
    res
) => {
    try {
        const {
            email,
            password,
        } = req.body;

        const user =
            await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found",
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!isMatch) {
            return res.status(401).json({
                message:
                    "Wrong password",
            });
        }

        const token = jwt.sign(
            {
                id: user.id_users,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            message: "Login success",
            token,
            user,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Internal server error",
        });
    }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                message: "User with this email does not exist",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            `UPDATE users
             SET reset_token = $1, reset_token_expires = $2
             WHERE id_users = $3`,
            [hashedToken, expires, user.id_users]
        );

        const resetUrl = `http://localhost:5173/?resetToken=${resetToken}`;

        console.log("=========================================");
        console.log("PASSWORD RESET REQUEST");
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("=========================================");

        res.status(200).json({
            message: "Password reset link has been sent to your email (dev mode)",
            devResetUrl: resetUrl,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message: "Token and new password are required",
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const query = `
            SELECT * FROM users
            WHERE reset_token = $1
              AND reset_token_expires > CURRENT_TIMESTAMP
              AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [hashedToken]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({
                message: "Reset token is invalid or has expired",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE users
             SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
             WHERE id_users = $2`,
            [hashedPassword, user.id_users]
        );

        res.status(200).json({
            message: "Password has been reset successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};