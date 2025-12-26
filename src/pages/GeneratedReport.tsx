import React, { useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";

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
      const container = iframeDoc.querySelector('.container') as HTMLElement;
      
      if (!container) {
        console.error('Container not found in iframe');
        setIsGeneratingPdf(false);
        return;
      }

      // Clone the container to avoid modifying the original
      const clonedContainer = container.cloneNode(true) as HTMLElement;
      
      // Create a wrapper with print-specific styles
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      `;
      wrapper.appendChild(clonedContainer);
      document.body.appendChild(wrapper);

      const opt = {
        margin: 0.5,
        filename: `mintdfolio-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null,
          allowTaint: true,
        },
        jsPDF: { 
          unit: 'in' as const, 
          format: 'letter' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const }
      };

      await html2pdf().set(opt).from(wrapper).save();
      
      // Clean up
      document.body.removeChild(wrapper);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
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
