import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const { user, login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already authenticated and not loading, redirect to role-appropriate home
  if (isAuthenticated && !authLoading && !isSubmitting && !successMessage) {
    const role = user?.role?.toUpperCase();
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'EXAM_COORDINATOR') return <Navigate to="/exam-coordinator" replace />;
    return <Navigate to="/teacher" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authData = await login(email.trim(), password);
      setSuccessMessage('Authentication successful! Redirecting...');
      setTimeout(() => {
        const role = (authData?.user?.role || user?.role)?.toUpperCase();
        if (role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else if (role === 'EXAM_COORDINATOR') {
          navigate('/exam-coordinator', { replace: true });
        } else {
          navigate('/teacher', { replace: true });
        }
      }, 400);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to complete login. Please check credentials or server connection.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>
            <ShieldCheck size={32} color="#2563eb" />
          </div>
          <h1 style={styles.title}>ExamGuard</h1>
          <p style={styles.subtitle}>Secure Question Paper Management System</p>
          <div style={styles.badge}>Secure Examination Management System</div>
        </div>

        {errorMessage && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={styles.alertIcon} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={styles.successAlert}>
            <ShieldCheck size={18} style={styles.alertIcon} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.fieldIcon} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="faculty@examguard.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.fieldIcon} />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isSubmitting ? (
              <span style={styles.buttonContent}>
                <Loader2 size={18} style={styles.spinner} />
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Protected by bcrypt password hashing &amp; signed JWT access tokens.
          </p>
        </div>
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
    maxWidth: '420px',
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
    fontSize: '1.75rem',
    fontWeight: '700',
    letterSpacing: '-0.025em',
    color: '#f8fafc',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: '0 0 0.75rem 0',
  },
  badge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    padding: '0.2rem 0.6rem',
    backgroundColor: '#334155',
    color: '#38bdf8',
    borderRadius: '9999px',
    fontWeight: '500',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '0.875rem',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid #22c55e',
    borderRadius: '8px',
    color: '#86efac',
    fontSize: '0.875rem',
  },
  alertIcon: {
    marginRight: '0.5rem',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: '0.875rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.75rem 0.875rem 0.75rem 2.5rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.925rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  button: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  buttonDisabled: {
    backgroundColor: '#1d4ed8',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '1rem',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
  },
};
