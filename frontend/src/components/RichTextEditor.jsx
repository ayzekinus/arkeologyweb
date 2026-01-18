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
      />
    </div>
  );
}
