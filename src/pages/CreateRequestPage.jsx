import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Send,
  ArrowLeft,
  Lightbulb,
  Search,
  CheckCircle,
  X,
  BookOpen,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createServiceRequest, searchKnowledgeBase, recordKnowledgeFeedback } from '@/services/api';
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES } from '@/data/mockRequests';
import styles from './CreateRequestPage.module.css';

/**
 * Knowledge-Assisted Request Creation Flow.
 * Allows users to search existing knowledge solutions before logging a request.
 * Retains form input completely if user chooses to proceed with request creation.
 */
export default function CreateRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [viewingArticle, setViewingArticle] = useState(null);
  const [solvedSuccess, setSolvedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    priority: 'MEDIUM',
    description: '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFindSolutions(e) {
    if (e) e.preventDefault();

    if (!formData.title.trim() && !formData.description.trim()) {
      alert('Please enter a problem title or description first.');
      return;
    }

    try {
      setSearching(true);
      const queryText = `${formData.title} ${formData.description}`;
      const results = await searchKnowledgeBase(queryText, formData.category);
      setRecommendations(results);
      setHasSearched(true);
    } catch (err) {
      console.error('Failed to search knowledge base:', err);
    } finally {
      setSearching(false);
    }
  }

  async function handleProblemSolved(article) {
    try {
      if (article) {
        await recordKnowledgeFeedback(article.id, true, user?.id);
      }
      setViewingArticle(null);
      setSolvedSuccess(true);
    } catch (err) {
      console.error('Failed to record feedback:', err);
      setSolvedSuccess(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newRequest = await createServiceRequest(formData, user);
      navigate(`/requests/${newRequest.id}`);
    } catch (err) {
      alert('Failed to submit request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (solvedSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle size={36} />
          </div>
          <h1 className={styles.successTitle}>Great! We're glad the solution helped.</h1>
          <p className={styles.successText}>
            Your problem was resolved using the Knowledge Base. No service request was created.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/requests')}
            >
              View My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/requests" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Requests
      </Link>

      <div className={styles.formCard}>
        <h1 className={styles.pageTitle}>Create Service Request</h1>
        <p className={styles.pageSubtitle}>
          Submitting as <strong>{user?.name}</strong> ({user?.email})
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="input"
              placeholder="e.g. Projector not displaying screen"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.label}>Category *</label>
              <select
                id="category"
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {REQUEST_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>Priority *</label>
              <select
                id="priority"
                name="priority"
                className="input"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                {REQUEST_PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location" className={styles.label}>Location *</label>
            <input
              id="location"
              name="location"
              type="text"
              className="input"
              placeholder="e.g. Block A - Room 204"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Description *</label>
            <textarea
              id="description"
              name="description"
              className={`input ${styles.textarea}`}
              placeholder="Provide detailed information about the issue..."
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Knowledge Assistance Search Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ gap: '8px' }}
              onClick={handleFindSolutions}
              disabled={searching}
            >
              <Search size={16} />
              {searching ? 'Searching Solutions...' : 'Find Possible Solutions'}
            </button>
          </div>

          {/* Knowledge Recommendations Results */}
          {hasSearched && (
            <div className={styles.recContainer}>
              <div className={styles.recHeader}>
                <Lightbulb size={22} className={styles.recIcon} />
                <div>
                  <h3 className={styles.recTitle}>💡 We may already have a solution</h3>
                  <p className={styles.recSub}>
                    {recommendations.length > 0
                      ? `We found ${recommendations.length} solution${recommendations.length > 1 ? 's' : ''} related to your problem.`
                      : 'No closely matching solution was found.'}
                  </p>
                </div>
              </div>

              {recommendations.length > 0 ? (
                <div className={styles.recList}>
                  {recommendations.map(article => (
                    <div key={article.id} className={styles.recCard}>
                      <div className={styles.recCardTop}>
                        <span className={styles.recArticleTitle}>{article.title}</span>
                        <span
                          className={`${styles.matchBadge} ${
                            article.score >= 8 ? styles.matchBadgeHigh : ''
                          }`}
                        >
                          {article.matchLabel}
                        </span>
                      </div>

                      <p className={styles.recProblem}>
                        <strong>Category:</strong> {article.category} | <strong>Problem:</strong>{' '}
                        {article.problem}
                      </p>

                      <div className={styles.recActions}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8125rem' }}
                          onClick={() => setViewingArticle(article)}
                        >
                          <BookOpen size={14} />
                          View Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noMatchBanner}>
                  <span>No matching article found. You can proceed with creating your service request.</span>
                </div>
              )}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/requests')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Service Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Article Detail & "Did this solve your problem?" Modal */}
      {viewingArticle && (
        <div className={styles.modalOverlay} onClick={() => setViewingArticle(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.articleCategoryBadge}>{viewingArticle.category}</span>
                <h2 className={styles.modalArticleTitle}>{viewingArticle.title}</h2>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setViewingArticle(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className={styles.articleSectionTitle}>Problem</h3>
              <p className={styles.articleText}>{viewingArticle.problem}</p>
            </div>

            {viewingArticle.symptoms && viewingArticle.symptoms.length > 0 && (
              <div>
                <h3 className={styles.articleSectionTitle}>Symptoms</h3>
                <ul className={styles.symptomsList}>
                  {viewingArticle.symptoms.map((symptom, idx) => (
                    <li key={idx}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            {viewingArticle.steps && viewingArticle.steps.length > 0 && (
              <div>
                <h3 className={styles.articleSectionTitle}>Troubleshooting Steps</h3>
                <ol className={styles.stepsList}>
                  {viewingArticle.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {viewingArticle.additionalNotes && (
              <div>
                <h3 className={styles.articleSectionTitle}>Additional Notes</h3>
                <p className={styles.articleText}>{viewingArticle.additionalNotes}</p>
              </div>
            )}

            {/* "Did this solve your problem?" Section */}
            <div className={styles.feedbackBox}>
              <span className={styles.feedbackPrompt}>Did this solve your problem?</span>
              <div className={styles.feedbackButtons}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                  onClick={() => handleProblemSolved(viewingArticle)}
                >
                  <Check size={16} />
                  Yes, Problem Solved
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ gap: '6px' }}
                  onClick={() => setViewingArticle(null)}
                >
                  <ChevronRight size={16} />
                  No, Continue Creating Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
