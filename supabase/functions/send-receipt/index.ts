import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*", // Optional: replace with GitHub Pages domain for security
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const { to, candidateName, electionName } = await req.json();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`, // ✅ Uses the secret properly
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Suffragium <onboarding@resend.dev>", // ✅ Safe for free plan
      to,
      subject: `🗳️ Vote Receipt: ${electionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #007bff;">🗳️ Suffragium Vote Receipt</h2>
          <p>Thank you for voting in <strong>${electionName}</strong>.</p>
          <p>Your vote has been recorded for:</p>
          <p style="font-size: 18px; font-weight: bold; color: #28a745;">✅ ${candidateName}</p>
          <hr />
          <p>If this wasn't you, contact your election admin.</p>
          <p style="font-size: 12px; color: #888;">This is an automated message from Suffragium.</p>
        </div>
      `,
    }),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // You can restrict this if needed
    },
    status: response.status,
  });
});
