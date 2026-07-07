import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, Loader2, FileAudio, FileText, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Kind = "image" | "audio" | "doc";

const ACCEPT: Record<Kind, string> = {
  image: "image/png,image/jpeg,image/jpg,image/webp,image/gif",
  audio: "audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/ogg",
  doc: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const MAX_MB: Record<Kind, number> = { image: 8, audio: 100, doc: 25 };

// 10 years — Supabase honors long-lived signed URLs and this keeps content
// links stable for public visitors.
const SIGN_TTL = 60 * 60 * 24 * 365 * 10;

export type FileDropzoneProps = {
  label: string;
  kind: Kind;
  folder: string; // e.g. "articles", "podcasts/covers"
  value: string | null;
  onChange: (url: string | null, meta?: { durationSeconds?: number; fileType?: string; sizeBytes?: number }) => void;
};

export function FileDropzone({ label, kind, folder, value, onChange }: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      const maxBytes = MAX_MB[kind] * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File is too large. Max ${MAX_MB[kind]} MB.`);
        return;
      }
      setUploading(true);
      setProgress(20);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const safeBase = file.name
          .replace(/\.[^.]+$/, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 60) || "file";
        const path = `${folder}/${Date.now()}-${safeBase}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("hub-media")
          .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        setProgress(70);

        const { data: signed, error: signErr } = await supabase.storage
          .from("hub-media")
          .createSignedUrl(path, SIGN_TTL);
        if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Could not sign URL");

        setProgress(90);

        let durationSeconds: number | undefined;
        if (kind === "audio") {
          try {
            durationSeconds = await readAudioDuration(file);
          } catch {
            /* ignore */
          }
        }

        onChange(signed.signedUrl, {
          durationSeconds,
          fileType: ext,
          sizeBytes: file.size,
        });
        setProgress(100);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setError(msg);
      } finally {
        setTimeout(() => setUploading(false), 300);
      }
    },
    [folder, kind, onChange]
  );

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  const Icon = kind === "image" ? ImageIcon : kind === "audio" ? FileAudio : FileText;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          {kind === "image" ? (
            <img src={value} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-sand text-primary">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-muted-foreground">{value}</div>
            {kind === "audio" && <audio controls src={value} className="mt-1 h-8 w-full" />}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange(null)}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-primary bg-sand/60" : "border-border bg-card hover:bg-sand/40"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-muted-foreground">Uploading…</div>
            </>
          ) : (
            <>
              <div className="grid h-11 w-11 place-items-center rounded-full bg-sand text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">Drop {kind === "audio" ? "an audio file" : kind === "image" ? "an image" : "a file"} here</div>
              <div className="text-xs text-muted-foreground">
                or click to browse · up to {MAX_MB[kind]} MB
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT[kind]}
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      )}

      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      URL.revokeObjectURL(url);
      if (isFinite(d)) resolve(Math.round(d));
      else reject(new Error("Duration unavailable"));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read audio"));
    };
  });
}