"use i18n";
"use client";

import { ChartAverageIcon } from "../icons";

export default function ViewChartTitle() {
  return (
    <div className="text-sm text-zinc-400 font-semibold flex items-center gap-3 group-hover:text-white">
      View Charts
      <span>
        <ChartAverageIcon />
      </span>
    </div>
  );
}
