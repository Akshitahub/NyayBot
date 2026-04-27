import { useState, createContext, useContext } from "react";
import Home from "./components/Home";
import OrgFlow from "./components/OrgFlow";
import IndFlow from "./components/IndFlow";
import OrgReport from "./components/OrgReport";
import IndReport from "./components/IndReport";
import { translations } from "./translations";
import "./App.css";

export const LangContext = createContext();
export const useLang = () => useContext(LangContext);

export default function App() {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("home");
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [orgResults, setOrgResults] = useState(null);
  const [indResults, setIndResults] = useState(null);
  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, t }}>
      <div className="app">
        {screen === "home" && (
          <Home
            lang={lang}
            setLang={setLang}
            onOrg={() => setScreen("org")}
            onInd={() => setScreen("ind")}
          />
        )}
        {screen === "org" && (
          <OrgFlow
            lang={lang}
            setLang={setLang}
            onBack={() => setScreen("home")}
            onComplete={(data, name, results) => {
              setCsvData(data); setFileName(name); setOrgResults(results);
              setScreen("org-report");
            }}
          />
        )}
        {screen === "org-report" && (
          <OrgReport
            lang={lang}
            setLang={setLang}
            results={orgResults}
            fileName={fileName}
            onRestart={() => setScreen("home")}
          />
        )}
        {screen === "ind" && (
          <IndFlow
            lang={lang}
            setLang={setLang}
            onBack={() => setScreen("home")}
            onComplete={(results) => { setIndResults(results); setScreen("ind-report"); }}
          />
        )}
        {screen === "ind-report" && (
          <IndReport
            lang={lang}
            setLang={setLang}
            results={indResults}
            onRestart={() => setScreen("home")}
          />
        )}
      </div>
    </LangContext.Provider>
  );
}
