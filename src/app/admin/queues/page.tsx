"use client";

import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BULL_BOARD_URL =
  process.env.NEXT_PUBLIC_BULL_BOARD_URL || "http://localhost:3002";

export default function AdminQueuesPage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <>
      <AdminPageHeader
        title="Worker queues"
        description="Bull Board live dashboard — BullMQ jobs running against Dragonfly/Redis. Embedded from the backend monitor service."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIframeKey((k) => k + 1)}
              className="gap-1"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <a href={BULL_BOARD_URL} target="_blank" rel="noreferrer">
                Open in new tab
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <iframe
          key={iframeKey}
          src={BULL_BOARD_URL}
          title="Bull Board"
          className="w-full h-[calc(100vh-18rem)] min-h-[600px] border-0 rounded-xl"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </Card>
    </>
  );
}
