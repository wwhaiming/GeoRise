/* EcoRise — AI Eco Coach Phase 0 tests.
 * Proves the safety frame: the surface is dark unless COACH_ENABLED=true, source
 * registration/approval is teacher/admin-only, and the seeded corpus is approved
 * and idempotent. No points are awarded anywhere in Phase 0. */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-' + 'x'.repeat(40);
process.env.NODE_ENV = 'test';
delete process.env.ANTHROPIC_API_KEY;     // force mock path
process.env.GEMINI_API_KEY = '';          // hermetic: never hit the live network
process.env.GOOGLE_API_KEY = '';
const DB = path.join(__dirname, 'coach-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { getDb } = require('../db');
const { signToken } = require('../middleware/auth');
const { seedCoachCorpus } = require('../scripts/seedCoachCorpus');

const auth = (t) => ['Authorization', `Bearer ${t}`];
let seq = 0;
async function newUser(name) {
  const email = `coach${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'password123', name });
  assert.equal(r.status, 200, 'signup ok: ' + JSON.stringify(r.body));
  return { id: r.body.user.id, token: signToken(r.body.user.id) };
}

test.after(() => { try { for (const f of [DB, DB + '-shm', DB + '-wal']) fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {} });

test('coach surface is 404 when COACH_ENABLED is off', async () => {
  process.env.COACH_ENABLED = 'false';
  const u = await newUser('Off');
  const r = await request(app).get('/api/coach/status').set(...auth(u.token));
  assert.equal(r.status, 404, 'disabled coach must 404');
  assert.equal(r.body.enabled, false);
});

test('status reports role and that the coach awards no points', async () => {
  process.env.COACH_ENABLED = 'true';
  const u = await newUser('Stat');
  const r = await request(app).get('/api/coach/status').set(...auth(u.token));
  assert.equal(r.status, 200);
  assert.equal(r.body.enabled, true);
  assert.equal(r.body.role, 'user');
  assert.equal(r.body.awardsPoints, false, 'Phase 0 must not award points');
});

test('only teacher/admin can register and approve a source', async () => {
  process.env.COACH_ENABLED = 'true';
  const u = await newUser('Reg');
  const denied = await request(app).post('/api/coach/sources').set(...auth(u.token))
    .send({ title: 'My Source', provenance: 'open_access' });
  assert.equal(denied.status, 403, 'regular user cannot register a source');

  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', u.id);
  const ok = await request(app).post('/api/coach/sources').set(...auth(u.token))
    .send({ title: 'My Source', provenance: 'open_access', topicTags: ['waste'] });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.status, 'pending', 'new sources start pending review');

  // Not yet retrievable: only approved sources are listed.
  const beforeApprove = await request(app).get('/api/coach/sources').set(...auth(u.token));
  assert.ok(!beforeApprove.body.sources.some(s => s.id === ok.body.id), 'pending source must not be listed');

  const approve = await request(app).post(`/api/coach/sources/${ok.body.id}/approve`).set(...auth(u.token)).send({});
  assert.equal(approve.status, 200);
  assert.equal(approve.body.status, 'approved');

  const list = await request(app).get('/api/coach/sources').set(...auth(u.token));
  assert.ok(list.body.sources.some(s => s.id === ok.body.id), 'approved source is listed');
});

test('seedCoachCorpus inserts an approved corpus and is idempotent', async () => {
  const db = getDb();
  const r1 = seedCoachCorpus(db);
  assert.ok(r1.sources >= 2 && r1.chunks >= 4, 'seeds sources + chunks');
  const approved = db.prepare("SELECT COUNT(*) c FROM eco_sources WHERE provenance='synthetic_demo' AND status='approved'").get().c;
  assert.equal(approved, r1.sources, 'all demo sources are approved');
  const chunks1 = db.prepare("SELECT COUNT(*) c FROM eco_source_chunks").get().c;

  // Re-run must reset, not duplicate.
  const r2 = seedCoachCorpus(db);
  const demoSources = db.prepare("SELECT COUNT(*) c FROM eco_sources WHERE provenance='synthetic_demo'").get().c;
  assert.equal(demoSources, r2.sources, 're-seeding does not duplicate sources');
  const chunks2 = db.prepare("SELECT COUNT(*) c FROM eco_source_chunks").get().c;
  assert.equal(chunks2, chunks1, 're-seeding does not duplicate chunks');
});
