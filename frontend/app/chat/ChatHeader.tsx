"use client";
"use i18n";

import {
  DropletIcon,
  MapsIcon,
  Message01Icon,
  Download04Icon,
} from "@/components/icons";
import { Avatar, Button } from "@heroui/react";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import { useState } from "react";

interface ChatHeaderProps {
  showMap: boolean;
  onToggleMap: () => void;
  hasMessages?: boolean;
  onExport?: () => void;
}

export default function ChatHeader({
  showMap,
  onToggleMap,
  hasMessages = false,
  onExport,
}: ChatHeaderProps) {
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
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {hasMessages && onExport && (
            <Button
              size="sm"
              onPress={onExport}
              color="default"
              startContent={
                <Download04Icon className="min-w-4" width={15} height={15} />
              }
              className="h-8"
            >
              <span className="text-xs font-medium">
                <>Export</>
              </span>
            </Button>
          )}
          <Button
            size="sm"
            onPress={onToggleMap}
            color={showMap ? "default" : "primary"}
            startContent={
              showMap ? (
                <Message01Icon className="min-w-4" width={15} height={15} />
              ) : (
                <MapsIcon width={15} height={15} className="min-w-4" />
              )
            }
            className="h-8"
          >
            <span className="text-xs font-medium">
              {showMap ? <>Hide Map</> : <>Show Map</>}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
