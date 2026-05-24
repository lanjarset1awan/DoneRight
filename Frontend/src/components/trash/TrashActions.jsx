import React from "react";

export default function TrashActions({
  onNavigateDashboard,
  trashTasks,
  handleRestoreAll,
  handleClearAll,
  processing,
}) {
  return (
    <div className="trash-header-row">
      <button
        className="btn-secondary trash-btn-back"
        onClick={onNavigateDashboard}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Dashboard
      </button>

      {trashTasks.length > 0 && (
        <div className="btn-group-row" style={{ gap: "10px" }}>
          <button
            className="btn-secondary trash-btn-restore-all"
            onClick={handleRestoreAll}
            disabled={processing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
            Pulihkan Semua
          </button>
          <button
            className="btn-primary trash-btn-clear-all"
            onClick={handleClearAll}
            disabled={processing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Kosongkan Sampah
          </button>
        </div>
      )}
    </div>
  );
}
