"use client";

import { Button, Listbox, ListboxItem } from "@heroui/react";
import Link from "next/link";
import { Droplet, Plus, MessageSquare, Settings, User } from "lucide-react";
import type { Selection } from "@heroui/react";

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
  chatHistory?: ChatHistoryItem[];
  activeChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

export default function Sidebar({
  isOpen,
  onNewChat,
  chatHistory = [],
  activeChatId,
  onChatSelect,
}: SidebarProps) {
  const sampleHistory: ChatHistoryItem[] = chatHistory.length
    ? chatHistory
    : [
        {
          id: "1",
          title: "Groundwater trends in Maharashtra",
          timestamp: new Date(),
        },
        {
          id: "2",
          title: "Compare states extraction data",
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: "3",
          title: "Historical analysis Delhi",
          timestamp: new Date(Date.now() - 172800000),
        },
      ];

  return (
    <aside
      className={`${
        isOpen ? "w-72" : "w-0"
      } transition-all duration-300 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-r border-zinc-800/30 flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/30">
        <Link href="/" className="flex items-center gap-3 px-1 py-2 mb-4 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Droplet size={17} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-50 text-base tracking-tight">INGRES</span>
        </Link>
        <Button
          fullWidth
          onPress={onNewChat}
          startContent={<Plus size={16} strokeWidth={2.5} />}
          className="bg-white/5 hover:bg-white/10 text-zinc-100 font-medium h-10 border border-white/10 hover:border-white/20 transition-all"
          radius="lg"
        >
          <span className="text-sm font-medium">New Chat</span>
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-xs font-medium text-zinc-500 px-3 mb-3">
          Recent
        </p>
        <Listbox
          aria-label="Chat history"
          variant="flat"
          selectionMode="single"
          selectedKeys={activeChatId ? [activeChatId] : []}
          onSelectionChange={(keys: Selection) => {
            const key = Array.from(keys)[0];
            if (key) onChatSelect?.(key.toString());
          }}
          classNames={{
            list: "gap-1",
          }}
        >
          {sampleHistory.map((chat) => (
            <ListboxItem
              key={chat.id}
              textValue={chat.title}
              startContent={
                <MessageSquare size={15} className="text-zinc-600 shrink-0" strokeWidth={2} />
              }
              description={
                <span className="text-xs">{formatRelativeTime(chat.timestamp)}</span>
              }
              classNames={{
                base: "px-3 py-2.5 data-[hover=true]:bg-white/5 data-[selected=true]:bg-white/10 rounded-xl transition-colors",
                title: "text-sm text-zinc-200 truncate font-medium",
                description: "text-zinc-600",
              }}
            >
              {chat.title}
            </ListboxItem>
          ))}
        </Listbox>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/30 space-y-1">
        <Button
          fullWidth
          variant="light"
          startContent={<Settings size={16} strokeWidth={2} />}
          className="justify-start text-zinc-400 hover:text-zinc-200 hover:bg-white/5 h-10"
          radius="lg"
        >
          <span className="text-sm font-medium">Settings</span>
        </Button>
        <Button
          fullWidth
          variant="light"
          startContent={<User size={16} strokeWidth={2} />}
          className="justify-start text-zinc-400 hover:text-zinc-200 hover:bg-white/5 h-10"
          radius="lg"
        >
          <span className="text-sm font-medium">Profile</span>
        </Button>
      </div>
    </aside>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}
