import { DropletIcon, MessageIcon } from "@/components/icons";
import { Button } from "@heroui/button";
import LanguageSelector from "@/components/LanguageSelector";
import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <DropletIcon size={18} className="text-white" />
          </div>
          <span className="font-semibold text-base text-white">INGRES AI</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link href="/chat">
            <Button
              color="primary"
              size="sm"
              className="font-medium"
              endContent={<MessageIcon width={16} height={16} />}
            >
              Get started now
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
