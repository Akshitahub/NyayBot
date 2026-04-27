import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Nav from "./Nav";
import { translations } from "../translations";

export default function IndFlow({ lang, setLang, onBack, onComplete }) {
  const t = translations[lang];
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyse() {
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBOmS79ssOi6Tnwd5NvAP9dIbcaIir9tNk");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      const prompt = `You are an AI bias and discrimination expert specializing in Indian law and context. Analyze the following rejection or situation described by a person.

Situation: "${text}"

Respond ONLY with a JSON object in this exact format:
{
  "biasDetected": true or false,
  "biasType": "list the types e.g. gender, caste, religion, age, race or NONE",
  "severity": "HIGH, MEDIUM, LOW, or NONE",
  "explanation": "2-3 sentence plain language explanation of what bias was found and why. Language: ${lang === "hi" ? "Hindi" : "English"}",
  "complaintLetter": "A formal complaint letter in ${lang === "hi" ? "Hindi" : "English"} that the person can submit to the company, NHRC, or relevant authority. Include: To, Subject, Body with specific references to Indian constitutional rights and laws, From: [Your Name]",
  "fairScore": "A 0-100 merit score for this person based on what they described, judging only on merit not demographics"
}`;

      const r = await model.generateContent(prompt);
      let text2 = r.response.text().trim().replace(/```json|```/g, "").trim();
      const results = JSON.parse(text2);
      results.situation = text;
      onComplete(results);
    } catch (e) {
      setError(lang === "hi" ? "विश्लेषण विफल। कृपया पुनः प्रयास करें।" : "Analysis failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flow">
      <Nav lang={lang} setLang={setLang} onBack={onBack} />
      <div className="flow-body">
        <h2 className="flow-title">{lang === "hi" ? "अपना मामला बताएं" : "Describe Your Case"}</h2>
        <p className="flow-sub">
          {lang === "hi"
            ? "अपनी अस्वीकृति, स्थिति, या अनुभव बताएं। हम विश्लेषण करेंगे कि क्या भेदभाव हुआ।"
            : "Describe your rejection, situation, or experience. We'll analyse whether discrimination occurred."}
        </p>

        <textarea
          className="text-input"
          placeholder={t.pasteHint}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          disabled={loading}
        />

        {error && <p style={{ color: "#D93025", fontSize: "0.82rem", marginBottom: "1rem" }}>{error}</p>}

        <button className="primary-btn green" onClick={handleAnalyse} disabled={!text.trim() || loading}>
          {loading ? <><span className="spinner" />{t.analysing}</> : t.analyseCase}
        </button>

        <div style={{ marginTop: "2rem", padding: "1rem 1.2rem", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #D6E0EC" }}>
          <p style={{ fontSize: "0.75rem", fontFamily: "Space Mono, monospace", color: "#6B7F96", marginBottom: "0.6rem", fontWeight: 700 }}>
            {lang === "hi" ? "उदाहरण स्थितियां:" : "EXAMPLE SITUATIONS:"}
          </p>
          {[
            lang === "hi" ? "मेरा लोन आवेदन अस्वीकार कर दिया गया, मेरे पड़ोसी का नहीं जिनका क्रेडिट स्कोर कम है" : "My loan was rejected but my neighbour with a lower credit score was approved",
            lang === "hi" ? "मुझे नौकरी के लिए अस्वीकार किया गया, मेरी योग्यता बेहतर थी" : "I was rejected for a job despite being more qualified than selected candidates",
            lang === "hi" ? "मेरी दुकान को GeM पोर्टल पर सूचीबद्ध नहीं किया गया" : "My shop was not listed on GeM portal without a clear reason",
          ].map((ex, i) => (
            <p key={i} onClick={() => setText(ex)} style={{ fontSize: "0.8rem", color: "#3C5068", padding: "0.4rem 0", cursor: "pointer", borderBottom: i < 2 ? "1px solid #EEF2F7" : "none", lineHeight: 1.5 }}>
              → {ex}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}