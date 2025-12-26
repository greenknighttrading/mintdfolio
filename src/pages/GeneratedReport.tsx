import React, { useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { Button } from "@/components/ui/button";
import { buildPortfolioReportHtml } from "@/lib/reportHtml";
import { Seo } from "@/components/seo/Seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const downloadAsPdf = async () => {
    if (!iframeRef.current?.contentDocument?.body) return;

    setIsGeneratingPdf(true);

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      const container = iframeDoc.querySelector(".container") as HTMLElement;

      if (!container) {
        toast.error("Could not find report content");
        return;
      }

      // Get the container's outer HTML for server-side rendering
      const reportHtml = container.outerHTML;

      // Call backend function to generate PDF
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { html: reportHtml },
      });

      if (error) {
        console.error("PDF generation error:", error);
        toast.error("Failed to generate PDF. Please try again.");
        return;
      }

      // Supabase Functions client returns a Blob for application/pdf responses.
      // Still, we normalize defensively so the downloaded file is always valid.
      const pdfBlob = normalizePdfBlob(data);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mintdfolio-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

function normalizePdfBlob(data: unknown): Blob {
  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) return new Blob([data], { type: "application/pdf" });
  if (data instanceof Uint8Array) {
    return new Blob([data as unknown as BlobPart], { type: "application/pdf" });
  }

  // Some environments serialize Uint8Array into a plain object like {"0":37,"1":80,...}
  if (data && typeof data === "object") {
    const keys = Object.keys(data as Record<string, unknown>);
    const looksLikeByteObject = keys.length > 0 && keys.every((k) => /^\d+$/.test(k));

    if (looksLikeByteObject) {
      const bytes = new Uint8Array(
        keys
          .map((k) => Number(k))
          .sort((a, b) => a - b)
          .map((i) => Number((data as Record<string, unknown>)[String(i)] ?? 0))
      );
      return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    }
  }

  // Fallback: best-effort stringification (will still produce a valid download, but may not open)
  return new Blob([String(data ?? "")], { type: "application/pdf" });
}


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

        <Button onClick={downloadAsPdf} size="sm" disabled={isGeneratingPdf}>
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download as PDF
            </>
          )}
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
