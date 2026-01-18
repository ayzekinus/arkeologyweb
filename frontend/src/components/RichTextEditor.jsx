import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "image",
];

export default function RichTextEditor({ value, onChange, placeholder = "" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="[&_.ql-container]:min-h-[220px] [&_.ql-container]:rounded-b-2xl [&_.ql-toolbar]:rounded-t-2xl"

import React, { useEffect, useRef, useState } from "react";

function ToolbarButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = "" }) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isFocused) return;
    const current = editorRef.current.innerHTML;
    const next = value || "";
    if (current !== next) {
      editorRef.current.innerHTML = next;
    }
  }, [value, isFocused]);

  function exec(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange?.(editorRef.current?.innerHTML || "");
  }

  function insertTable() {
    const rows = Number(prompt("Kaç satır?") || 0);
    const cols = Number(prompt("Kaç sütun?") || 0);
    if (!rows || !cols) return;
    const bodyRows = Array.from({ length: rows }, () => {
      const cells = Array.from({ length: cols }, () => "<td>&nbsp;</td>").join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    const tableHtml = `<table><tbody>${bodyRows}</tbody></table>`;
    exec("insertHTML", tableHtml);
  }

  function insertImage() {
    const url = prompt("Görsel URL girin");
    if (!url) return;
    exec("insertImage", url);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton onClick={() => exec("bold")}>Kalın</ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")}>İtalik</ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")}>Altı Çizili</ToolbarButton>
        <ToolbarButton onClick={() => exec("insertUnorderedList")}>Liste</ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")}>Numaralı</ToolbarButton>
        <ToolbarButton onClick={insertTable}>Tablo Ekle</ToolbarButton>
        <ToolbarButton onClick={insertImage}>Görsel Ekle</ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={(event) => onChange?.(event.currentTarget.innerHTML)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 [&[data-placeholder]:empty:before]:text-slate-400 [&[data-placeholder]:empty:before]:content-[attr(data-placeholder)] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2"
      />
    </div>
  );
}
