import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html } = await req.json();

    if (!html) {
      return new Response(
        JSON.stringify({ error: "Missing HTML content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const browserlessToken = Deno.env.get("BROWSERLESS_TOKEN");
    if (!browserlessToken) {
      return new Response(
        JSON.stringify({ error: "Browserless token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the complete HTML document with all styles inline
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 1200px !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #e2e8f0 !important;
      line-height: 1.6 !important;
    }
    
    /* Lock container width */
    .container {
      width: 1100px !important;
      max-width: 1100px !important;
      margin: 0 auto !important;
      padding: 48px 32px !important;
    }
    
    /* Header styling */
    .header {
      text-align: center !important;
      margin-bottom: 48px !important;
      padding-bottom: 32px !important;
      border-bottom: 1px solid rgba(139, 92, 246, 0.3) !important;
    }
    
    .logo {
      font-size: 36px !important;
      font-weight: 700 !important;
      background: linear-gradient(135deg, #a78bfa, #818cf8) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
      margin-bottom: 8px !important;
    }
    
    /* Metrics grid - 3-tile layout */
    .metrics-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 20px !important;
      margin-bottom: 24px !important;
    }
    
    .metric-card {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(139, 92, 246, 0.15) !important;
      border-radius: 12px !important;
      padding: 24px !important;
      text-align: center !important;
    }
    
    .metric-value {
      font-size: 28px !important;
      font-weight: 700 !important;
      color: #f1f5f9 !important;
      margin-bottom: 4px !important;
    }
    
    .metric-value.positive { color: #4ade80 !important; }
    .metric-value.negative { color: #f87171 !important; }
    
    .metric-label {
      font-size: 13px !important;
      color: #94a3b8 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
    }
    
    /* Section cards */
    .section {
      background: rgba(30, 27, 75, 0.5) !important;
      border: 1px solid rgba(139, 92, 246, 0.2) !important;
      border-radius: 16px !important;
      padding: 32px !important;
      margin-bottom: 24px !important;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1) !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    .section-title {
      font-size: 22px !important;
      font-weight: 600 !important;
      color: #a78bfa !important;
      margin-bottom: 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    
    .section-title::before {
      content: '' !important;
      width: 4px !important;
      height: 24px !important;
      background: linear-gradient(180deg, #a78bfa, #818cf8) !important;
      border-radius: 2px !important;
    }
    
    /* Narrative blocks */
    .narrative-block {
      background: rgba(15, 23, 42, 0.4) !important;
      border-left: 3px solid rgba(139, 92, 246, 0.5) !important;
      border-radius: 0 12px 12px 0 !important;
      padding: 24px !important;
      margin-top: 20px !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    .narrative-title {
      font-weight: 600 !important;
      color: #c4b5fd !important;
      margin-bottom: 12px !important;
      font-size: 15px !important;
    }
    
    .narrative-text {
      color: #cbd5e1 !important;
      font-size: 14px !important;
      line-height: 1.7 !important;
    }
    
    /* Allocation donut area */
    .allocation-grid {
      display: grid !important;
      grid-template-columns: 200px 1fr !important;
      gap: 32px !important;
      align-items: center !important;
    }
    
    /* Milestone cards */
    .milestone-card {
      background: rgba(15, 23, 42, 0.5) !important;
      border: 1px solid rgba(74, 222, 128, 0.2) !important;
      border-radius: 12px !important;
      padding: 20px !important;
      margin-bottom: 12px !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    .milestone-card.loss {
      border-color: rgba(248, 113, 113, 0.2) !important;
    }
    
    /* Insight items */
    .insight-item {
      background: rgba(15, 23, 42, 0.4) !important;
      border-radius: 10px !important;
      padding: 16px 20px !important;
      margin-bottom: 12px !important;
      border-left: 3px solid rgba(139, 92, 246, 0.4) !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    .insight-item.strength {
      border-left-color: rgba(74, 222, 128, 0.5) !important;
    }
    
    .insight-item.risk {
      border-left-color: rgba(251, 191, 36, 0.5) !important;
    }
    
    .insight-title {
      font-weight: 600 !important;
      color: #e2e8f0 !important;
      margin-bottom: 4px !important;
      font-size: 14px !important;
    }
    
    .insight-desc {
      color: #94a3b8 !important;
      font-size: 13px !important;
    }
    
    /* Action items */
    .action-item {
      display: flex !important;
      align-items: flex-start !important;
      gap: 12px !important;
      padding: 16px !important;
      background: rgba(15, 23, 42, 0.3) !important;
      border-radius: 10px !important;
      margin-bottom: 12px !important;
      break-inside: avoid !important;
    }
    
    .action-number {
      width: 28px !important;
      height: 28px !important;
      background: linear-gradient(135deg, #a78bfa, #818cf8) !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      flex-shrink: 0 !important;
    }
    
    /* Health score display */
    .health-score {
      font-size: 56px !important;
      font-weight: 700 !important;
      text-align: center !important;
      margin: 20px 0 !important;
    }
    
    .health-score.excellent { color: #4ade80 !important; }
    .health-score.good { color: #a3e635 !important; }
    .health-score.fair { color: #fbbf24 !important; }
    .health-score.poor { color: #f87171 !important; }
    
    /* Closing section */
    .closing-section {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 27, 75, 0.5) 100%) !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
      text-align: center !important;
    }
    
    /* Footer */
    .footer {
      text-align: center !important;
      padding: 32px !important;
      color: #64748b !important;
      font-size: 12px !important;
      border-top: 1px solid rgba(139, 92, 246, 0.2) !important;
      margin-top: 24px !important;
    }
    
    /* Positive/negative text colors */
    .positive { color: #4ade80 !important; }
    .negative { color: #f87171 !important; }
    
    /* Print-specific rules */
    @media print {
      html, body {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
      }
      
      .section, .metric-card, .narrative-block, .milestone-card, .insight-item, .action-item {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    console.log("Generating PDF with Browserless...");

    // First, take a screenshot for debugging and to verify rendering
    const screenshotResponse = await fetch(
      `https://chrome.browserless.io/screenshot?token=${browserlessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: fullHtml,
          options: {
            type: "png",
            fullPage: true,
            encoding: "binary",
          },
          setViewport: {
            width: 1200,
            height: 2000,
            deviceScaleFactor: 2,
          },
          gotoOptions: {
            waitUntil: "networkidle0",
          },
          waitForFunction: {
            fn: "() => document.fonts.ready.then(() => true)",
            timeout: 10000,
          },
        }),
      }
    );

    if (!screenshotResponse.ok) {
      const errText = await screenshotResponse.text();
      console.error("Screenshot failed:", errText);
    } else {
      console.log("Screenshot captured successfully for verification");
    }

    // Now generate the PDF
    const pdfResponse = await fetch(
      `https://chrome.browserless.io/pdf?token=${browserlessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: fullHtml,
          options: {
            format: "Letter",
            printBackground: true,
            preferCSSPageSize: false,
            scale: 0.75,
            margin: {
              top: "0.5in",
              right: "0.5in",
              bottom: "0.5in",
              left: "0.5in",
            },
          },
          setViewport: {
            width: 1200,
            height: 2000,
            deviceScaleFactor: 2,
          },
          gotoOptions: {
            waitUntil: "networkidle0",
          },
          waitForFunction: {
            fn: "() => document.fonts.ready.then(() => true)",
            timeout: 10000,
          },
          addStyleTag: [{
            content: `
              @media print {
                html, body {
                  width: 1200px !important;
                  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
                }
              }
            `
          }],
        }),
      }
    );

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error("PDF generation failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate PDF", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PDF generated successfully");
    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="mintdfolio-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
