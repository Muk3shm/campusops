/**
 * Service Layer — API & Data Storage Functions
 * 
 * Single point of contact between React frontend components and persistent storage.
 * Manages requests, knowledge base articles, sessions, and feedback in localStorage.
 */

import { mockRequests } from '@/data/mockRequests';
import { mockUsers, mockTechnicians, mockAdmins, defaultMockAccounts } from '@/data/mockUsers';
import { mockArticles } from '@/data/mockKnowledgeBase';

const SESSION_KEY = 'campusops_mock_session';
const REQUESTS_KEY = 'campusops_requests';
const KNOWLEDGE_KEY = 'campusops_knowledge';
const FEEDBACK_KEY = 'campusops_knowledge_feedback';

export const MIN_RELEVANCE_THRESHOLD = 3;

const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));
const API_URL = import.meta.env.VITE_API_URL;
// ─── localStorage Helpers: Requests ─────────────────────────────

function getStoredRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read requests from localStorage:', e);
  }

  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(mockRequests));
  } catch (e) {
    console.error('Failed to seed requests to localStorage:', e);
  }
  return [...mockRequests];
}

function saveStoredRequests(requests) {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save requests to localStorage:', e);
  }
}

// ─── localStorage Helpers: Knowledge Base ─────────────────────────

function getStoredKnowledge() {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read knowledge base from localStorage:', e);
  }

  // Seed localStorage ONLY if no collection exists
  try {
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(mockArticles));
  } catch (e) {
    console.error('Failed to seed knowledge base to localStorage:', e);
  }
  return [...mockArticles];
}

function saveStoredKnowledge(articles) {
  try {
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save knowledge base to localStorage:', e);
  }
}

// ─── localStorage Helpers: Feedback ─────────────────────────────

function getStoredFeedback() {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read knowledge feedback from localStorage:', e);
  }
  return [];
}

function saveStoredFeedback(feedbackList) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbackList));
  } catch (e) {
    console.error('Failed to save knowledge feedback to localStorage:', e);
  }
}

// ─── Authentication & Session ─────────────────────────────────

