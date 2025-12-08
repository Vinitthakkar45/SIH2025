"use client";

import {
  DropletIcon,
  Location01Icon,
  MapsIcon,
  Message01Icon,
} from "@/components/icons";
import { Avatar, Button } from "@heroui/react";
import Link from "next/link";

interface ChatHeaderProps {
  showMap: boolean;
  onToggleMap: () => void;
}

export default function ChatHeader({ showMap, onToggleMap }: ChatHeaderProps) {
  return (
    <header className="bg-zinc-900 px-3 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link className="flex items-center gap-2" href={"/"}>
          <Avatar
            icon={<DropletIcon width={16} height={16} />}
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
        </Link>
        <Button
          size="sm"
          onPress={onToggleMap}
          color={showMap ? "default" : "primary"}
          startContent={
            showMap ? (
              <Message01Icon width={15} height={15} />
            ) : (
              <MapsIcon width={15} height={15} />
            )
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
