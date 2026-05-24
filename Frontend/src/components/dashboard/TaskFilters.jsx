import React from "react";
import CustomSelect from "../CustomSelect";

export default function TaskFilters({
  viewMode,
  setViewMode,
  onNavigateReport,
  onNavigateTrash,
  setShowCategoryModal,
  openAddTask,
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  categories,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
}) {
  return (
    <div className="board-card">
      <div className="board-header">
        <div className="dashboard-actions-left">
          <div className="board-title">Daftar Tugas</div>

          <div className="dashboard-viewmode-switcher">
            <button
              onClick={() => setViewMode("list")}
              className={`dashboard-viewmode-btn ${viewMode === "list" ? "active" : ""}`}
            >
              Daftar
            </button>

            <button
              onClick={() => setViewMode("grouped")}
              className={`dashboard-viewmode-btn ${viewMode === "grouped" ? "active" : ""}`}
            >
              Per Kategori
            </button>
          </div>
        </div>
        <div className="btn-group-row">
          <button
            className="btn-primary dashboard-btn-report"
            onClick={onNavigateReport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Laporan
          </button>
          <button
            className="btn-secondary dashboard-btn-trash"
            onClick={onNavigateTrash}
            title="Keranjang Sampah"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sampah
          </button>
          <button
            className="btn-secondary dashboard-btn-admin"
            onClick={() => setShowCategoryModal(true)}
          >
            <span className="btn-icon-add">+</span> Kategori
          </button>
          <button className="btn-primary dashboard-btn-add" onClick={openAddTask}>
            <span className="btn-icon-add">+</span> Tambah Tugas
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-grid">
        <input
          type="text"
          className="filter-input"
          placeholder="Cari tugas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <CustomSelect
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: "", label: "Semua Kategori" },
            { value: "null", label: "Tanpa Kategori" },
            ...categories.map((cat) => ({
              value: cat.id_categories,
              label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1)
            }))
          ]}
          placeholder="Pilih Kategori"
        />

        <CustomSelect
          value={filterPriority}
          onChange={setFilterPriority}
          options={[
            { value: "", label: "Semua Prioritas" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" }
          ]}
          placeholder="Pilih Prioritas"
        />

        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: "Semua Status" },
            { value: "done", label: "Selesai" },
            { value: "pending", label: "Belum Selesai" },
            { value: "overdue", label: "Overdue" }
          ]}
          placeholder="Pilih Status"
        />

        <CustomSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "deadline", label: "Urutkan: Deadline" },
            { value: "priority", label: "Urutkan: Prioritas" },
            { value: "newest", label: "Urutkan: Terbaru" }
          ]}
          placeholder="Urutkan"
        />
      </div>
    </div>
  );
}
