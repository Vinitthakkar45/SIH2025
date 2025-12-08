"use client";

import { Button, Avatar } from "@heroui/react";
import { Menu, Map, MessageSquare, Droplet } from "lucide-react";

interface ChatHeaderProps {
  showMap: boolean;
  onToggleMap: () => void;
  onToggleSidebar: () => void;
}

export default function ChatHeader({
  showMap,
  onToggleMap,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <header className="bg-zinc-900 px-3 py-2.5 border-b border-zinc-800/50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            variant="light"
            onPress={onToggleSidebar}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 min-w-8 h-8"
            size="sm"
          >
            <Menu size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar
              icon={<Droplet size={16} />}
              className="w-7 h-7 bg-blue-600 text-white"
              radius="sm"
            />
            <div>
              <h1 className="font-semibold text-zinc-100 text-[13px] leading-tight">
                INGRES AI
              </h1>
              <p className="text-[11px] text-zinc-500 leading-tight">
                Groundwater Resource Information
              </p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onPress={onToggleMap}
          color={showMap ? "default" : "primary"}
          startContent={
            showMap ? <MessageSquare size={15} /> : <Map size={15} />
          }
          className="h-8"
          radius="lg"
        >
          <span className="text-[13px] font-medium">
            {showMap ? "Hide Map" : "Show Map"}
          </span>
        </Button>
      </div>
    </header>
  );
}
