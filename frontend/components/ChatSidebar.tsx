"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import {
  Add01Icon as PlusIcon,
  Message01Icon as MessageIcon,
  Delete01Icon as TrashIcon,
  Edit01Icon as EditIcon,
  ArrowLeft01Icon as ChevronLeftIcon,
  ArrowRight01Icon as ChevronRightIcon,
  DropletIcon,
} from "./icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export default function ChatSidebar({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = "",
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    // Refresh the list after creating new chat
    setTimeout(fetchConversations, 500);
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          onNewChat();
        }
        onDeleteConversation?.(conversationId);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async (conversationId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });

      if (response.ok) {
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, title: editTitle } : c)));
      }
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conversation) => {
    const dateLabel = formatDate(conversation.updatedAt);
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(conversation);
    return groups;
  }, {} as Record<string, Conversation[]>);

  // Refresh conversations when a new message is sent
  useEffect(() => {
    if (currentConversationId) {
      fetchConversations();
    }
  }, [currentConversationId]);

  if (isCollapsed) {
    return (
      <div className={`w-14 bg-dark-tertiary flex flex-col items-center py-4 border-r border-zinc-800/50 transition-all duration-300 ${className}`}>
        <button
          onClick={toggleCollapse}
          aria-label="Expand sidebar"
          title="INGRES AI - Click to expand"
          className="w-9 h-9 rounded-xl bg-primary/90 flex items-center justify-center mb-4 cursor-pointer hover:bg-primary transition-colors">
          <DropletIcon size={20} className="text-white" />
        </button>

        <button
          onClick={handleNewChat}
          aria-label="New Chat"
          title="New Chat"
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 hover:bg-zinc-700/50 transition-colors">
          <PlusIcon size={18} className="text-zinc-400" />
        </button>

        <div className="flex-1" />

        <button
          onClick={toggleCollapse}
          aria-label="Expand Sidebar"
          title="Expand Sidebar"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-700/50 transition-colors">
          <ChevronRightIcon size={18} className="text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-64 bg-dark-tertiary flex flex-col border-r border-zinc-800/50 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center">
              <DropletIcon size={16} className="text-white" />
            </div>
            <span className="font-medium text-zinc-200 text-sm">INGRES AI</span>
          </div>
          <Button isIconOnly variant="light" size="sm" className="hover:bg-zinc-700/50" onPress={toggleCollapse}>
            <ChevronLeftIcon size={16} className="text-zinc-500" />
          </Button>
        </div>

        {/* New Chat Button */}
        <Button
          fullWidth
          variant="flat"
          size="sm"
          startContent={<PlusIcon size={16} />}
          className="bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 font-medium border border-zinc-700/50"
          onPress={handleNewChat}>
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollShadow className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2 px-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-zinc-800/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-6 px-4">
              <MessageIcon size={24} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-xs text-zinc-500">No conversations yet</p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([dateLabel, convos]) => (
              <div key={dateLabel} className="mb-3">
                <p className="text-[10px] text-zinc-600 px-2 py-1.5 font-medium uppercase tracking-wider">{dateLabel}</p>
                <div className="space-y-0.5">
                  {convos.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all duration-150 ${
                        currentConversationId === conversation.id
                          ? "bg-zinc-700/50 text-zinc-100"
                          : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-300"
                      }`}
                      onClick={() => onSelectConversation(conversation.id)}
                      onMouseEnter={() => setHoveredId(conversation.id)}
                      onMouseLeave={() => setHoveredId(null)}>
                      <MessageIcon
                        size={14}
                        className={`shrink-0 ${currentConversationId === conversation.id ? "text-zinc-300" : "text-zinc-600"}`}
                      />

                      {editingId === conversation.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleSaveEdit(conversation.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(conversation.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded border border-zinc-700 focus:outline-none focus:border-primary"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Enter chat title"
                          aria-label="Edit conversation title"
                        />
                      ) : (
                        <span className="flex-1 text-xs truncate">{conversation.title}</span>
                      )}

                      {/* Action buttons - show on hover */}
                      {hoveredId === conversation.id && editingId !== conversation.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="min-w-5 w-5 h-5"
                            onPress={(e) => handleStartEdit(e as unknown as React.MouseEvent, conversation)}>
                            <EditIcon size={12} className="text-zinc-500 hover:text-zinc-300" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="min-w-5 w-5 h-5"
                            onPress={(e) => handleDelete(e as unknown as React.MouseEvent, conversation.id)}>
                            <TrashIcon size={12} className="text-zinc-500 hover:text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollShadow>
    </div>
  );
}
