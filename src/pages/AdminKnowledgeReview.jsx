import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Edit3, Eye, Clock, X, Save } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import {
  getKnowledgeBaseArticles,
  approveKnowledgeArticle,
  rejectKnowledgeArticle,
  updateKnowledgeArticle,
} from '@/services/api';
import { REQUEST_CATEGORIES } from '@/data/mockRequests';
import styles from './AdminKnowledgeReview.module.css';

/**
 * Admin Knowledge Review & Approval Console.
 * Allows administrators to inspect, edit, approve/publish, or reject community and technician-suggested solutions.
 */
export default function AdminKnowledgeReview() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Review modal / Edit modal state
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadPendingArticles();
  }, []);

  async function loadPendingArticles() {
    try {
      setLoading(true);
      const allArticles = await getKnowledgeBaseArticles({ role: 'ADMIN' });
      setArticles(allArticles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id, e) {
    if (e) e.stopPropagation();
    try {
      setProcessingId(id);
      await approveKnowledgeArticle(id);
      setSelectedArticle(null);
      await loadPendingArticles();
    } catch (err) {
      alert('Failed to approve article: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id, e) {
    if (e) e.stopPropagation();
    const reason = prompt('Please enter a reason for rejecting this solution submission (optional):');
    try {
      setProcessingId(id);
      await rejectKnowledgeArticle(id, reason || 'Submission did not meet quality standards.');
      setSelectedArticle(null);
      await loadPendingArticles();
    } catch (err) {
      alert('Failed to reject article: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  function handleOpenEdit(article) {
    setSelectedArticle(article);
    setIsEditing(true);
    setEditFormData({
      title: article.title,
      category: article.category,
      problem: article.problem,
      symptoms: Array.isArray(article.symptoms) ? article.symptoms.join('\n') : article.symptoms || '',
      steps: Array.isArray(article.steps) ? article.steps.join('\n') : article.steps || '',
      additionalNotes: article.additionalNotes || '',
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!selectedArticle) return;

    try {
      setProcessingId(selectedArticle.id);
      const updatedSymptoms = editFormData.symptoms.split('\n').map(s => s.trim()).filter(Boolean);
      const updatedSteps = editFormData.steps.split('\n').map(s => s.trim()).filter(Boolean);

      await updateKnowledgeArticle(selectedArticle.id, {
        title: editFormData.title,
        category: editFormData.category,
        problem: editFormData.problem,
        symptoms: updatedSymptoms,
        steps: updatedSteps,
        additionalNotes: editFormData.additionalNotes,
      });

      setIsEditing(false);
      setSelectedArticle(null);
      await loadPendingArticles();
    } catch (err) {
      alert('Failed to save article edits: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  const pendingArticles = articles.filter(a => a.status === 'PENDING_REVIEW');
  const publishedArticles = articles.filter(a => a.status === 'PUBLISHED');

  if (loading) return <LoadingSpinner message="Loading knowledge review panel..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Shield size={24} />
            Knowledge Review & Publishing
          </h1>
          <p className={styles.subtitle}>
            Review solutions submitted by Technicians and Students before publishing them to the campus knowledge base.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <Clock className={styles.metricIconWarn} size={24} />
          <div>
            <span className={styles.metricLabel}>Pending Review</span>
            <span className={styles.metricVal}>{pendingArticles.length}</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <CheckCircle className={styles.metricIconSuccess} size={24} />
          <div>
            <span className={styles.metricLabel}>Published Articles</span>
            <span className={styles.metricVal}>{publishedArticles.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Submissions Pending Review</h2>

        {pendingArticles.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle size={36} style={{ color: '#166534', marginBottom: '8px' }} />
            <p>No articles currently pending review. All submitted solutions are up to date!</p>
          </div>
        ) : (
          <div className={styles.articleGrid}>
            {pendingArticles.map(article => (
              <div key={article.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.idBadge}>{article.id}</span>
                    <span className={styles.categoryBadge}>{article.category}</span>
                  </div>
                  <span className={styles.pendingBadge}>PENDING REVIEW</span>
                </div>

                <h3 className={styles.cardTitle}>{article.title}</h3>

                <p className={styles.cardProblem}>
                  <strong>Problem:</strong> {article.problem || article.summary}
                </p>

                <div className={styles.cardMeta}>
                  <span><strong>Submitted by:</strong> {article.author} ({article.createdBy})</span>
                  {article.relatedRequestId && (
                    <span><strong>Related Request:</strong> {article.relatedRequestId}</span>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.8125rem', gap: '4px' }}
                    onClick={() => setSelectedArticle(article)}
                  >
                    <Eye size={14} />
                    Review
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.8125rem', gap: '4px' }}
                    onClick={() => handleOpenEdit(article)}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.8125rem', gap: '4px', backgroundColor: '#166534', borderColor: '#166534' }}
                    onClick={(e) => handleApprove(article.id, e)}
                    disabled={processingId === article.id}
                  >
                    <CheckCircle size={14} />
                    Approve & Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedArticle && !isEditing && (
        <div className={styles.modalOverlay} onClick={() => setSelectedArticle(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.categoryBadge}>{selectedArticle.category}</span>
                <h2 className={styles.modalTitle}>{selectedArticle.title}</h2>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedArticle(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.metaLine}>
                <strong>Submitted By:</strong> {selectedArticle.author} ({selectedArticle.createdBy}) |{' '}
                <strong>Related Request:</strong> {selectedArticle.relatedRequestId || 'None'}
              </p>

              <div>
                <h4 className={styles.subTitle}>Problem</h4>
                <p className={styles.bodyText}>{selectedArticle.problem}</p>
              </div>

              {selectedArticle.symptoms && selectedArticle.symptoms.length > 0 && (
                <div>
                  <h4 className={styles.subTitle}>Symptoms</h4>
                  <ul className={styles.list}>
                    {selectedArticle.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedArticle.steps && selectedArticle.steps.length > 0 && (
                <div>
                  <h4 className={styles.subTitle}>Troubleshooting Steps</h4>
                  <ol className={styles.list}>
                    {selectedArticle.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedArticle.additionalNotes && (
                <div>
                  <h4 className={styles.subTitle}>Additional Notes</h4>
                  <p className={styles.bodyText}>{selectedArticle.additionalNotes}</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className="btn btn-secondary"
                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                onClick={(e) => handleReject(selectedArticle.id, e)}
                disabled={processingId === selectedArticle.id}
              >
                <XCircle size={16} />
                Reject
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => handleOpenEdit(selectedArticle)}
              >
                <Edit3 size={16} />
                Edit Article
              </button>

              <button
                className="btn btn-primary"
                style={{ backgroundColor: '#166534', borderColor: '#166534' }}
                onClick={(e) => handleApprove(selectedArticle.id, e)}
                disabled={processingId === selectedArticle.id}
              >
                <CheckCircle size={16} />
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedArticle && isEditing && (
        <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Article: {selectedArticle.id}</h2>
              <button className={styles.closeBtn} onClick={() => setIsEditing(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="editTitle" className={styles.label}>Title</label>
                <input
                  id="editTitle"
                  type="text"
                  className="input"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editCategory" className={styles.label}>Category</label>
                <select
                  id="editCategory"
                  className="input"
                  value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                  required
                >
                  {REQUEST_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editProblem" className={styles.label}>Problem Description</label>
                <textarea
                  id="editProblem"
                  className="input"
                  rows={3}
                  value={editFormData.problem}
                  onChange={e => setEditFormData({ ...editFormData, problem: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editSymptoms" className={styles.label}>Symptoms (One per line)</label>
                <textarea
                  id="editSymptoms"
                  className="input"
                  rows={3}
                  value={editFormData.symptoms}
                  onChange={e => setEditFormData({ ...editFormData, symptoms: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editSteps" className={styles.label}>Steps (One per line)</label>
                <textarea
                  id="editSteps"
                  className="input"
                  rows={5}
                  value={editFormData.steps}
                  onChange={e => setEditFormData({ ...editFormData, steps: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editNotes" className={styles.label}>Additional Notes</label>
                <textarea
                  id="editNotes"
                  className="input"
                  rows={2}
                  value={editFormData.additionalNotes}
                  onChange={e => setEditFormData({ ...editFormData, additionalNotes: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processingId === selectedArticle.id}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
