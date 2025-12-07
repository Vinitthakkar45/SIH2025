import React from "react";
import { Droplets, MessageCircle } from "lucide-react";

interface ChatToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread?: boolean;
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({ onClick, isOpen, hasUnread = false }) => {
  if (isOpen) return null;

  return (
    <button onClick={onClick} className="ig-fixed ig-bottom-6 ig-right-6 ig-z-[999998] ig-group" title="Open INGRES AI Assistant">
      {/* Main Button */}
      <div className="ig-relative ig-w-16 ig-h-16 ig-rounded-full ig-bg-gradient-to-br ig-from-water-500 ig-to-primary-600 ig-shadow-lg ig-flex ig-items-center ig-justify-center ig-transition-all ig-duration-300 group-hover:ig-scale-110 group-hover:ig-shadow-xl group-active:ig-scale-95">
        {/* Ripple Effect */}
        <div className="ig-absolute ig-inset-0 ig-rounded-full ig-bg-white/20 ig-animate-ping ig-opacity-75" />

        {/* Icon */}
        <div className="ig-relative ig-flex ig-items-center ig-justify-center">
          <Droplets className="ig-w-7 ig-h-7 ig-text-white" />
        </div>

        {/* Unread Badge */}
        {hasUnread && (
          <div className="ig-absolute -ig-top-1 -ig-right-1 ig-w-5 ig-h-5 ig-rounded-full ig-bg-red-500 ig-flex ig-items-center ig-justify-center ig-shadow-md">
            <span className="ig-text-white ig-text-xs ig-font-bold">!</span>
          </div>
        )}

        {/* Chat Icon Badge */}
        <div className="ig-absolute -ig-bottom-1 -ig-right-1 ig-w-6 ig-h-6 ig-rounded-full ig-bg-white ig-flex ig-items-center ig-justify-center ig-shadow-md">
          <MessageCircle className="ig-w-3.5 ig-h-3.5 ig-text-primary-600" />
        </div>
      </div>

      {/* Tooltip */}
      <div className="ig-absolute ig-bottom-full ig-right-0 ig-mb-3 ig-opacity-0 group-hover:ig-opacity-100 ig-transition-opacity ig-duration-200 ig-pointer-events-none">
        <div className="ig-bg-gray-900 ig-text-white ig-text-sm ig-px-3 ig-py-2 ig-rounded-lg ig-shadow-lg ig-whitespace-nowrap">
          INGRES AI Assistant
          <div className="ig-absolute ig-bottom-0 ig-right-6 ig-transform ig-translate-y-1/2 ig-rotate-45 ig-w-2 ig-h-2 ig-bg-gray-900" />
        </div>
      </div>
    </button>
  );
};
