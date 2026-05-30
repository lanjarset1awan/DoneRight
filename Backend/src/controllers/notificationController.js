import {
    checkAndCreateH1Notifications,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../models/notificationModel.js";

// GET ALL NOTIFICATIONS (AND SYNC H-1 DEADLINES)
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Synchronize and detect new H-1 notifications first
        await checkAndCreateH1Notifications(userId);

        // Fetch notifications
        const notifications = await getUserNotifications(userId);

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error in getNotifications:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// MARK A SINGLE NOTIFICATION AS READ
export const readNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await markAsRead(id, userId);

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        console.error("Error in readNotification:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// MARK ALL USER NOTIFICATIONS AS READ
export const readAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await markAllAsRead(userId);

        res.status(200).json({
            message: "All notifications marked as read",
        });
    } catch (error) {
        console.error("Error in readAllNotifications:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// DELETE A SINGLE NOTIFICATION
export const removeNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await deleteNotification(id, userId);

        if (!result) {
            return res.status(404).json({
                message: "Notification not found",
            });
        }

        res.status(200).json({
            message: "Notification deleted successfully",
            notification: result,
        });
    } catch (error) {
        console.error("Error in removeNotification:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
