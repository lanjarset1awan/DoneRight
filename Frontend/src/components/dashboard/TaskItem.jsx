import React from "react";

export default function TaskItem({
  task,
  onToggleCompleted,
  onOpenDetail,
  showCategoryBadge = true
}) {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const completedAt = task.completed_at ? new Date(task.completed_at) : null;
  const now = new Date();
  const isOverdue = deadline && (
    (!task.is_completed && deadline < now) ||
    (task.is_completed && completedAt && completedAt > deadline)
  );

  return (
    <div className="task-item">
      <div className="task-left">
        <div className="task-title-row">
          <div
            className={`todo-checkbox ${task.is_completed ? "checked" : ""}`}
            onClick={() => onToggleCompleted(task.id_tasks)}
          ></div>

          <h3 className={`task-title ${task.is_completed ? "completed" : ""}`}>
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        <div className="task-badges">
          <span className={`badge badge-${task.priority}`}>
            {task.priority.toUpperCase()}
          </span>

          {showCategoryBadge && task.category_name && (
            <span className="badge badge-category">
              {task.category_name}
            </span>
          )}

          {deadline && (
            <span className="badge badge-deadline">
              Deadline: {deadline.toLocaleDateString("id-ID")}
            </span>
          )}

          {task.is_completed && (
            <span className="badge badge-completed">
              ✓ Selesai
            </span>
          )}

          {isOverdue && (
            <span className="badge badge-overdue">
              ⚠ Overdue
            </span>
          )}
        </div>
      </div>

      <div className="task-right">
        <button
          className="btn-detail"
          onClick={() => onOpenDetail(task)}
        >
          Detail
        </button>
      </div>
    </div>
  );
}
