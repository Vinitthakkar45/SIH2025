"use client";
"use i18n";

import ChatComposer from "@/components/ChatComposer";
import { Location01Icon } from "@/components/icons";
import MessageList, { type Message } from "@/components/MessageList";
import type { Visualization } from "@/types/visualizations";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MapWrapper from "./MapWrapper";
import ScrollToBottom from "./ScrollToBottom";
import WelcomeView from "./WelcomeView";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface LocationInfo {
  state: string;
  district: string;
}

export default function ChatPage() {
  const [showMap, setShowMap] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationInfo>({
    state: "Maharashtra",
    district: "Mumbai",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchLocation = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }

        const data = await response.json();

        const state = data.principalSubdivision;
        const district =
          data.city ||
          data.locality ||
          data.localityInfo?.administrative?.[2]?.name;

        setUserLocation({ state, district });
      } catch (error) {
        console.error("Failed to fetch location details:", error);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isScrollable = scrollHeight > clientHeight;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setShowScrollButton(isScrollable && !isAtBottom);
  };

  const handleScroll = () => {
    checkScrollPosition();
  };

  useEffect(() => {
    checkScrollPosition();

    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, showScrollButton]);

  const handleSubmit = async (query: string) => {
    console.log("test");
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", charts: [], isLoading: true },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      // Get language from cookie
      const language = Cookies.get("lingo-locale") || "en";

      const response = await fetch(`${API_URL}/api/gw-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          language,
          chatHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      const charts: Visualization[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                assistantContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: assistantContent,
                    isLoading: false,
                  };
                  return updated;
                });
              } else if (
                data.type === "chart" ||
                data.type === "stats" ||
                data.type === "table" ||
                data.type === "summary" ||
                data.type === "trend_summary" ||
                data.type === "data_container"
              ) {
                charts.push(data);
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    charts: [...charts],
                  };
                  return updated;
                });
              } else if (data.type === "suggestions") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    suggestions: data.suggestions,
                  };
                  return updated;
                });
              } else if (data.type === "done") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = { ...updated[lastIdx], isLoading: false };
                  return updated;
                });
              } else if (data.type === "error") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    role: "assistant",
                    content: `Error: ${data.error}`,
                    isLoading: false,
                  };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            isLoading: false,
          };
          return updated;
        });
      } else {
        console.error("Chat error:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            isLoading: false,
          };
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleExport = async () => {
    if (messages.length === 0) return;

    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const exportContainer = exportContainerRef.current;
    if (!exportContainer) {
      console.error("Export container not found");
      setIsExporting(false);
      return;
    }

    const accordions = exportContainer.querySelectorAll(
      '[data-slot="trigger"]'
    );
    console.log("Found accordions:", accordions.length);

    accordions.forEach((acc) => {
      const button = acc as HTMLElement;
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      if (!isExpanded) {
        button.click();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const totalPages = Math.ceil(imgHeight / pageHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        const yPosition = -(page * pageHeight);

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          yPosition,
          imgWidth,
          imgHeight
        );

        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          "INGRES AI - Groundwater Resource Information",
          10,
          pageHeight - 10
        );
        pdf.text(
          `Page ${page + 1} of ${totalPages}`,
          imgWidth - 30,
          pageHeight - 10
        );
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      pdf.save(`INGRES-AI-Chat-${timestamp}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-dark-primary overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 relative">
        <ChatHeader
          onToggleMap={() => setShowMap(!showMap)}
          showMap={showMap}
          hasMessages={messages.length > 0}
          onExport={handleExport}
        />

        <main
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {messages.length === 0 ? (
              <WelcomeView
                onQueryClick={handleSubmit}
                userLocation={userLocation}
              />
            ) : (
              <MessageList
                messages={messages}
                onSuggestionClick={handleSubmit}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <ScrollToBottom
          visible={showScrollButton}
          onClick={() => {
            scrollToBottom();
            setShowScrollButton(false);
          }}
        />

        <div className="max-w-2xl mx-auto w-full pt-3">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStop}
            isLoading={isLoading}
            placeholder="Ask me anything..."
          />
        </div>
      </div>

      {/* Hidden Export Container */}
      {isExporting && (
        <div
          ref={exportContainerRef}
          className="light"
          style={{
            position: "absolute",
            left: "-10000px",
            top: "-10000px",
            width: "800px",
            backgroundColor: "#ffffff",
            padding: "40px",
            minHeight: "100vh",
            color: "#000000",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
              [data-export="true"] * {
                color: #000000 !important;
                border-color: #e5e5e5 !important;
              }
              [data-export="true"] .text-zinc-200,
              [data-export="true"] .text-zinc-300,
              [data-export="true"] .text-zinc-400,
              [data-export="true"] .text-zinc-500 {
                color: #404040 !important;
              }
              [data-export="true"] .bg-zinc-800,
              [data-export="true"] .bg-zinc-900 {
                background-color: #f5f5f5 !important;
              }
              [data-export="true"] .text-primary {
                color: #2563eb !important;
              }
            `,
            }}
          />
          <div
            className="space-y-6"
            data-export="true"
            style={{ backgroundColor: "#ffffff", color: "#000000" }}
          >
            <MessageList messages={messages} onSuggestionClick={() => {}} />
          </div>
        </div>
      )}

      {/* Map Panel */}
      <div
        className={`${
          showMap ? "w-1/2 opacity-100" : "w-0 opacity-0"
        } transition-all duration-300 bg-zinc-900 overflow-hidden`}
      >
        {showMap ? (
          <MapWrapper />
        ) : (
          <div className="flex items-center justify-center h-full text-center text-zinc-400">
            <div>
              <Location01Icon
                width={48}
                height={48}
                className="mx-auto mb-4 opacity-50"
              />
              <p className="font-medium">Map View</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
