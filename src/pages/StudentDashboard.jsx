import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/ui/StatCard';
import RequestCard from '@/components/ui/RequestCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getDashboardStats, getServiceRequests } from '@/services/api';
import styles from './StudentDashboard.module.css';

/**
 * The Student/Staff dashboard.
 * Shows personal request summary stats, personal recent requests, and quick action shortcuts.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsData, requestsData] = await Promise.all([
          getDashboardStats(user),
          getServiceRequests(user),
        ]);
        setStats(statsData);
        setRecentRequests(
          requestsData
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4)
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading your student dashboard..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Student Portal</h1>
          <p className={styles.pageSubtitle}>
            Welcome back, <strong>{user?.name || 'Student'}</strong>. Here is your service request overview.
          </p>
        </div>
        <Link to="/requests/new" className="btn btn-primary">
          <PlusCircle size={18} />
          New Request
        </Link>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard icon={ClipboardList} label="My Total Requests" value={stats?.total || 0} />
        <StatCard icon={AlertCircle} label="Open" value={stats?.open || 0} variant="warning" />
        <StatCard icon={Clock} label="In Progress" value={stats?.inProgress || 0} variant="purple" />
        <StatCard icon={CheckCircle} label="Resolved" value={stats?.resolved || 0} variant="success" />
      </div>

      {/* Personal Requests */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>My Recent Requests</h2>
          <Link to="/requests" className={styles.sectionLink}>
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className={styles.emptyCard}>
            <p>You haven't submitted any service requests yet.</p>
            <Link to="/requests/new" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Create your first request
            </Link>
          </div>
        ) : (
          <div className={styles.requestsGrid}>
            {recentRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Shortcuts</h2>
        <div className={styles.quickActions}>
          <Link to="/requests/new" className={styles.quickAction}>
            <PlusCircle size={24} />
            <span>Report Campus Issue</span>
          </Link>
          <Link to="/requests" className={styles.quickAction}>
            <ClipboardList size={24} />
            <span>Track My Requests</span>
          </Link>
          <Link to="/knowledge-base" className={styles.quickAction}>
            <BookOpen size={24} />
            <span>Browse Knowledge Base</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
