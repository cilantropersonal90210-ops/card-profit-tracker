
const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const EBAY_ENDPOINT =
    "https://card-profit-tracker.onrender.com/ebay/notifications";

const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // eBay account-deletion verification
    if (req.method === "GET" && req.url.startsWith("/ebay/notifications")) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const challengeCode = url.searchParams.get("challenge_code");
        const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;

        if (!challengeCode || !verificationToken) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing challenge code or verification configuration" }));
            return;
        }

        const hash = crypto.createHash("sha256");
        hash.update(challengeCode + verificationToken + EBAY_ENDPOINT);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ challengeResponse: hash.digest("hex") }));
        return;
    }

    // eBay OAuth callback: exchange code and store refresh token
    if (req.method === "GET" && req.url.startsWith("/ebay/oauth/callback")) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const code = url.searchParams.get("code");

        if (!code) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Missing eBay authorization code.");
            return;
        }

        const clientId = process.env.EBAY_APP_ID;
        const clientSecret = process.env.EBAY_CERT_ID;
        const ruName = process.env.EBAY_RUNAME;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!clientId || !clientSecret || !ruName || !supabaseUrl || !supabaseKey) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("A required backend environment variable is missing. Check Render Environment settings.");
            return;
        }

        try {
            const credentials = Buffer
                .from(`${clientId}:${clientSecret}`)
                .toString("base64");

            const tokenResponse = await fetch(
                "https://api.ebay.com/identity/v1/oauth2/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": `Basic ${credentials}`
                    },
                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        code,
                        redirect_uri: ruName
                    })
                }
            );

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {
                console.error("eBay token exchange failed with HTTP status:", tokenResponse.status);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("The eBay token exchange failed. Check Render logs for the HTTP status.");
                return;
            }

            if (!tokenData.refresh_token) {
                console.error("eBay did not return a refresh token.");
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("eBay did not provide a refresh token. Please authorize again.");
                return;
            }

            // Save the refresh token privately in Supabase.
            const cleanSupabaseUrl = supabaseUrl.replace(/\/+$/, "");
            const saveResponse = await fetch(
                `${cleanSupabaseUrl}/rest/v1/ebay_tokens?on_conflict=id`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Prefer": "resolution=merge-duplicates,return=minimal"
                    },
                    body: JSON.stringify({
                        id: 1,
                        refresh_token: tokenData.refresh_token,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (!saveResponse.ok) {
                // Do not log the response body; it could contain sensitive details.
                console.error("Saving the eBay token to Supabase failed. HTTP status:", saveResponse.status);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("eBay authorized successfully, but saving the connection failed. Check Render environment settings and Supabase table configuration.");
                return;
            }

            console.log("eBay OAuth succeeded; refresh token saved to Supabase.");

            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>eBay Connected</title></head>
                <body style="font-family:Arial;text-align:center;padding:50px">
                    <h1>eBay Connected Successfully!</h1>
                    <p>Your eBay connection was saved securely.</p>
                    <p>You can close this window.</p>
                </body>
                </html>
            `);
        } catch (error) {
            console.error("eBay OAuth callback failed:", error.message);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Something went wrong connecting eBay or saving the connection.");
        }

        return;
    }

    // eBay OAuth declined
    if (req.method === "GET" && req.url.startsWith("/ebay/oauth/declined")) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>eBay Connection Cancelled</h1><p>Your tracker was not connected.</p>");
        return;
    }

    // API test
    if (req.method === "GET" && req.url === "/api/test") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            success: true,
            message: "Card Profit API is working!"
        }));
        return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Card Profit API backend is running!");
});

server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
