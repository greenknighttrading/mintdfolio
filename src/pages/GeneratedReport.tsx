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
        setIsGeneratingImage(false);
        return;
      }

      // Wait for fonts to be ready
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
        await iframeDoc.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clone the entire container into an offscreen wrapper in the main document
      const clone = container.cloneNode(true) as HTMLElement;
      
      // Create offscreen container with fixed dimensions
      const offscreen = document.createElement('div');
      offscreen.id = 'offscreen-capture';
      offscreen.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: 1000px;
        min-width: 1000px;
        max-width: 1000px;
        overflow: visible;
        background: #0f172a;
        padding: 32px;
        box-sizing: border-box;
        z-index: -9999;
      `;
      
      // Copy all styles from iframe to clone
      const iframeStyles = Array.from(iframeDoc.querySelectorAll('style, link[rel="stylesheet"]'));
      iframeStyles.forEach(styleEl => {
        const clonedStyle = styleEl.cloneNode(true);
        offscreen.appendChild(clonedStyle);
      });
      
      // Add capture-specific styles to disable animations
      const captureStyle = document.createElement('style');
      captureStyle.textContent = `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
        .container {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      offscreen.appendChild(captureStyle);
      
      // Style the clone
      clone.style.cssText = `
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
        overflow: visible;
      `;
      
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Wait for fonts to load in main document and reflow
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 200));

      // Measure the clone dimensions
      const captureWidth = clone.scrollWidth;
      const captureHeight = clone.scrollHeight;

      // Capture the clone with exact dimensions
      const dataUrl = await toPng(offscreen, {
        pixelRatio: 2,
        width: captureWidth + 64, // Account for padding
        height: captureHeight + 64,
        backgroundColor: '#0f172a',
        cacheBust: true,
        filter: (node) => {
          if (node.tagName === 'SCRIPT') return false;
          return true;
        },
      });

      // Clean up offscreen container
      document.body.removeChild(offscreen);

      // Validate the image was captured correctly
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      if (img.width < captureWidth) {
        console.warn('Image may be clipped, width:', img.width, 'expected:', captureWidth + 64);
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
      
      // Clean up offscreen container on error
      const offscreen = document.getElementById('offscreen-capture');
      if (offscreen) {
        document.body.removeChild(offscreen);
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
