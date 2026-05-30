import pool from "../config/db.js";

// CREATE USER
export const createUser = async (
    username,
    email,
    passwordHash,
    verificationToken = null,
    verificationTokenExpires = null
) => {
    const query = `
    INSERT INTO users (
      username,
      email,
      password_hash,
      verification_token,
      verification_token_expires
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id_users,
      username,
      email,
      role,
      created_at
  `;

    const values = [
        username,
        email,
        passwordHash,
        verificationToken,
        verificationTokenExpires,
    ];

    const result = await pool.query(
        query,
        values
    );

    return result.rows[0];
};

// FIND USER BY EMAIL
export const findUserByEmail =
    async (email) => {
        const query = `
      SELECT *
      FROM users
      WHERE email = $1
      AND deleted_at IS NULL
    `;

        const result =
            await pool.query(query, [
                email,
            ]);

        return result.rows[0];
    };

// GET USER BY ID
export const getUserById = async (id) => {
    const query = `
        SELECT id_users, username, email, role, created_at, avatar
        FROM users
        WHERE id_users = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// UPDATE USER
export const updateUser = async (id, data) => {
    const query = `
        UPDATE users
        SET
            username = COALESCE($1, username),
            email = COALESCE($2, email),
            password_hash = COALESCE($3, password_hash),
            avatar = CASE WHEN $4 = 'REMOVE_AVATAR' THEN NULL ELSE COALESCE($4, avatar) END
        WHERE id_users = $5
        RETURNING id_users, username, email, role, created_at, avatar
    `;

    const result = await pool.query(query, [
        data.username,
        data.email,
        data.password_hash,
        data.avatar,
        id
    ]);

    return result.rows[0];
};

// DELETE USER
export const deleteUser = async (id) => {
    const query = `
        DELETE FROM users
        WHERE id_users = $1
    `;

    await pool.query(query, [id]);
};