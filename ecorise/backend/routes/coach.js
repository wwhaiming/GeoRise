/* EcoRise — AI eco-coach: personalized, data-grounded carbon advice. */
const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { ecoCoach } = require('../utils/aiClient');
const { body } = require('../utils/validate');

const router = express.Router();

function gatherStats(db, userId) {
  const rows = db.prepare(
    "SELECT action_type, COALESCE(SUM(co2_saved),0) co2, COUNT(*) c, COALESCE(SUM(points),0) pts FROM posts WHERE user_id = ? AND hidden = 0 GROUP BY action_type"
  ).all(userId);
  const byCategory = {};
  let totalCO2 = 0, postCount = 0, totalPoints = 0;
  for (const r of rows) {
    const co2 = Math.round(r.co2 * 10) / 10;
    byCategory[r.action_type] = { co2, count: r.c, points: r.pts };
    totalCO2 += co2; postCount += r.c; totalPoints += r.pts;
  }
  totalCO2 = Math.round(totalCO2 * 10) / 10;
  const streak = db.prepare('SELECT COALESCE(MAX(streak),0) s FROM leaderboard_members WHERE user_id = ?').get(userId).s;
  let topCategory = null, topCO2 = -1;
  for (const [k, v] of Object.entries(byCategory)) if (v.co2 > topCO2) { topCO2 = v.co2; topCategory = k; }
  return { totalCO2, postCount, totalPoints, streak, byCategory, topCategory };
}

// POST /api/coach { message?, history? } -> { reply, stats }
router.post('/', authMiddleware, body('coach'), async (req, res) => {
  try {
    const db = getDb();
    const stats = gatherStats(db, req.userId);
    const { message, history } = req.valid;
    const out = await ecoCoach({ stats, message, history });
    res.json({
      reply: out.reply,
      isMock: !!out.isMock,
      stats: { totalCO2: stats.totalCO2, postCount: stats.postCount, totalPoints: stats.totalPoints, streak: stats.streak, topCategory: stats.topCategory },
    });
  } catch (err) {
    console.error('Coach error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
