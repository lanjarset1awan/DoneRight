import {
    getUserById,
    updateUser,
    deleteUser
} from "../models/userModel.js";

import bcrypt from "bcryptjs";

// GET PROFILE
export const getProfile = async (req, res) => {
    try {
        const user = await getUserById(req.user.id);

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
    try {
        const { username, email, password, avatar } = req.body;

        let password_hash = null;
        if (password) {
            password_hash = await bcrypt.hash(password, 10);
        }

        let avatarUrl = avatar;
        if (avatar && avatar.startsWith("data:image/")) {
            const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return res.status(400).json({ message: "Format gambar tidak valid." });
            }
            const contentType = matches[1];
            const fileBuffer = Buffer.from(matches[2], "base64");

            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
                console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
                return res.status(500).json({ message: "Supabase credentials are not configured in backend env." });
            }

            const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/avatar/${req.user.id}/avatar.png`;
            const uploadRes = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    "Content-Type": contentType,
                    "x-upsert": "true"
                },
                body: fileBuffer
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error("Supabase storage upload failed:", errorText);
                return res.status(500).json({ message: "Gagal mengunggah foto ke Supabase Storage." });
            }

            avatarUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatar/${req.user.id}/avatar.png`;
        }

        const user = await updateUser(req.user.id, {
            username: username || null,
            email: email || null,
            password_hash,
            avatar: avatarUrl || null
        });

        res.json(user);
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat memperbarui profil." });
    }
};

// DELETE ACCOUNT
export const deleteProfile = async (req, res) => {
    try {
        await deleteUser(req.user.id);

        res.json({ message: "Account deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};