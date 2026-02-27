import { useState, type FormEvent } from "react";

import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface UrlImportFormProps {
  onSubmit: (url: string) => Promise<void>;
  loading: boolean;
}

export function UrlImportForm({ onSubmit, loading }: UrlImportFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a URL to import");
      return;
    }

    try {
      await onSubmit(trimmed);
      setUrl("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Import failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste article or RSS URL"
          aria-label="URL input"
        />
        <Button type="submit" disabled={loading} className="sm:w-auto">
          {loading ? "Importing..." : "Import"}
        </Button>
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </form>
  );
}
