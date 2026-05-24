import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import TaskModal from "../components/dashboard/TaskModal";
import TaskDetailModal from "../components/dashboard/TaskDetailModal";
import CategoryModal from "../components/dashboard/CategoryModal";
import ProgressBanner from "../components/dashboard/ProgressBanner";
import TaskFilters from "../components/dashboard/TaskFilters";
import TaskList from "../components/dashboard/TaskList";
import useDashboardData from "../hooks/useDashboardData";
import "../styles/pages/dashboard-user.css";

export default function Dashboard({ token, user, onLogout, onNavigateReport, onNavigateTrash, onOpenProfile }) {
  const {
    tasks,
    categories,
    loading,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    showTaskModal,
    showDetailModal,
    setShowDetailModal,
    showCategoryModal,
    setShowCategoryModal,
    closingModals,
    selectedTask,
    setSelectedTask,
    editingTask,
    confirmModal,
    taskSubmitting,
    categorySubmitting,
    toast,
    closeModal,
    handleToggleCompleted,
    handleTaskSubmit,
    handleCategorySubmit,
    handleDeleteCategory,
    handleDeleteTask,
    openAddTask,
    openEditTask,
    totalTasks,
    completedTasks,
    progressPercent,
    filteredTasks,
    groupedTasks
  } = useDashboardData(token);

  return (
    <div>
      {/* NAVBAR */}
      <Navbar
        title="DoneRight"
        subtitle={`Selamat datang, ${user ? user.username : "Pengguna"}`}
        user={user}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
        token={token}
        showNotifBell={true}
        tasks={tasks}
        setSelectedTask={setSelectedTask}
        setShowDetailModal={setShowDetailModal}
      />

      {/* MAIN CONTAINER */}
      <div className="dashboard-container">
        {/* PROGRESS BANNER */}
        <ProgressBanner
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          progressPercent={progressPercent}
        />

        {/* DAFTAR TUGAS FILTER BOARD */}
        <TaskFilters
          viewMode={viewMode}
          setViewMode={setViewMode}
          onNavigateReport={onNavigateReport}
          onNavigateTrash={onNavigateTrash}
          setShowCategoryModal={setShowCategoryModal}
          openAddTask={openAddTask}
          search={search}
          setSearch={setSearch}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          categories={categories}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* TASKS LIST */}
        <TaskList
          loading={loading}
          filteredTasks={filteredTasks}
          viewMode={viewMode}
          groupedTasks={groupedTasks}
          handleToggleCompleted={handleToggleCompleted}
          setSelectedTask={setSelectedTask}
          setShowDetailModal={setShowDetailModal}
        />

        {/* MODAL: ADD / EDIT TASK */}
        <TaskModal
          show={showTaskModal}
          closingModal={closingModals.task ? "task" : ""}
          closeModal={closeModal}
          editingTask={editingTask}
          categories={categories}
          taskSubmitting={taskSubmitting}
          onSubmit={handleTaskSubmit}
        />

        {/* MODAL: DETAIL VIEW */}
        <TaskDetailModal
          show={showDetailModal}
          selectedTask={selectedTask}
          closingModal={closingModals.detail ? "detail" : ""}
          closeModal={closeModal}
          onDeleteTask={handleDeleteTask}
          onEditTask={openEditTask}
        />

        {/* MODAL: ADD CUSTOM CATEGORY */}
        <CategoryModal
          show={showCategoryModal}
          closingModal={closingModals.category ? "category" : ""}
          closeModal={closeModal}
          categories={categories}
          categorySubmitting={categorySubmitting}
          onSubmit={handleCategorySubmit}
          onDeleteCategory={handleDeleteCategory}
        />

        {/* CUSTOM CONFIRMATION MODAL */}
        <ConfirmModal
          show={confirmModal.show}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          isDanger={confirmModal.isDanger}
          isCategoryDelete={confirmModal.isCategoryDelete}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
          onKeepTasks={confirmModal.onKeepTasks}
          onDeleteTasks={confirmModal.onDeleteTasks}
          closingModal={closingModals.confirm ? "confirm" : ""}
          closeModal={closeModal}
          overlayClass=""
          titleClass="dashboard-detail-item-full"
          bodyTextClass="dashboard-detail-desc"
          footerClass={confirmModal.isCategoryDelete ? "dashboard-cat-del-footer" : ""}
          style={{ zIndex: 200 }}
        />

        {/* TOAST NOTIFICATION */}
        <div className={`toast-notification ${toast.show ? "active" : ""} ${toast.type}`}>
          <div className="toast-message">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
