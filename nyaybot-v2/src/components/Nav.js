import { translations } from "../translations";

export default function Nav({ lang, setLang, onBack, rightContent }) {
  return (
    <nav className="nav">
      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
        {onBack && (
          <button className="flow-back" onClick={onBack} style={{ margin: 0 }}>
            ← {lang === "hi" ? "वापस" : "Back"}
          </button>
        )}
        <div className="nav-logo">
          <span>⚖️</span>
          NyayBot
          <div className="nav-google-bar">
            {["#1A73E8","#EA4335","#FBBC05","#34A853"].map((c,i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="nav-right">
        {rightContent}
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
          <button className={`lang-btn ${lang === "hi" ? "active" : ""}`} onClick={() => setLang("hi")}>हि</button>
        </div>
      </div>
    </nav>
  );
}
