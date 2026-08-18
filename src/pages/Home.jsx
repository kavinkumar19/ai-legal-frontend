import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function Home() {
    const { t } = useLanguage();
    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="text-center">
                    <h1 className="display-4 fw-bold text-primary">{t("heroTitle")}</h1>
                    <p className="lead mt-3">{t("heroSubtitle")}</p>
                    <Link to="/chat" className="btn btn-primary btn-lg mt-3">
                        {t("startChat")}
                    </Link>
                </div>


            </div>
            <Footer />
        </>
    );
}

export default Home;
