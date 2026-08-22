import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Users, Wrench, Tag, BarChart3, Settings, FileText, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getUsers, getTechnicians, getDashboardStats } from '@/services/api';
import { REQUEST_CATEGORIES } from '@/data/mockRequests';
import styles from './AdminDashboard.module.css';

/**
 * Clean UI prototype views for Admin Management routes:
 * - /admin/users
 * - /admin/technicians
 * - /admin/categories
 * - /admin/analytics
 * - /admin/settings
 * - /admin/audit-log
 */
export default function AdminManagementPages() {
  const location = useLocation();
  const path = location.pathname;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (path.includes('/users')) {
        const res = await getUsers();
        setData(res);
      } else if (path.includes('/technicians')) {
        const res = await getTechnicians();
        setData(res);
      } else if (path.includes('/analytics')) {
        const res = await getDashboardStats();
        setData(res);
      }
      setLoading(false);
    }
    load();
  }, [path]);

  if (loading) return <LoadingSpinner message="Loading management view..." />;

  // 1. Users Management
  if (path.includes('/users')) {
    const userColumns = [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'department', label: 'Department' },
    ];
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 className={styles.pageTitle}><Users size={24} /> User Directory</h1>
            <p className={styles.pageSubtitle}>Manage student, staff, and technician access</p>
          </div>
          <button className="btn btn-primary"><Plus size={16} /> Add User</button>
        </div>
        <div className={styles.section}>
          <DataTable columns={userColumns} data={data} />
        </div>
      </div>
    );
  }

  // 2. Technicians Management
  if (path.includes('/technicians')) {
    const techColumns = [
      { key: 'id', label: 'Tech ID' },
      { key: 'name', label: 'Name' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'email', label: 'Email' },
      { key: 'activeRequests', label: 'Active Work Orders' },
    ];
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 className={styles.pageTitle}><Wrench size={24} /> Technician Management</h1>
            <p className={styles.pageSubtitle}>Monitor technician specializations and workload</p>
          </div>
          <button className="btn btn-primary"><Plus size={16} /> Add Technician</button>
        </div>
        <div className={styles.section}>
          <DataTable columns={techColumns} data={data} />
        </div>
      </div>
    );
  }

  // 3. Categories Management
  if (path.includes('/categories')) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 className={styles.pageTitle}><Tag size={24} /> Service Categories</h1>
            <p className={styles.pageSubtitle}>Configure campus service issue classification categories</p>
          </div>
          <button className="btn btn-primary"><Plus size={16} /> New Category</button>
        </div>
        <div className={styles.section}>
          <div className={styles.analyticsGrid}>
            {REQUEST_CATEGORIES.map(cat => (
              <div key={cat} className={styles.analyticsCard}>
                <h3 className={styles.chartTitle}>{cat}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Active campus category for routing requests to specialized technicians.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Analytics Overview
  if (path.includes('/analytics')) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}><BarChart3 size={24} /> Global Analytics</h1>
          <p className={styles.pageSubtitle}>Campus operations performance, resolution metrics, and load distribution</p>
        </div>
        <div className={styles.analyticsSection}>
          <div className={styles.analyticsGrid}>
            <div className={styles.analyticsCard}>
              <h3 className={styles.chartTitle}>Average Resolution Time</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>4.2 Hours</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>18% faster than last month target</p>
            </div>
            <div className={styles.analyticsCard}>
              <h3 className={styles.chartTitle}>SLA Compliance Rate</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>94.8%</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Target threshold: 90.0%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. System Settings
  if (path.includes('/settings')) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}><Settings size={24} /> System Settings</h1>
          <p className={styles.pageSubtitle}>CampusOps platform configuration and notifications</p>
        </div>
        <div className={styles.section}>
          <div className={styles.analyticsCard}>
            <h3 className={styles.chartTitle}>Platform Configuration</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Configure automatic technician assignment rules, maintenance windows, and student notification preferences.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 6. Audit Log
  if (path.includes('/audit-log')) {
    const logs = [
      { id: 'LOG-101', action: 'STATUS_UPDATE', details: 'SR-004 marked as RESOLVED by Arun Prasad', timestamp: '2026-08-20 15:00' },
      { id: 'LOG-102', action: 'TECH_ASSIGN', details: 'SR-003 assigned to Deepak Verma by Admin', timestamp: '2026-08-20 08:30' },
      { id: 'LOG-103', action: 'NEW_REQUEST', details: 'SR-001 created by Rahul Sharma', timestamp: '2026-08-20 10:30' },
    ];
    const logCols = [
      { key: 'id', label: 'Log ID' },
      { key: 'action', label: 'Action' },
      { key: 'details', label: 'Details' },
      { key: 'timestamp', label: 'Timestamp' },
    ];
    return (
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}><FileText size={24} /> Audit Log</h1>
          <p className={styles.pageSubtitle}>System audit trail and security event log</p>
        </div>
        <div className={styles.section}>
          <DataTable columns={logCols} data={logs} />
        </div>
      </div>
    );
  }

  return null;
}
