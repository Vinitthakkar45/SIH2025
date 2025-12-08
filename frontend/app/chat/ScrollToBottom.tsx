"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
}

export default function ScrollToBottom({ visible, onClick }: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
        >
          <Button
            isIconOnly
            radius="full"
            size="sm"
            onPress={onClick}
            className="bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 shadow-lg border border-zinc-700/50 backdrop-blur-sm"
          >
            <ArrowDown size={16} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
