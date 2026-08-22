import { useState, useEffect } from 'react';
import { Search, BookOpen, ThumbsUp, ThumbsDown, Eye, PlusCircle, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SuggestSolutionModal from '@/components/ui/SuggestSolutionModal';
import { useAuth } from '@/context/AuthContext';
import {
  getKnowledgeBaseArticles,
  recordKnowledgeFeedback,
  submitKnowledgeArticleForReview,
} from '@/services/api';
import { REQUEST_CATEGORIES } from '@/data/mockRequests';
import styles from './KnowledgeBasePage.module.css';

/**
 * Knowledge Base page listing guides and solutions.
 * Supports query search, category filtering, admin status filtering,
 * solution suggestions, and article feedback.
 */
export default function KnowledgeBasePage() {
  const { user } = useAuth();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [user]);

  async function loadArticles() {
    try {
      setLoading(true);
      const data = await getKnowledgeBaseArticles(user);
      setArticles(data);
      if (data.length > 0 && !selectedArticle) {
        setSelectedArticle(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(articleId, helpful) {
    try {
      await recordKnowledgeFeedback(articleId, helpful, user?.id);
      setFeedbackGiven(true);
      await loadArticles();
      setTimeout(() => setFeedbackGiven(false), 3000);
    } catch (err) {
      console.error('Failed to record feedback:', err);
    }
  }

  async function handleSuggestSubmit(formData) {
    await submitKnowledgeArticleForReview(formData, user);
    alert('Thank you! Your solution suggestion has been submitted for administrative review.');
    await loadArticles();
  }

  const filteredArticles = articles.filter(article => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      article.title.toLowerCase().includes(q) ||
      (article.problem && article.problem.toLowerCase().includes(q)) ||
      (article.summary && article.summary.toLowerCase().includes(q)) ||
      (article.keywords && article.keywords.join(' ').toLowerCase().includes(q));

    const matchesCat = !selectedCategory || article.category === selectedCategory;
    const matchesStatus = !selectedStatus || article.status === selectedStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  if (loading) return <LoadingSpinner message="Loading knowledge base..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Knowledge Base</h1>
          <p className={styles.pageSubtitle}>
            Search campus guides, troubleshooting steps, and validated technical solutions.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ gap: '8px' }}
          onClick={() => setIsSuggestModalOpen(true)}
        >
          <PlusCircle size={18} />
          Suggest a Solution
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search articles by title, keywords, or error description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={styles.selectFilter}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {REQUEST_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {user?.role === 'ADMIN' && (
          <select
            className={styles.selectFilter}
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        )}
      </div>

      <div className={styles.layout}>
        {/* Article List */}
        <div className={styles.articleList}>
          {filteredArticles.length === 0 ? (
            <p className={styles.emptyState}>No articles match your search criteria.</p>
          ) : (
            filteredArticles.map(article => (
              <button
                key={article.id}
                className={`${styles.articleItem} ${
                  selectedArticle?.id === article.id ? styles.articleItemActive : ''
                }`}
                onClick={() => setSelectedArticle(article)}
              >
                <div className={styles.articleItemHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} />
                    <span className={styles.articleCategory}>{article.category}</span>
                  </div>
                  {article.status && article.status !== 'PUBLISHED' && (
                    <span
                      className={`${styles.statusBadge} ${
                        article.status === 'PENDING_REVIEW'
                          ? styles.statusPending
                          : styles.statusRejected
                      }`}
                    >
                      {article.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <h3 className={styles.articleTitle}>{article.title}</h3>
                <p className={styles.articleSummary}>
                  {article.problem || article.summary}
                </p>

                <div className={styles.articleMeta}>
                  <span><ThumbsUp size={12} /> {article.helpful || 0}</span>
                  <span><Eye size={12} /> {article.views || 0}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Article Detail */}
        <div className={styles.articleDetail}>
          {selectedArticle ? (
            <>
              <div className={styles.articleDetailHeader}>
                <span className={styles.articleDetailCategory}>{selectedArticle.category}</span>
                <h2 className={styles.articleDetailTitle}>{selectedArticle.title}</h2>
                <div className={styles.articleDetailMeta}>
                  <span><strong>Author:</strong> {selectedArticle.author || 'IT Operations'}</span>
                  <span>
                    <strong>Updated:</strong>{' '}
                    {new Date(selectedArticle.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {selectedArticle.relatedRequestId && (
                    <span><strong>Related Request:</strong> {selectedArticle.relatedRequestId}</span>
                  )}
                </div>
              </div>

              <div className={styles.articleDetailContent}>
                <div>
                  <h3 className={styles.contentH3}>Problem Description</h3>
                  <p className={styles.contentP}>{selectedArticle.problem || selectedArticle.summary}</p>
                </div>

                {selectedArticle.symptoms && selectedArticle.symptoms.length > 0 && (
                  <div>
                    <h3 className={styles.contentH3}>Symptoms</h3>
                    <ul className={styles.contentList}>
                      {selectedArticle.symptoms.map((sym, i) => (
                        <li key={i}>{sym}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedArticle.steps && selectedArticle.steps.length > 0 && (
                  <div>
                    <h3 className={styles.contentH3}>Troubleshooting Steps</h3>
                    <ol className={styles.contentList}>
                      {selectedArticle.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {selectedArticle.additionalNotes && (
                  <div>
                    <h3 className={styles.contentH3}>Additional Notes</h3>
                    <p className={styles.contentP}>{selectedArticle.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Helpful Feedback Section */}
              <div className={styles.feedbackSection}>
                <span className={styles.feedbackLabel}>Was this solution helpful?</span>
                <div className={styles.feedbackActions}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.8125rem', gap: '6px' }}
                    onClick={() => handleFeedback(selectedArticle.id, true)}
                  >
                    <ThumbsUp size={14} />
                    Yes ({selectedArticle.helpful || 0})
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.8125rem', gap: '6px' }}
                    onClick={() => handleFeedback(selectedArticle.id, false)}
                  >
                    <ThumbsDown size={14} />
                    No ({selectedArticle.unhelpful || 0})
                  </button>
                </div>

                {feedbackGiven && (
                  <span style={{ fontSize: '0.8125rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Thanks for your feedback!
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyDetail}>
              <BookOpen size={48} />
              <p>Select an article to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggest Solution Modal */}
      <SuggestSolutionModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onSubmit={handleSuggestSubmit}
      />
    </div>
  );
}
