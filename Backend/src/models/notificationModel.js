import pool from "../config/db.js";

// CHECK AND CREATE H-1 DEADLINE NOTIFICATIONS
export const checkAndCreateH1Notifications = async (userId) => {
    // 1. Get all incomplete active tasks due in <= 24 hours (H-1)
    const findH1TasksQuery = `
        SELECT id_tasks, title, deadline 
        FROM tasks 
        WHERE user_id = $1 
          AND is_completed = FALSE 
          AND deleted_at IS NULL 
          AND deadline IS NOT NULL 
          AND deadline >= NOW() 
          AND deadline <= NOW() + INTERVAL '1 day'
    `;

    const tasksResult = await pool.query(findH1TasksQuery, [userId]);
    const h1Tasks = tasksResult.rows;

    for (const task of h1Tasks) {
        // 2. Check if a notification already exists for this task
        const checkQuery = `
            SELECT id_notifications 
            FROM notifications 
            WHERE user_id = $1 
              AND task_id = $2 
              AND type = 'deadline_h1'
        `;
        const checkResult = await pool.query(checkQuery, [userId, task.id_tasks]);

        if (checkResult.rows.length === 0) {
            // 3. Insert notification if it does not exist
            const message = `Tugas "${task.title}" mendekati batas waktu (H-1).`;
            const insertQuery = `
                INSERT INTO notifications (user_id, task_id, type, message)
                VALUES ($1, $2, 'deadline_h1', $3)
                RETURNING *
            `;
            await pool.query(insertQuery, [userId, task.id_tasks, message]);
        }
    }
};

// GET USER NOTIFICATIONS
export const getUserNotifications = async (userId) => {
    const query = `
        SELECT 
            n.id_notifications,
            n.user_id,
            n.task_id,
            n.type,
            n.message,
            n.is_read,
            n.created_at,
            t.title AS task_title,
            t.deadline AS task_deadline
        FROM notifications n
        LEFT JOIN tasks t ON n.task_id = t.id_tasks AND t.deleted_at IS NULL
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT 50
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// MARK SINGLE NOTIFICATION AS READ
export const markAsRead = async (notificationId, userId) => {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id_notifications = $1 AND user_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllAsRead = async (userId) => {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1
        RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};
