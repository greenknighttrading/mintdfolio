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

    console.log("Starting PDF generation via Browserless /function endpoint...");

    // Build the complete HTML with all print-optimized styles
    const fullHtml = buildFullHtml(html);

    // Use Browserless /function endpoint - this allows full puppeteer control
    // including setViewport, emulateMediaType, etc. inside the function code
    const functionCode = `
export default async function ({ page, context }) {
  // Set viewport for consistent rendering
  await page.setViewport({
    width: 900,
    height: 1200,
    deviceScaleFactor: 2
  });

  // Emulate screen media (not print) to preserve dark theme
  await page.emulateMediaType('screen');

  // Set content directly from the provided HTML
  await page.setContent(context.html, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  // Small delay to ensure all styles are applied
  await new Promise(r => setTimeout(r, 500));

  // Get the full page height for screenshot
  const bodyHeight = await page.evaluate(() => {
    return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
  });

  // Take a full-page screenshot at high resolution
  const screenshot = await page.screenshot({
    type: 'png',
    fullPage: true,
    encoding: 'binary'
  });

  // Generate PDF from the screenshot approach:
  // First, create a PDF with the screenshot embedded
  const pdf = await page.pdf({
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: false,
    scale: 0.75,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    }
  });

  return {
    data: pdf,
    type: 'application/pdf'
  };
}
`;

    const response = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: functionCode,
          context: {
            html: fullHtml,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Browserless error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate PDF", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PDF generated successfully");
    const pdfBuffer = await response.arrayBuffer();

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

