import pool from "../config/db.js";
import { isValidEmailDomain } from "../utils/emailValidator.js";
import { sendEmail } from "../utils/emailSender.js";

// CHECK AND CREATE H-1 DEADLINE NOTIFICATIONS
export const checkAndCreateH1Notifications = async (userId) => {
    // Fetch the user's email first
    const userResult = await pool.query(
        "SELECT email FROM users WHERE id_users = $1 AND deleted_at IS NULL",
        [userId]
     );
    const user = userResult.rows[0];
    const userEmail = user?.email;

    // Check if the domain is valid to receive emails
    const isEmailValid = userEmail ? await isValidEmailDomain(userEmail) : false;

    // 1. Get all incomplete active tasks due in <= 24 hours (H-1)
    const findH1TasksQuery = `
        SELECT id_tasks, title, deadline 
        FROM tasks 
        WHERE user_id = $1 
          AND is_completed = FALSE 
          AND deleted_at IS NULL 
          AND deadline IS NOT NULL 
          AND deadline >= NOW() AT TIME ZONE 'Asia/Jakarta' 
          AND deadline <= (NOW() AT TIME ZONE 'Asia/Jakarta') + INTERVAL '1 day'
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

            // 4. Send email notification if user email domain is valid
            if (isEmailValid) {
                const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
                const deadlineStr = typeof task.deadline === 'string' ? task.deadline.replace(' ', 'T') : task.deadline;
                const formattedDeadline = new Date(deadlineStr).toLocaleString("id-ID", {
                    dateStyle: "full",
                    timeStyle: "short",
                });

                const emailHtml = `
<div style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; line-height: 1.6;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; overflow: hidden;">
    <!-- Banner Header Danger -->
    <div style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">⚠️ Pengingat Tugas</h1>
      <p style="color: #ffe4e6; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Batas waktu tugas Anda sudah dekat!</p>
    </div>
    
    <!-- Body Utama -->
    <div style="padding: 40px 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Halo,</h2>
      <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">Kami ingin mengingatkan bahwa ada tugas yang belum selesai dan akan segera mencapai batas waktunya (H-1):</p>
      
      <!-- Detail Tugas Card -->
      <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #be123c; font-size: 16px; font-weight: 700;">${task.title}</h3>
        <p style="margin: 0; color: #4f46e5; font-size: 14px; font-weight: 600;">
          Deadline: ${formattedDeadline}
        </p>
      </div>
      
      <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">Segera selesaikan tugas Anda dan tandai sebagai selesai agar tetap terpantau dengan baik.</p>
      
      <!-- Tombol Buka Web -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${frontendUrl}" style="background-color: #e11d48; color: #ffffff; padding: 14px 30px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.3); letter-spacing: -0.2px;">
          Buka DoneRight
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh sistem notifikasi DoneRight.</p>
      <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">&copy; 2026 DoneRight. All rights reserved.</p>
    </div>
  </div>
</div>
                `;

                try {
                    await sendEmail({
                        to: userEmail,
                        subject: `🚨 [DoneRight] Batas Waktu H-1: ${task.title}`,
                        html: emailHtml,
                    });
                } catch (mailError) {
                    console.error(`Failed to send deadline email notification to ${userEmail}:`, mailError.message);
                }
            }
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

// DELETE SINGLE NOTIFICATION
export const deleteNotification = async (notificationId, userId) => {
    const query = `
        DELETE FROM notifications
        WHERE id_notifications = $1 AND user_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
};
