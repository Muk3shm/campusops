import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, LogIn, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginPage.module.css';

/**
 * CampusOps Login Page.
 * Default application entry point. Demonstrates frontend role selection & mock authentication.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  
  const [role, setRole] = useState('STUDENT');
  const [email, setEmail] = useState('rahul@campus.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TECHNICIAN') navigate('/technician');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Update default email hint based on selected role
  function handleRoleChange(e) {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    if (selectedRole === 'ADMIN') {
      setEmail('admin@campus.edu');
    } else if (selectedRole === 'TECHNICIAN') {
      setEmail('arun@campus.edu');
    } else {
      setEmail('rahul@campus.edu');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      const loggedUser = await login(email, role);
      
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'TECHNICIAN') {
        navigate('/technician');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Mock login failed:', err);
    } finally {
      setLoading(false);
    }
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
          <span>Prototype Mode: Select any role below to test the interface</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="role" className={styles.label}>Select Role</label>
            <select
              id="role"
              className="input"
              value={role}
              onChange={handleRoleChange}
            >
              <option value="STUDENT">Student / Staff</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

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
            {loading ? 'Signing In...' : `Sign In as ${role.charAt(0) + role.slice(1).toLowerCase()}`}
          </button>

          <p className={styles.hint}>
            No backend or AWS cloud resources are required for this frontend prototype.
          </p>
        </form>
      </div>
    </div>
  );
}
