/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "../api/users.api";

import type { User } from "../api/auth.api";
import type { UserStatus } from "../constants/user-status";

import { ROLE } from "../constants/roles";
import { USER_STATUS } from "../constants/user-status";

import { useAuth } from "../auth/AuthContext";

import "./css/UserManagement.css";

const DEFAULT_PAGE_SIZE = 10;

type FilterPanel = "search" | "status" | "role" | null;

type PendingAction =
  | {
      type: "create";
    }
  | {
      type: "update";
      user: User;
    }
  | {
      type: "delete";
      user: User;
    }
  | null;

interface ToastMessage {
  type: "success" | "error";
  message: string;
}

function matchesUserFilters(
  item: User,
  searchTerm: string,
  statusFilter: "ALL" | UserStatus,
  roleFilter: number | "ALL",
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchesSearch =
    !normalizedSearch ||
    item.firstName.toLowerCase().includes(normalizedSearch) ||
    item.lastName.toLowerCase().includes(normalizedSearch) ||
    item.email.toLowerCase().includes(normalizedSearch);

  const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

  const matchesRole = roleFilter === "ALL" || item.roleId === roleFilter;

  return matchesSearch && matchesStatus && matchesRole;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [error, setError] = useState("");

  // Confirmation
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [processingAction, setProcessingAction] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState<number>(ROLE.USER);
  const [status, setStatus] = useState<UserStatus>(USER_STATUS.ACTIVE);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");

  const [roleFilter, setRoleFilter] = useState<number | "ALL">("ALL");

  const [openFilter, setOpenFilter] = useState<FilterPanel>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function showSuccessToast(message: string) {
    setToast({
      type: "success",
      message,
    });
  }

  function showErrorToast(message: string) {
    setToast({
      type: "error",
      message,
    });
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRoleId(ROLE.USER);
    setStatus(USER_STATUS.ACTIVE);
  }

  function openAddModal() {
    setEditingUser(null);
    resetForm();
    setError("");
    setShowModal(true);
  }

  function openEditModal(selectedUser: User) {
    setEditingUser(selectedUser);

    setEmail(selectedUser.email);
    setPassword("");
    setFirstName(selectedUser.firstName);
    setLastName(selectedUser.lastName);
    setRoleId(selectedUser.roleId);
    setStatus(selectedUser.status);

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving || processingAction) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
    resetForm();
    setError("");
  }

  function cancelConfirmation() {
    if (processingAction) {
      return;
    }

    setPendingAction(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    if (!trimmedFirstName) {
      setError("First name is required");
      return;
    }

    if (!trimmedLastName) {
      setError("Last name is required");
      return;
    }

    if (!editingUser && !trimmedPassword) {
      setError("Password is required");
      return;
    }

    setError("");

    if (editingUser) {
      setPendingAction({
        type: "update",
        user: editingUser,
      });

      return;
    }

    setPendingAction({
      type: "create",
    });
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    try {
      setProcessingAction(true);
      setError("");

      if (pendingAction.type === "create") {
        setSaving(true);

        const createData: CreateUserRequest = {
          email: email.trim(),
          password: password.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          roleId,
        };

        const created = await createUser(createData);

        setUsers((current) => [created, ...current]);

        setCurrentPage(1);

        setPendingAction(null);
        setShowModal(false);
        setEditingUser(null);
        resetForm();

        showSuccessToast("User created successfully.");

        return;
      }

      if (pendingAction.type === "update") {
        setSaving(true);

        const updateData: UpdateUserRequest = {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          roleId,
          status,
        };

        const trimmedPassword = password.trim();

        if (trimmedPassword) {
          updateData.password = trimmedPassword;
        }

        const updated = await updateUser(pendingAction.user.id, updateData);

        setUsers((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );

        setPendingAction(null);
        setShowModal(false);
        setEditingUser(null);
        resetForm();

        showSuccessToast("User updated successfully.");

        return;
      }

      if (pendingAction.type === "delete") {
        const selectedUser = pendingAction.user;

        setDeletingUserId(selectedUser.id);

        await deleteUser(selectedUser.id);

        const nextUsers = users.filter((item) => item.id !== selectedUser.id);

        setUsers(nextUsers);

        const filteredCount = nextUsers.filter((item) =>
          matchesUserFilters(item, searchTerm, statusFilter, roleFilter),
        ).length;

        const nextTotalPages = Math.max(
          1,
          Math.ceil(filteredCount / itemsPerPage),
        );

        setCurrentPage((page) => Math.min(page, nextTotalPages));

        setPendingAction(null);

        showSuccessToast("User deleted successfully.");
      }
    } catch (err) {
      console.error("Failed to process user action:", err);

      const message =
        err instanceof Error ? err.message : "Failed to process user action";

      setError(message);
      showErrorToast(message);

      setPendingAction(null);
    } finally {
      setSaving(false);
      setDeletingUserId(null);
      setProcessingAction(false);
    }
  }

  function handleDelete(selectedUser: User) {
    if (selectedUser.id === currentUser?.id) {
      setError("You cannot delete your own account");

      showErrorToast("You cannot delete your own account.");

      return;
    }

    setPendingAction({
      type: "delete",
      user: selectedUser,
    });
  }

  async function handleStatusToggle(selectedUser: User) {
    if (selectedUser.id === currentUser?.id) {
      setError("You cannot deactivate your own account");

      showErrorToast("You cannot change your own status.");

      return;
    }

    const nextStatus =
      selectedUser.status === USER_STATUS.ACTIVE
        ? USER_STATUS.INACTIVE
        : USER_STATUS.ACTIVE;

    try {
      setDeletingUserId(null);
      setError("");

      const updated = await updateUser(selectedUser.id, {
        status: nextStatus,
      });

      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );

      showSuccessToast(
        nextStatus === USER_STATUS.ACTIVE
          ? "User activated successfully."
          : "User deactivated successfully.",
      );
    } catch (err) {
      console.error("Failed to update user status:", err);

      const message =
        err instanceof Error ? err.message : "Failed to update user status";

      setError(message);
      showErrorToast(message);
    }
  }

  function toggleFilter(panel: FilterPanel) {
    setOpenFilter((current) => (current === panel ? null : panel));
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: "ALL" | UserStatus) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(value: string) {
    setRoleFilter(value === "ALL" ? "ALL" : Number(value));

    setCurrentPage(1);
  }

  function handlePageSizeChange(value: number) {
    setItemsPerPage(value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setRoleFilter("ALL");
    setCurrentPage(1);
    setOpenFilter(null);
  }

  const filteredUsers = useMemo(
    () =>
      users.filter((item) =>
        matchesUserFilters(item, searchTerm, statusFilter, roleFilter),
      ),
    [users, searchTerm, statusFilter, roleFilter],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const showingFrom = filteredUsers.length === 0 ? 0 : startIndex + 1;

  const showingTo =
    filteredUsers.length === 0
      ? 0
      : Math.min(startIndex + itemsPerPage, filteredUsers.length);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "ALL" ||
    roleFilter !== "ALL";

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  function getInitials(item: User) {
    return `${item.firstName.charAt(0)}${item.lastName.charAt(
      0,
    )}`.toUpperCase();
  }

  function getRoleName(item: User) {
    return item.role?.name || (item.roleId === ROLE.ADMIN ? "ADMIN" : "USER");
  }

  function getStatusLabel() {
    if (statusFilter === "ALL") {
      return "All statuses";
    }

    return statusFilter === USER_STATUS.ACTIVE ? "Active" : "Inactive";
  }

  function getRoleLabel() {
    if (roleFilter === "ALL") {
      return "All roles";
    }

    return roleFilter === ROLE.ADMIN ? "Admin" : "User";
  }

  function getConfirmationTitle() {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.type === "create") {
      return "Create user?";
    }

    if (pendingAction.type === "update") {
      return "Save user changes?";
    }

    return "Delete user?";
  }

  function getConfirmationMessage() {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.type === "create") {
      return `Create the account for ${firstName.trim()} ${lastName.trim()}?`;
    }

    if (pendingAction.type === "update") {
      return `Save the changes made to ${pendingAction.user.firstName} ${pendingAction.user.lastName}?`;
    }

    return `Are you sure you want to permanently delete ${pendingAction.user.firstName} ${pendingAction.user.lastName}?`;
  }

  function getConfirmationButtonText() {
    if (processingAction) {
      if (pendingAction?.type === "delete") {
        return "Deleting...";
      }

      return "Saving...";
    }

    if (pendingAction?.type === "delete") {
      return "Delete user";
    }

    if (pendingAction?.type === "update") {
      return "Save changes";
    }

    return "Create user";
  }

  if (loading) {
    return (
      <div className="user-page">
        <div className="user-page-header">
          <div>
            <div className="user-skeleton user-skeleton-title" />
            <div className="user-skeleton user-skeleton-subtitle" />
          </div>
        </div>

        <div className="user-skeleton user-skeleton-toolbar" />

        <div className="user-skeleton user-skeleton-table" />
      </div>
    );
  }

  return (
    <div className="user-page">
      {/* HEADER */}
      <section className="user-page-header">
        <div className="user-page-heading">
          <div className="user-page-eyebrow">ADMINISTRATION</div>

          <h1 className="user-page-title">User Management</h1>

          <p className="user-page-subtitle">
            Manage user accounts, roles, and access status.
          </p>
        </div>

        {/* COMMAND BAR */}
        <div className="user-command-bar">
          {/* SEARCH */}
          <div
            className={`user-command-control ${
              openFilter === "search" ? "expanded" : ""
            }`}
          >
            <button
              type="button"
              className="user-command-button"
              onClick={() => toggleFilter("search")}
              aria-label="Search users"
              title="Search users"
            >
              <span className="user-command-icon">⌕</span>
            </button>

            {openFilter === "search" && (
              <div className="user-command-expanded">
                <input
                  type="search"
                  className="user-command-input"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* STATUS */}
          <div
            className={`user-command-control ${
              openFilter === "status" ? "expanded" : ""
            }`}
          >
            <button
              type="button"
              className={`user-command-button ${
                statusFilter !== "ALL" ? "selected" : ""
              }`}
              onClick={() => toggleFilter("status")}
              aria-label="Filter by status"
              title={`Status: ${getStatusLabel()}`}
            >
              <span className="user-command-icon status-icon">●</span>
            </button>

            {openFilter === "status" && (
              <div className="user-command-expanded user-command-select-wrapper">
                <select
                  className="user-command-select"
                  value={statusFilter}
                  onChange={(event) =>
                    handleStatusFilterChange(
                      event.target.value as "ALL" | UserStatus,
                    )
                  }
                  autoFocus
                >
                  <option value="ALL">All statuses</option>

                  <option value={USER_STATUS.ACTIVE}>Active</option>

                  <option value={USER_STATUS.INACTIVE}>Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* ROLE */}
          <div
            className={`user-command-control ${
              openFilter === "role" ? "expanded" : ""
            }`}
          >
            <button
              type="button"
              className={`user-command-button ${
                roleFilter !== "ALL" ? "selected" : ""
              }`}
              onClick={() => toggleFilter("role")}
              aria-label="Filter by role"
              title={`Role: ${getRoleLabel()}`}
            >
              <span className="user-command-icon">◈</span>
            </button>

            {openFilter === "role" && (
              <div className="user-command-expanded user-command-select-wrapper">
                <select
                  className="user-command-select"
                  value={roleFilter}
                  onChange={(event) =>
                    handleRoleFilterChange(event.target.value)
                  }
                  autoFocus
                >
                  <option value="ALL">All roles</option>

                  <option value={ROLE.ADMIN}>Admin</option>

                  <option value={ROLE.USER}>User</option>
                </select>
              </div>
            )}
          </div>

          {/* CLEAR */}
          {hasActiveFilters && (
            <button
              type="button"
              className="user-command-clear"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

          {/* ADD */}
          <button
            type="button"
            className="btn user-add-button"
            onClick={openAddModal}
          >
            <span className="user-add-icon">+</span>
            Add User
          </button>
        </div>
      </section>

      {/* ERROR */}
      {error && !showModal && (
        <div className="alert alert-danger user-alert">
          <span>{error}</span>

          <button
            type="button"
            className="user-alert-close"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* MAIN CARD */}
      <section className="user-card">
        {/* RESULTS */}
        <div className="user-results-bar">
          <div className="user-results-left">
            <span className="user-results-main">
              {filteredUsers.length === 0
                ? "No users"
                : `Showing ${showingFrom}–${showingTo}`}
            </span>

            {filteredUsers.length > 0 && (
              <span className="user-results-muted">
                {" "}
                of {filteredUsers.length} users
              </span>
            )}

            {filteredUsers.length > 0 && (
              <div className="user-rows-control">
                <span>Rows</span>

                <select
                  value={itemsPerPage}
                  onChange={(event) =>
                    handlePageSizeChange(Number(event.target.value))
                  }
                  aria-label="Rows per page"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <span className="user-filtered-label">
              Filtered from {users.length} total
            </span>
          )}
        </div>

        {/* TABLE */}
        <div className="table-responsive user-table-wrapper">
          <table className="table user-table align-middle">
            <thead>
              <tr>
                <th className="user-col-user">User</th>

                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Employee</th>

                <th className="user-col-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="user-empty-cell">
                    <div className="user-empty">
                      <div className="user-empty-icon">U</div>

                      <h3>No users found</h3>

                      <p>Create your first user to get started.</p>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={openAddModal}
                      >
                        Add User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="user-empty-cell">
                    <div className="user-empty">
                      <div className="user-empty-icon">⌕</div>

                      <h3>No matching users</h3>

                      <p>Try changing your search or filters.</p>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((item) => {
                  const isCurrentUser = item.id === currentUser?.id;

                  const isDeleting = deletingUserId === item.id;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="user-identity">
                          <div className="user-avatar">{getInitials(item)}</div>

                          <div className="user-identity-info">
                            <div className="user-name">
                              {item.firstName} {item.lastName}
                            </div>

                            {isCurrentUser && (
                              <span className="user-you-badge">You</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="user-email">{item.email}</span>
                      </td>

                      <td>
                        <span
                          className={`user-role-badge ${
                            item.roleId === ROLE.ADMIN ? "admin" : "user"
                          }`}
                        >
                          <span className="user-badge-dot" />

                          {getRoleName(item)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`user-status-badge ${
                            item.status === USER_STATUS.ACTIVE
                              ? "active"
                              : "inactive"
                          }`}
                          onClick={() => handleStatusToggle(item)}
                          disabled={isCurrentUser}
                        >
                          <span className="user-badge-dot" />

                          {item.status}
                        </button>
                      </td>

                      <td>
                        {item.employee ? (
                          <div className="user-employee-badge">
                            <span className="user-employee-dot" />

                            {item.employee.employeeNumber}
                          </div>
                        ) : (
                          <span className="user-unassigned">Not assigned</span>
                        )}
                      </td>

                      <td>
                        <div className="user-actions">
                          <button
                            type="button"
                            className="btn user-action-edit"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn user-action-delete"
                            onClick={() => handleDelete(item)}
                            disabled={isCurrentUser || isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
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

        {/* PAGINATION */}
        {filteredUsers.length > 0 && totalPages > 1 && (
          <div className="user-pagination">
            <div className="user-page-info">
              Page <strong>{safeCurrentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </div>

            <nav className="user-pagination-nav" aria-label="User pagination">
              <ul className="pagination user-pagination-list">
                <li
                  className={`page-item ${
                    safeCurrentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                  >
                    Previous
                  </button>
                </li>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) => index + 1,
                ).map((page) => (
                  <li
                    key={page}
                    className={`page-item ${
                      page === safeCurrentPage ? "active" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    safeCurrentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </section>

      {/* ADD / EDIT FORM MODAL */}
      {showModal && (
        <div
          className="user-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="userModalTitle"
        >
          <div className="user-modal-dialog">
            <div className="user-modal">
              <form onSubmit={handleSubmit}>
                <div className="user-modal-header">
                  <div>
                    <div className="user-modal-eyebrow">USER ACCOUNT</div>

                    <h2 id="userModalTitle" className="user-modal-title">
                      {editingUser ? "Edit user" : "Create user"}
                    </h2>

                    <p className="user-modal-subtitle">
                      {editingUser
                        ? "Update account details and access settings."
                        : "Create a new WorkSphere user account."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                    disabled={saving || processingAction}
                    aria-label="Close"
                  />
                </div>

                <div className="user-modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="user-form-section">
                    <div className="user-form-section-title">
                      Personal information
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="userFirstName"
                          className="user-form-label"
                        >
                          First name
                        </label>

                        <input
                          id="userFirstName"
                          type="text"
                          className="form-control"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          maxLength={100}
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          htmlFor="userLastName"
                          className="user-form-label"
                        >
                          Last name
                        </label>

                        <input
                          id="userLastName"
                          type="text"
                          className="form-control"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          maxLength={100}
                          disabled={saving}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="user-form-section">
                    <div className="user-form-section-title">
                      Account information
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="userEmail" className="user-form-label">
                          Email address
                        </label>

                        <input
                          id="userEmail"
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          htmlFor="userPassword"
                          className="user-form-label"
                        >
                          Password
                        </label>

                        <input
                          id="userPassword"
                          type="password"
                          className="form-control"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          disabled={saving}
                          placeholder={
                            editingUser
                              ? "Leave blank to keep current"
                              : "Enter password"
                          }
                          required={!editingUser}
                          autoComplete="new-password"
                        />

                        {editingUser && (
                          <div className="user-form-help">
                            Leave blank to keep the existing password.
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="userRole" className="user-form-label">
                          Role
                        </label>

                        <select
                          id="userRole"
                          className="form-select"
                          value={roleId}
                          onChange={(event) =>
                            setRoleId(Number(event.target.value))
                          }
                          disabled={
                            saving || editingUser?.id === currentUser?.id
                          }
                        >
                          <option value={ROLE.USER}>User</option>

                          <option value={ROLE.ADMIN}>Admin</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="userStatus" className="user-form-label">
                          Status
                        </label>

                        <select
                          id="userStatus"
                          className="form-select"
                          value={status}
                          onChange={(event) =>
                            setStatus(event.target.value as UserStatus)
                          }
                          disabled={
                            saving || editingUser?.id === currentUser?.id
                          }
                        >
                          <option value={USER_STATUS.ACTIVE}>Active</option>

                          <option value={USER_STATUS.INACTIVE}>Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="user-modal-footer">
                  <button
                    type="button"
                    className="btn user-modal-cancel"
                    onClick={closeModal}
                    disabled={saving || processingAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn user-modal-save"
                    disabled={saving || processingAction}
                  >
                    {editingUser ? "Save changes" : "Create user"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {pendingAction && (
        <div
          className="user-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="userConfirmTitle"
        >
          <div className="user-confirm-modal">
            <div
              className={`user-confirm-icon ${
                pendingAction.type === "delete" ? "danger" : "primary"
              }`}
            >
              {pendingAction.type === "delete" ? "!" : "?"}
            </div>

            <h2 id="userConfirmTitle" className="user-confirm-title">
              {getConfirmationTitle()}
            </h2>

            <p className="user-confirm-message">{getConfirmationMessage()}</p>

            {pendingAction.type === "delete" && (
              <div className="user-confirm-warning">
                This action cannot be undone.
              </div>
            )}

            <div className="user-confirm-actions">
              <button
                type="button"
                className="btn user-confirm-cancel"
                onClick={cancelConfirmation}
                disabled={processingAction}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`btn ${
                  pendingAction.type === "delete"
                    ? "user-confirm-delete"
                    : "user-confirm-primary"
                }`}
                onClick={confirmPendingAction}
                disabled={processingAction}
              >
                {getConfirmationButtonText()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          className={`user-toast ${
            toast.type === "success" ? "success" : "error"
          }`}
          role="status"
        >
          <span className="user-toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>

          <span className="user-toast-message">{toast.message}</span>

          <button
            type="button"
            className="user-toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
