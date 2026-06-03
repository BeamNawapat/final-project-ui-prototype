interface ProductTagProps {
  name: string;
  color?: string;
}

export function ProductTag({ name, color }: ProductTagProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: color ?? "oklch(0.7 0.18 240)" }}
        aria-hidden
      />
      <span className="font-medium">{name}</span>
    </div>
  );
}
