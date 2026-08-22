import { useState } from 'react';
import { Menu, Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import styles from './Header.module.css';

/**
 * Top header bar displaying CampusOps branding, search, notifications,
 * and active user profile details (Name & Role). Includes a quick logout dropdown.
 */
export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const formatRoleLabel = (role) => {
    if (!role) return 'User';
    if (role === 'STUDENT') return 'Student';
    if (role === 'TECHNICIAN') return 'Technician';
    if (role === 'ADMIN') return 'Administrator';
    return role;
  };

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.menuButton}
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className={styles.logoIcon}>C</div>
          <span className={styles.logoText}>CampusOps</span>
        </div>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search requests, articles..."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.headerRight}>
        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.notificationDot} />
        </button>

        {user && (
          <div className={styles.userDropdownWrapper}>
            <button
              className={styles.userMenu}
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-expanded={dropdownOpen}
            >
              <div className={styles.avatar}>
                <User size={18} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>{formatRoleLabel(user.role)}</span>
              </div>
              <ChevronDown size={14} className={styles.dropdownIcon} />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownEmail}>{user.email}</p>
                </div>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  <User size={16} />
                  My Profile
                </button>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
