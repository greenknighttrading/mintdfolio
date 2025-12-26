import React, { useMemo, useRef, useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { Button } from "@/components/ui/button";
import { buildPortfolioReportHtml, buildPortfolioReportText } from "@/lib/reportHtml";
import { Seo } from "@/components/seo/Seo";
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

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

  // Wait for iframe to fully load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Wait for fonts to load
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        if (iframeDoc.fonts && iframeDoc.fonts.ready) {
          iframeDoc.fonts.ready.then(() => {
            setIframeLoaded(true);
          });
        } else {
          // Fallback for browsers without font loading API
          setTimeout(() => setIframeLoaded(true), 500);
        }
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [html]);

  const downloadAsImage = async () => {
    if (!iframeRef.current?.contentDocument?.body) {
      toast.error("Report not ready yet. Please wait a moment.");
      return;
    }

    setIsGeneratingImage(true);

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      const container = iframeDoc.querySelector(".container") as HTMLElement;

      if (!container) {
        toast.error("Could not find report content");
        return;
      }

      // Wait for fonts to be ready
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
        await iframeDoc.fonts.ready;
      }

      // Add a small delay to ensure all images and styles are loaded
      await new Promise(resolve => setTimeout(resolve, 300));

      // Store original styles
      const originalWidth = container.style.width;
      const originalMaxWidth = container.style.maxWidth;
      const originalOverflow = container.style.overflow;
      const originalMargin = container.style.margin;
      const originalPadding = container.style.padding;

      // Force fixed width for deterministic capture
      container.style.width = '900px';
      container.style.maxWidth = '900px';
      container.style.overflow = 'visible';
      container.style.margin = '0 auto';
      container.style.padding = '24px';

      // Temporarily disable animations and transitions
      const style = iframeDoc.createElement('style');
      style.id = 'capture-styles';
      style.textContent = `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Wait for reflow
      await new Promise(resolve => setTimeout(resolve, 100));

      // Measure the actual dimensions after forcing width
      const captureWidth = container.scrollWidth;
      const captureHeight = container.scrollHeight;

      // Capture with exact dimensions and 2x scale for crispness
      const dataUrl = await toPng(container, {
        pixelRatio: 2,
        width: captureWidth,
        height: captureHeight,
        backgroundColor: '#0f172a', // Dark theme background
        cacheBust: true,
        filter: (node) => {
          if (node.tagName === 'SCRIPT') return false;
          return true;
        },
      });

      // Restore original styles
      container.style.width = originalWidth;
      container.style.maxWidth = originalMaxWidth;
      container.style.overflow = originalOverflow;
      container.style.margin = originalMargin;
      container.style.padding = originalPadding;

      // Remove temporary styles
      const captureStyle = iframeDoc.getElementById('capture-styles');
      if (captureStyle) {
        captureStyle.remove();
      }

      // Create download link
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `mintdfolio-report-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
      
      // Clean up styles on error
      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) {
        const container = iframeDoc.querySelector(".container") as HTMLElement;
        if (container) {
          container.style.width = '';
          container.style.maxWidth = '';
          container.style.overflow = '';
          container.style.margin = '';
          container.style.padding = '';
        }
        const captureStyle = iframeDoc.getElementById('capture-styles');
        if (captureStyle) {
          captureStyle.remove();
        }
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadAsText = () => {
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

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mintdfolio-report-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Text report downloaded successfully!");
  };

  if (!isDataLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Seo
          title="Portfolio Report | mintdfolio"
          description="Generate a detailed portfolio analysis report and download it as an image."
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
        description="View your portfolio analysis report and download it as an image."
        canonicalPath="/report/generated"
      />

      <h1 className="sr-only">Portfolio analysis report</h1>

      <header className="flex items-center justify-between gap-3 p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="text-sm text-muted-foreground">
          Generated from the MintdFolio App
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={downloadAsText} 
            size="sm" 
            variant="outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export as .txt
          </Button>
          <Button 
            onClick={downloadAsImage} 
            size="sm" 
            disabled={isGeneratingImage || !iframeLoaded}
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing image...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Save Report as Image
              </>
            )}
          </Button>
        </div>
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
