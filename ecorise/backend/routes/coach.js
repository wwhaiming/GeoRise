/* EcoRise — AI Eco Coach routes (Phase 0: gating, roles, source approval).
 *
 * See docs/AI_ECO_COACH_PLAN.md. This router is the scaffold for the retrieval-
 * augmented learning layer. Phase 0 ships ONLY the safety frame:
 *   - the whole feature is dark unless COACH_ENABLED=true,
 *   - source ingestion/approval is restricted to teacher/admin roles,
 *   - and NO points, generation, or notifications exist yet.
 * Question generation, grading, and capped scoring arrive in later phases behind
 * the faithfulness + cap gates described in the plan.
 */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Hard feature gate. Read per-request so it can be flipped without a restart, and
// so an accidental deploy can't expose half-built coach endpoints. When off, the
// whole surface 404s as if it does not exist.
router.use((req, res, next) => {
  if (process.env.COACH_ENABLED !== 'true') {
    return res.status(404).json({ error: 'AI Eco Coach is not enabled', enabled: false });
  }
  next();
});

// Role gate. The users table has no role concept beyond this column (added in
// migrate()); only teacher/admin may add or approve learning sources.
function requireRole(...roles) {
  return (req, res, next) => {
    const db = getDb();
    const u = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
    if (!u || !roles.includes(u.role || 'user')) {
      return res.status(403).json({ error: `Requires ${roles.join(' or ')} role` });
    }
    next();
  };
}

const PROVENANCE = ['upload', 'open_access', 'agency', 'synthetic_demo'];

// GET /api/coach/status — cheap probe the UI uses to show/hide the Coach tab.
router.get('/status', authMiddleware, (req, res) => {
  const db = getDb();
  const role = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId)?.role || 'user';
  const approved = db.prepare("SELECT COUNT(*) c FROM eco_sources WHERE status = 'approved'").get().c;
  res.json({ enabled: true, role, approvedSources: approved, awardsPoints: false });
});

// GET /api/coach/sources — list approved sources (any authed user).
router.get('/sources', authMiddleware, (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    "SELECT id, title, authors, institution, url, provenance, pub_year, topic_tags, status FROM eco_sources WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100"
  ).all();
  res.json({ sources: rows.map(r => ({ ...r, topic_tags: safeTags(r.topic_tags) })) });
});

// POST /api/coach/sources — register a learning source (teacher/admin). Lands as
// 'pending' until approved; ingestion/embedding happens in Phase 1.
router.post('/sources', authMiddleware, requireRole('teacher', 'admin'), (req, res) => {
  const { title, authors, institution, url, provenance, license, pubYear, topicTags, courseId } = req.body || {};
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'A source title (>= 3 chars) is required' });
  }
  const prov = PROVENANCE.includes(provenance) ? provenance : 'upload';
  const id = uuid();
  getDb().prepare(`INSERT INTO eco_sources
    (id, title, authors, institution, url, provenance, license, pub_year, topic_tags, owner_user_id, course_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).run(
    id, title.trim(), str(authors), str(institution), str(url), prov, str(license),
    Number.isFinite(Number(pubYear)) ? Number(pubYear) : null,
    JSON.stringify(Array.isArray(topicTags) ? topicTags.slice(0, 12) : []),
    req.userId, str(courseId),
  );
  res.json({ success: true, id, status: 'pending' });
});

// POST /api/coach/sources/:id/approve — move a source into the retrievable corpus
// (teacher/admin). The human-review gate that keeps the corpus trustworthy.
router.post('/sources/:id/approve', authMiddleware, requireRole('teacher', 'admin'), (req, res) => {
  const db = getDb();
  const src = db.prepare('SELECT id FROM eco_sources WHERE id = ?').get(req.params.id);
  if (!src) return res.status(404).json({ error: 'Source not found' });
  const status = req.body && req.body.reject ? 'rejected' : 'approved';
  db.prepare('UPDATE eco_sources SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, id: req.params.id, status });
});

function str(v) { return typeof v === 'string' ? v : ''; }
function safeTags(t) { try { const a = JSON.parse(t); return Array.isArray(a) ? a : []; } catch { return []; } }

module.exports = router;
