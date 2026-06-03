import { Terminal } from "lucide-react";

interface Props {
  contract: string;
  fn: string;
  args: Array<{ name: string; value: string | number }>;
  note?: string;
}

export function SimulatedTxReceipt({ contract, fn, args, note }: Props) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2 font-mono text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Terminal className="size-3.5" />
        <span className="uppercase tracking-wider text-[10px]">Will execute</span>
      </div>
      <div className="text-foreground leading-relaxed break-all">
        <span className="text-primary font-semibold">{contract}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{fn}</span>
        <span className="text-muted-foreground">(</span>
        <div className="pl-3 my-1 flex flex-col gap-0.5">
          {args.map((a, i) => (
            <div key={a.name}>
              <span className="text-muted-foreground">{a.name}:</span>{" "}
              <span className="text-foreground">{String(a.value)}</span>
              {i < args.length - 1 && <span className="text-muted-foreground">,</span>}
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">)</span>
      </div>
      {note && <div className="text-[11px] text-muted-foreground italic">{note}</div>}
    </div>
  );
}
