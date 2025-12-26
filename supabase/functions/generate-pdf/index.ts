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

    // Wrap HTML with print-optimized styles that mimic screen appearance
    // Using @media print rules to preserve screen styles instead of emulateMedia
    const printOptimizedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* Force print to match screen appearance */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: #e2e8f0 !important;
      line-height: 1.6 !important;
    }
    
    /* Lock container width for consistent layout */
    .container {
      width: 850px !important;
      max-width: 850px !important;
      margin: 0 auto !important;
      padding: 40px 24px !important;
    }
    
    /* Prevent card splitting across pages */
    .section, .card, .metric-card, .insight-item, .narrative-block, .milestone-card {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    /* Preserve all backgrounds and gradients in print */
    .section {
      background: rgba(30, 27, 75, 0.5) !important;
      border: 1px solid rgba(139, 92, 246, 0.2) !important;
      border-radius: 16px !important;
      padding: 32px !important;
      margin-bottom: 24px !important;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15) !important;
    }
    
    .header {
      text-align: center !important;
      margin-bottom: 48px !important;
      padding-bottom: 32px !important;
      border-bottom: 1px solid rgba(139, 92, 246, 0.3) !important;
    }
    
    .metrics-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 16px !important;
    }
    
    .metric-card {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(139, 92, 246, 0.15) !important;
      border-radius: 12px !important;
      padding: 20px !important;
      text-align: center !important;
    }
    
    .narrative-block {
      background: rgba(15, 23, 42, 0.4) !important;
      border-left: 3px solid rgba(139, 92, 246, 0.5) !important;
      border-radius: 0 10px 10px 0 !important;
      padding: 20px 24px !important;
      margin-top: 20px !important;
    }
    
    /* Print-specific overrides to ensure screen styles are used */
    @media print {
      html, body {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
      }
      
      .section, .metric-card, .narrative-block, .milestone-card, .insight-item {
        background-color: inherit !important;
        border: inherit !important;
        box-shadow: inherit !important;
      }
      
      /* Ensure text colors are preserved */
      .logo, .section-title, h1, h2, h3, h4 {
        color: inherit !important;
      }
      
      /* Keep gradients on text */
      .logo {
        background: linear-gradient(135deg, #a78bfa, #818cf8) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
      }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    // Call Browserless PDF API - no emulateMedia field (handled via CSS above)
    const pdfResponse = await fetch(
      `https://chrome.browserless.io/pdf?token=${browserlessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: printOptimizedHtml,
          options: {
            format: "Letter",
            printBackground: true,
            preferCSSPageSize: true,
            scale: 1.15,
            margin: {
              top: "0.5in",
              right: "0.5in",
              bottom: "0.5in",
              left: "0.5in",
            },
          },
          gotoOptions: {
            waitUntil: "networkidle0",
          },
        }),
      }
    );

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error("Browserless error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate PDF", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
