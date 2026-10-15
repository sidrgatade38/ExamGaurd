import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToDashboard = () => {
    // Navigate to root route, which automatically redirects to role-appropriate home
    navigate('/', { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>
          <ShieldAlert size={44} color="#ef4444" />
        </div>
        <h1 style={styles.title}>Access Denied</h1>
        <p style={styles.message}>
          You do not have permission to access this page.
        </p>

        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Signed in as:</span>
            <span style={styles.infoValue}>{user?.email || 'Authenticated User'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Current Role:</span>
            <span style={styles.roleBadge}>{user?.role || 'UNKNOWN'}</span>
          </div>
        </div>

        <button onClick={handleBackToDashboard} style={styles.button}>
          <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
          Back to Dashboard
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
    maxWidth: '440px',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    border: '1px solid #334155',
    color: '#f8fafc',
    textAlign: 'center',
  },
  iconWrapper: {
    display: 'inline-flex',
    padding: '1rem',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 0.5rem 0',
  },
  message: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    margin: '0 0 1.5rem 0',
    lineHeight: '1.5',
  },
  infoBox: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.75rem',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
  },
  infoLabel: {
    color: '#64748b',
  },
  infoValue: {
    color: '#cbd5e1',
    fontWeight: '500',
  },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
};