export async function getCurrentSessionUser() {
  await delay(50);
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export async function loginMock({ email, role }) {
  await delay(150);
  let user = null;

  const roleUpper = (role || 'STUDENT').toUpperCase();
  if (roleUpper === 'ADMIN') {
    user = mockAdmins.find(u => u.email === email) || { ...defaultMockAccounts.ADMIN, email: email || defaultMockAccounts.ADMIN.email };
  } else if (roleUpper === 'TECHNICIAN') {
    user = mockTechnicians.find(u => u.email === email) || { ...defaultMockAccounts.TECHNICIAN, email: email || defaultMockAccounts.TECHNICIAN.email };
  } else {
    user = mockUsers.find(u => u.email === email) || { ...defaultMockAccounts.STUDENT, email: email || defaultMockAccounts.STUDENT.email };
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function logoutMock() {
  await delay(50);
  localStorage.removeItem(SESSION_KEY);
  return true;
}

// ─── Service Requests (Persistent) ────────────────────────────

export async function getServiceRequests(user) {
    try {
        const response = await fetch(`${API_URL}/requests`);

        if (!response.ok) {
            throw new Error(`Failed to fetch service requests: ${response.status}`);
        }

        const data = await response.json();

        const requests = (data.requests || []).map(request => ({
            ...request,
            id: request.requestId
        }));

        if (!user) return requests;

        if (user.role === 'STUDENT') {
            return requests.filter(request => request.reportedBy === user.email);
        }

        if (user.role === 'TECHNICIAN') {
            return requests.filter(
                request =>
                    request.assignedTo === user.id ||
                    request.assignedTo === user.email
            );
        }

        return requests;
    } catch (error) {
        console.error('Failed to fetch service requests from AWS:', error);
        throw error;
    }
}

export async function getServiceRequestById(id) {
    try {
        const response = await fetch(
            `${API_URL}/requests/${encodeURIComponent(id)}`
        );

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(
                `Failed to fetch service request: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.request) {
            return null;
        }

        return {
            ...data.request,
            id: data.request.requestId
        };
    } catch (error) {
        console.error(
            'Failed to fetch service request from AWS:',
            error
        );
        throw error;
    }
}
export async function createServiceRequest(data, currentUser) {
  await delay(200);
  const allRequests = getStoredRequests();

  const existingNums = allRequests
    .map(r => parseInt(String(r.id).replace('SR-', ''), 10))
    .filter(num => !isNaN(num));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  const newId = `SR-${String(nextNum).padStart(3, '0')}`;

  const newRequest = {
    id: newId,
    ...data,
    status: 'OPEN',
    assignedTo: null,
    assigneeName: null,
    reportedBy: currentUser?.email || 'rahul@campus.edu',
    reporterName: currentUser?.name || 'Rahul Sharma',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    resolutionNotes: null,
  };

  const updatedRequests = [newRequest, ...allRequests];
  saveStoredRequests(updatedRequests);

  return newRequest;
}

export async function updateServiceRequestStatus(id, newStatus, resolutionNotes) {
  await delay(150);
  const allRequests = getStoredRequests();
  const index = allRequests.findIndex(r => r.id === id);

  if (index === -1) throw new Error('Request not found');

  const updated = {
    ...allRequests[index],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (resolutionNotes) {
    updated.resolutionNotes = resolutionNotes;
  }

  if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
    updated.resolvedAt = new Date().toISOString();
  }

  allRequests[index] = updated;
  saveStoredRequests(allRequests);

  return { ...updated };
}

export async function assignTechnicianToRequest(requestId, techId, techName) {
  await delay(150);
  const allRequests = getStoredRequests();
  const index = allRequests.findIndex(r => r.id === requestId);

  if (index === -1) throw new Error('Request not found');

  const updated = {
    ...allRequests[index],
    assignedTo: techId,
    assigneeName: techName,
    status: allRequests[index].status === 'OPEN' ? 'ASSIGNED' : allRequests[index].status,
    updatedAt: new Date().toISOString(),
  };

  allRequests[index] = updated;
  saveStoredRequests(allRequests);

  return { ...updated };
}

// ─── Users & Technicians ──────────────────────────────────────

export async function getTechnicians() {
  await delay(50);
  return [...mockTechnicians];
}

export async function getUsers() {
  await delay(50);
  return [...mockUsers];
}

// ─── Knowledge Search & Matching Engine ───────────────────────

/**
 * Transparent Local Knowledge Base Search Engine.
 * Normalizes query terms and scores matching published knowledge articles.
 * Title keyword match: +5
 * Category match: +3
 * Symptom/keyword match: +2
 * Description match: +1
 */
export async function searchKnowledgeBase(query, category = '') {
  await delay(150);
  const articles = getStoredKnowledge().filter(a => a.status === 'PUBLISHED');

  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'in', 'it', 'on', 'to', 'for', 'of', 'and', 'but',
    'with', 'this', 'that', 'or', 'are', 'was', 'my', 'our', 'your', 'be', 'at',
    'by', 'from', 'shows', 'showing', 'has', 'have', 'does', 'do', 'not', 'i',
    'we', 'you', 'me', 'please', 'help', 'issue', 'problem', 'getting', 'error'
  ]);

  const rawQuery = String(query || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const queryTokens = rawQuery
    .split(/\s+/)
    .filter(t => t.length > 1 && !stopWords.has(t));

  const results = [];

  for (const article of articles) {
    let score = 0;

    // Category exact/partial match (+3)
    if (category && article.category.toLowerCase().includes(category.toLowerCase())) {
      score += 3;
    }

    const titleLower = article.title.toLowerCase();
    const problemLower = (article.problem || article.summary || '').toLowerCase();
    const symptomsText = Array.isArray(article.symptoms)
      ? article.symptoms.join(' ').toLowerCase()
      : (article.symptoms || '').toLowerCase();
    const keywordsText = Array.isArray(article.keywords)
      ? article.keywords.join(' ').toLowerCase()
      : (article.keywords || '').toLowerCase();
    const stepsText = Array.isArray(article.steps)
      ? article.steps.join(' ').toLowerCase()
      : (article.content || '').toLowerCase();

    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 5;
      if (keywordsText.includes(token) || symptomsText.includes(token)) score += 2;
      if (problemLower.includes(token)) score += 1;
      if (stepsText.includes(token)) score += 1;
    }

    if (score >= MIN_RELEVANCE_THRESHOLD) {
      let matchLabel = 'Possible match';
      if (score >= 8) matchLabel = 'Highly relevant';
      else if (score >= 5) matchLabel = 'Relevant';

      results.push({
        ...article,
        score,
        matchLabel,
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 3);
}

// ─── Knowledge Article Lifecycle & CRUD ────────────────────────

export async function getKnowledgeBaseArticles(user) {
  await delay(100);
  const articles = getStoredKnowledge();

  if (!user || user.role === 'STUDENT') {
    return articles.filter(a => a.status === 'PUBLISHED');
  }

  if (user.role === 'TECHNICIAN') {
    return articles.filter(
      a => a.status === 'PUBLISHED' || a.createdBy === user.id || a.createdBy === user.email
    );
  }

  // ADMIN sees all articles across all statuses
  return articles;
}

export async function getPublishedKnowledgeArticles() {
  await delay(100);
  const articles = getStoredKnowledge();
  return articles.filter(a => a.status === 'PUBLISHED');
}

export async function getKnowledgeBaseArticleById(id) {
  await delay(100);
  const articles = getStoredKnowledge();
  const article = articles.find(a => a.id === id);
  if (!article) return null;

  // Increment view counter locally
  article.views = (article.views || 0) + 1;
  const index = articles.findIndex(a => a.id === id);
  articles[index] = article;
  saveStoredKnowledge(articles);

  return { ...article };
}

export async function createKnowledgeArticle(data, currentUser) {
  await delay(200);
  const articles = getStoredKnowledge();

  const existingNums = articles
    .map(a => parseInt(String(a.id).replace('KB-', ''), 10))
    .filter(num => !isNaN(num));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  const newId = `KB-${String(nextNum).padStart(3, '0')}`;

  const symptomsArray = Array.isArray(data.symptoms)
    ? data.symptoms
    : (data.symptoms ? data.symptoms.split('\n').map(s => s.trim()).filter(Boolean) : []);

  const keywordsArray = Array.isArray(data.keywords)
    ? data.keywords
    : (data.keywords ? data.keywords.split(',').map(s => s.trim()).filter(Boolean) : []);

  const stepsArray = Array.isArray(data.steps)
    ? data.steps
    : (data.steps ? data.steps.split('\n').map(s => s.trim()).filter(Boolean) : []);

  const newArticle = {
    id: newId,
    title: data.title,
    category: data.category || 'General',
    problem: data.problem || data.description || '',
    symptoms: symptomsArray,
    keywords: keywordsArray,
    steps: stepsArray,
    additionalNotes: data.additionalNotes || '',
    summary: data.problem || data.title,
    content: stepsArray.map((st, i) => `${i + 1}. ${st}`).join('\n'),
    status: data.status || 'PENDING_REVIEW',
    version: 1,
    createdBy: currentUser?.id || currentUser?.email || 'USR-101',
    author: currentUser?.name || 'CampusOps User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relatedRequestId: data.relatedRequestId || null,
    helpful: 0,
    unhelpful: 0,
    views: 0,
  };

  const updatedList = [newArticle, ...articles];
  saveStoredKnowledge(updatedList);

  return newArticle;
}

export async function submitKnowledgeArticleForReview(data, currentUser) {
  return createKnowledgeArticle({ ...data, status: 'PENDING_REVIEW' }, currentUser);
}

export async function approveKnowledgeArticle(id) {
  await delay(150);
  const articles = getStoredKnowledge();
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Knowledge article not found');

  const updated = {
    ...articles[index],
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
  };

  articles[index] = updated;
  saveStoredKnowledge(articles);
  return { ...updated };
}

export async function rejectKnowledgeArticle(id, reason = '') {
  await delay(150);
  const articles = getStoredKnowledge();
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Knowledge article not found');

  const updated = {
    ...articles[index],
    status: 'REJECTED',
    rejectionReason: reason,
    updatedAt: new Date().toISOString(),
  };

  articles[index] = updated;
  saveStoredKnowledge(articles);
  return { ...updated };
}

export async function updateKnowledgeArticle(id, data) {
  await delay(150);
  const articles = getStoredKnowledge();
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Knowledge article not found');

  const currentVer = articles[index].version || 1;
  const updated = {
    ...articles[index],
    ...data,
    version: currentVer + 1,
    updatedAt: new Date().toISOString(),
  };

  articles[index] = updated;
  saveStoredKnowledge(articles);
  return { ...updated };
}

export async function recordKnowledgeFeedback(articleId, helpful, userId) {
  await delay(100);
  const feedbackList = getStoredFeedback();

  const newFeedback = {
    articleId,
    helpful: Boolean(helpful),
    userId: userId || 'anonymous',
    createdAt: new Date().toISOString(),
  };

  feedbackList.push(newFeedback);
  saveStoredFeedback(feedbackList);

  // Update counter in article
  const articles = getStoredKnowledge();
  const index = articles.findIndex(a => a.id === articleId);
  if (index !== -1) {
    if (helpful) {
      articles[index].helpful = (articles[index].helpful || 0) + 1;
    } else {
      articles[index].unhelpful = (articles[index].unhelpful || 0) + 1;
    }
    saveStoredKnowledge(articles);
  }

  return true;
}

export async function getKnowledgeAnalytics() {
  await delay(100);
  const articles = getStoredKnowledge();

  const total = articles.length;
  const published = articles.filter(a => a.status === 'PUBLISHED').length;
  const pendingReview = articles.filter(a => a.status === 'PENDING_REVIEW').length;
  const rejected = articles.filter(a => a.status === 'REJECTED').length;

  const sortedByHelpful = [...articles].sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
  const mostHelpfulArticle = sortedByHelpful[0] || null;

  return {
    total,
    published,
    pendingReview,
    rejected,
    mostHelpfulArticle,
  };
}

// ─── Dashboard Stats & Analytics ──────────────────────────────

export async function getDashboardStats(user) {
  await delay(150);
  const requests = await getServiceRequests(user);
  const kbStats = await getKnowledgeAnalytics();

  const total = requests.length;
  const open = requests.filter(r => r.status === 'OPEN').length;
  const assigned = requests.filter(r => r.status === 'ASSIGNED').length;
  const inProgress = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const resolved = requests.filter(r => r.status === 'RESOLVED').length;
  const closed = requests.filter(r => r.status === 'CLOSED').length;
  const critical = requests.filter(r => r.priority === 'CRITICAL').length;

  const byStatus = {
    OPEN: open,
    ASSIGNED: assigned,
    IN_PROGRESS: inProgress,
    RESOLVED: resolved,
    CLOSED: closed,
  };

  const byPriority = {
    LOW: requests.filter(r => r.priority === 'LOW').length,
    MEDIUM: requests.filter(r => r.priority === 'MEDIUM').length,
    HIGH: requests.filter(r => r.priority === 'HIGH').length,
    CRITICAL: critical,
  };

  const byCategory = {
    'Network/Wi-Fi': requests.filter(r => r.category === 'Network/Wi-Fi').length,
    Equipment: requests.filter(r => r.category === 'Equipment').length,
    Electrical: requests.filter(r => r.category === 'Electrical').length,
    'Facility/Maintenance': requests.filter(r => r.category === 'Facility/Maintenance').length,
    Software: requests.filter(r => r.category === 'Software').length,
  };

  const byLocation = {
    'Block A': requests.filter(r => r.location.includes('Block A')).length,
    'Block B': requests.filter(r => r.location.includes('Block B')).length,
    'Block C': requests.filter(r => r.location.includes('Block C')).length,
    Library: requests.filter(r => r.location.includes('Library')).length,
    'Computer Lab': requests.filter(r => r.location.includes('Computer Lab')).length,
  };

  return {
    total,
    open,
    assigned,
    inProgress,
    resolved,
    closed,
    critical,
    avgResolutionTimeHours: 4.2,
    byStatus,
    byPriority,
    byCategory,
    byLocation,
    knowledge: kbStats,
  };
}
