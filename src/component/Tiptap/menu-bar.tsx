"use client";

import React from "react";
import type { Editor } from "@tiptap/react";

// ✅ فقط ۳ آیکن
import { Scissors, Copy as CopyIcon, ClipboardPaste } from "lucide-react";

type Props = {
  editor: Editor | null;
};

const COLORS = [
  { name: "مشکی", value: "#000000" },
  { name: "قرمز", value: "#EF4444" },
  { name: "آبی", value: "#3B82F6" },
  { name: "سبز", value: "#22C55E" },
  { name: "نارنجی", value: "#F59E0B" },
];

function Sep() {
  return <div className="mx-1 h-6 w-px bg-slate-200" />;
}

function ToolBtn({
  label,
  title,
  active,
  disabled,
  onClick,
  mono,
}: {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  mono?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "h-8 min-w-8 px-2 rounded-md border text-sm transition",
        mono ? "font-mono" : "font-semibold",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function IconBtn({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-700",
        "inline-flex items-center justify-center transition",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ✅ helper: fallback copy
async function copyTextFallback(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

export default function MenuBar({ editor }: Props) {
  if (!editor) return null;

  const disabled = !editor.isEditable;

  // ✅ انتخاب فعلی (اگر انتخاب خالی بود، کل متن)
  const getSelectedTextOrAll = () => {
    const { from, to, empty } = editor.state.selection as any;
    if (!empty && typeof from === "number" && typeof to === "number") {
      return editor.state.doc.textBetween(from, to, "\n");
    }
    return editor.getText();
  };

  const handleCopy = async () => {
    try {
      const text = getSelectedTextOrAll();
      console.log("[Tiptap][Clipboard] copy text:", text);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        console.log("[Tiptap][Clipboard] copy ✅ (navigator.clipboard)");
      } else {
        const ok = await copyTextFallback(text);
        console.log("[Tiptap][Clipboard] copy fallback:", ok);
      }
    } catch (e) {
      console.log("[Tiptap][Clipboard] copy error:", e);
    }
  };

  const handleCut = async () => {
    try {
      const { empty } = editor.state.selection as any;
      if (empty) {
        console.log("[Tiptap][Clipboard] cut: selection empty -> nothing");
        return;
      }

      const text = getSelectedTextOrAll();
      console.log("[Tiptap][Clipboard] cut text:", text);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        console.log("[Tiptap][Clipboard] cut copy ✅ (navigator.clipboard)");
      } else {
        const ok = await copyTextFallback(text);
        console.log("[Tiptap][Clipboard] cut copy fallback:", ok);
      }

      editor.chain().focus().deleteSelection().run();
      console.log("[Tiptap][Clipboard] cut deleteSelection ✅");
    } catch (e) {
      console.log("[Tiptap][Clipboard] cut error:", e);
    }
  };

  const handlePaste = async () => {
    try {
      console.log("[Tiptap][Clipboard] paste click");

      if (!navigator.clipboard?.readText) {
        console.log("[Tiptap][Clipboard] paste not supported -> use Ctrl+V");
        return;
      }

      const text = await navigator.clipboard.readText();
      console.log("[Tiptap][Clipboard] paste readText:", text);

      if (!text) return;

      editor.chain().focus().insertContent(text).run();
      console.log("[Tiptap][Clipboard] paste insert ✅");
    } catch (e) {
      console.log("[Tiptap][Clipboard] paste error (likely permission):", e);
      console.log("[Tiptap][Clipboard] hint: user can paste with Ctrl+V");
    }
  };

  const setColor = (hex: string) => {
    console.log("[Tiptap][Color] setColor:", hex);
    editor.chain().focus().setColor(hex).run();
  };

  const unsetColor = () => {
    console.log("[Tiptap][Color] unsetColor");
    editor.chain().focus().unsetColor().run();
  };

  return (
    <div className="mb-2 flex flex-wrap items-center justify-center gap-2 rounded-md border border-gray-200 bg-white p-2">
      {/* ✅ فقط ۳ آیکن */}
      <IconBtn title="برش" disabled={disabled} onClick={handleCut}>
        <Scissors className="h-4 w-4" />
      </IconBtn>

      <IconBtn title="کپی" disabled={disabled} onClick={handleCopy}>
        <CopyIcon className="h-4 w-4" />
      </IconBtn>

      <IconBtn title="چسباندن" disabled={disabled} onClick={handlePaste}>
        <ClipboardPaste className="h-4 w-4" />
      </IconBtn>

      <Sep />

      {/* متن */}
      <ToolBtn
        label="B"
        title="بولد"
        disabled={disabled}
        active={editor.isActive("bold")}
        onClick={() => {
          console.log("[Tiptap] toggleBold");
          editor.chain().focus().toggleBold().run();
        }}
      />
      <ToolBtn
        label="I"
        title="ایتالیک"
        disabled={disabled}
        active={editor.isActive("italic")}
        onClick={() => {
          console.log("[Tiptap] toggleItalic");
          editor.chain().focus().toggleItalic().run();
        }}
      />
      <ToolBtn
        label="U"
        title="زیرخط"
        disabled={disabled}
        active={editor.isActive("underline")}
        onClick={() => {
          console.log("[Tiptap] toggleUnderline");
          editor.chain().focus().toggleUnderline().run();
        }}
      />
      <ToolBtn
        label="S"
        title="خط‌خورده"
        disabled={disabled}
        active={editor.isActive("strike")}
        onClick={() => {
          console.log("[Tiptap] toggleStrike");
          editor.chain().focus().toggleStrike().run();
        }}
      />

      <Sep />

      {/* لیست */}
      <ToolBtn
        label="•"
        title="لیست بولت"
        disabled={disabled}
        active={editor.isActive("bulletList")}
        mono
        onClick={() => {
          console.log("[Tiptap] toggleBulletList");
          editor.chain().focus().toggleBulletList().run();
        }}
      />
      <ToolBtn
        label="1."
        title="لیست شماره‌ای"
        disabled={disabled}
        active={editor.isActive("orderedList")}
        mono
        onClick={() => {
          console.log("[Tiptap] toggleOrderedList");
          editor.chain().focus().toggleOrderedList().run();
        }}
      />

      <Sep />

      {/* هایلایت */}
      <ToolBtn
        label="HL"
        title="هایلایت"
        disabled={disabled}
        active={editor.isActive("highlight")}
        mono
        onClick={() => {
          console.log("[Tiptap] toggleHighlight");
          editor.chain().focus().toggleHighlight().run();
        }}
      />

      <Sep />

      {/* رنگ‌های اصلی */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-slate-500">رنگ</span>

        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            disabled={disabled}
            onClick={() => setColor(c.value)}
            title={c.name}
            className={[
              "h-6 w-6 rounded-full border border-slate-300",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
            ].join(" ")}
            style={{ backgroundColor: c.value }}
          />
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={unsetColor}
          className={[
            "h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-700 bg-white",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
          ].join(" ")}
          title="حذف رنگ"
        >
          حذف
        </button>
      </div>
    </div>
  );
}
