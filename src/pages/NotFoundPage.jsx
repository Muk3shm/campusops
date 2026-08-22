import { Link, useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import styles from './NotFoundPage.module.css';

/**
 * Displayed when the user navigates to an unknown route.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Page Not Found</h2>
        <p className={styles.message}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link to="/dashboard" className="btn btn-primary">
            <Home size={16} />
            Go to Dashboard
          </Link>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
