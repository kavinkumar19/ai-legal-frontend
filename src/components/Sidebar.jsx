import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function Sidebar({ collapsed, recentSearches = [], onClearRecent, onNewChat, onRecentClick, onExportPDF, onExportWord, userName }) {
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  const categories = [
    { icon: "👩", key: "womenSafety" },
    { icon: "🛒", key: "consumerRights" },
    { icon: "💻", key: "cyberCrime" },
    { icon: "👷", key: "labourLaw" },
    { icon: "🏠", key: "propertyLaw" },
    { icon: "📋", key: "firProcedure" },
  ];

  const filteredRecent = recentSearches.filter(e =>
    e.question?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-top">
        <div className="sidebar-logo">⚖️ <span>NIRAL</span></div>
      </div>

      {/* New Chat */}
      <button className="new-chat-btn" onClick={onNewChat}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        {t("newChat")}
        <svg style={{ marginLeft: "auto" }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Export Buttons */}
      {!collapsed && (
        <div className="sidebar-export-actions" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button className="export-btn pdf" onClick={onExportPDF} title="Save as PDF" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s, color 0.2s' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PDF
          </button>
          <button className="export-btn word" onClick={onExportWord} title="Save as Word" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s, color 0.2s' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13h-4M16 17h-4M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Word
          </button>
        </div>
      )}

      {/* Search */}
      <div className="sidebar-search">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          placeholder={t("search")}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <hr className="sidebar-divider" />

      {/* Legal Topics */}
      <div className="sidebar-section-label">{t("legalTopics")}</div>
      <div className="sidebar-categories">
        {categories.map(cat => (
          <div key={cat.key} className="category-item">
            <span>{cat.icon}</span>
            {t(cat.key)}
          </div>
        ))}
      </div>

      <hr className="sidebar-divider" />

      {/* Recent Searches */}
      <div className="sidebar-section-label recent-label">
        <span>{t("recentSearches")}</span>
        {recentSearches.length > 0 && (
          <button className="clear-recent-btn" onClick={onClearRecent} title="Clear all">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      <div className="recent-searches-list">
        {filteredRecent.length === 0 ? (
          <p className="no-recent">{t("noRecent")}</p>
        ) : (
          filteredRecent.map((entry, i) => (
            <div key={i} className="recent-item" onClick={() => onRecentClick?.(entry)} title={entry.question}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v5l3 3" strokeLinecap="round"/>
              </svg>
              <span className="recent-text">{entry.question}</span>
            </div>
          ))
        )}
      </div>

      {/* User */}
      <div className="sidebar-bottom">
        <button className="user-avatar-btn">
          <div className="avatar-circle">{userName ? userName[0].toUpperCase() : "U"}</div>
          <span>{userName || t("user")}</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
