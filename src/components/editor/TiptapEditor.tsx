import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image as ImageExt } from "@tiptap/extension-image";
import { Link as LinkExt } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Youtube } from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Pilcrow,
  RemoveFormatting,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Table as TableIcon,
  Minus,
  Highlighter,
  Undo2,
  Redo2,
  Eye,
} from "lucide-react";

type Props = {
  value: unknown;
  onChange: (json: unknown, html: string) => void;
  placeholder?: string;
};

export function TiptapEditor({ value, onChange, placeholder }: Props) {
  const [preview, setPreview] = useState(false);
  const initialised = useRef(false);

  const editor = useEditor({
    extensions: [
      // StarterKit v3 bundles Underline and Link — disable them here so our
      // custom-configured versions below are the single source of truth.
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      Highlight,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { class: "text-primary underline", rel: "noopener noreferrer", target: "_blank" },
      }),
      ImageExt.configure({ HTMLAttributes: { class: "rounded-xl" } }),
      Youtube.configure({ width: 640, height: 360, controls: true, HTMLAttributes: { class: "rounded-xl" } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: (value as object) ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none min-h-[400px] focus:outline-none font-serif px-6 py-5 [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif",
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        (async () => {
          for (const file of files) {
            const ext = file.name.split(".").pop() ?? "png";
            const path = `editor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error } = await supabase.storage.from("hub-media").upload(path, file, { contentType: file.type });
            if (error) continue;
            const { data: signed } = await supabase.storage
              .from("hub-media")
              .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
            if (signed?.signedUrl) {
              const editorInstance = (view as unknown as { editor?: Editor }).editor;
              editorInstance?.chain().focus().setImage({ src: signed.signedUrl }).run();
            }
          }
        })();
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON(), ed.getHTML());
    },
  });

  // Load initial value once (avoids remount on parent state churn)
  useEffect(() => {
    if (!editor || initialised.current) return;
    if (value) editor.commands.setContent(value as object);
    initialised.current = true;
  }, [editor, value]);

  if (!editor) return <div className="h-96 rounded-xl border border-border/60 bg-muted animate-pulse" />;

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <Toolbar editor={editor} preview={preview} setPreview={setPreview} />
      {preview ? (
        <div
          className="prose prose-neutral max-w-none font-serif px-6 py-5 min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

function Toolbar({
  editor,
  preview,
  setPreview,
}: {
  editor: Editor;
  preview: boolean;
  setPreview: (v: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `editor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("hub-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("hub-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed?.signedUrl) editor.chain().focus().setImage({ src: signed.signedUrl }).run();
    } finally {
      setUploading(false);
    }
  }

  function pickImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => input.files && input.files[0] && uploadImage(input.files[0]);
    input.click();
  }

  function insertLink() {
    const prev = editor.getAttributes("link").href ?? "";
    const url = prompt("URL", prev);
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertYoutube() {
    const url = prompt("YouTube URL");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  const B = ({
    on,
    active,
    children,
    title,
  }: {
    on: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      size="icon"
      variant={active ? "default" : "ghost"}
      className="h-8 w-8"
      onClick={on}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-sand/40 px-2 py-1.5">
      <B on={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph">
        <Pilcrow className="h-4 w-4" />
      </B>
      <B on={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1">
        <Heading1 className="h-4 w-4" />
      </B>
      <B on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
        <Heading2 className="h-4 w-4" />
      </B>
      <B on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
        <Heading3 className="h-4 w-4" />
      </B>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <B on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting"><RemoveFormatting className="h-4 w-4" /></B>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <B on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bulleted"><List className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered"><ListOrdered className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist"><ListChecks className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code"><Code2 className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></B>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <B on={insertLink} active={editor.isActive("link")} title="Link"><LinkIcon className="h-4 w-4" /></B>
      <B on={pickImage} title={uploading ? "Uploading…" : "Image"}><ImageIcon className="h-4 w-4" /></B>
      <B on={insertYoutube} title="YouTube"><YoutubeIcon className="h-4 w-4" /></B>
      <B on={insertTable} title="Table"><TableIcon className="h-4 w-4" /></B>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <B on={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></B>
      <B on={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></B>
      <div className="ml-auto">
        <Button
          type="button"
          size="sm"
          variant={preview ? "default" : "outline"}
          className="rounded-full h-8 gap-1"
          onClick={() => setPreview(!preview)}
        >
          <Eye className="h-3.5 w-3.5" /> {preview ? "Editing" : "Preview"}
        </Button>
      </div>
    </div>
  );
}