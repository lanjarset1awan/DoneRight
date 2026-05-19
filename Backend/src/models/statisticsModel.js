import pool from "../config/db.js";

// =====================================
// GLOBAL OVERVIEW
// =====================================
export const getGlobalStatistics =
    async () => {

        const query = `
            SELECT
                COUNT(DISTINCT u.id_users)
                    AS total_users,

                COUNT(t.id_tasks)
                    AS total_tasks,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = TRUE
                        AND (
                            t.deadline IS NULL
                            OR t.completed_at <= t.deadline
                        )
                ) AS on_time,

                COUNT(*) FILTER (
                    WHERE
                        (
                            t.is_completed = TRUE
                            AND t.deadline IS NOT NULL
                            AND t.completed_at > t.deadline
                        )

                        OR

                        (
                            t.is_completed = FALSE
                            AND t.deadline IS NOT NULL
                            AND t.deadline < NOW()
                        )
                ) AS overdue,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = FALSE
                        AND (
                            t.deadline IS NULL
                            OR t.deadline >= NOW()
                        )
                ) AS pending,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = TRUE
                ) AS completed_tasks


            FROM users u

            LEFT JOIN tasks t
                ON u.id_users =
                    t.user_id
                AND t.deleted_at
                    IS NULL
        `;

        const result =
            await pool.query(
                query
            );

        return result.rows[0];
    };

// =====================================
// ALL USER STATISTICS
// =====================================
export const getUserStatistics =
    async () => {

        const query = `
            SELECT
                u.id_users,
                u.username,
                u.email,

                COUNT(t.id_tasks)
                    AS total_tasks,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = TRUE
                        AND (
                            t.deadline IS NULL
                            OR t.completed_at <= t.deadline
                        )
                ) AS on_time,

                COUNT(*) FILTER (
                    WHERE
                        (
                            t.is_completed = TRUE
                            AND t.deadline IS NOT NULL
                            AND t.completed_at > t.deadline
                        )

                        OR

                        (
                            t.is_completed = FALSE
                            AND t.deadline IS NOT NULL
                            AND t.deadline < NOW()
                        )
                ) AS overdue,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = FALSE
                        AND (
                            t.deadline IS NULL
                            OR t.deadline >= NOW()
                        )
                ) AS pending,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = TRUE
                ) AS completed_tasks


            FROM users u

            LEFT JOIN tasks t
                ON u.id_users =
                    t.user_id
                AND t.deleted_at
                    IS NULL

            GROUP BY
                u.id_users,
                u.username,
                u.email

            ORDER BY
                u.id_users ASC
        `;

        const result =
            await pool.query(
                query
            );

        return result.rows;
    };

// =====================================
// SINGLE USER REPORT
// =====================================
export const getSingleUserStats =
    async (userId) => {

        const query = `
            SELECT
                u.id_users,
                u.username,
                u.email,

                COUNT(t.id_tasks)
                    AS total_tasks,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = TRUE
                        AND (
                            t.deadline IS NULL
                            OR t.completed_at <= t.deadline
                        )
                ) AS on_time,

                COUNT(*) FILTER (
                    WHERE
                        (
                            t.is_completed = TRUE
                            AND t.deadline IS NOT NULL
                            AND t.completed_at > t.deadline
                        )
                        OR
                        (
                            t.is_completed = FALSE
                            AND t.deadline IS NOT NULL
                            AND t.deadline < NOW()
                        )
                ) AS overdue,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = FALSE
                        AND (
                            t.deadline IS NULL
                            OR t.deadline >= NOW()
                        )
                ) AS pending,

                COUNT(*) FILTER (
                    WHERE
                        t.is_completed = TRUE
                ) AS completed_tasks


            FROM users u

            LEFT JOIN tasks t
                ON
                u.id_users =
                t.user_id

                AND

                t.deleted_at
                IS NULL

            WHERE
                u.id_users = $1

            GROUP BY
                u.id_users
        `;

        const result =
            await pool.query(
                query,
                [userId]
            );

        return result.rows[0];
    };