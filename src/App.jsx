import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
    useEffect(() => {
        const savedTheme = localStorage.getItem("niral_theme") || "dark";
        document.body.setAttribute("data-theme", savedTheme);
    }, []);

    return (
        <ToastProvider>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>

        </ToastProvider>
    );
}

export default App;
