"use client";

import dynamic from "next/dynamic";
import { Loading01Icon } from "@/components/icons";

const IndiaMap = dynamic(() => import("./IndiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center text-gray-400">
        <Loading01Icon
          className="animate-spin mx-auto mb-2"
          width={32}
          height={32}
        />
        <p>Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapWrapper() {
  return <IndiaMap />;
}
