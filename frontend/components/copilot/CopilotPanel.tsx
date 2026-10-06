"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, CornerDownLeft, RefreshCw, FileText } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  time: string;
  isError?: boolean;
  sources?: string[];
}

interface CopilotPanelProps {
  onClose?: () => void;
  isDrawer?: boolean;
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Which fixtures are leaking right now?",
  "How much water did we lose this week?",
  "What should housekeeping clean first?",
];

function extractEvidenceTokens(text: string): string[] {
  const matches = new Set<string>();
  // Match fixtures like Sink_01, Toilet_02, Urinal_03
  const fixtureMatches = text.match(/\b(Sink|Toilet|Urinal)_\d{2}\b/gi);
  if (fixtureMatches) fixtureMatches.forEach((m) => matches.add(m));

  // Match tickets like TKT-001 or TKT-[a-f0-9]+
  const ticketMatches = text.match(/\bTKT-[a-zA-Z0-9_-]+\b/gi);
  if (ticketMatches) ticketMatches.forEach((m) => matches.add(m));

  // Match zones like Zone M1, Zone F1, etc.
  const zoneMatches = text.match(/\bZone\s+(M1|M2|F1|F2)\b/gi);
  if (zoneMatches) zoneMatches.forEach((m) => matches.add(m));

  return Array.from(matches);
}

export function CopilotPanel({ onClose, isDrawer = false, className }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "init",
      sender: "copilot",
      text: "Hello. I am the Facility Copilot, connected to Terminal 2 telemetry, active maintenance tickets, and baseline consumption models. How can I assist you with restroom operations today?",
      time: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? inputText).trim();
    if (!textToSend || loading) return;

    setLastUserPrompt(textToSend);

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.reply || "I analyzed the telemetry data. No operational anomalies detected.";

      const sources = extractEvidenceTokens(reply);

      const copilotMsg: CopilotMessage = {
        id: `ast-${Date.now()}`,
        sender: "copilot",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      console.error("Copilot request error:", err);
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        sender: "copilot",
        text: "Unable to reach the facility telemetry service. Please verify your backend connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[var(--text-1)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-[var(--bg-surface)]", className)}>
      {/* Header — clean editorial lockup, no gradient, no gold */}
      {!isDrawer && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-hairline)] shrink-0 bg-[var(--bg-surface)]">
          <div>
            <h3 className="text-h3 font-semibold text-[var(--text-1)]">Facility Copilot</h3>
            <p className="text-caption text-[var(--text-3)] mt-0.5">
              Terminal 2 telemetry & operational intelligence
            </p>
          </div>
          {onClose && (
            <IconButton label="Close Copilot" onClick={onClose} style={{ color: "var(--text-3)" }}>
              <X size={16} strokeWidth={1.5} />
            </IconButton>
          )}
        </div>
      )}

      {/* Messages region — role="log" and aria-live="polite" */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            {msg.sender === "user" ? (
              // User message: right-aligned subtle bubble
              <div className="ml-auto max-w-[85%] space-y-1">
                <div className="rounded-[var(--radius-md)] px-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-body text-[var(--text-1)] whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
                <div className="text-right text-caption font-mono text-[var(--text-3)]">
                  {msg.time}
                </div>
              </div>
            ) : (
              // Assistant message: left-aligned, no bubble, brass hairline marker
              <div className="border-l-2 border-[var(--accent)] pl-3.5 py-0.5 space-y-2">
                <div className="text-body text-[var(--text-1)] whitespace-pre-wrap leading-relaxed">
                  {renderFormattedText(msg.text)}
                </div>

                {/* Evidence / Source Chips (only when references are detected) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-caption text-[var(--text-3)] inline-flex items-center gap-1 mr-1">
                      <FileText size={12} strokeWidth={1.5} />
                      Referenced:
                    </span>
                    {msg.sources.map((src) => (
                      <span
                        key={src}
                        className="inline-flex items-center text-caption font-mono text-[var(--text-2)] bg-[var(--bg-subtle)] border border-[var(--border-hairline)] px-2 py-0.5 rounded-[var(--radius-sm)]"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inline retry button on failure */}
                {msg.isError && lastUserPrompt && (
                  <div className="pt-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSend(lastUserPrompt)}
                      className="gap-1.5"
                    >
                      <RefreshCw size={13} strokeWidth={1.5} />
                      Retry request
                    </Button>
                  </div>
                )}

                <div className="text-caption font-mono text-[var(--text-3)]">{msg.time}</div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator — subtle three-dot bounce */}
        {loading && (
          <div className="border-l-2 border-[var(--accent)] pl-3.5 py-1">
            <div className="flex items-center gap-1.5 py-1" aria-label="Copilot thinking">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-3)] animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-3)] animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-3)] animate-pulse [animation-delay:300ms]" />
              <span className="text-caption text-[var(--text-3)] ml-2">Consulting models…</span>
            </div>
          </div>
        )}

        {/* Suggested Prompts — shown only when conversation is fresh */}
        {messages.length <= 1 && (
          <div className="pt-2 space-y-2">
            <p className="text-caption text-[var(--text-3)]">Suggested inquiries</p>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-body text-[var(--text-2)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent)] hover:text-[var(--text-1)] transition-colors flex items-center justify-between group"
                >
                  <span className="pr-2">{prompt}</span>
                  <CornerDownLeft
                    size={14}
                    strokeWidth={1.5}
                    className="text-[var(--text-3)] group-hover:text-[var(--text-1)] shrink-0 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area — auto-growing textarea + ink send button */}
      <div className="p-4 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-end gap-2 bg-[var(--bg-subtle)] border border-[var(--border-hairline)] rounded-[var(--radius-md)] px-3 py-2 focus-within:border-[var(--accent)] transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about leaks, hygiene, or consumption…"
            className="flex-1 bg-transparent text-body text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none resize-none leading-relaxed"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="button"
            disabled={!inputText.trim() || loading}
            onClick={() => handleSend()}
            className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--text-1)] text-[var(--bg-surface)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shrink-0"
            aria-label="Send message"
          >
            <Send size={14} strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-caption text-[var(--text-3)] mt-1.5 text-right">
          Press <kbd className="font-mono text-[var(--text-2)]">Enter</kbd> to send,{" "}
          <kbd className="font-mono text-[var(--text-2)]">Shift+Enter</kbd> for newline
        </p>
      </div>
    </div>
  );
}
