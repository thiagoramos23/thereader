import { Search } from "lucide-react";

import { Input } from "./ui/Input";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-textMuted" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search saved articles"
        className="pl-10"
      />
    </label>
  );
}
