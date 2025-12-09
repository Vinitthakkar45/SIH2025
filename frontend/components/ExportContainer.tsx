"use client";

import MessageList, { type Message } from "@/components/MessageList";

interface ExportContainerProps {
  messages: Message[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ExportContainer({
  messages,
  containerRef,
}: ExportContainerProps) {
  return (
    <div
      ref={containerRef}
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
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1e3a8a",
              marginBottom: "8px",
            }}
          >
            INGRES AI
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            Groundwater Resource Information System
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            Chat Export -{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <MessageList
          messages={messages}
          onSuggestionClick={() => {}}
          showSuggestions={false}
        />
      </div>
    </div>
  );
}
