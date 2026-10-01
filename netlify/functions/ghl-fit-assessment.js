// Relay for the fit assessment's GHL submission.
//
// Same reasoning as netlify/functions/ghl-free-assessment.js: GHL's inbound
// webhook only parses a request body as real, workflow-triggering data when
// Content-Type is literally "application/json", but a cross-origin browser
// sending that header gets blocked by GHL's own CORS gap (preflight OK,
// real POST blocked). Routing through this same-origin function sidesteps
// CORS entirely: the browser's call to this endpoint is same-origin (no
// CORS applies), and this function's call to GHL is server-to-server (CORS
// only governs browsers, so it doesn't apply there either).
const GHL_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/ZeZoAmpxsGzfen1ME3JX/webhook-trigger/nTm69RdLoPh9VX8flFV9";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  try {
    const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await ghlResponse.text();

    return {
      statusCode: ghlResponse.status,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Failed to reach GHL webhook", detail: String(err) }),
    };
  }
};
