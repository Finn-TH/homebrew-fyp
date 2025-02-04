"use client";

import { motion } from "framer-motion";
import { List, Calendar } from "lucide-react";

type ViewType = "list" | "calendar";

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-[#8B4513]/5 p-1 rounded-lg">
      <motion.button
        onClick={() => onViewChange("list")}
        whileTap={{ scale: 0.95 }}
        className={`p-2 rounded-md transition-colors ${
          currentView === "list"
            ? "bg-white text-[#8B4513] shadow-sm"
            : "text-[#8B4513]/60 hover:text-[#8B4513]"
        }`}
      >
        <List className="h-4 w-4" />
      </motion.button>
      <motion.button
        onClick={() => onViewChange("calendar")}
        whileTap={{ scale: 0.95 }}
        className={`p-2 rounded-md transition-colors ${
          currentView === "calendar"
            ? "bg-white text-[#8B4513] shadow-sm"
            : "text-[#8B4513]/60 hover:text-[#8B4513]"
        }`}
      >
        <Calendar className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
