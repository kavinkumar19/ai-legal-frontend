import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LANGUAGES, useLanguage } from "../context/LanguageContext";

function Navbar() {
  const { selectedLang, setSelectedLang, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLabel = LANGUAGES.find(l => l.value === selectedLang)?.label || "Language";

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/home">
          ⚖️ Legal AI Assistant
        </Link>
        <button className="navbar-toggler" type="button" onClick={() => setDropdownOpen(false)}>
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/login">{t("login")}</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
