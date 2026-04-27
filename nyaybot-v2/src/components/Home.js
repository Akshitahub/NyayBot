import Nav from "./Nav";
import { translations } from "../translations";

export default function Home({ lang, setLang, onOrg, onInd }) {
  const t = translations[lang];
  return (
    <div className="home">
      <Nav lang={lang} setLang={setLang} />

      <div className="home-hero">
        <div className="hero-eyebrow">
          <span className="live-dot" />
          {t.tagline}
        </div>
        <h1 className="hero-title">
          {t.heroTitle} <span className="highlight">{t.heroTitleHighlight}</span>
        </h1>
        <p className="hero-sub">{t.heroSub}</p>

        <div className="path-cards">
          <div className="path-card org" onClick={onOrg}>
            <div className="path-icon blue">🏢</div>
            <div className="path-title">{t.orgPath}</div>
            <p className="path-desc">{t.orgDesc}</p>
            <div className="path-tags">
              {t.orgTags.map(tag => <span key={tag} className="path-tag blue">{tag}</span>)}
            </div>
            <div className="path-cta">
              <span className="path-cta-text">{t.orgCta}</span>
              <div className="path-arrow">→</div>
            </div>
          </div>

          <div className="path-card ind" onClick={onInd}>
            <div className="path-icon green">🧑‍💼</div>
            <div className="path-title">{t.indPath}</div>
            <p className="path-desc">{t.indDesc}</p>
            <div className="path-tags">
              {t.indTags.map(tag => <span key={tag} className="path-tag green">{tag}</span>)}
            </div>
            <div className="path-cta">
              <span className="path-cta-text">{t.indCta}</span>
              <div className="path-arrow">→</div>
            </div>
          </div>
        </div>
      </div>

      <div className="trust-strip">
        {[t.trust1, t.trust2, t.trust3, t.trust4].map((item, i) => (
          <div className="trust-item" key={i}>
            <span>{["✦","📊","🇮🇳","📄"][i]}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="home-stats">
        {[t.stat1, t.stat2, t.stat3].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-num" style={{ color: ["#1A73E8","#D93025","#1E8E3E"][i] }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
