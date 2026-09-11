'use client';

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontSize } from "./ui/font-size";
import MenuBar from "./menu-bar";
import { CustomStrike } from "./ui/custom-strike";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  height?: string;     // ارتفاع ثابت (اختیاری)
  minHeight?: string;  // حداقل ارتفاع
  maxHeight?: string;  // حداکثر ارتفاع - اگر متن زیاد شود اسکرول می‌خورد
  readOnly?: boolean;
  justify?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  height,
  minHeight = "min-h-[300px]",
  maxHeight = "max-h-[500px]", // 👈 اضافه شد
  readOnly = false,
  justify = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        strike: false,
        bulletList: { HTMLAttributes: { class: "list-disc ml-3" } },
        orderedList: { HTMLAttributes: { class: "list-decimal ml-3" } },
      }),
      CustomStrike,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: { class: "bg-yellow-200" },
      }),
      TextStyle,
      Color,
      FontSize,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      if (justify) editor.chain().focus().setTextAlign("justify").run();
      editor.chain().focus().setColor("black").setFontSize("14px").run();
    }
  }, [editor, justify]);

  return (
    <div className="flex flex-col h-full">
      <MenuBar editor={editor} />

      <div
        className={`${height || ""} ${minHeight} ${maxHeight} w-full border border-gray-300 rounded-md overflow-y-auto bg-white focus-within:border-gray-300`}
      >
        <EditorContent
          editor={editor}
          className="w-full h-full p-3 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0"
        />
      </div>
    </div>
  );

}
