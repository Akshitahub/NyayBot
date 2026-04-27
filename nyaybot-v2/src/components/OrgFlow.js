import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Nav from "./Nav";
import { translations } from "../translations";

const SENSITIVE = ["gender","sex","race","ethnicity","age","religion","name","nationality","origin","disability","marital","pregnant","color","caste","tribe","language","pincode","zipcode","zip","pin","area","locality"];
const DECISION = ["hired","approved","accepted","decision","outcome","result","status","label","target","passed","selected","rejected","denied","admitted","granted","loan","credit","approve","hire","pass"];

function detectColumns(headers) {
  const lower = headers.map(h => h.toLowerCase().replace(/[_\s-]/g, ""));
  const sensitive = headers.filter((h, i) => SENSITIVE.some(k => lower[i].includes(k)));
  const decision = headers.find((h, i) => DECISION.some(k => lower[i].includes(k)));
  return { sensitive, decision };
}

function computeDisparities(data, col, decisionCol) {
  const groups = {};
  data.forEach(row => {
    const group = String(row[col] || "unknown").toLowerCase().trim();
    const raw = String(row[decisionCol] || "").toLowerCase().trim();
    const positive = ["1","yes","hired","approved","accepted","true","pass","selected","granted","admitted","approve","y"].includes(raw);
    if (!groups[group]) groups[group] = { total: 0, positive: 0 };
    groups[group].total++;
    if (positive) groups[group].positive++;
  });
  const result = Object.entries(groups)
    .map(([name, { total, positive }]) => ({ group: name, total, positive, rate: total > 0 ? positive / total : 0 }))
    .sort((a, b) => b.rate - a.rate);
  if (result.length < 2) return { groups: result, maxDisparity: 0, disparityRatio: 1, biasDetected: false };
  const rates = result.map(r => r.rate);
  const maxR = Math.max(...rates), minR = Math.min(...rates);
  const disparityRatio = minR > 0 ? maxR / minR : maxR > 0 ? 999 : 1;
  const biasDetected = disparityRatio > 1.25 || (maxR - minR) > 0.1;
  return { groups: result, maxDisparity: maxR - minR, disparityRatio, biasDetected };
}

const STEPS = [
  { id: "parse", icon: "📋", en: "Parsing Dataset", hi: "डेटासेट पार्स हो रहा है", desc_en: "Reading structure, headers and rows", desc_hi: "संरचना, हेडर और पंक्तियां पढ़ी जा रही हैं" },
  { id: "detect", icon: "🔎", en: "Detecting Sensitive Columns", hi: "संवेदनशील कॉलम पहचाने जा रहे हैं", desc_en: "Finding gender, caste, age, race, religion, pincode attributes", desc_hi: "लिंग, जाति, उम्र, नस्ल, धर्म, पिनकोड विशेषताएं खोजी जा रही हैं" },
  { id: "stats", icon: "📊", en: "Computing Disparity Statistics", hi: "असमानता आंकड़े गणना हो रहे हैं", desc_en: "Calculating real approval rate gaps per demographic group", desc_hi: "प्रत्येक जनसांख्यिकीय समूह के लिए वास्तविक अनुमोदन दर अंतराल" },
  { id: "gemini", icon: "✦", en: "Gemini AI Interpretation", hi: "Gemini AI व्याख्या", desc_en: "AI analyses computed statistics and identifies patterns", desc_hi: "AI गणना की गई सांख्यिकी का विश्लेषण और पैटर्न की पहचान करता है" },
  { id: "fix", icon: "🛠", en: "Generating Fix Recommendations", hi: "सुधार सिफारिशें तैयार हो रही हैं", desc_en: "3-level actionable bias remediation plan", desc_hi: "3-स्तरीय कार्रवाई योग्य पूर्वाग्रह उपचार योजना" },
];

