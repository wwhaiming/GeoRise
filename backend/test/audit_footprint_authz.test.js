/* EcoRise — footprint recommendation auth regression test.
 * approve/unapprove/assign require authentication (authMiddleware) but the
 * staff-role gate was intentionally removed: any signed-in user may act.
 * Unauthenticated requests are rejected (401).
 * Hermetic: no API key, temp SQLite DB. (Covers backend/routes/footprint.js.) */

process.env.JWT_SECRET = process.env.JWT_SECRET || ('fp-authz-test-secret-' + 'x'.repeat(24));
process.env.COACH_ENABLED = 'true';
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = '';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const DB = path.join(__dirname, 'fp-authz-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../middleware/auth');
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

test.after(() => {
  for (const f of [DB, DB + '-shm', DB + '-wal']) {
    try { fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {}
  }
});

const auth = (t) => ['Authorization', `Bearer ${t}`];
let seq = 0;
async function signup(name) {
  const email = `fpauthz${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'pass1234', name });
  assert.equal(r.status, 200, 'signup: ' + JSON.stringify(r.body));
  return { id: r.body.user.id, token: signToken(r.body.user.id) };
}

function seedRecommendation() {
  const db = getDb();
  const id = uuid();
  db.prepare(
    "INSERT INTO fp_recommendations (id, week_start, category, title, reasoning, estimated_impact, kg_co2e_per_year, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed')"
  ).run(id, '2026-01-05', 'electricity', 'Audit test rec', 'synthetic', '', 0);
  return id;
}

test('footprint approve: any authenticated user allowed, unauthenticated blocked (401)', async () => {
  const member = await signup('FpMember');   // plain member, not staff/organizer
  const recId = seedRecommendation();

  const noAuth = await request(app)
    .post(`/api/footprint/recommendations/${recId}/approve`)
    .send({});
  assert.equal(noAuth.status, 401, 'unauthenticated approve must be blocked: ' + JSON.stringify(noAuth.body));

  const ok = await request(app)
    .post(`/api/footprint/recommendations/${recId}/approve`)
    .set(...auth(member.token)).send({});
  assert.equal(ok.status, 200, 'member approve: ' + JSON.stringify(ok.body));
  assert.equal(ok.body.recommendation.status, 'approved');
  assert.equal(ok.body.recommendation.approved_by, member.id, 'approved_by records who acted');
});

test('footprint unapprove: approved -> proposed, any authenticated user allowed, unauthenticated 401', async () => {
  const member = await signup('FpMember3');
  const recId = seedRecommendation();

  // Approve first so there is an active goal to deactivate.
  const approved = await request(app)
    .post(`/api/footprint/recommendations/${recId}/approve`)
    .set(...auth(member.token)).send({});
  assert.equal(approved.body.recommendation.status, 'approved');

  const noAuth = await request(app)
    .post(`/api/footprint/recommendations/${recId}/unapprove`)
    .send({});
  assert.equal(noAuth.status, 401, 'unauthenticated unapprove must be blocked: ' + JSON.stringify(noAuth.body));

  const ok = await request(app)
    .post(`/api/footprint/recommendations/${recId}/unapprove`)
    .set(...auth(member.token)).send({});
  assert.equal(ok.status, 200, 'member unapprove: ' + JSON.stringify(ok.body));
  assert.equal(ok.body.recommendation.status, 'proposed');
  assert.equal(ok.body.recommendation.approved_by, null, 'approved_by cleared');
  assert.equal(ok.body.recommendation.approved_at, null, 'approved_at cleared');
});

test('footprint assign: any authenticated user allowed, unauthenticated blocked (401)', async () => {
  const member = await signup('FpMember2');
  const recId = seedRecommendation();

  const noAuth = await request(app)
    .post(`/api/footprint/recommendations/${recId}/assign`)
    .send({ assignedTo: 'Facilities' });
  assert.equal(noAuth.status, 401, 'unauthenticated assign must be blocked: ' + JSON.stringify(noAuth.body));

  const ok = await request(app)
    .post(`/api/footprint/recommendations/${recId}/assign`)
    .set(...auth(member.token)).send({ assignedTo: 'Facilities' });
  assert.equal(ok.status, 200, 'member assign: ' + JSON.stringify(ok.body));
  assert.equal(ok.body.recommendation.assigned_to, 'Facilities');
});