function buildFullHtml(contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=900">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 900px !important;
      min-width: 900px !important;
      max-width: 900px !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #e2e8f0 !important;
      line-height: 1.6 !important;
    }

    .container {
      width: 850px !important;
      max-width: 850px !important;
      margin: 0 auto !important;
      padding: 40px 24px !important;
    }

    .header {
      text-align: center !important;
      margin-bottom: 48px !important;
      padding-bottom: 32px !important;
      border-bottom: 1px solid rgba(139, 92, 246, 0.3) !important;
    }

    .logo {
      font-size: 32px !important;
      font-weight: 700 !important;
      background: linear-gradient(135deg, #a78bfa, #818cf8) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
      margin-bottom: 8px !important;
    }

    .subtitle {
      color: #94a3b8 !important;
      font-size: 14px !important;
    }

    .stats-grid, .metrics-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 16px !important;
      margin-bottom: 24px !important;
    }

    .stat-card, .metric-card {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(139, 92, 246, 0.15) !important;
      border-radius: 12px !important;
      padding: 20px !important;
      text-align: center !important;
    }

    .stat-value, .metric-value {
      font-size: 24px !important;
      font-weight: 700 !important;
      color: #f1f5f9 !important;
      margin-bottom: 4px !important;
    }

    .stat-value.positive, .metric-value.positive, .positive {
      color: #4ade80 !important;
    }

    .stat-value.negative, .metric-value.negative, .negative {
      color: #f87171 !important;
    }

    .stat-label, .metric-label {
      font-size: 12px !important;
      color: #94a3b8 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
    }

    .section {
      background: rgba(30, 27, 75, 0.5) !important;
      border: 1px solid rgba(139, 92, 246, 0.2) !important;
      border-radius: 16px !important;
      padding: 28px !important;
      margin-bottom: 20px !important;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1) !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .section-title {
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #a78bfa !important;
      margin-bottom: 14px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .section-title::before {
      content: '' !important;
      width: 4px !important;
      height: 20px !important;
      background: linear-gradient(180deg, #a78bfa, #818cf8) !important;
      border-radius: 2px !important;
    }

    .narrative-block {
      background: rgba(15, 23, 42, 0.4) !important;
      border-left: 3px solid rgba(139, 92, 246, 0.5) !important;
      border-radius: 0 10px 10px 0 !important;
      padding: 20px !important;
      margin-top: 16px !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .narrative-title {
      font-weight: 600 !important;
      color: #c4b5fd !important;
      margin-bottom: 10px !important;
      font-size: 14px !important;
    }

    .narrative-text {
      color: #cbd5e1 !important;
      font-size: 13px !important;
      line-height: 1.65 !important;
    }

    .collector-profile {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 27, 75, 0.6) 100%) !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
      border-radius: 16px !important;
      padding: 28px !important;
      margin-bottom: 24px !important;
      text-align: center !important;
    }

    .collector-type {
      font-size: 26px !important;
      font-weight: 700 !important;
      background: linear-gradient(135deg, #a78bfa, #c4b5fd) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      margin-bottom: 10px !important;
    }

    .collector-desc {
      color: #cbd5e1 !important;
      font-size: 14px !important;
      max-width: 650px !important;
      margin: 0 auto !important;
    }

    .allocation-bar {
      display: flex !important;
      height: 28px !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      margin-bottom: 12px !important;
    }

    .allocation-segment {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      color: white !important;
      min-width: 30px !important;
    }

    .allocation-segment.sealed { background: #8b5cf6 !important; }
    .allocation-segment.slabs { background: #06b6d4 !important; }
    .allocation-segment.raw { background: #f59e0b !important; }

    .allocation-legend {
      display: flex !important;
      gap: 20px !important;
      flex-wrap: wrap !important;
      margin-bottom: 16px !important;
    }

    .legend-item {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      font-size: 12px !important;
      color: #94a3b8 !important;
    }

    .legend-dot {
      width: 10px !important;
      height: 10px !important;
      border-radius: 50% !important;
    }

    .health-score {
      font-size: 48px !important;
      font-weight: 700 !important;
      text-align: center !important;
      margin: 16px 0 !important;
    }

    .health-score.excellent { color: #4ade80 !important; }
    .health-score.good { color: #a3e635 !important; }
    .health-score.fair { color: #fbbf24 !important; }
    .health-score.poor { color: #f87171 !important; }

    .hit-item {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 10px 14px !important;
      background: rgba(15, 23, 42, 0.4) !important;
      border-radius: 8px !important;
      margin-bottom: 8px !important;
    }

    .hit-name {
      color: #e2e8f0 !important;
      font-weight: 500 !important;
      font-size: 13px !important;
    }

    .hit-gain {
      color: #4ade80 !important;
      font-weight: 600 !important;
      font-size: 13px !important;
    }

    .insight-item {
      background: rgba(15, 23, 42, 0.4) !important;
      border-radius: 10px !important;
      padding: 14px 18px !important;
      margin-bottom: 10px !important;
      border-left: 3px solid rgba(139, 92, 246, 0.4) !important;
      break-inside: avoid !important;
    }

    .insight-item.strength { border-left-color: rgba(74, 222, 128, 0.5) !important; }
    .insight-item.risk { border-left-color: rgba(251, 191, 36, 0.5) !important; }

    .insight-title {
      font-weight: 600 !important;
      color: #e2e8f0 !important;
      margin-bottom: 4px !important;
      font-size: 13px !important;
    }

    .insight-desc {
      color: #94a3b8 !important;
      font-size: 12px !important;
    }

    .target-allocation-card {
      background: rgba(15, 23, 42, 0.5) !important;
      border: 1px solid rgba(139, 92, 246, 0.2) !important;
      border-radius: 12px !important;
      padding: 18px !important;
      margin-top: 18px !important;
    }

    .target-title {
      font-weight: 600 !important;
      color: #a78bfa !important;
      font-size: 14px !important;
      margin-bottom: 8px !important;
    }

    .target-info {
      color: #e2e8f0 !important;
      font-size: 13px !important;
      margin-bottom: 10px !important;
    }

    .target-note {
      color: #94a3b8 !important;
      font-size: 12px !important;
      font-style: italic !important;
    }

    .action-item {
      display: flex !important;
      align-items: flex-start !important;
      gap: 12px !important;
      padding: 14px !important;
      background: rgba(15, 23, 42, 0.3) !important;
      border-radius: 10px !important;
      margin-bottom: 10px !important;
      break-inside: avoid !important;
    }

    .action-number {
      width: 24px !important;
      height: 24px !important;
      background: linear-gradient(135deg, #a78bfa, #818cf8) !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-weight: 600 !important;
      font-size: 12px !important;
      flex-shrink: 0 !important;
    }

    .closing-section {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 27, 75, 0.5) 100%) !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
      text-align: center !important;
    }

    .footer {
      text-align: center !important;
      padding: 28px !important;
      color: #64748b !important;
      font-size: 11px !important;
      border-top: 1px solid rgba(139, 92, 246, 0.2) !important;
      margin-top: 20px !important;
    }

    @media print {
      html, body {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
      }
      
      .section, .narrative-block, .collector-profile, .stat-card, .metric-card, .insight-item, .action-item {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
${contentHtml}
</body>
</html>`;
}
