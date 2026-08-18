import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useToast } from "../context/ToastContext";
import axios from "axios";
import { API_BASE_URL, APP_BASE_URL } from "../config";

function ForgotPassword() {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [recoveryLink, setRecoveryLink] = useState(null);

    const handleSendLink = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setRecoveryLink(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/forgot-password/send-link`, { email });
            showToast(response.data.message, "success");
            
            // For development purposes, display the mock link
            if (response.data.dev_token) {
                setRecoveryLink(`${APP_BASE_URL}/reset-password?token=${response.data.dev_token}`);
            }
        } catch (error) {
            // Display a generic error or the specific detail if provided
            showToast(error.response?.data?.detail || "Failed to process request", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 mb-5">
                <div className="row justify-content-center">
                    <div className="col-md-5">
                        <div className="card shadow" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                            <div className="card-header bg-primary text-white">
                                <h3 className="text-center m-0">Forgot Password</h3>
                            </div>
                            <div className="card-body p-4">
                                {!recoveryLink ? (
                                    <form onSubmit={handleSendLink}>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                                            Enter your registered email address and we'll send you a link to reset your password.
                                        </p>
                                        <div className="mb-4">
                                            <label className="form-label" style={{ color: "var(--text-primary)" }}>Email Address</label>
                                            <input type="email" className="form-control" value={email}
                                                onChange={(e) => setEmail(e.target.value)} required 
                                                placeholder="Enter your email"
                                                style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                                        </div>
                                        <button 
                                            className="btn btn-primary w-100" 
                                            style={{ padding: "10px", fontSize: "16px" }}
                                            disabled={isLoading || !email}
                                        >
                                            {isLoading ? "Sending..." : "Send Recovery Link"}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center">
                                        <div className="mb-4" style={{ fontSize: "40px" }}>📧</div>
                                        <h5 style={{ color: "var(--text-primary)", marginBottom: "15px" }}>Email Sent!</h5>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "25px" }}>
                                            If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
                                        </p>
                                        
                                        {/* Mock Email View for Dev Mode */}
                                        <div style={{ padding: "15px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "left", fontSize: "13px" }}>
                                            <strong style={{ color: "var(--warning)", display: "block", marginBottom: "10px" }}>⚠️ Development Mode Simulation</strong>
                                            Since there's no real email server connected, click the link below to continue to the reset page:
                                            <br /><br />
                                            <a href={recoveryLink} style={{ color: "var(--accent)", wordBreak: "break-all" }}>{recoveryLink}</a>
                                        </div>
                                    </div>
                                )}

                                <div style={{ textAlign: "center", marginTop: "20px" }}>
                                    <a href="/login" style={{ color: "var(--text-secondary)", fontSize: "14px", textDecoration: "none" }}>
                                        ← Back to Login
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ForgotPassword;
