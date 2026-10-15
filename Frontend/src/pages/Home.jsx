import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Award, CheckCircle, LogOut } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>
            <ShieldCheck size={36} color="#2563eb" />
          </div>
          <h1 style={styles.title}>ExamGuard</h1>
          <p style={styles.subtitle}>Authentication Status Verification (Module 3)</p>
        </div>

        <div style={styles.statusBox}>
          <div style={styles.statusHeader}>
            <CheckCircle size={22} color="#22c55e" />
            <span style={styles.statusTitle}>Authenticated ✓</span>
          </div>
          <p style={styles.statusDesc}>
            Your session is verified with a signed JWT access token.
          </p>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoItem}>
            <div style={styles.itemHeader}>
              <User size={16} style={styles.itemIcon} />
              <span style={styles.itemLabel}>User</span>
            </div>
            <div style={styles.itemValue}>{user?.name || 'Faculty Member'}</div>
            <div style={styles.itemSubValue}>{user?.email || 'N/A'}</div>
          </div>

          <div style={styles.infoItem}>
            <div style={styles.itemHeader}>
              <Award size={16} style={styles.itemIcon} />
              <span style={styles.itemLabel}>Role ID</span>
            </div>
            <div style={styles.itemValueMono}>{user?.roleId || 'N/A'}</div>
          </div>

          <div style={styles.infoItem}>
            <div style={styles.itemHeader}>
              <CheckCircle size={16} style={styles.itemIcon} />
              <span style={styles.itemLabel}>Authentication</span>
            </div>
            <div style={styles.itemValueGreen}>Authenticated ✓</div>
          </div>
        </div>

        <div style={styles.noticeBox}>
          <p style={styles.noticeText}>
            <strong>Note:</strong> This is a temporary authentication verification page for Module 3. Role-based dashboards (Admin, Teacher, Exam Coordinator) will be implemented in Module 4 (RBAC).
          </p>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={18} style={{ marginRight: '0.5rem' }} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '1.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
    border: '1px solid #334155',
    color: '#f8fafc',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoIcon: {
    display: 'inline-flex',
    padding: '0.75rem',
    borderRadius: '12px',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '1.85rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  statusBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid #22c55e',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    color: '#86efac',
    fontSize: '1.05rem',
  },
  statusTitle: {
    color: '#86efac',
  },
  statusDesc: {
    margin: '0.35rem 0 0 0',
    fontSize: '0.8rem',
    color: '#bbf7d0',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  infoItem: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '0.875rem 1rem',
    border: '1px solid #334155',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginBottom: '0.25rem',
  },
  itemIcon: {
    color: '#64748b',
  },
  itemLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
  },
  itemValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  itemSubValue: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginTop: '0.15rem',
  },
  itemValueMono: {
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    color: '#38bdf8',
    wordBreak: 'break-all',
  },
  itemValueGreen: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#4ade80',
  },
  noticeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid #0284c7',
    borderRadius: '8px',
    padding: '0.875rem',
    marginBottom: '1.5rem',
  },
  noticeText: {
    fontSize: '0.785rem',
    color: '#bae6fd',
    margin: 0,
    lineHeight: '1.4',
  },
  logoutButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.925rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
};
