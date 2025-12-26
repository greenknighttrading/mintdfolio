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

    // Wrap HTML with print-optimized styles
    const printOptimizedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
    }
    
    /* Prevent card splitting across pages */
    .section, .card, .metric-card, .insight-item, .narrative-block {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    /* Lock container width */
    .container {
      width: 900px !important;
      max-width: 900px !important;
      margin: 0 auto !important;
    }
    
    /* Reduce blur/glow for PDF - replace with subtle borders */
    .header, .section {
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15) !important;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    // Call Browserless PDF API with screen media emulation
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
          emulateMedia: "screen",
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
