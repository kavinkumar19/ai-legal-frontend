import React, { createContext, useContext, useState } from "react";
import translations from "../i18n/translations";

export const LANGUAGES = [
    { label: "🇬🇧 English",   value: "en-IN" },
    { label: "🇮🇳 Tamil",     value: "ta-IN" },
    { label: "🇮🇳 Hindi",     value: "hi-IN" },
    { label: "🇮🇳 Malayalam", value: "ml-IN" },
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [selectedLang, setSelectedLang] = useState(() => {
        return localStorage.getItem("niral_lang") || "en-IN";
    });

    const handleSetLang = (lang) => {
        setSelectedLang(lang);
        localStorage.setItem("niral_lang", lang);
    };

    /** t(key) returns the translated string for the current language */
    const t = (key) =>
        translations[selectedLang]?.[key] ?? translations["en-IN"][key] ?? key;

    return (
        <LanguageContext.Provider value={{ selectedLang, setSelectedLang: handleSetLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
