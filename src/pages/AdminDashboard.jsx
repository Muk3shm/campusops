import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield,
  Users,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  X,
  UserCheck,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import {
  getDashboardStats,
  getServiceRequests,
  getTechnicians,
  assignTechnicianToRequest,
} from '@/services/api';
import styles from './AdminDashboard.module.css';

/**
 * Admin Operations & Control Dashboard.
 * Includes bird's-eye metrics, Knowledge Base analytics, and technician assignment controls.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Technician assignment modal state
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [user]);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [statsData, requestsData, techData] = await Promise.all([
        getDashboardStats(user),
        getServiceRequests(user),
        getTechnicians(),
      ]);
      setStats(statsData);
      setRequests(requestsData);
      setTechnicians(techData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAssignModal(req, e) {
    e.stopPropagation();
    setAssignTarget(req);
    setSelectedTechId(req.assignedTo || (technicians[0]?.id || ''));
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!assignTarget || !selectedTechId) return;

    const techObj = technicians.find(t => t.id === selectedTechId);
    if (!techObj) return;

    try {
      setAssigning(true);
      await assignTechnicianToRequest(assignTarget.id, techObj.id, techObj.name);
      setAssignTarget(null);
      await loadAdminData();
    } catch (err) {
      alert('Failed to assign technician: ' + err.message);
    } finally {
      setAssigning(false);
    }
  }

  const requestColumns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <PriorityBadge priority={value} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'assigneeName',
      label: 'Assigned Technician',
      render: (value) => value || <span className={styles.unassigned}>Unassigned</span>,
    },
    {
      key: 'actions',
      label: 'Assign Control',
      render: (_, row) => (
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          onClick={(e) => handleOpenAssignModal(row, e)}
        >
          <UserPlus size={12} />
          {row.assignedTo ? 'Reassign' : 'Assign'}
        </button>
      ),
    },
  ];

  const techColumns = [
    { key: 'name', label: 'Name' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'email', label: 'Email' },
    { key: 'activeRequests', label: 'Active Tasks' },
  ];

  if (loading) return <LoadingSpinner message="Loading operations control panel..." />;
  if (error) return <ErrorMessage message={error} />;

  const getMaxVal = (obj = {}) => Math.max(...Object.values(obj), 1);
  const kbStats = stats?.knowledge || {};

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Shield size={24} />
            Operations & Admin Panel
          </h1>
          <p className={styles.pageSubtitle}>
            Full operational oversight for <strong>{user?.name || 'Administrator'}</strong>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={ClipboardList} label="Total Requests" value={stats.total} />
        <StatCard icon={AlertCircle} label="Open Requests" value={stats.open} variant="warning" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} variant="purple" />
        <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved} variant="success" />
        <StatCard icon={BookOpen} label="Published KB Articles" value={kbStats.published || 0} variant="purple" />
        <StatCard icon={FileCheck} label="KB Articles Pending Review" value={kbStats.pendingReview || 0} variant="warning" />
      </div>

      {/* CSS Visual Analytics Section */}
      <div className={styles.analyticsSection}>
        <h2 className={styles.sectionTitle}>Visual Operational Analytics</h2>

        <div className={styles.analyticsGrid}>
          {/* Requests by Status */}
          <div className={styles.analyticsCard}>
            <h3 className={styles.chartTitle}>Requests by Status</h3>
            <div className={styles.barList}>
              {Object.entries(stats.byStatus || {}).map(([key, count]) => {
                const pct = Math.round((count / getMaxVal(stats.byStatus)) * 100);
                return (
                  <div key={key} className={styles.barRow}>
                    <span className={styles.barLabel}>{key.replace('_', ' ')}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${styles[`fill_${key}`] || ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requests by Priority */}
          <div className={styles.analyticsCard}>
            <h3 className={styles.chartTitle}>Requests by Priority</h3>
            <div className={styles.barList}>
              {Object.entries(stats.byPriority || {}).map(([key, count]) => {
                const pct = Math.round((count / getMaxVal(stats.byPriority)) * 100);
                return (
                  <div key={key} className={styles.barRow}>
                    <span className={styles.barLabel}>{key}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${styles[`fill_${key}`] || ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requests by Category */}
          <div className={styles.analyticsCard}>
            <h3 className={styles.chartTitle}>Requests by Category</h3>
            <div className={styles.barList}>
              {Object.entries(stats.byCategory || {}).map(([key, count]) => {
                const pct = Math.round((count / getMaxVal(stats.byCategory)) * 100);
                return (
                  <div key={key} className={styles.barRow}>
                    <span className={styles.barLabel}>{key}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requests by Location */}
          <div className={styles.analyticsCard}>
            <h3 className={styles.chartTitle}>Requests by Location</h3>
            <div className={styles.barList}>
              {Object.entries(stats.byLocation || {}).map(([key, count]) => {
                const pct = Math.round((count / getMaxVal(stats.byLocation)) * 100);
                return (
                  <div key={key} className={styles.barRow}>
                    <span className={styles.barLabel}>{key}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%`, backgroundColor: 'var(--color-purple)' }} />
                    </div>
                    <span className={styles.barValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Requests Management Table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Global Service Request Queue</h2>
        <DataTable
          columns={requestColumns}
          data={requests}
          onRowClick={(row) => navigate(`/requests/${row.id}`)}
        />
      </div>

      {/* Technician Roster Table */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Technician Workload Roster</h2>
        <DataTable columns={techColumns} data={technicians} />
      </div>

      {/* Technician Assignment Modal */}
      {assignTarget && (
        <div className={styles.modalOverlay} onClick={() => setAssignTarget(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Assign Technician: {assignTarget.id}</h3>
              <button className={styles.closeBtn} onClick={() => setAssignTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className={styles.modalForm}>
              <p className={styles.modalSub}>
                <strong>{assignTarget.title}</strong> — {assignTarget.category} ({assignTarget.location})
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="selectTech" className={styles.label}>Select Technician</label>
                <select
                  id="selectTech"
                  className="input"
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  required
                >
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.specialization} ({t.activeRequests} tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAssignTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={assigning}>
                  <UserCheck size={16} />
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
