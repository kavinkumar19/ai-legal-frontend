import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Message from "./Message";
import { useLanguage } from "../context/LanguageContext";

const ChatBox = forwardRef(({ onSearch, restoreEntry }, ref) => {
  const [question, setQuestion]         = useState("");
  const [messages, setMessages]         = useState([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const [lastAiText, setLastAiText]     = useState("");
  const [canReRead, setCanReRead]       = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const utteranceRef   = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const fileInputRef   = useRef(null);
  const keepAliveRef   = useRef(null);
  const { selectedLang, t } = useLanguage();

  const SUGGESTIONS = [
    { titleKey: "s1Title", descKey: "s1Desc", promptKey: "s1Prompt" },
    { titleKey: "s2Title", descKey: "s2Desc", promptKey: "s2Prompt" },
    { titleKey: "s3Title", descKey: "s3Desc", promptKey: "s3Prompt" },
    { titleKey: "s4Title", descKey: "s4Desc", promptKey: "s4Prompt" },
  ];

  /* Expose messages to parent */
  useImperativeHandle(ref, () => ({
    getMessages: () => messages
  }));

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* Sync document lang for correct script shaping */
  useEffect(() => {
    document.documentElement.lang = selectedLang.split("-")[0]; // e.g. "ta", "hi", "ml", "en"
  }, [selectedLang]);

  /* Restore saved Q&A */
  useEffect(() => {
    if (!restoreEntry?.question) return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
    setMessages([
      { sender: "user", text: restoreEntry.question },
      { sender: "ai",   text: restoreEntry.answer  },
    ]);
    setLastAiText(restoreEntry.answer);
    setCanReRead(true);
  }, [restoreEntry]);

  /* auto-resize textarea */
  const handleTextareaInput = (e) => {
    setQuestion(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    }
  };

  /* Text-to-Speech — keepAlive prevents Chrome/Edge from silently
     killing the utterance after ~15 s or on tab visibility change. */
  const clearKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    clearKeepAlive();
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const langCode = selectedLang;                  // e.g. "ml-IN"
      const langPrefix = langCode.split("-")[0];      // e.g. "ml"

      // 1. Exact locale match  (e.g. "ml-IN")
      let voice = voices.find(v => v.lang === langCode);
      // 2. Language-prefix match  (e.g. any "ml-*" voice)
      if (!voice) voice = voices.find(v => v.lang.startsWith(langPrefix));
      // 3. No match — browser will use its default voice

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang  = langCode;
      utterance.rate  = 1;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;
      utteranceRef.current = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCanReRead(false);
        /* keepAlive: pause + resume every 10 s to prevent browser kill */
        keepAliveRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            clearKeepAlive();
          }
        }, 10000);
      };

      utterance.onend = () => {
        clearKeepAlive();
        setIsSpeaking(false);
        setCanReRead(true);
      };

      utterance.onerror = () => {
        clearKeepAlive();
        setIsSpeaking(false);
        setCanReRead(true);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Chrome loads voices asynchronously — wait if the list is empty
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
    }
  };

  const stopSpeaking = () => {
    clearKeepAlive();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCanReRead(true);
  };

  /* Resume speech when user switches back to this tab */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearKeepAlive();
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* Mic */
  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported. Use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current     = recognition;
    recognition.lang           = selectedLang;
    recognition.interimResults = true;
    recognition.continuous     = false;
    recognition.onstart  = () => setIsListening(true);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        transcript += event.results[i][0].transcript;
      setQuestion(transcript);
    };
    recognition.onend  = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  /* File Upload */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    setAttachedFile({ name: file.name, size: file.size, uploading: true, error: null });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachedFile({ name: res.data.filename, size: res.data.size_kb, uploading: false, error: null });
      setMessages(prev => [...prev, {
        sender: "user",
        text: `${t("uploadedFile")} **${res.data.filename}** (${res.data.size_kb} KB)`,
        isFile: true,
      }]);
    } catch (err) {
      const msg = err.response?.data?.detail || "Upload failed. Please try again.";
      setAttachedFile({ name: file.name, size: null, uploading: false, error: msg });
      setMessages(prev => [...prev, { sender: "ai", text: `${t("uploadError")} ${msg}` }]);
    }
  };

  /* Send */
  const sendQuestion = async (overrideQ) => {
    const q = (overrideQ ?? question).trim();
    if (!q) return;
    recognitionRef.current?.stop();
    setIsListening(false);
    setMessages(prev => [...prev, { sender: "user", text: q }]);
    onSearch?.(q);
    setQuestion("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${API_BASE_URL}/chat`,
        { question: q, language: selectedLang },
        { headers }
      );
      const answer = response.data.answer;
      const chatId  = response.data.chat_id ?? null;
      setMessages(prev => [...prev, { sender: "ai", text: answer, chatId }]);
      setLastAiText(answer);
      setCanReRead(false);
      speak(answer);
      onSearch?.(q, answer);
    } catch {
      setMessages(prev => [...prev, { sender: "ai", text: t("backendError") }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  const showWelcome = messages.length === 0 && !isLoading;

  const statusLabel = isListening ? t("listening") : isSpeaking ? t("speaking") : "";
  const statusColor = isListening ? "#e17055" : isSpeaking ? "#6c5ce7" : "transparent";

  return (
    <>
      {/* Chat area */}
      <div className="chat-area">
        {showWelcome ? (
          <div className="welcome-screen">
            <div className="welcome-icon">⚖️</div>
            <h1 className="welcome-title">{t("welcomeTitle")}</h1>
            <p className="welcome-subtitle">{t("welcomeSubtitle")}</p>
            <p className="suggestions-label">{t("suggested")}</p>
            <div className="suggestions-grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.titleKey}
                  className="suggestion-card"
                  onClick={() => sendQuestion(t(s.promptKey))}
                >
                  <h4>{t(s.titleKey)}</h4>
                  <p>{t(s.descKey)}</p>
                  <span className="prompt-tag">Prompt</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, i) => (
              <Message key={i} sender={msg.sender} text={msg.text} lang={selectedLang} chatId={msg.chatId ?? null} />
            ))}
            {isLoading && (
              <div className="message-row ai-row">
                <div className="msg-avatar ai-avatar">⚖️</div>
                <div className="msg-content">
                  <div className="msg-sender">{t("aiName")}</div>
                  <div className="msg-bubble ai-bubble">
                    <div className="thinking-dots"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="input-bar-wrapper">
        <div className="status-bar" style={{ color: statusColor }}>{statusLabel}</div>

        <div className={`input-bar ${isListening ? "listening" : ""}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx,.doc,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <button className="input-add-btn" title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={attachedFile?.uploading}>
            {attachedFile?.uploading ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
            )}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={t("sendPlaceholder")}
            value={question}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
          />

          <button className={`input-mic-btn ${isListening ? "active" : ""}`} onClick={toggleMic} title={isListening ? "Stop" : "Voice Input"}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" strokeLinecap="round"/>
            </svg>
          </button>

          {(isSpeaking || canReRead) && (
            <button
              className={`input-stop-btn ${isSpeaking ? "active" : ""}`}
              onClick={() => isSpeaking ? stopSpeaking() : speak(lastAiText)}
              title={isSpeaking ? "Stop Speech" : "Re-read Response"}
            >
              {isSpeaking ? (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 2l-9 10 9 10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}

          <button className="input-send-btn" onClick={() => sendQuestion()} disabled={!question.trim() || isLoading} title="Send">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <p className="input-disclaimer">{t("disclaimer")}</p>
      </div>
    </>
  );
});

export default ChatBox;
