import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config";

function Login() {
    const navigate = useNavigate();
    const { t, selectedLang, setSelectedLang } = useLanguage();
    const { showToast } = useToast();
    
    const [name, setName] = useState("");
    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [password, setPassword] = useState("");
    const [language, setLanguage] = useState(selectedLang);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, { 
                email_or_phone: emailOrPhone, 
                password 
            });
            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("user_name", name);
            localStorage.setItem("user_id", emailOrPhone);
            sessionStorage.setItem("show_login_message", "true");
            
            // Update global language context
            setSelectedLang(language);
            
            showToast(t("loginSuccess") || "Login Successful", 'success');
            navigate("/chat");
        } catch (error) {
            showToast(error.response?.data?.detail || t("loginFail") || "Invalid Credentials", 'error');
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-5">
                        <div className="card shadow" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                            <div className="card-header bg-primary text-white">
                                <h3 className="text-center m-0">{t("loginTitle") || "Login"}</h3>
                            </div>
                            <div className="card-body p-4">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label" style={{ color: "var(--text-primary)" }}>{t("nameLabel") || "Name"} <span style={{fontSize:"11px",color:"var(--text-secondary)"}}>(display only)</span></label>
                                        <input type="text" className="form-control" value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your display name"
                                            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label" style={{ color: "var(--text-primary)" }}>Email or Phone Number</label>
                                        <input type="text" className="form-control" value={emailOrPhone}
                                            onChange={(e) => setEmailOrPhone(e.target.value)} required 
                                            placeholder="Enter your registered email or phone"
                                            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label" style={{ color: "var(--text-primary)" }}>{t("passwordLabel") || "Password"}</label>
                                        <input type="password" className="form-control" value={password}
                                            onChange={(e) => setPassword(e.target.value)} required 
                                            placeholder="Enter your password"
                                            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                                        <div className="text-end mt-1">
                                            <a href="/forgot-password" style={{ color: "var(--accent)", fontSize: "13px", textDecoration: "none" }}>Forgot Password?</a>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label" style={{ color: "var(--text-primary)" }}>Select Language</label>
                                        <select 
                                            className="form-select" 
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary w-100" style={{ padding: "10px", fontSize: "16px" }}>
                                        {t("loginBtn") || "Login"}
                                    </button>
                                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                                            Don't have an account?{" "}
                                        </span>
                                        <a href="/register" style={{ color: "var(--accent)", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}>
                                            Register
                                        </a>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Login;

