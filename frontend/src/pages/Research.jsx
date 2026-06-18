/* GeoRise — Research screen.
 *
 * Split out of the AI Eco Coach screen: this is the "research library and below"
 * half (the 1000-paper corpus: ask / browse / summarize / visualize) plus the
 * responsible-AI guardrails note. Reached from its own bottom-nav tab.
 */
import Icon from '../components/Icon';
import ResearchLibrary from '../components/ResearchLibrary';

export default function Research({ ctx }) {
  const { go, showToast } = ctx;
  return (
    <div className="screen-in">
      {/* header */}
      <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(46,125,79,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="folder" size={22} color="var(--green)" />
        </span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--green)' }}>AI · grounded in research</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 19, lineHeight: 1 }}>Research library</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ padding: 9 }} aria-label="Back home" onClick={() => go('home')}>
          <Icon name="home" size={18} />
        </button>
      </div>

      <ResearchLibrary showToast={showToast} />

      <div style={{ padding: '16px 16px 0' }}>
        <div className="card" style={{ padding: 15, border: '1px solid rgba(182,111,77,.22)' }}>
          <div className="eyebrow" style={{ color: 'var(--coral-d)', marginBottom: 6 }}>Responsible AI guardrails</div>
          <div className="muted" style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.45 }}>
            The coach cannot award unlimited points or invent sources. Learning points are capped, citations are shown, impact math stays deterministic, and organizers keep human review over boards, source approval, and moderation.
          </div>
        </div>
      </div>

      <div style={{ height: 110 }} />
    </div>
  );
}
