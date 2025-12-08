"use client";

import { ArrowDown02Icon } from "@/components/icons";
import { Button } from "@heroui/button";
import { AnimatePresence, motion } from "framer-motion";

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
}

export default function ScrollToBottom({
  visible,
  onClick,
}: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
        >
          <Button isIconOnly radius="full" onPress={onClick}>
            <ArrowDown02Icon width={18} height={18} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