export default function OrgFlow({ lang, setLang, onBack, onComplete }) {
  const t = translations[lang];
  const [stage, setStage] = useState("upload");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [stepStatus, setStepStatus] = useState({});
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();
  const ran = useRef(false);
  const [csvData, setCsvData] = useState(null);
  const [fname, setFname] = useState("");

  function handleFile(f) {
    setError("");
    if (!f) return;
    if (!f.name.endsWith(".csv")) { setError(lang === "hi" ? "कृपया CSV फ़ाइल अपलोड करें।" : "Please upload a CSV file."); return; }
    setFile(f);
  }

  function handleStart() {
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        if (!r.data || r.data.length < 2) { setError(lang === "hi" ? "CSV में कम से कम 2 पंक्तियां होनी चाहिए।" : "CSV must have at least 2 rows."); return; }
        setCsvData(r.data); setFname(file.name); setStage("audit");
      },
      error: () => setError(lang === "hi" ? "फ़ाइल पार्स करने में विफल।" : "Failed to parse file."),
    });
  }

  useEffect(() => {
    if (stage !== "audit" || ran.current || !csvData) return;
    ran.current = true;
    runAudit(csvData, fname);
  }, [stage, csvData]);

  function setStep(id, status) { setStepStatus(prev => ({ ...prev, [id]: status })); }
  const delay = ms => new Promise(r => setTimeout(r, ms));

  async function runAudit(data, name) {
    const results = {};
    setStep("parse", "running"); await delay(400);
    const headers = Object.keys(data[0]);
    results.rowCount = data.length; results.headers = headers;
    setStep("parse", "done"); setProgress(20);

    setStep("detect", "running"); await delay(300);
    const { sensitive, decision } = detectColumns(headers);
    results.sensitiveColumns = sensitive; results.decisionColumn = decision;
    setStep("detect", "done"); setProgress(40);

    setStep("stats", "running"); await delay(300);
    const disparities = sensitive.map(col => {
      if (!decision) return { column: col, groups: [], maxDisparity: 0, disparityRatio: 1, biasDetected: false };
      return { column: col, ...computeDisparities(data, col, decision) };
    });
    results.disparities = disparities;
    results.biasCount = disparities.filter(d => d.biasDetected).length;
    const fs = disparities.length === 0 ? 100 :
      Math.round(Math.max(0, 100 - (results.biasCount / disparities.length) * 100 *
        (disparities.reduce((s, d) => s + Math.min(d.disparityRatio === 999 ? 3 : d.disparityRatio, 3), 0) / disparities.length) / 3));
    results.fairnessScore = Math.min(100, Math.max(0, fs));
    setStep("stats", "done"); setProgress(60);

    setStep("gemini", "running");
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBOmS79ssOi6Tnwd5NvAP9dIbcaIir9tNk");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const statsText = disparities.map(d =>
        `Column: ${d.column} | Bias: ${d.biasDetected ? "YES" : "NO"} | Ratio: ${d.disparityRatio === 999 ? "∞" : d.disparityRatio.toFixed(2)}\n` +
        d.groups.map(g => `  ${g.group}: ${(g.rate*100).toFixed(1)}% (${g.positive}/${g.total})`).join("\n")
      ).join("\n\n");
      const r = await model.generateContent(
        `You are a senior AI fairness auditor. Analyze this bias audit and give a 3-4 sentence expert interpretation. Be specific, cite numbers, mention which groups are most affected. Language: ${lang === "hi" ? "Hindi" : "English"}.\n\nDataset: ${name}, Rows: ${data.length}, Decision col: ${decision || "not found"}\n\n${statsText || "No sensitive columns found."}\n\nProvide ONLY the interpretation paragraph.`
      );
      results.geminiInsight = r.response.text().trim();
    } catch { results.geminiInsight = lang === "hi" ? "Gemini विश्लेषण अनुपलब्ध। API कुंजी जांचें।" : "Gemini analysis unavailable. Check your API key."; }
    setStep("gemini", "done"); setProgress(80);

    setStep("fix", "running");
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBOmS79ssOi6Tnwd5NvAP9dIbcaIir9tNk");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const biased = disparities.filter(d => d.biasDetected).map(d => d.column);
      const fixR = await model.generateContent(
        `You are a DEI and AI fairness expert. Bias detected in columns: ${biased.join(", ") || "none"}. Decision column: "${decision}". Generate exactly 6 fixes: 2 immediate, 2 process, 2 model retraining. Language: ${lang === "hi" ? "Hindi" : "English"}.\n\nReturn ONLY a JSON array:\n[{"level":"immediate","column":"col","fix":"One sentence."},...]`
      );
      let ft = fixR.response.text().trim().replace(/\`\`\`json|\`\`\`/g, "").trim();
      results.fixes = JSON.parse(ft);
    } catch {
      const biased = disparities.filter(d => d.biasDetected);
      results.fixes = biased.flatMap(d => [
        { level: "immediate", column: d.column, fix: lang === "hi" ? `'${d.column}' कॉलम को प्रशिक्षण डेटा से हटाएं या अनामित करें।` : `Remove or anonymize the '${d.column}' column from training data.` },
        { level: "process", column: d.column, fix: lang === "hi" ? `'${d.column}' विशेषताओं को छुपाने वाली अंध मूल्यांकन प्रक्रियाएं लागू करें।` : `Implement blind evaluation hiding '${d.column}' attributes.` },
        { level: "model", column: d.column, fix: lang === "hi" ? `'${d.column}' समूहों के लिए प्रशिक्षण नमूनों को पुनः भारित करें।` : `Re-weight training samples to equalize rates across '${d.column}' groups.` },
      ]);
    }
    setStep("fix", "done"); setProgress(100);
    await delay(600);
    onComplete(data, name, results);
  }

  const getStatus = id => stepStatus[id] || "waiting";

  if (stage === "upload") return (
    <div className="flow">
      <Nav lang={lang} setLang={setLang} onBack={onBack} />
      <div className="flow-body">
        <h2 className="flow-title">{lang === "hi" ? "डेटासेट ऑडिट" : "Dataset Audit"}</h2>
        <p className="flow-sub">{lang === "hi" ? "अपना CSV डेटासेट अपलोड करें। हम स्वचालित रूप से संवेदनशील कॉलम और निर्णय कॉलम ढूंढेंगे।" : "Upload your CSV dataset. We'll automatically find sensitive columns and the decision column."}</p>

        <div
          className={`upload-zone ${drag ? "drag" : ""} ${file ? "ready" : ""}`}
          onClick={() => inputRef.current.click()}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
        >
          <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          <div className="upload-icon">{file ? "✅" : "📂"}</div>
          <div className="upload-title">{file ? (lang === "hi" ? "फ़ाइल तैयार है" : "File ready") : t.uploadTitle}</div>
          <div className="upload-hint">{t.uploadHint}</div>
          {file && <div className="upload-fname">{file.name}</div>}
        </div>

        {error && <p style={{ color: "#D93025", fontSize: "0.82rem", marginBottom: "1rem" }}>{error}</p>}

        <button className="primary-btn blue" onClick={handleStart} disabled={!file}>{t.runAudit}</button>

        <div style={{ marginTop: "2rem", padding: "1rem 1.2rem", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #D6E0EC" }}>
          <p style={{ fontSize: "0.75rem", fontFamily: "Space Mono, monospace", color: "#6B7F96", marginBottom: "0.5rem", fontWeight: 700 }}>
            {lang === "hi" ? "क्या पहचाना जाता है:" : "WHAT WE DETECT:"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {["Gender / Sex","Age","Race / Ethnicity","Caste","Religion","Name","Pincode / Zipcode","Nationality","Marital Status","Disability"].map(tag => (
              <span key={tag} style={{ fontSize: "0.68rem", padding: "0.2rem 0.6rem", background: "#EEF2F7", borderRadius: "100px", color: "#3C5068", fontFamily: "Space Mono, monospace" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flow">
      <Nav lang={lang} setLang={setLang} />
      <div className="flow-body">
        <h2 className="flow-title">{lang === "hi" ? "ऑडिट चल रहा है..." : "Running Audit..."}</h2>
        <p className="flow-sub" style={{ fontFamily: "Space Mono, monospace", fontSize: "0.75rem" }}>📄 {fname} · {csvData?.length?.toLocaleString()} {lang === "hi" ? "पंक्तियां" : "rows"}</p>

        <div className="pipeline">
          {STEPS.map(step => {
            const status = getStatus(step.id);
            return (
              <div key={step.id} className={`p-step ${status}`}>
                <div className="p-icon">{step.icon}</div>
                <div className="p-info">
                  <div className="p-name">{lang === "hi" ? step.hi : step.en}</div>
                  <div className="p-desc">{lang === "hi" ? step.desc_hi : step.desc_en}</div>
                </div>
                <div className={`p-status ${status}`}>
                  {status === "waiting" && "—"}
                  {status === "running" && <><span className="spinner" />{lang === "hi" ? "चल रहा है" : "Running"}</>}
                  {status === "done" && (lang === "hi" ? "✓ पूर्ण" : "✓ Done")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p style={{ textAlign: "center", marginTop: "0.6rem", fontSize: "0.72rem", color: "#6B7F96", fontFamily: "Space Mono, monospace" }}>
          {progress < 100 ? `${progress}%` : lang === "hi" ? "रिपोर्ट तैयार हो रही है..." : "Finalizing report..."}
        </p>
      </div>
    </div>
  );
}