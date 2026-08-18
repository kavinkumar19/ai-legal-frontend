import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import { LANGUAGES, useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";
import { API_BASE_URL } from "../config";



function Chat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("niral_theme") !== "light");
  const [chatKey, setChatKey]                   = useState(0);
  const [recentSearches, setRecentSearches]     = useState([]);
  const [restoreEntry, setRestoreEntry]         = useState(null);

  const chatBoxRef = useRef(null);

  /* Language dropdown */
  const { selectedLang, setSelectedLang, t } = useLanguage();
  const [langOpen, setLangOpen]           = useState(false);
  const langRef                           = useRef(null);
  const currentLabel = LANGUAGES.find(l => l.value === selectedLang)?.label || "Language";

  const navigate = useNavigate();
  const profileRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(() => localStorage.getItem("user_name") || "");
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem("user_id") || "");

  const getUserStorageKey = (userId) => {
    const activeId = userId || currentUserId || localStorage.getItem("user_id") || "";
    return activeId ? `niral_recent_${activeId.replace(/[^a-zA-Z0-9_@.-]/g, "_")}` : null;
  };

  /* Remove legacy global search history if present */
  useEffect(() => {
    localStorage.removeItem("niral_recent");
  }, []);

  /* Fetch profile to sync user identity */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get(`${API_BASE_URL}/get-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data?.email) {
          localStorage.setItem("user_id", res.data.email);
          setCurrentUserId(res.data.email);
        }
        if (res.data?.name) {
          localStorage.setItem("user_name", res.data.name);
          setCurrentUserName(res.data.name);
        }
      }).catch(err => {
        console.error("Error fetching profile on mount", err);
      });
    }
  }, []);

  /* Fetch and load user-scoped search history from backend and local cache */
  useEffect(() => {
    const fetchUserHistory = async () => {
      const activeId = currentUserId || localStorage.getItem("user_id") || "";
      const storageKey = getUserStorageKey(activeId);

      if (storageKey) {
        try {
          const cached = JSON.parse(localStorage.getItem(storageKey) || "[]");
          setRecentSearches(cached);
        } catch {
          setRecentSearches([]);
        }
      } else {
        setRecentSearches([]);
      }

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data?.history) {
          const fetched = response.data.history.map(item => ({
            question: item.question,
            answer: item.answer
          }));
          setRecentSearches(fetched);
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(fetched));
          }
        }
      } catch (err) {
        console.error("Failed to fetch user chat history", err);
      }
    };

    fetchUserHistory();
  }, [currentUserId]);

  const { showToast } = useToast();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password state
  const [showChangePwd, setShowChangePwd]     = useState(false);
  const [currentPwd, setCurrentPwd]           = useState("");
  const [newPwd, setNewPwd]                   = useState("");
  const [confirmPwd, setConfirmPwd]           = useState("");
  const [pwdError, setPwdError]               = useState("");
  const [pwdSuccess, setPwdSuccess]           = useState("");
  const [pwdLoading, setPwdLoading]           = useState(false);

  const pwdsMatch     = newPwd === confirmPwd;

  /* Close language dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Close profile dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Apply & persist theme on every change */
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("niral_theme", theme);
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  /* New Chat */
  const handleNewChat = () => {
    setRestoreEntry(null);
    setChatKey(k => k + 1);
  };

  /* Recent item clicked */
  const handleRecentClick = (entry) => {
    setRestoreEntry({ ...entry, ts: Date.now() });
  };

  /* Save question + answer per user */
  const addRecentSearch = (question, answer) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(e => e.question !== question);
      const next = [{ question, answer }, ...filtered].slice(0, 20);
      const storageKey = getUserStorageKey();
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    const storageKey = getUserStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await axios.delete(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to clear backend chat history", err);
      }
    }
  };

  /* Exports */
  const handleExportPDF = () => {
    const msgs = chatBoxRef.current?.getMessages();
    if (!msgs || msgs.length === 0) {
      alert(t("noMessagesToExport") || "No messages to export.");
      return;
    }

    const doExport = () => {
      const container = document.createElement("div");
      container.style.fontFamily = "Arial, sans-serif";
      container.style.padding = "30px";
      container.style.color = "#333";
      container.style.backgroundColor = "#ffffff";

      let htmlContent = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #1e3c72; margin: 0; font-size: 24px;">NIRAL Legal AI Assistant</h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Chat Conversation Export</p>
          <div style="margin-top: 15px; border-bottom: 2px solid #1e3c72; opacity: 0.2;"></div>
        </div>
      `;

      msgs.forEach(msg => {
        const isUser = msg.sender === "user";
        const senderName = isUser ? "User" : "AI Assistant";
        const headerColor = isUser ? "#1e3c72" : "#2c3e50";
        const bgColor = isUser ? "#f4f7f6" : "#fdfdfd";
        const borderLeftColor = isUser ? "#1e3c72" : "#00b894";
        const messageText = msg.text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>");

        htmlContent += `
          <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background-color: ${bgColor}; border-left: 5px solid ${borderLeftColor};">
            <div style="font-weight: bold; color: ${headerColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
              ${senderName}
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #2d3748; word-wrap: break-word;">
              ${messageText}
            </div>
          </div>
        `;
      });

      htmlContent += `
        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Generated on ${new Date().toLocaleString()} | Powered by NIRAL Legal AI
        </div>
      `;

      container.innerHTML = htmlContent;

      const opt = {
        margin:       [15, 15, 15, 15],
        filename:     'Legal_Assistant_Export.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().from(container).set(opt).save();
    };

    if (!window.html2pdf) {
      // Dynamically load html2pdf script if it hasn't loaded yet
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => {
        if (window.html2pdf) {
          doExport();
        } else {
          alert("Could not load PDF library. Please try again.");
        }
      };
      script.onerror = () => {
        alert("Failed to load PDF library. Check your internet connection.");
      };
      document.body.appendChild(script);
    } else {
      doExport();
    }
  };

  const handleExportWord = () => {
    const msgs = chatBoxRef.current?.getMessages();
    if (!msgs || msgs.length === 0) {
      alert(t("noMessagesToExport") || "No messages to export.");
      return;
    }

    let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>";
    html += "<head><meta charset='utf-8'><title>Legal Assistant Chat Export</title></head>";
    html += "<body style='font-family: Arial, sans-serif; padding: 30px; color: #333; background-color: #ffffff;'>";
    
    html += `
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #1e3c72; margin: 0; font-size: 24px;">NIRAL Legal AI Assistant</h1>
        <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Chat Conversation Export</p>
        <div style="margin-top: 15px; border-bottom: 2px solid #1e3c72; opacity: 0.2;"></div>
      </div>
    `;

    msgs.forEach(msg => {
      const isUser = msg.sender === "user";
      const senderName = isUser ? "User" : "AI Assistant";
      const headerColor = isUser ? "#1e3c72" : "#2c3e50";
      const bgColor = isUser ? "#f4f7f6" : "#fdfdfd";
      const borderLeftColor = isUser ? "#1e3c72" : "#00b894";
      const messageText = msg.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");

      html += `
        <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background-color: ${bgColor}; border-left: 5px solid ${borderLeftColor};">
          <div style="font-weight: bold; color: ${headerColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            ${senderName}
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #2d3748; word-wrap: break-word;">
            ${messageText}
          </div>
        </div>
      `;
    });

    html += `
      <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        Generated on ${new Date().toLocaleString()} | Powered by NIRAL Legal AI
      </div>
    `;
    
    html += "</body></html>";
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Legal_Assistant_Export.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    const storageKey = getUserStorageKey();
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    localStorage.removeItem("niral_recent");
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    setRecentSearches([]);
    setCurrentUserId("");
    setCurrentUserName("");
    navigate("/login");
  };

  const handleOpenEditModal = async () => {
    setProfileOpen(false);
    setIsEditModalOpen(true);
    setProfileLoading(true);
    // Reset change-password fields whenever modal opens
    setShowChangePwd(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdError("");
    setPwdSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/get-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditName(response.data.name);
      setEditEmail(response.data.email);
      setEditPhone(response.data.phone);
    } catch (err) {
      console.error("Failed to load profile details", err);
      setEditName(localStorage.getItem("user_name") || "");
      setEditEmail(localStorage.getItem("user_id") || "");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!newPwd) {
      setPwdError("Please enter a new password.");
      return;
    }
    if (!pwdsMatch) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/change-password`,
        { current_password: currentPwd, new_password: newPwd, confirm_password: confirmPwd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwdSuccess("Password changed successfully!");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      showToast("Password changed successfully!", "success");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to change password.";
      setPwdError(msg);
      showToast(msg, "error");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = { name: editName, email: editEmail, phone: editPhone };
      const response = await axios.post(`${API_BASE_URL}/update-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem("user_name", response.data.name);
      localStorage.setItem("user_id", response.data.email);
      setCurrentUserName(response.data.name);
      setCurrentUserId(response.data.email);
      showToast("Profile updated successfully!", "success");
      setIsEditModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to update profile", "error");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        recentSearches={recentSearches}
        onClearRecent={clearRecent}
        onNewChat={handleNewChat}
        onRecentClick={handleRecentClick}
        onExportPDF={handleExportPDF}
        onExportWord={handleExportWord}
        userName={currentUserName}
      />

      <div className="main-content">
        {/* Top bar */}
        <div className="topbar">
          {/* Sidebar toggle */}
          <button
            className="topbar-toggle"
            onClick={() => setSidebarCollapsed(c => !c)}
            title="Toggle Sidebar"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="topbar-spacer" />

          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="theme-icon">{isDark ? "☀️" : "🌙"}</span>
            {isDark ? t("lightMode") : t("darkMode")}
          </button>

          {/* Clear Chat */}
          <button
            className="theme-toggle-btn clear-chat-btn"
            onClick={handleNewChat}
            title="Clear current chat"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2" strokeLinecap="round"/>
            </svg>
            {t("clearChat")}
          </button>

          {/* Language Dropdown */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              className="theme-toggle-btn"
              onClick={() => setLangOpen(prev => !prev)}
              title="Select Language"
            >
              🔊 {currentLabel} ▾
            </button>

            {langOpen && (
              <ul style={{
                position: "absolute",
                top: "110%",
                right: 0,
                zIndex: 9999,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "4px 0",
                minWidth: "170px",
                boxShadow: "var(--shadow)",
                listStyle: "none",
                margin: 0,
              }}>
                {LANGUAGES.map(lang => (
                  <li key={lang.value}>
                    <button
                      onClick={() => { setSelectedLang(lang.value); setLangOpen(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 16px",
                        background: selectedLang === lang.value ? "var(--accent)" : "transparent",
                        color: selectedLang === lang.value ? "#fff" : "var(--text-primary)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        borderRadius: selectedLang === lang.value ? "6px" : "0",
                        transition: "background 0.15s",
                      }}
                    >
                      {lang.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Home button */}
          <Link
            to="/"
            className="topbar-toggle"
            title="Go to Home"
            style={{ textDecoration: "none" }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 12v9h18V12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* Avatar & User ID with Dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <div 
              onClick={() => setProfileOpen(prev => !prev)}
              style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "10px", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-sm)", transition: "background 0.2s" }}
              className="user-profile-trigger"
            >
              <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "500" }}>
                {currentUserId}
              </span>
              <div className="avatar-circle" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {currentUserName ? currentUserName[0].toUpperCase() : "U"}
              </div>
            </div>

            {profileOpen && (
              <ul style={{
                position: "absolute",
                top: "110%",
                right: 0,
                zIndex: 9999,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "4px 0",
                minWidth: "150px",
                boxShadow: "var(--shadow)",
                listStyle: "none",
                margin: 0,
              }}>
                <li>
                  <button
                    onClick={handleOpenEditModal}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 16px",
                      background: "transparent",
                      color: "var(--text-primary)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    ✏️ Edit Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 16px",
                      background: "transparent",
                      color: "var(--danger)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(225, 112, 85, 0.1)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    🚪 Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        <ChatBox
          ref={chatBoxRef}
          key={chatKey}
          onSearch={addRecentSearch}
          restoreEntry={restoreEntry}
        />
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000
        }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            width: "90%",
            maxWidth: "450px",
            padding: "24px",
            boxShadow: "var(--shadow)",
            color: "var(--text-primary)"
          }}>
            <h3 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "600", color: "var(--text-primary)" }}>Edit Profile</h3>
            
            {profileLoading ? (
              <div style={{ padding: "20px", textAlign: "center" }}>Loading details...</div>
            ) : (
              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required 
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>Phone Number</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required 
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "16px" }}>
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--accent)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* ── Change Password Section ── */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "4px" }}>
              <button
                onClick={() => { setShowChangePwd(v => !v); setPwdError(""); setPwdSuccess(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  padding: 0,
                  marginBottom: showChangePwd ? "14px" : 0
                }}
              >
                🔑 {showChangePwd ? "Hide Change Password ▲" : "Change Password ▼"}
              </button>

              {showChangePwd && (
                <form onSubmit={handleChangePassword}>
                  {/* Current Password */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "var(--text-secondary)" }}>Current Password</label>
                    <input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      required
                      placeholder="Your current password"
                      style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)", fontSize: "14px", outline: "none" }}
                    />
                  </div>

                  {/* New Password */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "var(--text-secondary)" }}>New Password</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      required
                      placeholder="Enter new password"
                      style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)", fontSize: "14px", outline: "none" }}
                    />

                  </div>

                  {/* Confirm New Password */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "var(--text-secondary)" }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)", fontSize: "14px", outline: "none" }}
                    />
                    {confirmPwd.length > 0 && (
                      <small style={{ color: pwdsMatch ? "#198754" : "#dc3545" }}>
                        {pwdsMatch ? "✔ Passwords match" : "✘ Passwords do not match"}
                      </small>
                    )}
                  </div>

                  {/* Error / Success messages */}
                  {pwdError   && <p style={{ color: "#dc3545", fontSize: "13px", marginBottom: "10px" }}>{pwdError}</p>}
                  {pwdSuccess && <p style={{ color: "#198754", fontSize: "13px", marginBottom: "10px" }}>{pwdSuccess}</p>}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={pwdLoading || !newPwd || !pwdsMatch || !currentPwd}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "var(--radius-sm)",
                        background: pwdLoading || !newPwd || !pwdsMatch || !currentPwd ? "#6c757d" : "#198754",
                        color: "white",
                        border: "none",
                        cursor: pwdLoading || !newPwd || !pwdsMatch || !currentPwd ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                    >
                      {pwdLoading ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
      
      
      </div>
    </div>
  );
}

export default Chat;
