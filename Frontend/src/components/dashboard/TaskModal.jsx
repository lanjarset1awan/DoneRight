import { useState, useEffect } from "react";
import CustomSelect from "../CustomSelect";

export default function TaskModal({
  show,
  closingModal,
  closeModal,
  editingTask,
  categories,
  taskSubmitting,
  onSubmit
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");

  useEffect(() => {
    if (editingTask) {
      setTaskTitle(editingTask.title);
      setTaskDesc(editingTask.description || "");
      setTaskCategory(editingTask.category_id || "");
      setTaskPriority(editingTask.priority || "medium");
      if (editingTask.deadline) {
        const deadlineStr = typeof editingTask.deadline === 'string' ? editingTask.deadline.replace(' ', 'T') : editingTask.deadline;
        const date = new Date(deadlineStr);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
        setTaskDeadline(localISOTime);
      } else {
        setTaskDeadline("");
      }
    } else {
      setTaskTitle("");
      setTaskDesc("");
      setTaskCategory("");
      setTaskPriority("medium");
      setTaskDeadline("");
    }
  }, [editingTask, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e, {
      title: taskTitle,
      description: taskDesc,
      category_id: taskCategory,
      priority: taskPriority,
      deadline: taskDeadline
    });
  };

  if (!show) return null;

  return (
    <div className={`modal-overlay active ${closingModal === "task" ? "closing" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            {editingTask ? "Edit Detail Tugas" : "Tambah Tugas Baru"}
          </div>
          <button
            type="button"
            className="btn-close-modal dashboard-modal-close"
            onClick={() => closeModal("task")}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Judul Tugas *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan judul tugas"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                disabled={taskSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Deskripsi</label>
              <textarea
                className="form-input"
                placeholder="Deskripsi tugas (opsional)"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                disabled={taskSubmitting}
              ></textarea>
            </div>

            <div className="form-group">
              <label>Kategori</label>
              <CustomSelect
                value={taskCategory}
                onChange={setTaskCategory}
                isFormInput={true}
                options={[
                  { value: "", label: "Tanpa Kategori" },
                  ...categories.map((cat) => ({
                    value: cat.id_categories,
                    label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1)
                  }))
                ]}
                placeholder="Pilih Kategori"
              />
            </div>

            <div className="form-group">
              <label>Prioritas *</label>
              <CustomSelect
                value={taskPriority}
                onChange={setTaskPriority}
                isFormInput={true}
                options={[
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" }
                ]}
                placeholder="Pilih Prioritas"
              />
            </div>

            <div className="form-group">
              <label>Deadline *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                required
                disabled={taskSubmitting}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn-batal"
              onClick={() => closeModal("task")}
              disabled={taskSubmitting}
            >
              Batal
            </button>
            <button type="submit" className="btn-simpan" disabled={taskSubmitting}>
              {taskSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
