import { HealtcareIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            © 2025 INGRES AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Built with</span>
            <HealtcareIcon size={14} className="text-red-500" />
            <span>for water conservation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
