"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignRight, AlignCenter, AlignLeft, AlignJustify,
  List, ListOrdered, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3, Type, Link as LinkIcon,
  Image as ImageIcon, Table as TableIcon, Highlighter,
  Palette, Code, AlertTriangle,
} from "lucide-react";

// ============================================================
// Type declarations for custom commands
// ============================================================
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
  }
}

// ============================================================
// امتداد Font Size
// ============================================================
import { Extension } from "@tiptap/core";

export const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
          renderHTML: (attributes) => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: { chain: any }) =>
        chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize: () => ({ chain }: { chain: any }) =>
        chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

export const FontFamily = Extension.create({
  name: "fontFamily",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: (element) => element.style.fontFamily?.replace(/['"]+/g, "") || null,
          renderHTML: (attributes) => {
            if (!attributes.fontFamily) return {};
            return { style: `font-family: ${attributes.fontFamily}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }: { chain: any }) =>
        chain().setMark("textStyle", { fontFamily }).run(),
      unsetFontFamily: () => ({ chain }: { chain: any }) =>
        chain().setMark("textStyle", { fontFamily: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

// ============================================================
// Hook
// ============================================================
export interface EditorStats {
  words: number;
  chars: number;
  pages: number;
}

export type BlockReason = "paste" | "cut" | "drop";

interface WordEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  onBlockAttempt?: (reason: BlockReason) => void;
  onStats?: (stats: EditorStats) => void;
}

export function useWordEditor({
  content,
  onChange,
  editable = true,
  placeholder = "ابدأ كتابة البحث هنا...",
  onBlockAttempt,
  onStats,
}: WordEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      FontFamily,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["right", "center", "left", "justify"],
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      if (onStats) {
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const pages = Math.max(1, Math.ceil(words / 250));
        onStats({ words, chars, pages });
      }
    },
    onCreate: ({ editor }) => {
      if (onStats) {
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const pages = Math.max(1, Math.ceil(words / 250));
        onStats({ words, chars, pages });
      }
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-full",
        dir: "rtl",
        style: "font-family: 'Amiri', 'Traditional Arabic', serif;",
      },
      // منع اللصق
      handlePaste: () => {
        onBlockAttempt?.("paste");
        return true; // يمنع الافتراضي
      },
      // منع السحب والإفلات
      handleDrop: () => {
        onBlockAttempt?.("drop");
        return true;
      },
      // منع Ctrl+V و Ctrl+X
      handleKeyDown: (_view, event) => {
        const ctrl = event.ctrlKey || event.metaKey;
        if (ctrl && (event.key === "v" || event.key === "V")) {
          onBlockAttempt?.("paste");
          return true;
        }
        if (ctrl && (event.key === "x" || event.key === "X")) {
          onBlockAttempt?.("cut");
          return true;
        }
        return false;
      },
    },
  });

  return editor;
}

// ============================================================
// Toolbar
// ============================================================
export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("أدخل الرابط:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("أدخل رابط الصورة:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const fontSize = editor.getAttributes("textStyle").fontSize || "18px";
  const fontFamily = editor.getAttributes("textStyle").fontFamily || "Amiri";

  const TB = ({ onClick, active, children, title, disabled }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition ${
        active ? "bg-[#1e5eb8] text-white" : "hover:bg-gray-100 text-gray-700"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1" />;

  return (
    <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-200 p-2 flex flex-wrap items-center gap-1" dir="rtl">
      <TB onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="تراجع">
        <Undo className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="إعادة">
        <Redo className="w-4 h-4" />
      </TB>

      <Divider />

      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="عنوان 1">
        <Heading1 className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="عنوان 2">
        <Heading2 className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="عنوان 3">
        <Heading3 className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="نص عادي">
        <Type className="w-4 h-4" />
      </TB>

      <Divider />

      <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="عريض">
        <Bold className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="مائل">
        <Italic className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="تحته خط">
        <UnderlineIcon className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="يتوسطه خط">
        <Strikethrough className="w-4 h-4" />
      </TB>

      <Divider />

      <select
        value={fontSize}
        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        className="px-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg bg-white"
        title="حجم الخط"
      >
        {["12px", "14px", "16px", "18px", "20px", "22px", "24px", "28px", "32px", "36px", "48px"].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={fontFamily}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="px-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg bg-white"
        title="نوع الخط"
      >
        <option value="Amiri">Amiri</option>
        <option value="Arial">Arial</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Traditional Arabic">Traditional Arabic</option>
      </select>

      <Divider />

      <TB onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="يمين">
        <AlignRight className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="وسط">
        <AlignCenter className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="شمال">
        <AlignLeft className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="ضبط">
        <AlignJustify className="w-4 h-4" />
      </TB>

      <Divider />

      <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="قائمة نقطية">
        <List className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="قائمة مرقمة">
        <ListOrdered className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="اقتباس">
        <Quote className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="خط فاصل">
        <Minus className="w-4 h-4" />
      </TB>

      <Divider />

      <label className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer" title="لون النص">
        <Palette className="w-4 h-4 text-gray-700" />
        <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="hidden" />
      </label>
      <label className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer" title="تظليل">
        <Highlighter className="w-4 h-4 text-gray-700" />
        <input type="color" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} className="hidden" />
      </label>

      <Divider />

      <TB onClick={addLink} active={editor.isActive("link")} title="إدراج رابط">
        <LinkIcon className="w-4 h-4" />
      </TB>
      <TB onClick={addImage} title="إدراج صورة">
        <ImageIcon className="w-4 h-4" />
      </TB>
      <TB onClick={addTable} title="إدراج جدول">
        <TableIcon className="w-4 h-4" />
      </TB>
      <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="كود">
        <Code className="w-4 h-4" />
      </TB>
    </div>
  );
}

// ============================================================
// Editor مع Toolbar + Stats + Page Boundaries
// ============================================================
export default function WordEditor({
  content,
  onChange,
  editable = true,
  placeholder,
  onBlockAttempt,
  onStats,
}: WordEditorProps) {
  const editor = useWordEditor({ content, onChange, editable, placeholder, onBlockAttempt, onStats });

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} className="p-8 min-h-[500px]" />
    </div>
  );
}

// ============================================================
// شريط الإحصائيات — شريط سفلي ثابت
// ============================================================
export function EditorStatsBar({
  stats,
  lastSaveText,
  blockedCount,
}: {
  stats: EditorStats;
  lastSaveText?: string;
  blockedCount?: number;
}) {
  return (
    <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-2.5 flex items-center justify-between flex-wrap gap-3 text-xs font-black text-gray-600" dir="rtl">
      <div className="flex items-center gap-5 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="text-[#1e5eb8]">📄 الصفحات:</span>
          <span className="text-gray-900">{stats.pages}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-600">📝 الكلمات:</span>
          <span className="text-gray-900">{stats.words.toLocaleString("ar-EG")}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-purple-600">🔤 الحروف:</span>
          <span className="text-gray-900">{stats.chars.toLocaleString("ar-EG")}</span>
        </span>
        {blockedCount !== undefined && blockedCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>محاولات نسخ/لصق محظورة: {blockedCount}</span>
          </span>
        )}
      </div>
      {lastSaveText && (
        <span className="text-[10px] text-gray-400 font-mono">{lastSaveText}</span>
      )}
    </div>
  );
}
