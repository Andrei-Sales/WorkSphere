/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "../api/employees.api";
import type {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from "../api/employees.api";
import { getDepartments } from "../api/departments.api";
import type { Department } from "../api/departments.api";
import { getUsers } from "../api/users.api";
import type { User } from "../api/auth.api";
import "./css/EmployeeManagement.css";

const EMPLOYEE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

type PendingAction =
  | {
      type: "create";
      employee?: undefined;
    }
  | {
      type: "update";
      employee: Employee;
    }
  | {
      type: "delete";
      employee: Employee;
    };

type ToastMessage = {
  type: "success" | "error";
  message: string;
} | null;

type EmployeeFormData = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  userId: string;
  departmentId: string;
};

const DEFAULT_ROWS_PER_PAGE = 10;

const emptyForm: EmployeeFormData = {
  employeeNumber: "",
  firstName: "",
  lastName: "",
  position: "",
  hireDate: "",
  status: EMPLOYEE_STATUS.ACTIVE,
  userId: "",
  departmentId: "",
};

function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");

  const [statusOpen, setStatusOpen] = useState(false);

  const [departmentFilter, setDepartmentFilter] = useState("");

  const [departmentOpen, setDepartmentOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);

  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<ToastMessage>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, departmentFilter, rowsPerPage]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadData() {
    try {
      setLoading(true);

      const [employeeResponse, departmentResponse, userResponse] =
        await Promise.all([getEmployees(), getDepartments(), getUsers()]);

      setEmployees(employeeResponse);
      setDepartments(departmentResponse);
      setUsers(userResponse);
    } catch (error) {
      console.error("Failed to load employee data:", error);

      setToast({
        type: "error",
        message: "Failed to load employee data.",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const fullName =
        `${employee.firstName} ${employee.lastName}`.toLowerCase();

      const employeeNumber = employee.employeeNumber.toLowerCase();

      const position = employee.position?.toLowerCase() ?? "";

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        employeeNumber.includes(normalizedSearch) ||
        position.includes(normalizedSearch);

      const matchesStatus = !statusFilter || employee.status === statusFilter;

      const matchesDepartment =
        !departmentFilter || String(employee.departmentId) === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, search, statusFilter, departmentFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / rowsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;

    const endIndex = startIndex + rowsPerPage;

    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, safeCurrentPage, rowsPerPage]);

  const resultStart =
    filteredEmployees.length === 0
      ? 0
      : (safeCurrentPage - 1) * rowsPerPage + 1;

  const resultEnd =
    filteredEmployees.length === 0
      ? 0
      : Math.min(safeCurrentPage * rowsPerPage, filteredEmployees.length);

  function getUserName(user: User) {
    return `${user.firstName} ${user.lastName}`;
  }

  function getEmployeeUser(employee: Employee) {
    if ("user" in employee && employee.user) {
      return employee.user;
    }

    return users.find((user) => user.id === employee.userId);
  }

  function getEmployeeDepartment(employee: Employee) {
    if ("department" in employee && employee.department) {
      return employee.department;
    }

    return departments.find(
      (department) => department.id === employee.departmentId,
    );
  }

  function openCreateModal() {
    setFormData({
      ...emptyForm,
    });

    setPendingAction({
      type: "create",
    });

    setShowConfirmation(false);
  }

  function openEditModal(employee: Employee) {
    setFormData({
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      hireDate: employee.hireDate ? employee.hireDate.slice(0, 10) : "",
      status:
        employee.status === EMPLOYEE_STATUS.INACTIVE
          ? EMPLOYEE_STATUS.INACTIVE
          : EMPLOYEE_STATUS.ACTIVE,
      userId: String(employee.userId),
      departmentId: String(employee.departmentId),
    });

    setPendingAction({
      type: "update",
      employee,
    });

    setShowConfirmation(false);
  }

  function openDeleteConfirmation(employee: Employee) {
    setPendingAction({
      type: "delete",
      employee,
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

  function handleInputChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (
      !formData.employeeNumber.trim() ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.position.trim() ||
      !formData.hireDate ||
      !formData.userId ||
      !formData.departmentId
    ) {
      setToast({
        type: "error",
        message: "Please complete all required fields.",
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
        const payload: CreateEmployeeRequest = {
          employeeNumber: formData.employeeNumber.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          position: formData.position.trim(),
          hireDate: formData.hireDate,
          status: formData.status,
          userId: Number(formData.userId),
          departmentId: Number(formData.departmentId),
        };

        await createEmployee(payload);

        setToast({
          type: "success",
          message: "Employee created successfully.",
        });
      }

      if (pendingAction.type === "update") {
        const payload: UpdateEmployeeRequest = {
          employeeNumber: formData.employeeNumber.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          position: formData.position.trim(),
          hireDate: formData.hireDate,
          status: formData.status,
          userId: Number(formData.userId),
          departmentId: Number(formData.departmentId),
        };

        await updateEmployee(pendingAction.employee.id, payload);

        setToast({
          type: "success",
          message: "Employee updated successfully.",
        });
      }

      if (pendingAction.type === "delete") {
        await deleteEmployee(pendingAction.employee.id);

        setToast({
          type: "success",
          message: "Employee deleted successfully.",
        });
      }

      setPendingAction(null);
      setShowConfirmation(false);

      await loadData();
    } catch (error) {
      console.error("Failed to process employee action:", error);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to process employee action.",
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
      return "Create Employee?";
    }

    if (pendingAction.type === "update") {
      return "Update Employee?";
    }

    return "Delete Employee?";
  }

  function getConfirmationMessage() {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.type === "create") {
      return (
        <>
          Are you sure you want to create this employee record for{" "}
          <strong>
            {formData.firstName} {formData.lastName}
          </strong>
          ?
        </>
      );
    }

    if (pendingAction.type === "update") {
      return (
        <>
          Are you sure you want to update the employee record for{" "}
          <strong>
            {pendingAction.employee.firstName} {pendingAction.employee.lastName}
          </strong>
          ?
        </>
      );
    }

    return (
      <>
        Are you sure you want to delete{" "}
        <strong>
          {pendingAction.employee.firstName} {pendingAction.employee.lastName}
        </strong>
        ?
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
      <div className="employee-pagination">
        <button
          type="button"
          className="employee-pagination-button"
          disabled={safeCurrentPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          ‹
        </button>

        <div className="employee-pagination-list">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`employee-pagination-button ${
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
          className="employee-pagination-button"
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
    <div className="employee-management">
      <div className="employee-page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees.</p>
        </div>

        <button
          type="button"
          className="employee-add-button"
          onClick={openCreateModal}
        >
          <span>+</span>
          Add Employee
        </button>
      </div>

      <div className="employee-toolbar">
        <div className="employee-command-controls">
          {/* SEARCH */}
          <div className={`employee-command ${searchOpen ? "expanded" : ""}`}>
            <button
              type="button"
              className="employee-command-icon"
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
                placeholder="Search employees..."
                autoFocus
              />
            )}
          </div>

          {/* STATUS */}
          <div
            className={`employee-command ${
              statusOpen ? "expanded employee-filter" : ""
            }`}
          >
            <button
              type="button"
              className="employee-command-icon"
              title="Filter by status"
              onClick={() => setStatusOpen((value) => !value)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 6h14M8 12h8M10 18h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {statusOpen && (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                autoFocus
              >
                <option value="">All Statuses</option>

                <option value={EMPLOYEE_STATUS.ACTIVE}>Active</option>

                <option value={EMPLOYEE_STATUS.INACTIVE}>Inactive</option>
              </select>
            )}
          </div>

          {/* DEPARTMENT */}
          <div
            className={`employee-command ${
              departmentOpen ? "expanded employee-filter" : ""
            }`}
          >
            <button
              type="button"
              className="employee-command-icon"
              title="Filter by department"
              onClick={() => setDepartmentOpen((value) => !value)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 5h16v14H4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 9h8M8 13h8M8 17h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {departmentOpen && (
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                autoFocus
              >
                <option value="">All Departments</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="employee-results-toolbar">
        <div className="employee-result-count">
          Showing {resultStart}–{resultEnd} of {filteredEmployees.length}{" "}
          employees
        </div>

        <div className="employee-rows-control">
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

      <div className="employee-table-card">
        <div className="employee-table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Position</th>
                <th>Department</th>
                <th>Status</th>
                <th>Hire Date</th>
                <th className="employee-actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="employee-table-state">
                      Loading employees...
                    </div>
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="employee-table-state">
                      No employees found.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => {
                  const employeeUser = getEmployeeUser(employee);

                  const employeeDepartment = getEmployeeDepartment(employee);

                  return (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-name-cell">
                          <div className="employee-avatar">
                            {employee.firstName.charAt(0).toUpperCase()}
                            {employee.lastName.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="employee-name">
                              {employee.firstName} {employee.lastName}
                            </div>

                            <div className="employee-number">
                              {employee.employeeNumber}
                            </div>

                            {employeeUser && (
                              <div className="employee-email">
                                {employeeUser.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{employee.position}</td>

                      <td>{employeeDepartment?.name ?? "—"}</td>

                      <td>
                        <span
                          className={`employee-status-badge ${
                            employee.status === EMPLOYEE_STATUS.ACTIVE
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {employee.status === EMPLOYEE_STATUS.ACTIVE
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {new Date(employee.hireDate).toLocaleDateString()}
                      </td>

                      <td className="employee-actions-column">
                        <div className="employee-row-actions">
                          <button
                            type="button"
                            className="employee-action-button edit"
                            title="Edit employee"
                            onClick={() => openEditModal(employee)}
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
                            className="employee-action-button delete"
                            title="Delete employee"
                            onClick={() => openDeleteConfirmation(employee)}
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
                  );
                })
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
          <div className="employee-modal-backdrop">
            <div className="employee-modal">
              <div className="employee-modal-header">
                <div>
                  <h2>
                    {pendingAction.type === "create"
                      ? "Add Employee"
                      : "Edit Employee"}
                  </h2>

                  <p>
                    {pendingAction.type === "create"
                      ? "Create a new employee record."
                      : "Update employee information."}
                  </p>
                </div>

                <button
                  type="button"
                  className="employee-modal-close"
                  onClick={closeFormModal}
                  disabled={submitting}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="employee-modal-body">
                  <div className="employee-form-grid">
                    <div className="employee-form-group">
                      <label htmlFor="employee-number">Employee Number</label>

                      <input
                        id="employee-number"
                        name="employeeNumber"
                        type="text"
                        value={formData.employeeNumber}
                        onChange={handleInputChange}
                        placeholder="EMP-001"
                        disabled={submitting}
                      />
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-position">Position</label>

                      <input
                        id="employee-position"
                        name="position"
                        type="text"
                        value={formData.position}
                        onChange={handleInputChange}
                        placeholder="Software Engineer"
                        disabled={submitting}
                      />
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-first-name">First Name</label>

                      <input
                        id="employee-first-name"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        disabled={submitting}
                      />
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-last-name">Last Name</label>

                      <input
                        id="employee-last-name"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        disabled={submitting}
                      />
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-user">User</label>

                      <select
                        id="employee-user"
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="">Select user</option>

                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {getUserName(user)} — {user.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-department">Department</label>

                      <select
                        id="employee-department"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="">Select department</option>

                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-hire-date">Hire Date</label>

                      <input
                        id="employee-hire-date"
                        name="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={handleInputChange}
                        disabled={submitting}
                      />
                    </div>

                    <div className="employee-form-group">
                      <label htmlFor="employee-status">Status</label>

                      <select
                        id="employee-status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value={EMPLOYEE_STATUS.ACTIVE}>Active</option>

                        <option value={EMPLOYEE_STATUS.INACTIVE}>
                          Inactive
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="employee-modal-footer">
                  <button
                    type="button"
                    className="employee-secondary-button"
                    onClick={closeFormModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="employee-primary-button"
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
        <div className="employee-confirm-backdrop">
          <div className="employee-confirm-modal">
            <div
              className={`employee-confirm-icon ${
                pendingAction.type === "delete" ? "danger" : ""
              }`}
            >
              {pendingAction.type === "delete" ? "!" : "?"}
            </div>

            <h2>{getConfirmationTitle()}</h2>

            <p>{getConfirmationMessage()}</p>

            <div className="employee-confirm-actions">
              <button
                type="button"
                className="employee-secondary-button"
                onClick={closeConfirmationModal}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  pendingAction.type === "delete"
                    ? "employee-danger-button"
                    : "employee-primary-button"
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
        <div className={`employee-toast ${toast.type}`}>
          <span className="employee-toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>

          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;
