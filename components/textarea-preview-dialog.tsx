"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, User } from "lucide-react";

interface TextareaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  metadata?: {
    bulan?: string;
    tahun?: string;
    createdBy?: string;
  };
}

export function TextareaPreviewDialog({
  open,
  onOpenChange,
  title,
  content,
  metadata,
}: TextareaPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          {metadata && (
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {metadata.bulan && metadata.tahun && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{metadata.bulan} {metadata.tahun}</span>
                </div>
              )}
              {metadata.createdBy && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Oleh: {metadata.createdBy}</span>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <ScrollArea className="h-[300px] w-full rounded">
              <div className="pr-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
