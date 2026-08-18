import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config";



function Register() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [name, setName]               = useState("");
    const [email, setEmail]             = useState("");
    const [phone, setPhone]             = useState("");
    const [password, setPassword]       = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    const passwordsMatch = password === confirmPassword;

    const registerUser = async (e) => {
        e.preventDefault();

        if (!password) {
            showToast("Please enter a password.", "error");
            return;
        }
        if (!passwordsMatch) {
            showToast("Passwords do not match.", "error");
            return;
        }


        try {
            await axios.post(`${API_BASE_URL}/register`, {
                name, email, phone, password
            });
            showToast(t("registerSuccess") || "Registration Successful", "success");
            navigate("/login");
        } catch (error) {
            showToast(error.response?.data?.detail || t("registerFail") || "Registration Failed", "error");
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 mb-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow">
                            <div className="card-header bg-success text-white">
                                <h3 className="text-center">{t("registerTitle")}</h3>
                            </div>
                            <div className="card-body">
                                <form onSubmit={registerUser}>
                                    {/* Name */}
                                    <div className="mb-3">
                                        <label>{t("nameLabel")}</label>
                                        <input type="text" className="form-control" value={name}
                                            onChange={(e) => setName(e.target.value)} required />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-3">
                                        <label>{t("emailLabel")} <span className="text-muted" style={{ fontSize: "0.85em" }}>(Optional)</span></label>
                                        <input type="email" className="form-control" value={email}
                                            onChange={(e) => setEmail(e.target.value)} />
                                    </div>

                                    {/* Phone */}
                                    <div className="mb-3">
                                        <label>Phone Number</label>
                                        <input type="tel" className="form-control" value={phone}
                                            onChange={(e) => setPhone(e.target.value)} required />
                                    </div>

                                    {/* Password */}
                                    <div className="mb-3">
                                        <label>{t("passwordLabel")}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="mb-3">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        {confirmPassword.length > 0 && (
                                            <small style={{ color: passwordsMatch ? "#198754" : "#dc3545" }}>
                                                {passwordsMatch ? "✔ Passwords match" : "✘ Passwords do not match"}
                                            </small>
                                        )}
                                    </div>



                                    <button
                                        className="btn btn-success w-100"
                                        disabled={!password || !passwordsMatch}
                                    >
                                        {t("registerBtn")}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Register;
