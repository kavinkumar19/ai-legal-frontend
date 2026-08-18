import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const { showToast } = useToast();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            showToast("Invalid or missing recovery token.", "error");
            navigate("/forgot-password");
        }
    }, [token, navigate, showToast]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            showToast("Please enter a new password", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        setPwdLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/forgot-password/reset-with-token`, {
                token: token,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            showToast("Password reset successfully. You can now login.", "success");
            navigate("/login");
        } catch (error) {
            showToast(error.response?.data?.detail || "Failed to reset password. The link may have expired.", "error");
        } finally {
            setPwdLoading(false);
        }
    };

    if (!token) return null;

    return (
        <>
            <Navbar />
            <div className="container mt-5 mb-5">
                <div className="row justify-content-center">
                    <div className="col-md-5">
                        <div className="card shadow" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                            <div className="card-header bg-primary text-white">
                                <h3 className="text-center m-0">Reset Password</h3>
                            </div>
                            <div className="card-body p-4">
                                <form onSubmit={handleResetPassword}>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                                        Please enter your new password below.
                                    </p>
                                    <div className="mb-3">
                                        <label className="form-label" style={{ color: "var(--text-primary)" }}>New Password</label>
                                        <input type="password" className="form-control" value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)} required 
                                            placeholder="Enter new password"
                                            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label" style={{ color: "var(--text-primary)" }}>Confirm New Password</label>
                                        <input type="password" className="form-control" value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)} required 
                                            placeholder="Confirm new password"
                                            style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
                                    </div>
                                    <button 
                                        className="btn btn-primary w-100" 
                                        style={{ padding: "10px", fontSize: "16px" }}
                                        disabled={pwdLoading}
                                    >
                                        {pwdLoading ? "Resetting..." : "Reset Password"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ResetPassword;
