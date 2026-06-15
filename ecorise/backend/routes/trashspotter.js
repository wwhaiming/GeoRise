/* EcoRise — Trash Spotter routes */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { upload, fileToBase64 } = require('../middleware/upload');
const { aiRateLimit } = require('../middleware/rateLimit');
const { rateTrashSeverity } = require('../utils/aiClient');
const { awardPoints } = require('../utils/pointsEngine');
const { imageHash } = require('../utils/imageHash');
const { body } = require('../utils/validate');

const router = express.Router();

function isBoardMember(db, lbId, userId) {
  if (!lbId) return true;
  if (db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(lbId, userId)) return true;
  return !!db.prepare('SELECT 1 FROM leaderboards WHERE id = ? AND organizer_id = ?').get(lbId, userId);
}

router.post('/', authMiddleware, upload.single('image'), aiRateLimit, body('trash'), async (req, res) => {
  try {
    const db = getDb();
    const { location, leaderboardId } = req.valid;
    const image = req.file ? fileToBase64(req.file) : (req.valid.image || '');
    if (!image || !image.startsWith('data:')) return res.status(400).json({ error: 'An image is required' });

    if (leaderboardId && !db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, req.userId)) {
      return res.status(403).json({ error: 'Join this leaderboard before reporting to it' });
    }

    const hash = imageHash(image);
    const dup = db.prepare("SELECT id FROM trash_reports WHERE user_id = ? AND image_hash = ? AND created_at > datetime('now','-1 day')").get(req.userId, hash);
    if (dup) return res.status(409).json({ error: 'You already reported this photo recently.', reason: 'duplicate', accepted: false, points: 0 });

    const severity = await rateTrashSeverity(image);

    if (!severity.isTrash) {
      return res.json({
        success: false, accepted: false, reason: 'not_trash', isTrash: false,
        severity: 0, points: 0, confidence: severity.confidence ?? 0,
        description: severity.description || 'This image does not appear to show litter.',
        aiRemaining: req.aiRemaining,
      });
    }

    const points = 35 + severity.score * 5;
    const id = uuid();
    const postId = uuid();
    db.transaction(() => {
      db.prepare(`INSERT INTO trash_reports (id, user_id, leaderboard_id, image, image_hash, severity, description, estimated_items, location, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, req.userId, leaderboardId || null, image, hash, severity.score, severity.description, severity.estimatedItems || '', location || '', points);
      db.prepare(`INSERT INTO posts (id, user_id, leaderboard_id, image, image_hash, action_type, action_desc, co2_saved, points, caption)
        VALUES (?, ?, ?, ?, ?, 'nature', 'Trash report', 0.5, ?, ?)`)
        .run(postId, req.userId, leaderboardId || null, image, hash, points, `Trash spotted${location ? ' at ' + location : ''} — severity ${severity.score}/10`);
      awardPoints(req.userId, leaderboardId, points, { source: 'trash', sourceId: id });
    })();

    res.json({
      success: true, accepted: true, reportId: id, postId,
      severity: severity.score, description: severity.description, estimatedItems: severity.estimatedItems,
      points, confidence: severity.confidence, source: severity.source || (severity.isMock ? 'mock' : 'ai'),
      aiRemaining: req.aiRemaining,
    });
  } catch (err) {
    console.error('Trash report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId } = req.query;
    if (leaderboardId && !isBoardMember(db, leaderboardId, req.userId)) {
      return res.status(403).json({ error: 'Join this leaderboard to view its reports' });
    }
    const reports = leaderboardId
      ? db.prepare(`SELECT tr.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar
           FROM trash_reports tr JOIN users u ON u.id = tr.user_id WHERE tr.leaderboard_id = ? ORDER BY tr.created_at DESC LIMIT 100`).all(leaderboardId)
      : db.prepare(`SELECT tr.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar
           FROM trash_reports tr JOIN users u ON u.id = tr.user_id WHERE tr.user_id = ? ORDER BY tr.created_at DESC LIMIT 100`).all(req.userId);
    res.json({ reports });
  } catch (err) {
    console.error('Get trash reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
