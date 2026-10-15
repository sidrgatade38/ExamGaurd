import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  UserPlus,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Clock,
  Activity,
  FileText,
  KeyRound,
  Key,
  X,
  Search,
  Check,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import auditLogService from '../services/auditLogService';
import adminService from '../services/adminService';

export default function AdminHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active top tab: 'users' or 'audit'
  const [activeTab, setActiveTab] = useState('users');

  // ==========================================
  // SECTION A: User Management States
  // ==========================================
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionError, setUserActionError] = useState(null);
  const [userActionSuccess, setUserActionSuccess] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEACHER',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('');
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [passwordResetTarget, setPasswordResetTarget] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // ==========================================
  // SECTION B: Audit Log States (Module 13)
  // ==========================================
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    successCount: 0,
    failureCount: 0,
    deniedCount: 0,
  });
  const [auditPagination, setAuditPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // ==========================================
  // User Management Handlers
  // ==========================================
  const fetchUsers = useCallback(
    async (pageToLoad = 1) => {
      setUsersLoading(true);
      setUserActionError(null);
      try {
        const params = {
          page: pageToLoad,
          limit: usersPagination.limit,
        };
        if (userSearch) params.search = userSearch;
        if (userRoleFilter) params.role = userRoleFilter;
        if (userStatusFilter) params.status = userStatusFilter;

        const result = await adminService.getUsers(params);
        setUsersList(result.users || []);
        setUsersPagination(
          result.pagination || {
            total: 0,
            page: pageToLoad,
            limit: usersPagination.limit,
            totalPages: 1,
          }
        );
      } catch (err) {
        console.error('Error fetching users:', err);
        setUserActionError(
          err.response?.data?.message || err.message || 'Failed to load user list.'
        );
      } finally {
        setUsersLoading(false);
      }
    },
    [userSearch, userRoleFilter, userStatusFilter, usersPagination.limit]
  );

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    }
  }, [fetchUsers, activeTab]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionError(null);
    setUserActionSuccess(null);

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setUserActionError('Please fill in all required fields.');
      return;
    }
    if (createForm.password.length < 8) {
      setUserActionError('Password must be at least 8 characters long.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await adminService.createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        role: createForm.role,
      });

      setUserActionSuccess(`User "${res.user?.email || createForm.email}" created successfully.`);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'TEACHER' });
      fetchUsers(1);
    } catch (err) {
      setUserActionError(
        err.response?.data?.message || err.message || 'Failed to create user.'
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusConfirmTarget) return;
    setUserActionError(null);
    setUserActionSuccess(null);
    setStatusSubmitting(true);

    try {
      const targetIsActive = !statusConfirmTarget.isActive;
      const res = await adminService.updateUserStatus(statusConfirmTarget.id, targetIsActive);

      setUserActionSuccess(
        `User "${statusConfirmTarget.email}" successfully ${
          targetIsActive ? 'activated' : 'deactivated'
        }.`
      );
      setStatusConfirmTarget(null);
      fetchUsers(usersPagination.page);
    } catch (err) {
      setUserActionError(
        err.response?.data?.message || err.message || 'Failed to update account status.'
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget || !selectedNewRole) return;
    setUserActionError(null);
    setUserActionSuccess(null);
    setRoleSubmitting(true);

    try {
      const res = await adminService.updateUserRole(roleChangeTarget.id, selectedNewRole);
      setUserActionSuccess(
        `Role for "${roleChangeTarget.email}" successfully changed to ${selectedNewRole}.`
      );
      setRoleChangeTarget(null);
      setSelectedNewRole('');
      fetchUsers(usersPagination.page);
    } catch (err) {
      setUserActionError(
        err.response?.data?.message || err.message || 'Failed to change user role.'
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault();
    if (!passwordResetTarget) return;
    setUserActionError(null);
    setUserActionSuccess(null);

    if (newPasswordInput.length < 8) {
      setUserActionError('New password must be at least 8 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setUserActionError('Passwords do not match. Please re-enter.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await adminService.resetPassword(passwordResetTarget.id, newPasswordInput);
      setUserActionSuccess(`Password for "${passwordResetTarget.email}" reset successfully.`);
      setPasswordResetTarget(null);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err) {
      setUserActionError(
        err.response?.data?.message || err.message || 'Failed to reset password.'
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // ==========================================
  // Audit Log Handlers (Module 13)
  // ==========================================
  const fetchSummary = useCallback(async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await auditLogService.getAuditSummary(params);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch audit summary:', err);
    }
  }, [startDate, endDate]);

  const fetchLogs = useCallback(
    async (pageToLoad = 1) => {
      setAuditLoading(true);
      setAuditError(null);
      try {
        const params = {
          page: pageToLoad,
          limit: auditPagination.limit,
        };
        if (actionFilter) params.action = actionFilter;
        if (outcomeFilter) params.outcome = outcomeFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const result = await auditLogService.getAuditLogs(params);
        setLogs(result.logs || []);
        setAuditPagination(
          result.pagination || {
            total: 0,
            page: pageToLoad,
            limit: auditPagination.limit,
            totalPages: 1,
          }
        );
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setAuditError(err.response?.data?.message || err.message || 'Failed to load audit logs.');
      } finally {
        setAuditLoading(false);
      }
    },
    [actionFilter, outcomeFilter, startDate, endDate, auditPagination.limit]
  );

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchSummary();
      fetchLogs(1);
    }
  }, [fetchSummary, fetchLogs, activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return isoStr;
    }
  };

  const getRoleBadgeStyle = (roleName) => {
    switch ((roleName || '').toUpperCase()) {
      case 'ADMIN':
        return { bg: '#4c1d95', color: '#e9d5ff', border: '1px solid #7c3aed' };
      case 'EXAM_COORDINATOR':
        return { bg: '#78350f', color: '#fef3c7', border: '1px solid #d97706' };
      case 'TEACHER':
        return { bg: '#1e3a8a', color: '#bfdbfe', border: '1px solid #2563eb' };
      default:
        return { bg: '#334155', color: '#cbd5e1', border: '1px solid #475569' };
    }
  };

  const getOutcomeBadgeStyle = (outcome) => {
    switch (outcome) {
      case 'SUCCESS':
        return { bg: '#064e3b', color: '#6ee7b7', border: '1px solid #059669' };
      case 'FAILURE':
        return { bg: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626' };
      case 'DENIED':
        return { bg: '#78350f', color: '#fde68a', border: '1px solid #d97706' };
      default:
        return { bg: '#1e293b', color: '#94a3b8', border: '1px solid #334155' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.brandIconWrapper}>
            <ShieldAlert size={26} color="#38bdf8" />
          </div>
          <div>
            <h1 style={styles.headerTitle}>ExamGuard Administration</h1>
            <p style={styles.headerSubtitle}>
              Enterprise Security Oversight, User Administration & Cryptographic Audit
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.userProfilePill}>
            <User size={16} color="#38bdf8" style={{ marginRight: '0.4rem' }} />
            <span style={styles.userName}>{user?.name || 'Administrator'}</span>
            <span style={styles.roleBadge}>ADMIN</span>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} style={{ marginRight: '0.4rem' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav style={styles.tabNav}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'users' ? styles.tabBtnActive : {}),
          }}
        >
          <Users size={18} style={{ marginRight: '0.5rem' }} />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'audit' ? styles.tabBtnActive : {}),
          }}
        >
          <Activity size={18} style={{ marginRight: '0.5rem' }} />
          <span>Security Audit Logs</span>
        </button>
      </nav>

      {/* Main Body */}
      <main style={styles.main}>
        {/* Global Success / Error Alerts */}
        {userActionSuccess && (
          <div style={styles.successBox}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{userActionSuccess}</span>
            <button
              onClick={() => setUserActionSuccess(null)}
              style={styles.alertDismissBtn}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {userActionError && (
          <div style={styles.errorBox}>
            <XCircle size={18} color="#ef4444" />
            <span>{userActionError}</span>
            <button
              onClick={() => setUserActionError(null)}
              style={styles.alertDismissBtn}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: USER MANAGEMENT                                         */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div>
            {/* User Search & Filter Toolbar */}
            <section style={styles.filterCard}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Search size={14} style={{ marginRight: '0.35rem' }} />
                  Search Name or Email
                </label>
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Filter size={14} style={{ marginRight: '0.35rem' }} />
                  Filter Role
                </label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="EXAM_COORDINATOR">EXAM_COORDINATOR</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Account Status</label>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              <div style={styles.filterActions}>
                <button
                  onClick={() => fetchUsers(1)}
                  style={styles.refreshBtn}
                  disabled={usersLoading}
                  title="Refresh Users"
                >
                  <RefreshCw
                    size={16}
                    style={{
                      animation: usersLoading ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => {
                    setUserActionError(null);
                    setShowCreateModal(true);
                  }}
                  style={styles.createUserBtn}
                >
                  <UserPlus size={16} style={{ marginRight: '0.4rem' }} />
                  <span>Create User</span>
                </button>
              </div>
            </section>

            {/* Users Table Card */}
            <section style={styles.tableCard}>
              <div style={styles.tableHeaderBar}>
                <div>
                  <h2 style={styles.tableTitle}>Registered System Accounts</h2>
                  <p style={styles.tableSubtitle}>
                    Manage identity lifecycles, role delegations, and account activations
                  </p>
                </div>
                <span style={styles.recordsCountBadge}>
                  {usersPagination.total} Total Users
                </span>
              </div>

              {usersLoading ? (
                <div style={styles.loadingContainer}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#38bdf8' }} />
                  <p style={styles.loadingText}>Loading user registry from database...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <Users size={48} color="#64748b" />
                  <h3 style={styles.emptyTitle}>No Users Found</h3>
                  <p style={styles.emptyText}>
                    No registered user accounts match your search or filter criteria.
                  </p>
                </div>
              ) : (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeadRow}>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Email Address</th>
                        <th style={styles.th}>Role</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Created Date</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => {
                        const roleStyle = getRoleBadgeStyle(u.role);
                        const isSelf = u.id === user?.userId || u.id === user?.id;

                        return (
                          <tr key={u.id} style={styles.tableRow}>
                            <td style={styles.td}>
                              <div style={styles.userNameBlock}>
                                <span style={styles.userNameText}>{u.name}</span>
                                {isSelf && (
                                  <span style={styles.selfPill}>You</span>
                                )}
                              </div>
                            </td>
                            <td style={styles.tdMono}>{u.email}</td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.rolePill,
                                  backgroundColor: roleStyle.bg,
                                  color: roleStyle.color,
                                  border: roleStyle.border,
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td style={styles.td}>
                              {u.isActive ? (
                                <span style={styles.statusActivePill}>
                                  <CheckCircle2 size={12} style={{ marginRight: '0.25rem' }} />
                                  Active
                                </span>
                              ) : (
                                <span style={styles.statusInactivePill}>
                                  <XCircle size={12} style={{ marginRight: '0.25rem' }} />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td style={styles.tdTime}>
                              {formatTimestamp(u.createdAt)}
                            </td>
                            <td style={{ ...styles.tdAction, textAlign: 'right' }}>
                              <div style={styles.rowActions}>
                                {/* View details */}
                                <button
                                  onClick={() => setSelectedUserDetail(u)}
                                  style={styles.actionIconBtn}
                                  title="View User Details"
                                >
                                  <Eye size={15} />
                                </button>

                                {/* Change Role */}
                                <button
                                  onClick={() => {
                                    setRoleChangeTarget(u);
                                    setSelectedNewRole(u.role);
                                  }}
                                  style={styles.actionIconBtn}
                                  title="Change User Role"
                                >
                                  <ShieldCheck size={15} color="#a855f7" />
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => {
                                    setPasswordResetTarget(u);
                                    setNewPasswordInput('');
                                    setConfirmPasswordInput('');
                                  }}
                                  style={styles.actionIconBtn}
                                  title="Reset Password"
                                >
                                  <Key size={15} color="#38bdf8" />
                                </button>

                                {/* Toggle Active Status */}
                                <button
                                  onClick={() => setStatusConfirmTarget(u)}
                                  style={{
                                    ...styles.actionIconBtn,
                                    color: u.isActive ? '#ef4444' : '#10b981',
                                  }}
                                  title={u.isActive ? 'Deactivate User' : 'Activate User'}
                                >
                                  {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Pagination */}
              {usersPagination.totalPages > 1 && (
                <div style={styles.paginationBar}>
                  <div style={styles.paginationInfo}>
                    Page {usersPagination.page} of {usersPagination.totalPages} ({usersPagination.total} users)
                  </div>
                  <div style={styles.paginationBtns}>
                    <button
                      onClick={() => fetchUsers(usersPagination.page - 1)}
                      disabled={usersPagination.page <= 1}
                      style={styles.pageBtn}
                    >
                      <ArrowLeft size={14} style={{ marginRight: '0.35rem' }} />
                      Prev
                    </button>
                    <button
                      onClick={() => fetchUsers(usersPagination.page + 1)}
                      disabled={usersPagination.page >= usersPagination.totalPages}
                      style={styles.pageBtn}
                    >
                      Next
                      <ArrowRight size={14} style={{ marginLeft: '0.35rem' }} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: AUDIT LOGS (Module 13 preserved in full)                */}
        {/* ============================================================== */}
        {activeTab === 'audit' && (
          <div>
            {/* Summary Metrics Cards */}
            <section style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIconBoxTotal}>
                  <Activity size={22} color="#38bdf8" />
                </div>
                <div>
                  <div style={styles.statLabel}>Total Security Events</div>
                  <div style={styles.statValue}>{summary.totalEvents.toLocaleString()}</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconBoxSuccess}>
                  <CheckCircle2 size={22} color="#10b981" />
                </div>
                <div>
                  <div style={styles.statLabel}>Successful Operations</div>
                  <div style={styles.statValue}>{summary.successCount.toLocaleString()}</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconBoxDenied}>
                  <AlertTriangle size={22} color="#f59e0b" />
                </div>
                <div>
                  <div style={styles.statLabel}>Access Denials (403)</div>
                  <div style={styles.statValue}>{summary.deniedCount.toLocaleString()}</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconBoxFail}>
                  <XCircle size={22} color="#ef4444" />
                </div>
                <div>
                  <div style={styles.statLabel}>Security Failures</div>
                  <div style={styles.statValue}>{summary.failureCount.toLocaleString()}</div>
                </div>
              </div>
            </section>

            {/* Filter Toolbar */}
            <section style={styles.filterCard}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Filter size={14} style={{ marginRight: '0.35rem' }} />
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="FAILED_LOGIN">FAILED_LOGIN</option>
                  <option value="QUESTION_PAPER_SUBMITTED">QUESTION_PAPER_SUBMITTED</option>
                  <option value="QUESTION_PAPER_ACCESSED">QUESTION_PAPER_ACCESSED</option>
                  <option value="QUESTION_PAPER_SCHEDULED">QUESTION_PAPER_SCHEDULED</option>
                  <option value="SIGNATURE_VERIFIED">SIGNATURE_VERIFIED</option>
                  <option value="DECRYPTION_REQUESTED">DECRYPTION_REQUESTED</option>
                  <option value="DOWNLOAD">DOWNLOAD</option>
                  <option value="ANSWER_KEY_UPLOADED">ANSWER_KEY_UPLOADED</option>
                  <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Outcome</label>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="">All Outcomes</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILURE">FAILURE</option>
                  <option value="DENIED">DENIED</option>
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Calendar size={14} style={{ marginRight: '0.35rem' }} />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Calendar size={14} style={{ marginRight: '0.35rem' }} />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>

              <button
                onClick={() => {
                  fetchSummary();
                  fetchLogs(1);
                }}
                style={styles.refreshBtn}
                disabled={auditLoading}
                title="Refresh Logs"
              >
                <RefreshCw
                  size={16}
                  style={{
                    animation: auditLoading ? 'spin 1s linear infinite' : 'none',
                  }}
                />
                <span>Refresh</span>
              </button>
            </section>

            {auditError && (
              <div style={styles.errorBox}>
                <XCircle size={18} color="#ef4444" />
                <span>{auditError}</span>
              </div>
            )}

            {/* Audit Log Table Container */}
            <section style={styles.tableCard}>
              <div style={styles.tableHeaderBar}>
                <h2 style={styles.tableTitle}>Security Activity Stream</h2>
                <span style={styles.recordsCountBadge}>
                  {auditPagination.total} Total Records
                </span>
              </div>

              {auditLoading ? (
                <div style={styles.loadingContainer}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#38bdf8' }} />
                  <p style={styles.loadingText}>Loading audit logs from database...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <ShieldCheck size={48} color="#64748b" />
                  <h3 style={styles.emptyTitle}>No Audit Records Found</h3>
                  <p style={styles.emptyText}>
                    No events match the selected criteria. Try adjusting the filters.
                  </p>
                </div>
              ) : (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeadRow}>
                        <th style={styles.th}>Timestamp</th>
                        <th style={styles.th}>Action</th>
                        <th style={styles.th}>Outcome</th>
                        <th style={styles.th}>Actor</th>
                        <th style={styles.th}>Resource</th>
                        <th style={styles.th}>Summary</th>
                        <th style={styles.th}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const badge = getOutcomeBadgeStyle(log.outcome);
                        return (
                          <tr key={log.id} style={styles.tableRow}>
                            <td style={styles.tdTime}>
                              <Clock size={12} style={{ marginRight: '0.3rem', color: '#64748b' }} />
                              {formatTimestamp(log.createdAt)}
                            </td>
                            <td style={styles.td}>
                              <span style={styles.actionPill}>{log.action}</span>
                            </td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.outcomePill,
                                  backgroundColor: badge.bg,
                                  color: badge.color,
                                  border: badge.border,
                                }}
                              >
                                {log.outcome}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.actorBlock}>
                                <span style={styles.actorName}>
                                  {log.user?.name || log.role || 'Unauthenticated'}
                                </span>
                                {log.user?.email && (
                                  <span style={styles.actorEmail}>{log.user.email}</span>
                                )}
                              </div>
                            </td>
                            <td style={styles.td}>
                              {log.resourceType ? (
                                <span style={styles.resourceBadge}>
                                  {log.resourceType}
                                  {log.resourceId && (
                                    <span style={styles.resourceIdMono}>
                                      :{log.resourceId.slice(0, 8)}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b' }}>-</span>
                              )}
                            </td>
                            <td style={styles.tdSummary} title={log.summary}>
                              {log.summary || 'Operation recorded'}
                            </td>
                            <td style={styles.tdAction}>
                              <button
                                onClick={() => setSelectedLog(log)}
                                style={styles.detailBtn}
                                title="Inspect Audit Metadata"
                              >
                                <Eye size={14} style={{ marginRight: '0.25rem' }} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {auditPagination.totalPages > 1 && (
                <div style={styles.paginationBar}>
                  <div style={styles.paginationInfo}>
                    Page {auditPagination.page} of {auditPagination.totalPages} ({auditPagination.total} records)
                  </div>
                  <div style={styles.paginationBtns}>
                    <button
                      onClick={() => fetchLogs(auditPagination.page - 1)}
                      disabled={auditPagination.page <= 1}
                      style={styles.pageBtn}
                    >
                      <ArrowLeft size={14} style={{ marginRight: '0.35rem' }} />
                      Prev
                    </button>
                    <button
                      onClick={() => fetchLogs(auditPagination.page + 1)}
                      disabled={auditPagination.page >= auditPagination.totalPages}
                      style={styles.pageBtn}
                    >
                      Next
                      <ArrowRight size={14} style={{ marginLeft: '0.35rem' }} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: CREATE USER                                           */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Register New ExamGuard Account</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={styles.modalBody}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Alan Turing"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    style={styles.modalInput}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Institutional Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alan.turing@examguard.edu"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    style={styles.modalInput}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Assigned Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    style={styles.modalSelect}
                  >
                    <option value="TEACHER">TEACHER (Question Paper Author & Answer Keys)</option>
                    <option value="EXAM_COORDINATOR">EXAM_COORDINATOR (Distribution & Materials)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters with letter and number"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    style={styles.modalInput}
                  />
                  <p style={styles.formHint}>
                    Password will be hashed using bcrypt (12 rounds) server-side and never exposed.
                  </p>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.modalDismissBtn}
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                  disabled={createSubmitting}
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '0.4rem' }} />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: USER DETAILS INSPECTION                               */}
      {/* ============================================================== */}
      {selectedUserDetail && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Account Profile</h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>User ID</span>
                  <span style={styles.modalMono}>{selectedUserDetail.id}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Account Status</span>
                  <span>
                    {selectedUserDetail.isActive ? (
                      <span style={styles.statusActivePill}>Active</span>
                    ) : (
                      <span style={styles.statusInactivePill}>Inactive</span>
                    )}
                  </span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Full Name</span>
                  <span style={styles.modalFieldValue}>{selectedUserDetail.name}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Email Address</span>
                  <span style={styles.modalMono}>{selectedUserDetail.email}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>System Role</span>
                  <span>
                    <span style={styles.rolePill}>{selectedUserDetail.role}</span>
                  </span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Created At</span>
                  <span style={styles.modalFieldValue}>
                    {formatTimestamp(selectedUserDetail.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedUserDetail(null)}
                style={styles.modalDismissBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: STATUS CONFIRMATION                                   */}
      {/* ============================================================== */}
      {statusConfirmTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {statusConfirmTarget.isActive ? 'Deactivate User Account' : 'Activate User Account'}
              </h3>
              <button
                onClick={() => setStatusConfirmTarget(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>
                Are you sure you want to{' '}
                <strong>{statusConfirmTarget.isActive ? 'deactivate' : 'activate'}</strong> the account
                for <strong>{statusConfirmTarget.name}</strong> ({statusConfirmTarget.email})?
              </p>
              {statusConfirmTarget.isActive && (
                <div style={styles.warningAlert}>
                  <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span>
                    Deactivating this account will immediately revoke all JWT sessions and prevent future logins.
                  </span>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setStatusConfirmTarget(null)}
                style={styles.modalDismissBtn}
                disabled={statusSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                style={{
                  ...styles.modalSubmitBtn,
                  backgroundColor: statusConfirmTarget.isActive ? '#dc2626' : '#10b981',
                }}
                disabled={statusSubmitting}
              >
                {statusSubmitting ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : statusConfirmTarget.isActive ? (
                  'Deactivate Account'
                ) : (
                  'Activate Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ROLE CHANGE                                           */}
      {/* ============================================================== */}
      {roleChangeTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign System Role</h3>
              <button
                onClick={() => setRoleChangeTarget(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>
                Select a new system role for <strong>{roleChangeTarget.name}</strong> ({roleChangeTarget.email}).
              </p>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Current Role</label>
                <span style={styles.rolePill}>{roleChangeTarget.role}</span>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>New Target Role</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="TEACHER">TEACHER</option>
                  <option value="EXAM_COORDINATOR">EXAM_COORDINATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {roleChangeTarget.role === 'ADMIN' && selectedNewRole !== 'ADMIN' && (
                <div style={styles.warningAlert}>
                  <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span>
                    Warning: Demoting an administrator removes full audit and user management privileges.
                  </span>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                style={styles.modalDismissBtn}
                disabled={roleSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                style={styles.modalSubmitBtn}
                disabled={roleSubmitting || selectedNewRole === roleChangeTarget.role}
              >
                {roleSubmitting ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: PASSWORD RESET                                        */}
      {/* ============================================================== */}
      {passwordResetTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Reset User Password</h3>
              <button
                onClick={() => setPasswordResetTarget(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordReset}>
              <div style={styles.modalBody}>
                <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>
                  Set a new initial password for <strong>{passwordResetTarget.name}</strong> ({passwordResetTarget.email}).
                </p>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters with letter and number"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type new password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setPasswordResetTarget(null)}
                  style={styles.modalDismissBtn}
                  disabled={passwordSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: AUDIT DETAIL INSPECTOR (Module 13)                    */}
      {/* ============================================================== */}
      {selectedLog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Forensic Audit Event Inspector</h3>
              <button onClick={() => setSelectedLog(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Event ID</span>
                  <span style={styles.modalMono}>{selectedLog.id}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Timestamp (UTC)</span>
                  <span style={styles.modalMono}>{selectedLog.createdAt}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Action</span>
                  <span style={styles.modalMono}>{selectedLog.action}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Outcome</span>
                  <span style={styles.modalMono}>{selectedLog.outcome}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Actor User ID</span>
                  <span style={styles.modalMono}>{selectedLog.userId || 'N/A (Unauthenticated)'}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Actor Role</span>
                  <span style={styles.modalMono}>{selectedLog.role || selectedLog.user?.role || 'N/A'}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Client IP</span>
                  <span style={styles.modalMono}>{selectedLog.ipAddress || 'Unknown'}</span>
                </div>
                <div style={styles.modalField}>
                  <span style={styles.modalFieldLabel}>Correlation ID</span>
                  <span style={styles.modalMono}>{selectedLog.correlationId || 'N/A'}</span>
                </div>
              </div>

              <div style={styles.modalSummaryBox}>
                <span style={styles.modalFieldLabel}>Event Summary</span>
                <p style={styles.modalSummaryText}>{selectedLog.summary || 'None'}</p>
              </div>

              <div style={styles.modalDetailsBox}>
                <span style={styles.modalFieldLabel}>Sanitized Event Metadata (Redacted JSON)</span>
                <pre style={styles.modalJson}>
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setSelectedLog(null)} style={styles.modalDismissBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0f1d',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  header: {
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    padding: '1.25rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  brandIconWrapper: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    padding: '0.65rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    margin: 0,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: '0.2rem 0 0 0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userProfilePill: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: '0.45rem 0.9rem',
    borderRadius: '20px',
    border: '1px solid #334155',
    fontSize: '0.85rem',
  },
  userName: {
    fontWeight: '600',
    color: '#f1f5f9',
    marginRight: '0.5rem',
  },
  roleBadge: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '0.15rem 0.45rem',
    borderRadius: '6px',
    letterSpacing: '0.04em',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    color: '#f87171',
    border: '1px solid #334155',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabNav: {
    display: 'flex',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    padding: '0 2rem',
    gap: '1rem',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '1rem 0.75rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  },
  tabBtnActive: {
    color: '#38bdf8',
    borderBottomColor: '#38bdf8',
  },
  main: {
    padding: '2rem',
    maxWidth: '1440px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
    padding: '0.85rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.85rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  alertDismissBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '0.2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  statCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIconBoxTotal: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '0.75rem',
    borderRadius: '10px',
  },
  statIconBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '0.75rem',
    borderRadius: '10px',
  },
  statIconBoxDenied: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: '0.75rem',
    borderRadius: '10px',
  },
  statIconBoxFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '0.75rem',
    borderRadius: '10px',
  },
  statLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: '0.2rem',
  },
  filterCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: '1 1 180px',
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
  },
  filterActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.55rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  selectInput: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.55rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  dateInput: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  createUserBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    border: 'none',
    color: '#ffffff',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1e293b',
  },
  tableTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: 0,
    color: '#f8fafc',
  },
  tableSubtitle: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    margin: '0.2rem 0 0 0',
  },
  recordsCountBadge: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeadRow: {
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  th: {
    padding: '0.85rem 1.25rem',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tableRow: {
    borderBottom: '1px solid #1e293b',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '1rem 1.25rem',
    fontSize: '0.85rem',
    color: '#e2e8f0',
    verticalAlign: 'middle',
  },
  tdMono: {
    padding: '1rem 1.25rem',
    fontSize: '0.825rem',
    fontFamily: 'monospace',
    color: '#cbd5e1',
    verticalAlign: 'middle',
  },
  tdTime: {
    padding: '1rem 1.25rem',
    fontSize: '0.8rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  userNameBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userNameText: {
    fontWeight: '600',
    color: '#f8fafc',
  },
  selfPill: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  rolePill: {
    fontSize: '0.725rem',
    fontWeight: '700',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    display: 'inline-block',
    letterSpacing: '0.03em',
  },
  statusActivePill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    border: '1px solid #059669',
    fontSize: '0.725rem',
    fontWeight: '700',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
  },
  statusInactivePill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #dc2626',
    fontSize: '0.725rem',
    fontWeight: '700',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
  },
  rowActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.4rem',
  },
  actionIconBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#cbd5e1',
    padding: '0.45rem',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tdSummary: {
    padding: '1rem 1.25rem',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'middle',
  },
  tdAction: {
    padding: '1rem 1.25rem',
    verticalAlign: 'middle',
  },
  actionPill: {
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: '1px solid #334155',
    display: 'inline-block',
  },
  outcomePill: {
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    fontSize: '0.725rem',
    fontWeight: '700',
    display: 'inline-block',
    letterSpacing: '0.03em',
  },
  actorBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  actorName: {
    fontWeight: '600',
    color: '#f8fafc',
  },
  actorEmail: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  resourceBadge: {
    backgroundColor: '#1e293b',
    color: '#a5b4fc',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    fontSize: '0.725rem',
    fontWeight: '600',
    border: '1px solid #334155',
  },
  resourceIdMono: {
    color: '#64748b',
    fontFamily: 'monospace',
    marginLeft: '0.2rem',
  },
  detailBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#38bdf8',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #1e293b',
    backgroundColor: '#0f172a',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  paginationInfo: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  paginationBtns: {
    display: 'flex',
    gap: '0.5rem',
  },
  pageBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.4rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loadingContainer: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: 0,
  },
  emptyContainer: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#e2e8f0',
    margin: 0,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    margin: 0,
    maxWidth: '400px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1e293b',
    backgroundColor: '#0f172a',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: 0,
    color: '#f8fafc',
  },
  modalCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
  },
  modalBody: {
    padding: '1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  modalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.85rem',
  },
  modalFieldLabel: {
    fontSize: '0.725rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  modalFieldValue: {
    color: '#e2e8f0',
    fontWeight: '500',
  },
  modalMono: {
    fontFamily: 'monospace',
    fontSize: '0.785rem',
    color: '#cbd5e1',
    wordBreak: 'break-all',
  },
  modalSummaryBox: {
    backgroundColor: '#0f172a',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    border: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  modalSummaryText: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#e2e8f0',
    lineHeight: 1.4,
  },
  modalDetailsBox: {
    backgroundColor: '#0f172a',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    border: '1px solid #1e293b',
  },
  modalJson: {
    margin: 0,
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#a5b4fc',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #1e293b',
    backgroundColor: '#0f172a',
  },
  modalDismissBtn: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  formHint: {
    fontSize: '0.725rem',
    color: '#94a3b8',
    margin: '0.2rem 0 0 0',
  },
  modalInput: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  modalSelect: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  warningAlert: {
    display: 'flex',
    gap: '0.65rem',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#fbbf24',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    lineHeight: 1.4,
  },
};
