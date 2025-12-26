import React, { useMemo, useRef } from "react";
import { Download } from "lucide-react";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { Button } from "@/components/ui/button";
import { buildPortfolioReportHtml } from "@/lib/reportHtml";
import { Seo } from "@/components/seo/Seo";

export default function GeneratedReport() {
  const {
    isDataLoaded,
    summary,
    allocation,
    concentration,
    milestones,
    insights,
    allocationTarget,
    allocationPreset,
    items,
  } = usePortfolio();

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(() => {
    return buildPortfolioReportHtml({
      summary,
      allocation,
      concentration,
      milestones: milestones ?? [],
      insights: insights ?? [],
      allocationTarget,
      allocationPreset,
      items,
    });
  }, [summary, allocation, concentration, milestones, insights, allocationTarget, allocationPreset, items]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  if (!isDataLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Seo
          title="Portfolio Report | mintdfolio"
          description="Generate a detailed portfolio analysis report and download it as a document."
          canonicalPath="/report/generated"
        />

        <div className="text-center space-y-4">
          <h1 className="text-lg font-semibold text-foreground">Portfolio Report</h1>
          <p className="text-muted-foreground">No portfolio data available.</p>
          <p className="text-xs text-muted-foreground mt-8">Generated from the MintdFolio App</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Seo
        title="Portfolio Report | mintdfolio"
        description="View your portfolio analysis report and download it as a document."
        canonicalPath="/report/generated"
      />

      <h1 className="sr-only">Portfolio analysis report</h1>

      <header className="flex items-center justify-between gap-3 p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="text-sm text-muted-foreground">
          Generated from the MintdFolio App
        </div>

        <Button onClick={handlePrint} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </header>

      <section className="px-4 lg:px-6 pb-6 max-w-6xl mx-auto">
        <div className="glass-card overflow-hidden">
          <iframe
            ref={iframeRef}
            title="Portfolio analysis report"
            className="w-full h-[calc(100vh-8rem)] bg-background"
            srcDoc={html}
          />
        </div>
      </section>
    </main>
  );
}
