import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";

import {
    createUser,
    findUserByEmail,
} from "../models/userModel.js";
import { isValidEmailDomain } from "../utils/emailValidator.js";
import { sendEmail } from "../utils/emailSender.js";

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

        // 1. Verify email domain MX record to prevent fake emails
        const emailValid = await isValidEmailDomain(email);
        if (!emailValid) {
            return res.status(400).json({
                message: "Email Anda tidak valid atau tidak dapat menerima pesan. Silakan gunakan email lain.",
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

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const expires = new Date(Date.now() + 24 * 3600000); // 24 hours from now

        // create user
        const user = await createUser(
            username,
            email,
            hashedPassword,
            hashedToken,
            expires
        );

        // Send verification email
        const host = req.get('host') || "localhost:5000";
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const backendUrl = `${protocol}://${host}`;
        const frontendUrl = req.get('origin') || process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${verificationToken}&f=${encodeURIComponent(frontendUrl)}`;

        const emailHtml = `
<div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; overflow: hidden;">
    <!-- Banner Header Gradient -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">DoneRight</h1>
      <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Sistem Manajemen Tugas Mahasiswa</p>
    </div>
    
    <!-- Body Utama -->
    <div style="padding: 40px 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Verifikasi Akun DoneRight Anda</h2>
      <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">Terima kasih telah mendaftar di DoneRight! Silakan klik tombol di bawah ini untuk mengaktifkan akun Anda:</p>
      
      <!-- Tombol Aksi Utama -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 30px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); letter-spacing: -0.2px;">
          Verifikasi Akun
        </a>
      </div>
      
      <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        Tautan ini hanya berlaku selama <strong>24 jam</strong> demi keamanan akun Anda. Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh sistem DoneRight.</p>
      <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">&copy; 2026 DoneRight. All rights reserved.</p>
    </div>
  </div>
</div>
        `;

        try {
            await sendEmail({
                to: email,
                subject: "Verifikasi Pendaftaran Akun - DoneRight",
                html: emailHtml,
            });
        } catch (mailError) {
            console.error("Failed to send verification email:", mailError.message);
        }

        res.status(201).json({
            message:
                "Registrasi sukses! Silakan periksa kotak masuk email Anda untuk memverifikasi akun Anda.",
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

        // Check if user is verified
        if (!user.is_verified) {
            return res.status(401).json({
                message: "Akun Anda belum aktif. Silakan verifikasi email Anda terlebih dahulu.",
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

        // 1. Verify email domain MX record to prevent fake emails
        const emailValid = await isValidEmailDomain(email);
        if (!emailValid) {
            return res.status(400).json({
                message: "Email Anda tidak valid atau tidak dapat menerima pesan. Silakan gunakan email lain.",
            });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({
                message: "User dengan email ini tidak ditemukan.",
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

        const frontendUrl = req.get('origin') || process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${frontendUrl}/?resetToken=${resetToken}`;

        // 2. Build email template
        const emailHtml = `
<div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; overflow: hidden;">
    <!-- Banner Header Gradient -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">DoneRight</h1>
      <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Sistem Manajemen Tugas Mahasiswa</p>
    </div>
    
    <!-- Body Utama -->
    <div style="padding: 40px 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Atur Ulang Kata Sandi Anda</h2>
      <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">Kami menerima permintaan untuk mengatur ulang kata sandi akun DoneRight Anda. Silakan klik tombol di bawah ini untuk membuat kata sandi baru:</p>
      
      <!-- Tombol Aksi Utama -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 30px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); letter-spacing: -0.2px;">
          Atur Ulang Kata Sandi
        </a>
      </div>
      
      <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        Tautan ini hanya berlaku selama <strong>1 jam</strong> demi keamanan akun Anda. Jika Anda tidak merasa meminta ini, Anda dapat mengabaikan email ini dengan aman.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh sistem DoneRight.</p>
      <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">&copy; 2026 DoneRight. All rights reserved.</p>
    </div>
  </div>
</div>
        `;

        // 3. Send email asynchronously using try...catch
        try {
            await sendEmail({
                to: email,
                subject: "Atur Ulang Kata Sandi - DoneRight",
                html: emailHtml,
            });
        } catch (mailError) {
            console.error("Failed to send forgot password email, but token saved:", mailError.message);
        }

        res.status(200).json({
            message: "Instruksi pengaturan ulang kata sandi telah dikirim ke email Anda.",
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

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
    try {
        const { token, f } = req.query;

        if (!token) {
            return res.status(400).json({
                message: "Verification token is required",
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const query = `
            SELECT * FROM users
            WHERE verification_token = $1
              AND verification_token_expires > CURRENT_TIMESTAMP
              AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [hashedToken]);
        const user = result.rows[0];

        // Determine dynamic frontend URL for redirection
        const fallbackFrontend = process.env.FRONTEND_URL || "http://localhost:5173";
        let redirectUrl = fallbackFrontend;
        if (f) {
            try {
                const parsed = new URL(f);
                if (
                    parsed.hostname === "localhost" ||
                    parsed.hostname === "127.0.0.1" ||
                    parsed.hostname.endsWith(".vercel.app") ||
                    (process.env.FRONTEND_URL && new URL(process.env.FRONTEND_URL).hostname === parsed.hostname)
                ) {
                    redirectUrl = f;
                }
            } catch (e) {
                // invalid URL format, ignore and use fallback
            }
        }

        if (!user) {
            return res.status(400).send(`
                <html>
                  <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #ef4444;">Verifikasi Gagal</h2>
                    <p>Tautan verifikasi tidak valid atau telah kedaluwarsa.</p>
                    <a href="${redirectUrl}" style="color: #4f46e5;">Kembali ke Aplikasi</a>
                  </body>
                </html>
            `);
        }

        await pool.query(
            `UPDATE users
             SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
             WHERE id_users = $1`,
            [user.id_users]
        );

        res.redirect(`${redirectUrl}/?verified=success`);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};