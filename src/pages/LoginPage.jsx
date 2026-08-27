import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, LogIn, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginPage.module.css';

/**
 * CampusOps Login Page — Amazon Cognito Authentication.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, completePasswordChallenge, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Password Required state
  const [challengeData, setChallengeData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user]);

  function redirectByRole(role) {
    if (role === 'ADMIN') {
      navigate('/admin');
    } else if (role === 'TECHNICIAN') {
      navigate('/technician');
    } else {
      navigate('/dashboard');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result?.status === 'NEW_PASSWORD_REQUIRED') {
        setChallengeData(result);
      } else if (result?.role) {
        redirectByRole(result.role);
      }
    } catch (err) {
      console.error('Cognito authentication error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChallengeSubmit(e) {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const loggedUser = await completePasswordChallenge(
        challengeData.cognitoUser,
        newPassword,
        challengeData.userAttributes
      );

      if (loggedUser?.role) {
        redirectByRole(loggedUser.role);
      }
    } catch (err) {
      console.error('Password change failed:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  function formatAuthError(err) {
    const code = err?.code || err?.name;
    const message = err?.message || '';

    if (code === 'NotAuthorizedException') {
      return 'Incorrect email or password.';
    }
    if (code === 'UserNotFoundException') {
      return 'Account not found. Check your campus email.';
    }
    if (code === 'UserNotConfirmedException') {
      return 'Account is not confirmed. Please check your verification email.';
    }
    if (code === 'InvalidPasswordException') {
      return 'Password does not meet complexity requirements (min 8 chars, uppercase, lowercase, numbers).';
    }
    if (code === 'LimitExceededException') {
      return 'Too many login attempts. Please wait a few minutes and try again.';
    }
    return message || 'Authentication failed. Please check your credentials and try again.';
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logoIcon}>
            <Building2 size={28} />
          </div>
          <h1 className={styles.title}>CampusOps</h1>
          <p className={styles.subtitle}>Cloud-Native Campus Operations & Knowledge Platform</p>
        </div>

        <div className={styles.mockBanner}>
          <CheckCircle2 size={16} />
          <span>Cognito Authentication: Sign in with your campus account</span>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {challengeData ? (
          <form onSubmit={handlePasswordChallengeSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>New Password</label>
              <input
                id="newPassword"
                type="password"
                className="input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitButton}`}
              disabled={loading}
            >
              <KeyRound size={18} />
              {loading ? 'Updating Password...' : 'Set Password & Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Campus Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitButton}`}
              disabled={loading}
            >
              <LogIn size={18} />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className={styles.hint}>
              Authenticated securely via Amazon Cognito User Pools.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
