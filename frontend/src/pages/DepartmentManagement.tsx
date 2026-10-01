/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../api/departments.api";
import type {
  CreateDepartmentRequest,
  Department,
  UpdateDepartmentRequest,
} from "../api/departments.api";
import "./css/DepartmentManagement.css";

type PendingAction =
  | {
      type: "create";
      department?: undefined;
    }
  | {
      type: "update";
      department: Department;
    }
  | {
      type: "delete";
      department: Department;
    };

type ToastMessage = {
  type: "success" | "error";
  message: string;
} | null;

const DEFAULT_ROWS_PER_PAGE = 10;

function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<ToastMessage>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadDepartments() {
    try {
      setLoading(true);

      const response = await getDepartments();

      setDepartments(response);
    } catch (error) {
      console.error("Failed to load departments:", error);

      setToast({
        type: "error",
        message: "Failed to load departments.",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return departments;
    }

    return departments.filter((department) =>
      department.name.toLowerCase().includes(normalizedSearch),
    );
  }, [departments, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDepartments.length / rowsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedDepartments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;

    const endIndex = startIndex + rowsPerPage;

    return filteredDepartments.slice(startIndex, endIndex);
  }, [filteredDepartments, safeCurrentPage, rowsPerPage]);

  const resultStart =
    filteredDepartments.length === 0
      ? 0
      : (safeCurrentPage - 1) * rowsPerPage + 1;

  const resultEnd =
    filteredDepartments.length === 0
      ? 0
      : Math.min(safeCurrentPage * rowsPerPage, filteredDepartments.length);

  function openCreateModal() {
    setFormData({
      name: "",
    });

    setPendingAction({
      type: "create",
    });

    setShowConfirmation(false);
  }

  function openEditModal(department: Department) {
    setFormData({
      name: department.name,
    });

    setPendingAction({
      type: "update",
      department,
    });

    setShowConfirmation(false);
  }

  function openDeleteConfirmation(department: Department) {
    setPendingAction({
      type: "delete",
      department,
    });

    setShowConfirmation(true);
  }

  function closeFormModal() {
    if (submitting) {
      return;
    }

    setPendingAction(null);
    setShowConfirmation(false);
  }

  function closeConfirmationModal() {
    if (submitting) {
      return;
    }

    setShowConfirmation(false);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setToast({
        type: "error",
        message: "Department name is required.",
      });

      return;
    }

    setShowConfirmation(true);
  }

  async function confirmAction() {
    if (!pendingAction) {
      return;
    }

    try {
      setSubmitting(true);

      if (pendingAction.type === "create") {
        const payload: CreateDepartmentRequest = {
          name: formData.name.trim(),
        };

        await createDepartment(payload);

        setToast({
          type: "success",
          message: "Department created successfully.",
        });
      }

      if (pendingAction.type === "update") {
        const payload: UpdateDepartmentRequest = {
          name: formData.name.trim(),
        };

        await updateDepartment(pendingAction.department.id, payload);

        setToast({
          type: "success",
          message: "Department updated successfully.",
        });
      }

      if (pendingAction.type === "delete") {
        await deleteDepartment(pendingAction.department.id);

        setToast({
          type: "success",
          message: "Department deleted successfully.",
        });
      }

      setPendingAction(null);
      setShowConfirmation(false);

      await loadDepartments();
    } catch (error) {
      console.error("Failed to process department action:", error);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to process department action.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function getConfirmationTitle() {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.type === "create") {
      return "Create Department?";
    }

    if (pendingAction.type === "update") {
      return "Update Department?";
    }

    return "Delete Department?";
  }

  function getConfirmationMessage() {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.type === "create") {
      return (
        <>
          Are you sure you want to create the department{" "}
          <strong>{formData.name}</strong>?
        </>
      );
    }

    if (pendingAction.type === "update") {
      return (
        <>
          Are you sure you want to update the department{" "}
          <strong>{pendingAction.department.name}</strong> to{" "}
          <strong>{formData.name}</strong>?
        </>
      );
    }

    return (
      <>
        Are you sure you want to delete{" "}
        <strong>{pendingAction.department.name}</strong>?
        <br />
        This action cannot be undone.
      </>
    );
  }

  function handleRowsPerPageChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  }

  function renderPagination() {
    if (totalPages <= 1) {
      return null;
    }

    const pages: number[] = [];

    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }

    return (
      <div className="department-pagination">
        <button
          type="button"
          className="department-pagination-button"
          disabled={safeCurrentPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          ‹
        </button>

        <div className="department-pagination-list">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`department-pagination-button ${
                safeCurrentPage === page ? "active" : ""
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="department-pagination-button"
          disabled={safeCurrentPage === totalPages}
          onClick={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
        >
          ›
        </button>
      </div>
    );
  }

  return (
    <div className="department-management">
      <div className="department-page-header">
        <div>
          <h1>Departments</h1>
          <p>Manage your organization departments.</p>
        </div>

        <button
          type="button"
          className="department-add-button"
          onClick={openCreateModal}
        >
          <span>+</span>
          Add Department
        </button>
      </div>

      <div className="department-toolbar">
        <div className="department-command-controls">
          <div className={`department-command ${searchOpen ? "expanded" : ""}`}>
            <button
              type="button"
              className="department-command-icon"
              title="Search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M16 16L21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {searchOpen && (
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments..."
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      <div className="department-results-toolbar">
        <div className="department-result-count">
          Showing {resultStart}–{resultEnd} of {filteredDepartments.length}{" "}
          departments
        </div>

        <div className="department-rows-control">
          <span>Rows</span>

          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="department-table-card">
        <div className="department-table-wrapper">
          <table className="department-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th className="department-actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>
                    <div className="department-table-state">
                      Loading departments...
                    </div>
                  </td>
                </tr>
              ) : paginatedDepartments.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="department-table-state">
                      No departments found.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((department) => (
                  <tr key={department.id}>
                    <td>
                      <div className="department-name-cell">
                        <div className="department-avatar">
                          {department.name.charAt(0).toUpperCase()}
                        </div>

                        <span>{department.name}</span>
                      </div>
                    </td>

                    <td>
                      {new Date(department.createdAt).toLocaleDateString()}
                    </td>

                    <td className="department-actions-column">
                      <div className="department-row-actions">
                        <button
                          type="button"
                          className="department-action-button edit"
                          title="Edit department"
                          onClick={() => openEditModal(department)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M4 20h4L19 9l-4-4L4 16v4z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M13.5 6.5l4 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="department-action-button delete"
                          title="Delete department"
                          onClick={() => openDeleteConfirmation(department)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M4 7h16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9 7V4h6v3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M7 7l1 13h8l1-13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 11v5M14 11v5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>

      {/* CREATE / UPDATE FORM MODAL */}
      {pendingAction &&
        (pendingAction.type === "create" || pendingAction.type === "update") &&
        !showConfirmation && (
          <div className="department-modal-backdrop">
            <div className="department-modal">
              <div className="department-modal-header">
                <div>
                  <h2>
                    {pendingAction.type === "create"
                      ? "Add Department"
                      : "Edit Department"}
                  </h2>

                  <p>
                    {pendingAction.type === "create"
                      ? "Create a new department."
                      : "Update department information."}
                  </p>
                </div>

                <button
                  type="button"
                  className="department-modal-close"
                  onClick={closeFormModal}
                  disabled={submitting}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="department-modal-body">
                  <div className="department-form-group">
                    <label htmlFor="department-name">Department Name</label>

                    <input
                      id="department-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter department name"
                      autoComplete="off"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="department-modal-footer">
                  <button
                    type="button"
                    className="department-secondary-button"
                    onClick={closeFormModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="department-primary-button"
                    disabled={submitting}
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* CONFIRMATION MODAL */}
      {showConfirmation && pendingAction && (
        <div className="department-confirm-backdrop">
          <div className="department-confirm-modal">
            <div
              className={`department-confirm-icon ${
                pendingAction.type === "delete" ? "danger" : ""
              }`}
            >
              {pendingAction.type === "delete" ? "!" : "?"}
            </div>

            <h2>{getConfirmationTitle()}</h2>

            <p>{getConfirmationMessage()}</p>

            <div className="department-confirm-actions">
              <button
                type="button"
                className="department-secondary-button"
                onClick={closeConfirmationModal}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  pendingAction.type === "delete"
                    ? "department-danger-button"
                    : "department-primary-button"
                }
                onClick={confirmAction}
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : pendingAction.type === "create"
                    ? "Create"
                    : pendingAction.type === "update"
                      ? "Update"
                      : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`department-toast ${toast.type}`}>
          <span className="department-toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>

          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default DepartmentManagement;
