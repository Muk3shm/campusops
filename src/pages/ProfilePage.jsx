import { useAuth } from '@/context/AuthContext';
import { User, Mail, Shield, Building, Key } from 'lucide-react';
import styles from './ProfilePage.module.css';

/**
 * Account Profile View for all authenticated roles.
 */
export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Account Profile</h1>
      <p className={styles.subtitle}>View your profile and account credentials</p>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            <User size={32} />
          </div>
          <div>
            <h2 className={styles.name}>{user?.name}</h2>
            <span className={styles.roleBadge}>{user?.role}</span>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.item}>
            <Mail size={16} />
            <div>
              <span className={styles.label}>Email Address</span>
              <span className={styles.val}>{user?.email}</span>
            </div>
          </div>

          <div className={styles.item}>
            <Building size={16} />
            <div>
              <span className={styles.label}>Department / Specialization</span>
              <span className={styles.val}>{user?.department || user?.specialization || 'Campus Operations'}</span>
            </div>
          </div>

          <div className={styles.item}>
            <Shield size={16} />
            <div>
              <span className={styles.label}>Account ID</span>
              <span className={styles.val}>{user?.id}</span>
            </div>
          </div>

          <div className={styles.item}>
            <Key size={16} />
            <div>
              <span className={styles.label}>Authentication Method</span>
              <span className={styles.val}>Mock Frontend Session (Prototype)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
