import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PanelSheetProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function PanelSheet({ open, onClose, children }: PanelSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998]"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 40,
              mass: 0.8,
            }}
            className="fixed bottom-0 left-0 right-0 z-[999] max-h-[85vh] rounded-t-3xl bg-[#0B0E14]/95 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/[0.08] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
