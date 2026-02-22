"use client";

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  RotateCcw,
  Redo,
  Image as ImageIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Masukkan teks...",
  rows = 6,
  className = "",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update content when value changes externally
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Don't call handleInput here, let the onInput event handle it
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle image insertion
  const handleImageInsert = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }

    // Limit image size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB!');
      return;
    }

    try {
      const base64 = await fileToBase64(file);

      // Insert image at cursor position
      editorRef.current?.focus();
      const imgHtml = `<img src="${base64}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 4px auto; display: block; object-fit: contain;" />`;
      document.execCommand('insertHTML', false, imgHtml);

      // Trigger onChange
      handleInput();
    } catch (error) {
      console.error('Error inserting image:', error);
      alert('Gagal memasukkan gambar!');
    }
  };

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageInsert(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste event
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if pasted content is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageInsert(file);
        }
        break;
      }
    }
  };

  const toolbarGroups = [
    // History
    [
      { icon: RotateCcw, command: 'undo', title: 'Undo (Ctrl+Z)' },
      { icon: Redo, command: 'redo', title: 'Redo (Ctrl+Y)' },
    ],
    // Text Format
    [
      { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
      { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
      { icon: Underline, command: 'underline', title: 'Underline (Ctrl+U)' },
    ],
    // Headings
    [
      { icon: Heading1, command: 'formatBlock', value: 'H1', title: 'Heading 1' },
      { icon: Heading2, command: 'formatBlock', value: 'H2', title: 'Heading 2' },
      { icon: Heading3, command: 'formatBlock', value: 'H3', title: 'Heading 3' },
    ],
    // Lists
    [
      { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
      { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    ],
    // Special
    [
      { icon: Quote, command: 'formatBlock', value: 'BLOCKQUOTE', title: 'Quote' },
      { icon: Code, command: 'insertHTML', value: '<code></code>', title: 'Inline Code' },
      { icon: Minus, command: 'insertHorizontalRule', title: 'Horizontal Line' },
    ],
    // Image
    [
      {
        icon: ImageIcon,
        isImage: true,
        title: 'Insert Image'
      },
    ],
    // Alignment
    [
      { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
      { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
      { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    ],
  ];

  return (
    <div className={`border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 p-2 flex flex-wrap gap-1">
        {toolbarGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="flex gap-1 border-r border-slate-300 dark:border-slate-600 pr-1 mr-1 last:border-0">
            {group.map((btn, btnIndex) => {
              const Icon = btn.icon;
              const uniqueKey = `${groupIndex}-${btnIndex}-${('command' in btn) ? btn.command : 'image'}`;

              // Handle image button separately
              if ('isImage' in btn && btn.isImage) {
                return (
                  <Button
                    key={uniqueKey}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    title={btn.title}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </Button>
                );
              }

              return (
                <Button
                  key={uniqueKey}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => 'command' in btn && execCommand(btn.command, btn.value)}
                  className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  title={btn.title}
                >
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="p-3 min-h-[150px] focus:outline-none bg-white dark:bg-slate-900 text-sm caret-slate-900 dark:caret-slate-100 cursor-text"
        style={{ minHeight: `${rows * 24}px` }}
        data-placeholder={placeholder}
      />

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* CSS for placeholder */}
      <style jsx global>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          white-space: pre-wrap;
        }
        [contenteditable] {
          line-height: 1.5;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }
        [contenteditable] li {
          margin: 0.1rem 0;
          padding: 0;
        }
        [contenteditable] p {
          margin: 0.1rem 0;
        }
        [contenteditable] h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        [contenteditable] h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.4rem 0 0.2rem 0;
        }
        [contenteditable] h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.3rem 0 0.15rem 0;
        }
        [contenteditable] blockquote {
          border-left: 3px solid #e2e8f0;
          padding-left: 0.75rem;
          margin: 0.25rem 0;
          font-style: italic;
          color: #64748b;
        }
        [contenteditable] code {
          background-color: #f1f5f9;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        [contenteditable] hr {
          margin: 0.5rem 0;
          border: none;
          border-top: 1px solid #e2e8f0;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 4px auto;
          display: block;
          object-fit: contain;
        }
        [contenteditable] p {
          margin-bottom: 0.25rem;
        }
        [contenteditable] p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export { RichTextEditor };
