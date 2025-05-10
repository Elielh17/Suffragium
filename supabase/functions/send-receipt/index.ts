import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // ✅ Debug logging
  console.log("🔔 Edge Function called");

  const { to, candidateName, electionName } = await req.json();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  console.log("RESEND_API_KEY:", resendApiKey); // Only for test; remove later

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Suffragium <onboarding@resend.dev>",
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
      "Access-Control-Allow-Origin": "*",
    },
    status: response.status,
  });
});
