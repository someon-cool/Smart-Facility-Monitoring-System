"use client";

import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import { CopilotPanel } from "./copilot/CopilotPanel";

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiCopilotDrawer({ isOpen, onClose }: AiCopilotDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        title="Facility Copilot"
        description="Terminal 2 telemetry & operational intelligence"
        bodyClassName="p-0 overflow-hidden flex flex-col"
        className="max-w-[440px]"
      >
        <CopilotPanel isDrawer onClose={onClose} className="h-full" />
      </DrawerContent>
    </Drawer>
  );
}
