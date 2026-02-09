'use client';

import { Editor } from "@tiptap/react";
import { Toggle } from "./ui/toggle";
import { Bold, Italic, Strikethrough, Highlighter } from "lucide-react";
import { Menu } from "@headlessui/react";
import { useState } from "react";

interface MenuBarProps {
  editor: Editor | null;
}

const COLORS = [
  { label: "مشکی", value: "black" },
  { label: "قرمز", value: "red" },
  { label: "سبز", value: "green" },
  { label: "آبی", value: "blue" },
  { label: "نارنجی", value: "orange" },
  { label: "بنفش", value: "purple" },
];

const FONT_SIZES = [
  { label: "12 px", value: "12px" },
  { label: "14 px", value: "14px" },
  { label: "16 px", value: "16px" },
  { label: "18 px", value: "18px" },
  { label: "20 px", value: "20px" },
  { label: "24 px", value: "24px" },
];

export default function MenuBar({ editor }: MenuBarProps) {
  const [colorValue, setColorValue] = useState<string>("مشکی");
  const [fontSizeValue, setFontSizeValue] = useState<string>("");

  if (!editor) return null;

  const Options = [
    {
      icon: <Bold className="size-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      pressed: editor.isActive("bold"),
    },
    {
      icon: <Italic className="size-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      pressed: editor.isActive("italic"),
    },
    {
      icon: <Strikethrough className="size-4" />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      pressed: editor.isActive("strike"),
    },
    {
      icon: <Highlighter className="size-4" />,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      pressed: editor.isActive("highlight"),
    },
  ];

  // اعمال رنگ مشکی دیفالت به TipTap
  editor.chain().focus().setColor('black').run();

  return (
    <div className="border rounded-t-md p-0 mb-0 bg-gray-50 flex flex-wrap gap-2 items-center">

      {/* Bold / Italic / Strike */}
      {Options.map((option, index) => (
        <Toggle
          key={index}
          pressed={option.pressed}
          onPressedChange={option.onClick}
        >
          {option.icon}
        </Toggle>
      ))}


      {/* Dropdown اندازه فونت */}
      <Menu as="div" className="relative inline-block w-32 text-right">
        <Menu.Button className="w-full border rounded px-2 py-1 text-left">
          {fontSizeValue || "اندازه فونت"}
        </Menu.Button>
        <Menu.Items className="absolute mt-1 w-full bg-white border rounded shadow-md z-50 origin-top-right right-0">
          {FONT_SIZES.map(f => (
            <Menu.Item key={f.value}>
              {({ active }) => (
                <button
                  className={`w-full px-3 py-1 text-left ${active ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => {
                    setFontSizeValue(f.label);
                    editor.chain().focus().setFontSize(f.value).run();
                  }}
                >
                  {f.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu>

    </div>
  );
}
