import { useState } from 'react';
import { Outlet } from 'react-router';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.css';

/**
 * The main application shell.
 * Wraps all authenticated pages with the Header + Sidebar + content area.
 * The <Outlet /> renders whichever child route is currently active.
 */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
