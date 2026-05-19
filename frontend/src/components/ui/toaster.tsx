"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          className={cn(
            "grid w-96 max-w-[calc(100vw-2rem)] gap-1 rounded-lg border bg-card p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out",
            toast.variant === "destructive" && "border-destructive/40"
          )}
          duration={3500}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id);
          }}
        >
          <ToastPrimitive.Title className="text-sm font-semibold">{toast.title}</ToastPrimitive.Title>
          {toast.description ? (
            <ToastPrimitive.Description className="text-sm text-muted-foreground">{toast.description}</ToastPrimitive.Description>
          ) : null}
          <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
