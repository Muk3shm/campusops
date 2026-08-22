import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  BookOpen,
  Wrench,
  Shield,
  User,
  LogOut,
  Clock,
  CheckCircle,
  BarChart3,
  Users,
  Tag,
  Settings,
  FileText,
  FileCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

/**
 * Dynamic Sidebar Navigation.
 * Renders strict, role-specific navigation menus for STUDENT, TECHNICIAN, and ADMIN roles.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    onClose?.();
    await logout();
    navigate('/login');
  }

  const role = user?.role || 'STUDENT';

  // Role-specific section configurations
  const getNavSections = () => {
    if (role === 'ADMIN') {
      return [
        {
          label: 'Overview',
          items: [
            { to: '/admin', icon: Shield, label: 'Dashboard', end: true },
            { to: '/requests', icon: ClipboardList, label: 'All Requests' },
            { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          ],
        },
        {
          label: 'Management',
          items: [
            { to: '/admin/knowledge-review', icon: FileCheck, label: 'Knowledge Review' },
            { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
            { to: '/admin/users', icon: Users, label: 'Users' },
            { to: '/admin/technicians', icon: Wrench, label: 'Technicians' },
            { to: '/admin/categories', icon: Tag, label: 'Categories' },
          ],
        },
        {
          label: 'System',
          items: [
            { to: '/admin/settings', icon: Settings, label: 'Settings' },
            { to: '/admin/audit-log', icon: FileText, label: 'Audit Log' },
          ],
        },
      ];
    }

    if (role === 'TECHNICIAN') {
      return [
        {
          label: 'Main',
          items: [
            { to: '/technician', icon: Wrench, label: 'Dashboard', end: true },
            { to: '/requests', icon: ClipboardList, label: 'Assigned Requests' },
            { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
          ],
        },
        {
          label: 'Work',
          items: [
            { to: '/requests?status=IN_PROGRESS', icon: Clock, label: 'In Progress' },
            { to: '/requests?status=RESOLVED', icon: CheckCircle, label: 'Resolved Requests' },
          ],
        },
      ];
    }

    // Default STUDENT navigation
    return [
      {
        label: 'Main',
        items: [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
          { to: '/requests', icon: ClipboardList, label: 'My Requests' },
          { to: '/requests/new', icon: PlusCircle, label: 'New Request' },
          { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
        ],
      },
    ];
  };

  const sections = getNavSections();

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>CampusOps</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {sections.map(section => (
            <div key={section.label} className={styles.navSection}>
              <span className={styles.navSectionLabel}>{section.label}</span>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  onClick={onClose}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {/* Account section for all roles */}
          <div className={styles.navSection}>
            <span className={styles.navSectionLabel}>Account</span>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={onClose}
            >
              <User size={18} />
              <span>Profile</span>
            </NavLink>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.footerText}>CampusOps v1.0</p>
          <p className={styles.footerSubtext}>
            Logged in as <strong>{role.toLowerCase()}</strong>
          </p>
        </div>
      </aside>
    </>
  );
}
