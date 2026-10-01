// Relay for the free assessment quiz's GHL submission.
//
// Why this exists: the quiz page used to POST straight from the browser to
// GHL's inbound webhook. GHL's webhook only parses the body as real,
// workflow-triggering data when the request's Content-Type header is
// literally "application/json". But GHL's own CORS setup doesn't fully
// support a cross-origin browser sending that header, their preflight
// (OPTIONS) answers fine, but the real POST that follows gets blocked by
// the browser. Sending as "text/plain" instead avoided the CORS block, but
// then GHL accepted the request (200 OK) without ever actually parsing it,
// so nothing showed up in Contacts or Execution Logs.
//
// This function breaks that deadlock: the browser calls this same-origin
// endpoint (no CORS involved at all for a same-origin request), and this
// function, running server-side, forwards the payload to GHL with the
// correct application/json header. Server-to-server requests aren't
// subject to CORS, since CORS is a browser-enforced rule, so there's no
// conflict here the way there was in the browser.
const GHL_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/ZeZoAmpxsGzfen1ME3JX/webhook-trigger/j5GiDtGqSDtgOw3YtnTI";

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
