import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

function About() {
    const { t } = useLanguage();
    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <h1 className="text-center text-primary">{t("aboutTitle")}</h1>
                <p className="mt-4">{t("aboutP1")}</p>
                <p>{t("aboutP2")}</p>
                <h3 className="mt-4">{t("features")}</h3>
                <ul>
                    <li>{t("f1")}</li>
                    <li>{t("f2")}</li>
                    <li>{t("f3")}</li>
                    <li>{t("f4")}</li>
                    <li>{t("f5")}</li>
                    <li>{t("f6")}</li>
                    <li>{t("f7")}</li>
                    <li>{t("f8")}</li>
                </ul>
                <h3 className="mt-4">{t("technologies")}</h3>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>{t("technology")}</th>
                            <th>{t("purpose")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>React</td><td>Frontend</td></tr>
                        <tr><td>FastAPI</td><td>Backend</td></tr>
                        <tr><td>Ollama</td><td>Run Llama 3</td></tr>
                        <tr><td>FAISS</td><td>Vector Search</td></tr>
                        <tr><td>MongoDB</td><td>Database</td></tr>
                    </tbody>
                </table>
            </div>
            <Footer />
        </>
    );
}

export default About;
