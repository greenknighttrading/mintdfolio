import React, { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { Button } from "@/components/ui/button";
import { buildPortfolioReportHtml, buildPortfolioReportText } from "@/lib/reportHtml";
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

  const downloadAsDoc = () => {
    const textContent = buildPortfolioReportText({
      summary,
      allocation,
      concentration,
      milestones: milestones ?? [],
      insights: insights ?? [],
      allocationTarget,
      allocationPreset,
      items,
    });

    const blob = new Blob([textContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mintdfolio-report-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isDataLoaded) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center p-6">
        <Seo
          title="Portfolio Report | mintdfolio"
          description="Generate a detailed portfolio analysis report and download it as a document."
          canonicalPath="/report/generated"
        />

        <div className="text-center space-y-4">
          <h1 className="text-lg font-semibold text-foreground">Portfolio report</h1>
          <p className="text-muted-foreground">No portfolio data available.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Upload Portfolio
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-6xl mx-auto">
      <Seo
        title="Portfolio Report | mintdfolio"
        description="View your portfolio analysis report and download it as a document."
        canonicalPath="/report/generated"
      />

      <h1 className="sr-only">Portfolio analysis report</h1>

      <header className="flex items-center justify-between gap-3 mb-4">
        <Link to="/report">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Button onClick={downloadAsDoc} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download as .doc
        </Button>
      </header>

      <section className="glass-card overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Portfolio analysis report"
          className="w-full h-[calc(100vh-11rem)] bg-background"
          srcDoc={html}
        />
      </section>
    </main>
  );
}
