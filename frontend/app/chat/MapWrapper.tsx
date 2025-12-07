"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const IndiaMap = dynamic(() => import("./IndiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center text-gray-400">
        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
        <p>Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapWrapper() {
  return <IndiaMap />;
}
