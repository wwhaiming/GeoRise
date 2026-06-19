/* EcoRise — AI Insights panel (Direction B reasoning layer).
 *
 * The input -> AI -> insight -> action loop, made visible: anomaly detection over the
 * school's utility history, a next-month forecast, and ranked interventions the teacher
 * APPROVES (human-in-the-loop). Falls back to the named "Lincoln High" sample so the demo
 * always shows real AI output. Environmental scope only.
 */
import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import api from '../utils/api';

const CONF_COLOR = { high: 'var(--coral-d)', medium: 'var(--yellow)', low: 'var(--text-dim)' };
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());

export default function Insights({ leaderboardId, showToast }) {
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try { setData(await api.coachInsights(leaderboardId)); setHidden(false); }
    catch { setHidden(true); } // coach disabled / error -> hide quietly
  }, [leaderboardId]);
  useEffect(() => { load(); }, [load]);

  if (hidden || !data) return null;
  const { anomalies = [], forecast = {}, recommendations = [], summary, school, sampleData, profile, humanInLoop } = data;

  const act = async (kind, key) => {
    if (!leaderboardId) { showToast && showToast('Open your board first.'); return; }
    setBusy(key || kind);
    try {
      if (kind === 'approve') { await api.coachInsightsApprove(leaderboardId, key); showToast && showToast('Action approved — added to the plan.'); }
      else { await api.coachInsightsLoadDemo(leaderboardId); showToast && showToast('Loaded Lincoln High sample onto your board.'); }
      await load();
    } catch (e) {
      const msg = e && e.status === 403 ? 'Only the board organizer (teacher) can do that.' : 'Action failed — try again.';
      showToast && showToast(msg);
    } finally { setBusy(''); }
  };

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon name="sparkle" size={16} color="var(--green)" />
          <span className="eyebrow" style={{ color: 'var(--green)' }}>AI insights · {school}</span>
          {sampleData && <span className="chip" style={{ marginLeft: 'auto', fontSize: 10 }}>sample data</span>}
        </div>
        <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.5, marginBottom: 6 }}>{summary}</div>
        {profile && <div className="dim" style={{ fontSize: 11, fontWeight: 600 }}>{profile.location} · {fmt(profile.students)} students · {profile.note}</div>}

        {/* Anomalies — pattern/anomaly detection */}
        {anomalies.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ color: 'var(--coral-d)', marginBottom: 8 }}>Detected anomalies</div>
            {anomalies.slice(0, 3).map((a, i) => (
              <div key={i} className="card" style={{ padding: 12, marginBottom: 8, border: '1px solid rgba(182,111,77,.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 9999, background: CONF_COLOR[a.confidence] || 'var(--text-dim)' }} />
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, textTransform: 'capitalize' }}>{a.category}</span>
                  <span className="dim" style={{ fontSize: 12 }}>{a.month}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--coral-d)' }}>+{a.percentAboveExpected}%</span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, marginTop: 6 }}>{a.likelyCauses[0]}</div>
                <div className="dim" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 6 }}>
                  ~{fmt(a.excessKgCO2ePerMonth)} kg CO₂e likely avoidable · {a.confidence} confidence · {a.observed} vs {a.expected} {a.unit} expected
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6, color: 'var(--green-d)' }}>→ {a.recommendedNextStep}</div>
              </div>
            ))}
          </div>
        )}

        {/* Forecast — predictive modelling */}
        {(forecast.gas || forecast.electricity || forecast.water) && (
          <div style={{ marginTop: 12 }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 8 }}>Next-month forecast</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {['electricity', 'gas', 'water'].filter(k => forecast[k]).map(k => {
                const f = forecast[k];
                return (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
                    <span className="muted" style={{ textTransform: 'capitalize' }}>{k}</span>
                    <span className="tnum">{fmt(f.predicted)} {f.unit} <span className="dim" style={{ fontWeight: 600 }}>[{fmt(f.low)}–{fmt(f.high)}]{f.trendPctVsTrailingAvg != null ? ` · ${f.trendPctVsTrailingAvg > 0 ? '+' : ''}${f.trendPctVsTrailingAvg}% vs avg` : ''}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations — the action plan (human approves) */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 8 }}>Recommended action plan</div>
            {recommendations.map((r) => {
              const approved = r.status === 'approved';
              return (
                <div key={r.key} className="card" style={{ padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5 }}>{r.label}</span>
                    {r.addressesAnomaly && <span className="chip" style={{ fontSize: 10, background: 'rgba(182,111,77,.16)', color: 'var(--coral-d)' }}>addresses anomaly</span>}
                    <span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--green-d)' }}>~{fmt(r.expectedKgPerMonth)} kg/mo</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, marginTop: 6 }}>{r.action}</div>
                  <div className="dim" style={{ fontSize: 11.5, fontWeight: 650, marginTop: 6 }}>
                    {r.costTier === 'none' ? 'No cost' : `${r.costTier} cost`} · {r.effortTier} effort · approver: {r.approver}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {approved ? (
                      <span className="chip chip-green" style={{ fontSize: 11 }}>
                        <Icon name="check" size={12} color="var(--green-d)" /> Approved{r.verifyBy ? ` · verify by ${r.verifyBy}` : ''}
                      </span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" disabled={busy === r.key} onClick={() => act('approve', r.key)}>
                        {busy === r.key ? 'Approving…' : 'Approve (teacher)'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Responsible-AI: human-in-the-loop boundary */}
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'rgba(46,125,79,.05)', border: '1px solid rgba(46,125,79,.12)' }}>
          <div className="eyebrow" style={{ color: 'var(--green)', marginBottom: 4 }}>Human in the loop</div>
          <div className="dim" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.45 }}>{humanInLoop}</div>
        </div>

        {sampleData && (
          <button className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }} disabled={busy === 'demo'} onClick={() => act('demo')}>
            {busy === 'demo' ? 'Loading…' : 'Load Lincoln High sample onto my board'}
          </button>
        )}
      </div>
    </div>
  );
}
