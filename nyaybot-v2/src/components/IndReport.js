import { useState } from "react";
import Nav from "./Nav";
import { translations } from "../translations";

export default function IndReport({ lang, setLang, results, onRestart }) {
  const t = translations[lang];
  const [tab, setTab] = useState("analysis");
  const [copied, setCopied] = useState(false);
  const { biasDetected, biasType, severity, explanation, complaintLetter, fairScore } = results;

  const severityColor = severity === "HIGH" ? "#D93025" : severity === "MEDIUM" ? "#F9AB00" : severity === "LOW" ? "#1A73E8" : "#1E8E3E";
  const severityLabel = lang === "hi"
    ? { HIGH: "उच्च", MEDIUM: "मध्यम", LOW: "कम", NONE: "कोई नहीं" }[severity] || severity
    : severity;

  function copyLetter() {
    navigator.clipboard.writeText(complaintLetter || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs = [
    { id: "analysis", label: t.biasAnalysis },
    { id: "rights", label: t.legalRights },
    { id: "schemes", label: t.govtSchemes },
    { id: "letter", label: t.complaintLetter },
  ];

  return (
    <div className="report">
      <Nav lang={lang} setLang={setLang} rightContent={
        <button className="action-btn secondary" onClick={onRestart}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", padding: "0.5rem 1rem", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontFamily: "DM Sans, sans-serif" }}>
          {lang === "hi" ? "नया विश्लेषण" : "New Analysis"}
        </button>
      } />

      <div className="report-header">
        <div className="report-header-top">
          <div>
            <div className="report-title">{lang === "hi" ? "भेदभाव विश्लेषण रिपोर्ट" : "Discrimination Analysis Report"}</div>
            <div className="report-meta">{lang === "hi" ? "व्यक्तिगत मामला विश्लेषण · NyayBot" : "Individual Case Analysis · NyayBot"}</div>
          </div>
        </div>
        <div className="metric-strip">
          <div className="metric-block">
            <div className="m-num" style={{ color: biasDetected ? "#D93025" : "#1E8E3E" }}>{biasDetected ? (lang==="hi"?"हां":"YES") : (lang==="hi"?"नहीं":"NO")}</div>
            <div className="m-label">{lang==="hi"?"भेदभाव पाया":"BIAS DETECTED"}</div>
          </div>
          <div className="metric-block">
            <div className="m-num" style={{ color: severityColor }}>{severityLabel}</div>
            <div className="m-label">{lang==="hi"?"गंभीरता":"SEVERITY"}</div>
          </div>
          <div className="metric-block">
            <div className="m-num" style={{ color: "#1A73E8" }}>{fairScore || "N/A"}</div>
            <div className="m-label">{lang==="hi"?"योग्यता स्कोर":"MERIT SCORE"}</div>
          </div>
          <div className="metric-block">
            <div className="m-num" style={{ color: "#F9AB00", fontSize: "1rem", paddingTop: "0.3rem" }}>{biasType || "NONE"}</div>
            <div className="m-label">{lang==="hi"?"भेदभाव प्रकार":"BIAS TYPE"}</div>
          </div>
        </div>
      </div>

      <div className="report-body">
        <div className="tabs">
          {tabs.map(tb => (
            <button key={tb.id} className={`tab-btn ${tab === tb.id ? "active" : ""}`} onClick={() => setTab(tb.id)}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* ANALYSIS */}
        {tab === "analysis" && (
          <>
            <div className="gemini-box">
              <div className="gemini-label">{t.geminiLabel}</div>
              <p>{explanation}</p>
            </div>

            <div className="ind-card">
              <div className="ind-card-header">📋 {lang==="hi"?"आपकी स्थिति":"Your Situation"}</div>
              <div className="ind-card-body">
                <p style={{ fontSize: "0.87rem", color: "#3C5068", lineHeight: 1.7 }}>{results.situation}</p>
              </div>
            </div>

            {biasDetected && (
              <div style={{ background: "#FEF7F7", border: "1.5px solid rgba(217,48,37,0.2)", borderRadius: 14, padding: "1.2rem 1.5rem" }}>
                <p style={{ fontSize: "0.68rem", fontFamily: "Space Mono, monospace", color: "#D93025", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                  {lang==="hi"?"⚠ आपके अधिकार":"⚠ YOUR RIGHTS"}
                </p>
                <p style={{ fontSize: "0.87rem", color: "#3C5068", lineHeight: 1.65 }}>
                  {lang==="hi"
                    ? "भेदभाव के प्रमाण के आधार पर, आप शिकायत दर्ज करने के हकदार हो सकते हैं। नीचे 'शिकायत पत्र' टैब में एक तैयार पत्र देखें।"
                    : "Based on evidence of discrimination, you may be entitled to file a formal complaint. See the 'Complaint Letter' tab below for a ready-to-use letter."}
                </p>
              </div>
            )}

            {!biasDetected && (
              <div style={{ background: "#F0FBF4", border: "1.5px solid rgba(30,142,62,0.2)", borderRadius: 14, padding: "1.2rem 1.5rem" }}>
                <p style={{ fontSize: "0.87rem", color: "#1E5C2E", lineHeight: 1.65 }}>
                  {lang==="hi"
                    ? "✓ हमारे विश्लेषण के अनुसार, आपकी स्थिति में स्पष्ट भेदभाव के संकेत नहीं मिले। फिर भी आप सरकारी योजनाओं के लिए पात्र हो सकते हैं।"
                    : "✓ Based on our analysis, no clear signs of discrimination were found in your situation. You may still qualify for government schemes below."}
                </p>
              </div>
            )}
          </>
        )}

        {/* LEGAL RIGHTS */}
        {tab === "rights" && (
          <div className="ind-card">
            <div className="ind-card-header">⚖️ {t.legalRights}</div>
            <div className="ind-card-body">
              {t.legalRightsData.map((r, i) => (
                <div key={i} className="right-item">
                  <div className="right-num">{r.num}</div>
                  <p className="right-text">{r.text}</p>
                </div>
              ))}
              <div style={{ marginTop: "1rem", padding: "0.8rem", background: "#F0F8FF", borderRadius: 8, fontSize: "0.78rem", color: "#1A3A6B" }}>
                💡 {lang==="hi"
                  ? "NHRC (राष्ट्रीय मानवाधिकार आयोग) में शिकायत दर्ज करें: nhrc.nic.in | हेल्पलाइन: 14433"
                  : "File a complaint with NHRC (National Human Rights Commission): nhrc.nic.in | Helpline: 14433"}
              </div>
            </div>
          </div>
        )}

        {/* GOVT SCHEMES */}
        {tab === "schemes" && (
          <div className="ind-card">
            <div className="ind-card-header">🏛️ {t.govtSchemes}</div>
            <div className="ind-card-body">
              {t.schemesData.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="scheme-card" style={{ display: "flex" }}>
                  <div className="scheme-icon">{s.icon}</div>
                  <div>
                    <div className="scheme-name">{s.name}</div>
                    <div className="scheme-desc">{s.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* COMPLAINT LETTER */}
        {tab === "letter" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.8rem" }}>
              <button className="action-btn primary" onClick={copyLetter} style={{ background: "#1A73E8", color: "#fff", border: "none", padding: "0.55rem 1.1rem", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {copied ? "✓ Copied!" : `📋 ${t.copyLetter}`}
              </button>
            </div>
            <div className="complaint-box">{complaintLetter || (lang==="hi"?"पत्र उपलब्ध नहीं।":"Letter not available.")}</div>
            <div style={{ padding: "0.8rem 1rem", background: "#FFF8E1", borderRadius: 8, fontSize: "0.75rem", color: "#BF360C", border: "1px solid #FFE082" }}>
              ⚠ {lang==="hi"
                ? "यह पत्र एक मसौदा है। जमा करने से पहले कानूनी सलाहकार से सत्यापित करें।"
                : "This letter is a draft. Verify with a legal advisor before submitting."}
            </div>
          </>
        )}

        <button onClick={onRestart} style={{ marginTop: "2rem", padding: "0.7rem 1.5rem", background: "transparent", border: "1.5px solid #D6E0EC", borderRadius: 8, color: "#6B7F96", fontSize: "0.83rem", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
          ← {lang==="hi"?"वापस जाएं":"Go Back"}
        </button>
      </div>
    </div>
  );
}
