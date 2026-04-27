import { useState } from "react";
import { jsPDF } from "jspdf";
import Nav from "./Nav";
import { translations } from "../translations";

function ScoreRing({ score }) {
  const r = 40, circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#1E8E3E" : score >= 50 ? "#F9AB00" : "#D93025";
  return (
    <div className="score-ring">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF2F7" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="ring-inner">
        <span className="ring-num" style={{ color }}>{score}</span>
        <span className="ring-sub">/100</span>
      </div>
    </div>
  );
}

export default function OrgReport({ lang, setLang, results, fileName, onRestart }) {
  const t = translations[lang];
  const [tab, setTab] = useState("overview");
  const { fairnessScore = 0, biasCount = 0, rowCount = 0, disparities = [], sensitiveColumns = [], decisionColumn, geminiInsight, fixes = [] } = results;
  const verdictColor = fairnessScore >= 75 ? "#1E8E3E" : fairnessScore >= 50 ? "#F9AB00" : "#D93025";
  const verdictText = lang === "hi"
    ? (fairnessScore >= 75 ? "अधिकतर निष्पक्ष" : fairnessScore >= 50 ? "मध्यम पूर्वाग्रह" : "उच्च पूर्वाग्रह जोखिम")
    : (fairnessScore >= 75 ? "Mostly Fair" : fairnessScore >= 50 ? "Moderate Bias" : "High Bias Risk");

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("NyayBot — Bias Intelligence Report", 20, 20);
    doc.setFontSize(11);
    doc.text(`Dataset: ${fileName}`, 20, 32);
    doc.text(`Rows: ${rowCount} | Decision: ${decisionColumn || "N/A"} | Fairness Score: ${fairnessScore}/100`, 20, 39);
    doc.text(`Bias Flags: ${biasCount} of ${disparities.length} attributes`, 20, 46);
    doc.setFontSize(13); doc.text("Gemini Analysis:", 20, 58);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(geminiInsight || "N/A", 170);
    doc.text(lines, 20, 66);
    let y = 66 + lines.length * 6 + 10;
    doc.setFontSize(13); doc.text("Disparities:", 20, y); y += 8;
    disparities.forEach(d => {
      doc.setFontSize(11); doc.text(`${d.column} — ${d.biasDetected ? "BIAS" : "FAIR"} (ratio: ${d.disparityRatio === 999 ? "∞" : d.disparityRatio.toFixed(2)})`, 20, y); y += 6;
      d.groups.forEach(g => { doc.setFontSize(10); doc.text(`  ${g.group}: ${(g.rate*100).toFixed(1)}% (${g.positive}/${g.total})`, 20, y); y += 5; });
      y += 3; if (y > 270) { doc.addPage(); y = 20; }
    });
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13); doc.text("Fix Recommendations:", 20, y); y += 8;
    fixes.forEach(f => {
      const fl = doc.splitTextToSize(`[${f.level.toUpperCase()}] ${f.column}: ${f.fix}`, 170);
      doc.setFontSize(10); doc.text(fl, 20, y); y += fl.length * 6 + 4;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`NyayBot_BIR_${fileName.replace(".csv", "")}.pdf`);
  }

  const tabs = [
    { id: "overview", label: t.overview },
    { id: "disparities", label: `${t.disparities} (${biasCount})` },
    { id: "fixes", label: `${t.fixes} (${fixes.length})` },
    { id: "rawData", label: t.rawData },
  ];

  return (
    <div className="report">
      <Nav lang={lang} setLang={setLang} rightContent={
        <div className="report-actions">
          <button className="action-btn primary" onClick={downloadPDF}>⬇ {t.downloadBIR}</button>
          <button className="action-btn secondary" onClick={onRestart}>{t.newAudit}</button>
        </div>
      } />

      <div className="report-header">
        <div className="report-header-top">
          <div>
            <div className="report-title">{t.birTitle}</div>
            <div className="report-meta">📄 {fileName} · {rowCount.toLocaleString()} {lang === "hi" ? "पंक्तियां" : "rows"} · {lang === "hi" ? "निर्णय" : "decision"}: {decisionColumn || "N/A"}</div>
          </div>
        </div>
        <div className="metric-strip">
          {[
            { num: fairnessScore, label: t.fairnessScore, color: verdictColor },
            { num: biasCount, label: t.biasFlags, color: "#D93025" },
            { num: rowCount.toLocaleString(), label: t.rowsAudited, color: "#1A73E8" },
            { num: disparities.length, label: t.attributesChecked, color: "#F9AB00" },
          ].map((m, i) => (
            <div className="metric-block" key={i}>
              <div className="m-num" style={{ color: m.color }}>{m.num}</div>
              <div className="m-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="report-body">
        <div className="tabs">
          {tabs.map(tab2 => (
            <button key={tab2.id} className={`tab-btn ${tab === tab2.id ? "active" : ""}`} onClick={() => setTab(tab2.id)}>
              {tab2.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div style={{ background: "#F8FAFC", border: "1.5px solid #D6E0EC", borderRadius: 14, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.68rem", fontFamily: "Space Mono, monospace", color: "#6B7F96", marginBottom: "1rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                {lang === "hi" ? "निष्पक्षता मूल्यांकन" : "FAIRNESS ASSESSMENT"}
              </p>
              <div className="score-ring-wrap">
                <ScoreRing score={fairnessScore} />
                <div className="verdict-list">
                  <div className="verdict-row"><div className="v-dot" style={{ background: verdictColor }} /><span style={{ fontWeight: 600, color: verdictColor }}>{verdictText}</span></div>
                  <div className="verdict-row"><div className="v-dot" style={{ background: "#1A73E8" }} /><span>{disparities.length} {lang === "hi" ? "विशेषताएं विश्लेषण की गईं" : "attributes analyzed"}</span></div>
                  <div className="verdict-row"><div className="v-dot" style={{ background: "#D93025" }} /><span>{biasCount} {lang === "hi" ? "पूर्वाग्रह चिह्न" : "bias flags raised"}</span></div>
                  <div className="verdict-row"><div className="v-dot" style={{ background: "#1E8E3E" }} /><span>{fixes.length} {lang === "hi" ? "सुधार अनुशंसाएं" : "fixes recommended"}</span></div>
                </div>
              </div>
            </div>

            <div className="gemini-box">
              <div className="gemini-label">{t.geminiLabel}</div>
              <p>{geminiInsight || (lang === "hi" ? "Gemini विश्लेषण अनुपलब्ध।" : "Gemini analysis unavailable.")}</p>
            </div>

            {disparities.filter(d => d.biasDetected).length > 0 && (
              <>
                <div className="section-title">⚠ {lang === "hi" ? "पूर्वाग्रह पाया गया" : "Bias Detected"}</div>
                {disparities.filter(d => d.biasDetected).map(d => {
                  const maxRate = Math.max(...d.groups.map(g => g.rate));
                  return (
                    <div key={d.column} className="bias-card flagged">
                      <div className="bias-card-header">
                        <span className="bias-col-name">{d.column}</span>
                        <span className="status-pill red">⚠ {t.biasDetected}</span>
                      </div>
                      <div className="bias-card-body">
                        <div className="disparity-stats">
                          <div className="d-stat"><span className="d-label">{t.disparityRatio}</span><span className="d-val red">{d.disparityRatio === 999 ? "∞" : d.disparityRatio.toFixed(2)}×</span></div>
                          <div className="d-stat"><span className="d-label">{t.maxGap}</span><span className="d-val yellow">{(d.maxDisparity*100).toFixed(1)}%</span></div>
                          <div className="d-stat"><span className="d-label">{t.groups}</span><span className="d-val blue">{d.groups.length}</span></div>
                        </div>
                        {d.groups.map(g => (
                          <div key={g.group} className="group-bar">
                            <div className="g-label" title={g.group}>{g.group}</div>
                            <div className="g-track"><div className="g-fill" style={{ width: `${maxRate > 0 ? (g.rate/maxRate)*100 : 0}%`, background: g.rate === Math.min(...d.groups.map(x=>x.rate)) && d.biasDetected ? "#D93025" : "#1A73E8" }} /></div>
                            <div className="g-val">{(g.rate*100).toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {disparities.filter(d => !d.biasDetected && d.groups.length > 0).length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: "1.5rem" }}>✓ {lang === "hi" ? "निष्पक्ष विशेषताएं" : "Fair Attributes"}</div>
                {disparities.filter(d => !d.biasDetected && d.groups.length > 0).map(d => (
                  <div key={d.column} className="bias-card clean">
                    <div className="bias-card-header">
                      <span className="bias-col-name">{d.column}</span>
                      <span className="status-pill green">✓ {t.fair}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* DISPARITIES */}
        {tab === "disparities" && (
          <>
            {disparities.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#6B7F96" }}>{lang === "hi" ? "कोई संवेदनशील कॉलम नहीं मिला।" : "No sensitive columns detected."}</div>}
            {disparities.map(d => {
              const maxRate = Math.max(...d.groups.map(g => g.rate));
              return (
                <div key={d.column} className={`bias-card ${d.biasDetected ? "flagged" : "clean"}`}>
                  <div className="bias-card-header">
                    <span className="bias-col-name">{d.column}</span>
                    <span className={`status-pill ${d.biasDetected ? "red" : "green"}`}>{d.biasDetected ? `⚠ ${t.biasDetected}` : `✓ ${t.fair}`}</span>
                  </div>
                  <div className="bias-card-body">
                    <div className="disparity-stats">
                      <div className="d-stat"><span className="d-label">{t.disparityRatio}</span><span className={`d-val ${d.disparityRatio > 1.5 ? "red" : d.disparityRatio > 1.25 ? "yellow" : "green"}`}>{d.disparityRatio === 999 ? "∞" : d.disparityRatio.toFixed(2)}×</span></div>
                      <div className="d-stat"><span className="d-label">{t.maxGap}</span><span className={`d-val ${d.maxDisparity > 0.2 ? "red" : d.maxDisparity > 0.1 ? "yellow" : "green"}`}>{(d.maxDisparity*100).toFixed(1)}%</span></div>
                      <div className="d-stat"><span className="d-label">{t.groups}</span><span className="d-val blue">{d.groups.length}</span></div>
                    </div>
                    {d.groups.map(g => (
                      <div key={g.group} className="group-bar">
                        <div className="g-label" title={g.group}>{g.group}</div>
                        <div className="g-track"><div className="g-fill" style={{ width: `${maxRate > 0 ? (g.rate/maxRate)*100 : 0}%`, background: d.biasDetected && g.rate === Math.min(...d.groups.map(x=>x.rate)) ? "#D93025" : "#1A73E8" }} /></div>
                        <div className="g-val">{(g.rate*100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* FIXES */}
        {tab === "fixes" && (
          <>
            {fixes.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#6B7F96" }}>{lang === "hi" ? "कोई सुधार आवश्यक नहीं।" : "No fixes required."}</div>}
            {["immediate","process","model"].map(level => {
              const lf = fixes.filter(f => f.level === level);
              if (!lf.length) return null;
              const labels = { immediate: t.immediateFixLabel, process: t.processFixLabel, model: t.modelFixLabel };
              return (
                <div key={level} className="fix-section">
                  <div className="fix-section-label" style={{ color: level === "immediate" ? "#B71C1C" : level === "process" ? "#BF360C" : "#0D47A1" }}>
                    {labels[level]}
                  </div>
                  {lf.map((f, i) => (
                    <div key={i} className="fix-card">
                      <div className={`fix-tag ${level}`}>{level.toUpperCase()}</div>
                      <div className="fix-col">→ {f.column}</div>
                      <p className="fix-text">{f.fix}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* RAW DATA */}
        {tab === "rawData" && (
          <table className="data-table">
            <thead><tr>
              {[lang==="hi"?"कॉलम":"Column", lang==="hi"?"समूह":"Groups", lang==="hi"?"अनुपात":"Ratio", lang==="hi"?"अंतर":"Gap", lang==="hi"?"स्थिति":"Status"].map(h => <th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {disparities.map(d => (
                <tr key={d.column}>
                  <td>{d.column}</td>
                  <td>{d.groups.length}</td>
                  <td style={{ color: d.disparityRatio > 1.5 ? "#D93025" : "#3C5068" }}>{d.disparityRatio === 999 ? "∞" : d.disparityRatio.toFixed(2)}×</td>
                  <td style={{ color: d.maxDisparity > 0.1 ? "#F9AB00" : "#1E8E3E" }}>{(d.maxDisparity*100).toFixed(1)}%</td>
                  <td><span className={`status-pill ${d.biasDetected ? "red" : "green"}`}>{d.biasDetected ? (lang==="hi"?"पूर्वाग्रह":"BIAS") : (lang==="hi"?"निष्पक्ष":"FAIR")}</span></td>
                </tr>
              ))}
              {disparities.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#6B7F96", padding: "1rem" }}>{lang==="hi"?"कोई डेटा नहीं":"No data"}</td></tr>}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: "2rem", padding: "1rem", background: "#FFF8E1", borderRadius: 10, border: "1px solid #FFE082", fontSize: "0.78rem", color: "#BF360C" }}>
          ⚠ {lang === "hi" ? "यह रिपोर्ट सूचनात्मक उद्देश्यों के लिए है। अनुपालन निर्णयों के लिए DEI विशेषज्ञ या कानूनी सलाहकार से परामर्श करें।" : "This report is for informational purposes. Consult a DEI expert or legal advisor for compliance decisions."}
        </div>
      </div>
    </div>
  );
}
