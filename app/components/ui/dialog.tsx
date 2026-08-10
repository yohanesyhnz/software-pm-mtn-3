"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export const Dialog = DialogPrimitive.Root;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className = "", ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={`tw-fixed tw-inset-0 tw-z-[11000] tw-bg-slate-950/65 tw-backdrop-blur-md ${className}`}
      {...props}
    />
  );
});

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ className = "", children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`smart-assistant-dialog tw-fixed tw-left-1/2 tw-top-1/2 tw-z-[11010] tw-max-h-[88dvh] tw-w-[95vw] -tw-translate-x-1/2 -tw-translate-y-1/2 tw-overflow-hidden tw-rounded-2xl tw-border tw-shadow-scada focus:tw-outline-none sm:tw-w-[90vw] md:tw-w-[min(92vw,680px)] ${className}`}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
