"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BracketInput } from "@/components/admin/bracket-input";
import { DateTimePicker } from "@/components/admin/datetime-picker";
import { ProductCombobox, findProduct } from "@/components/admin/product-combobox";
import { SimulatedTxReceipt } from "@/components/admin/simulated-tx-receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminCreateBinary, adminCreateMulti } from "@/lib/sim/service";

function plusDaysLocal(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 16);
}

function minus2hLocal(resolutionLocal: string): string {
  return new Date(new Date(resolutionLocal).getTime() - 2 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtLong(local: string): string {
  if (!local) return "—";
  return new Date(local).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Mock "latest price" — would come from /api/products/:code/prices in real impl.
const MOCK_LATEST_PRICE: Record<string, { price: number; date: string }> = {
  RICE_HOMMALI: { price: 14150, date: "2026-05-12" },
  RICE_JASMINE: { price: 13700, date: "2026-05-12" },
  PALM_OIL: { price: 34.5, date: "2026-05-12" },
  CASSAVA_STARCH: { price: 518, date: "2026-05-12" },
  DURIAN_MONTHONG: { price: 168, date: "2026-05-12" },
  RUBBER_RSS3: { price: 76.2, date: "2026-05-12" },
  RUBBER_PARA: { price: 62, date: "2026-05-12" },
  SUGAR_RAW: { price: 478, date: "2026-05-12" },
  LONGAN: { price: 64, date: "2026-05-12" },
  MANGO_NAMDOKMAI: { price: 108, date: "2026-05-12" },
  CORN_FEED: { price: 9.85, date: "2026-05-12" },
  COFFEE_ROBUSTA: { price: 128, date: "2026-05-12" },
};

export default function CreateMarketPage() {
  const router = useRouter();
  const [marketType, setMarketType] = useState<"binary" | "multi">("binary");

  return (
    <div className="space-y-6">
      {/* Breadcrumb + heading */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/markets" className="hover:text-foreground">
            Markets
          </Link>
          <span>/</span>
          <span>Create</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Create Market</h1>
        <p className="text-muted-foreground">
          Spin up a new prediction market for a Thai agricultural commodity.
        </p>
      </div>

      <Tabs value={marketType} onValueChange={(v) => setMarketType(v as "binary" | "multi")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="binary">Binary (YES / NO)</TabsTrigger>
          <TabsTrigger value="multi">Multi-Bracket</TabsTrigger>
        </TabsList>

        <TabsContent value="binary">
          <BinaryMarketForm onSuccess={() => router.push("/admin/markets")} />
        </TabsContent>
        <TabsContent value="multi">
          <MultiBracketMarketForm onSuccess={() => router.push("/admin/markets")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Binary
// ─────────────────────────────────────────────────────────────────
function BinaryMarketForm({ onSuccess }: { onSuccess: () => void }) {
  const [productCode, setProductCode] = useState("RICE_HOMMALI");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState("");
  const [resolutionTime, setResolutionTime] = useState(plusDaysLocal(14));
  const [tradingCutoff, setTradingCutoff] = useState(minus2hLocal(plusDaysLocal(14)));
  const [autoCutoff, setAutoCutoff] = useState(true);
  const [disputeDays, setDisputeDays] = useState("3");
  const [submitting, setSubmitting] = useState(false);

  const product = findProduct(productCode);
  const latest = MOCK_LATEST_PRICE[productCode];

  // Prefill threshold from latest price on product change.
  useEffect(() => {
    if (latest) setThreshold(latest.price.toString());
  }, [productCode, latest?.price, latest]);

  useEffect(() => {
    if (autoCutoff) setTradingCutoff(minus2hLocal(resolutionTime));
  }, [resolutionTime, autoCutoff]);

  const cutoffInvalid =
    tradingCutoff && resolutionTime &&
    new Date(tradingCutoff).getTime() >= new Date(resolutionTime).getTime();

  function autoGenTitle() {
    if (!product || !threshold) return;
    const dateStr = resolutionTime
      ? new Date(resolutionTime).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";
    setTitle(
      `Will ${product.name} exceed ${Number(threshold).toLocaleString()} ${product.unit}${
        dateStr ? ` by ${dateStr}` : ""
      }?`,
    );
  }

  const finalTitle =
    title.trim() ||
    `${product?.name ?? "Asset"} > ${threshold || "?"} ${product?.unit ?? ""}`;

  const resolutionDate = resolutionTime ? new Date(resolutionTime) : null;
  const isWeekend =
    resolutionDate && (resolutionDate.getDay() === 0 || resolutionDate.getDay() === 6);

  async function submit() {
    if (!product || !threshold || cutoffInvalid) return;
    setSubmitting(true);
    try {
      await adminCreateBinary({
        productCode,
        productName: product.name,
        productCategory: product.category,
        title: finalTitle,
        description,
        threshold: Number(threshold),
        thresholdUnit: product.unit,
        resolutionTime: new Date(resolutionTime).toISOString(),
        tradingCutoffTime: new Date(tradingCutoff).toISOString(),
        disputePeriodDays: Number(disputeDays),
      });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300">
            Binary
          </Badge>
          YES / NO Market
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Product */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Product *</label>
          <ProductCombobox value={productCode} onChange={setProductCode} />
          {product && (
            <p className="text-xs text-muted-foreground">Category: {product.category}</p>
          )}
        </div>

        {/* Threshold */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Threshold Price ({product?.unit ?? "—"}) *
          </label>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 60.00"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {product?.unit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Resolves YES if actual price ≥ threshold, NO if below.
          </p>
        </div>

        {/* Latest price reference */}
        {latest && (
          <Card className="bg-muted/30 border-border/50 gap-1 py-3">
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest avg price</span>
                <span className="font-mono font-medium">
                  {latest.price.toLocaleString()} {product?.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-0.5">
                Source: MOC daily wholesale · {latest.date}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resolution date */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Resolution Date &amp; Time *</label>
          <DateTimePicker
            value={resolutionTime}
            onChange={setResolutionTime}
            minDate={todayLocal()}
          />
          {isWeekend && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠ Resolution falls on{" "}
              {resolutionDate?.getDay() === 6 ? "Saturday" : "Sunday"}. MOC publishes Mon–Fri
              only — market will resolve using the last weekday price (usually Friday).
            </p>
          )}
        </div>

        {/* Trading cutoff */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Trading Ends At</label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoCutoff}
                onChange={(e) => setAutoCutoff(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Auto −2h from resolution
            </label>
          </div>
          <DateTimePicker
            value={tradingCutoff}
            onChange={(v) => {
              setAutoCutoff(false);
              setTradingCutoff(v);
            }}
            minDate={todayLocal()}
          />
          {cutoffInvalid && (
            <p className="text-xs text-destructive">
              Trading cutoff must be before resolution time.
            </p>
          )}
        </div>

        {/* Dispute period */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dispute Period</label>
          <Select value={disputeDays} onValueChange={setDisputeDays}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Day (Testnet)</SelectItem>
              <SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Window after resolution for traders to challenge the oracle outcome.
          </p>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Market Title</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={autoGenTitle}
              disabled={!product || !threshold}
            >
              Auto-generate
            </Button>
          </div>
          <Input
            placeholder={`e.g. Will ${product?.name ?? "asset"} exceed ${product?.unit ?? "?"}?`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description (optional)</label>
          <Input
            placeholder="Additional context for traders"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Preview */}
        {product && threshold && resolutionTime && (
          <Card className="bg-muted/40">
            <CardContent className="space-y-2 text-sm">
              <h4 className="text-sm font-semibold">Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <p>
                  <span className="text-muted-foreground">Question:</span>{" "}
                  <span className="font-medium">{finalTitle}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Outcomes:</span>{" "}
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300 mr-1">
                    YES
                  </Badge>
                  ≥ {Number(threshold).toLocaleString()}
                  <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300 ml-2 mr-1">
                    NO
                  </Badge>
                  &lt; {Number(threshold).toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Resolves:</span>{" "}
                  {fmtLong(resolutionTime)}
                </p>
                <p>
                  <span className="text-muted-foreground">Trading ends:</span>{" "}
                  {fmtLong(tradingCutoff)}
                </p>
                <p>
                  <span className="text-muted-foreground">Dispute period:</span> {disputeDays} day(s)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simulated tx receipt */}
        <SimulatedTxReceipt
          contract="AgriMarketFactoryV2"
          fn="createBinaryMarket"
          args={[
            { name: "productCode", value: `"${productCode}"` },
            { name: "threshold", value: threshold || "0" },
            {
              name: "resolutionTime",
              value: Math.floor(new Date(resolutionTime).getTime() / 1000),
            },
            { name: "question", value: `"${finalTitle.slice(0, 60)}…"` },
          ]}
          note="Backend: POST /api/markets/binary"
        />

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline">
            <Link href="/admin/markets">Cancel</Link>
          </Button>
          <Button
            disabled={
              !product || !threshold || !resolutionTime || submitting || !!cutoffInvalid
            }
            onClick={submit}
          >
            {submitting ? "Creating…" : "Create Binary Market"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// Multi-Bracket
// ─────────────────────────────────────────────────────────────────
function MultiBracketMarketForm({ onSuccess }: { onSuccess: () => void }) {
  const [productCode, setProductCode] = useState("PALM_OIL");
  const [title, setTitle] = useState("");
  const [brackets, setBrackets] = useState<number[]>([32, 36, 40]);
  const [resolutionTime, setResolutionTime] = useState(plusDaysLocal(14));
  const [tradingCutoff, setTradingCutoff] = useState(minus2hLocal(plusDaysLocal(14)));
  const [autoCutoff, setAutoCutoff] = useState(true);
  const [disputeDays, setDisputeDays] = useState("3");
  const [submitting, setSubmitting] = useState(false);

  const product = findProduct(productCode);
  const latest = MOCK_LATEST_PRICE[productCode];

  useEffect(() => {
    if (autoCutoff) setTradingCutoff(minus2hLocal(resolutionTime));
  }, [resolutionTime, autoCutoff]);

  const cutoffInvalid =
    tradingCutoff && resolutionTime &&
    new Date(tradingCutoff).getTime() >= new Date(resolutionTime).getTime();

  function autoGenTitle() {
    if (!product) return;
    setTitle(
      `${product.name} ${new Date(resolutionTime).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })} — which bracket lands?`,
    );
  }

  const finalTitle = title.trim() || `${product?.name ?? "Asset"} bracket`;

  const previewLabels = (() => {
    if (!product) return [] as string[];
    const sorted = [...brackets].sort((a, b) => a - b);
    const out: string[] = [];
    out.push(`< ${sorted[0]} ${product.unit}`);
    for (let i = 0; i < sorted.length - 1; i++)
      out.push(`${sorted[i]}–${sorted[i + 1]} ${product.unit}`);
    out.push(`≥ ${sorted[sorted.length - 1]} ${product.unit}`);
    return out;
  })();

  async function submit() {
    if (!product || cutoffInvalid) return;
    setSubmitting(true);
    try {
      await adminCreateMulti({
        productCode,
        productName: product.name,
        productCategory: product.category,
        title: finalTitle,
        brackets: [...brackets].sort((a, b) => a - b),
        thresholdUnit: product.unit,
        resolutionTime: new Date(resolutionTime).toISOString(),
        tradingCutoffTime: new Date(tradingCutoff).toISOString(),
        disputePeriodDays: Number(disputeDays),
      });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className="bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300">
            Multi-Bracket
          </Badge>
          Bracket Market
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Product */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Product *</label>
          <ProductCombobox value={productCode} onChange={setProductCode} />
          {product && (
            <p className="text-xs text-muted-foreground">Category: {product.category}</p>
          )}
        </div>

        {/* Latest price */}
        {latest && (
          <Card className="bg-muted/30 border-border/50 gap-1 py-3">
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latest avg price</span>
                <span className="font-mono font-medium">
                  {latest.price.toLocaleString()} {product?.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Source: MOC daily wholesale · {latest.date}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Brackets */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bracket boundaries</label>
          <BracketInput value={brackets} onChange={setBrackets} unitLabel={product?.unit} />
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Resolution Date &amp; Time *</label>
          <DateTimePicker
            value={resolutionTime}
            onChange={setResolutionTime}
            minDate={todayLocal()}
          />
        </div>

        {/* Trading cutoff */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Trading Ends At</label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={autoCutoff}
                onChange={(e) => setAutoCutoff(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Auto −2h from resolution
            </label>
          </div>
          <DateTimePicker
            value={tradingCutoff}
            onChange={(v) => {
              setAutoCutoff(false);
              setTradingCutoff(v);
            }}
            minDate={todayLocal()}
          />
          {cutoffInvalid && (
            <p className="text-xs text-destructive">
              Trading cutoff must be before resolution time.
            </p>
          )}
        </div>

        {/* Dispute */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dispute Period</label>
          <Select value={disputeDays} onValueChange={setDisputeDays}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["1", "3", "7", "14", "30"].map((d) => (
                <SelectItem key={d} value={d}>
                  {d} Day{d !== "1" ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Market Title</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={autoGenTitle}
              disabled={!product}
            >
              Auto-generate
            </Button>
          </div>
          <Input
            placeholder={`e.g. ${product?.name ?? "Asset"} bracket`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Preview */}
        {product && (
          <Card className="bg-muted/40">
            <CardContent className="space-y-2 text-sm">
              <h4 className="text-sm font-semibold">Preview ({previewLabels.length} outcomes)</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {previewLabels.map((l) => (
                  <Badge
                    key={l}
                    variant="outline"
                    className="justify-start font-normal text-xs"
                  >
                    {l}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2 border-t">
                <p>
                  <span className="text-muted-foreground">Resolves:</span>{" "}
                  {fmtLong(resolutionTime)}
                </p>
                <p>
                  <span className="text-muted-foreground">Trading ends:</span>{" "}
                  {fmtLong(tradingCutoff)}
                </p>
                <p>
                  <span className="text-muted-foreground">Dispute period:</span> {disputeDays} day(s)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <SimulatedTxReceipt
          contract="AgriMarketFactoryV2"
          fn="createMultiBracketMarket"
          args={[
            { name: "productCode", value: `"${productCode}"` },
            { name: "brackets", value: `[${brackets.join(", ")}]` },
            {
              name: "resolutionTime",
              value: Math.floor(new Date(resolutionTime).getTime() / 1000),
            },
            { name: "question", value: `"${finalTitle.slice(0, 60)}…"` },
          ]}
          note={`Backend: POST /api/markets/multi-bracket  ·  ${brackets.length + 1} outcomes`}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline">
            <Link href="/admin/markets">Cancel</Link>
          </Button>
          <Button disabled={!product || submitting || !!cutoffInvalid} onClick={submit}>
            {submitting ? "Creating…" : "Create Multi-Bracket Market"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
