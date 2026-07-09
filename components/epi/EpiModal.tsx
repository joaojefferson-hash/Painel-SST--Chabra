"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";

export const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-verde-primary focus:outline-none focus:ring-1 focus:ring-verde-primary/30";
export const labelCls = "block text-xs font-medium text-gray-600 mb-1";

/** Casca de modal centralizado com backdrop. */
export default function EpiModal({
  open, title, onClose, children, footer, maxWidth = "max-w-lg",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Fechar">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
