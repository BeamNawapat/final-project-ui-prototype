import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function GapBanner({ children }: Props) {
  return (
    <div className="flex gap-2 items-start rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 dark:bg-amber-500/15">
      <AlertCircle className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <div className="font-semibold mb-0.5">Backend / contract gap</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
