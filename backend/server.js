const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const EBAY_ENDPOINT =
    "https://card-profit-tracker.onrender.com/ebay/notifications";

const server = http.createServer(async (req, res) => {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // --------------------------------
    // eBay Marketplace Account Deletion
    // --------------------------------

    if (req.method === "GET" && req.url.startsWith("/ebay/notifications")) {

        const url = new URL(req.url, `http://${req.headers.host}`);
        const challengeCode = url.searchParams.get("challenge_code");

        if (!challengeCode) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Missing challenge_code"
            }));

            return;
        }

        const verificationToken =
            process.env.EBAY_VERIFICATION_TOKEN;

        if (!verificationToken) {
            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "EBAY_VERIFICATION_TOKEN is not configured"
            }));

            return;
        }

        const hash = crypto.createHash("sha256");

        hash.update(
            challengeCode +
            verificationToken +
            EBAY_ENDPOINT
        );

        const challengeResponse = hash.digest("hex");

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            challengeResponse: challengeResponse
        }));

        return;
    }

    // --------------------------------
    // eBay OAuth Callback
    // --------------------------------

    if (
        req.method === "GET" &&
        req.url.startsWith("/ebay/oauth/callback")
    ) {

        const url = new URL(
            req.url,
            `http://${req.headers.host}`
        );

        const code = url.searchParams.get("code");

        if (!code) {
            res.writeHead(400, {
                "Content-Type": "text/plain"
            });

            res.end("Missing eBay authorization code.");
            return;
        }

        const clientId = process.env.EBAY_APP_ID;
        const clientSecret = process.env.EBAY_CERT_ID;
        const ruName = process.env.EBAY_RUNAME;

        if (!clientId || !clientSecret || !ruName) {
            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end("eBay OAuth environment variables are missing.");
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
                        "Content-Type":
                            "application/x-www-form-urlencoded",

                        "Authorization":
                            `Basic ${credentials}`
                    },

                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        code: code,
                        redirect_uri: ruName
                    })
                }
            );

            const tokenData = await tokenResponse.json();

            if (!tokenResponse.ok) {

                console.error(
                    "eBay token exchange failed:",
                    tokenData
                );

                res.writeHead(500, {
                    "Content-Type": "text/plain"
                });

                res.end(
                    "eBay authorization succeeded, but the token exchange failed. Check the Render logs."
                );

                return;
            }

            // IMPORTANT:
            // Do NOT send the token to the browser.
            // For now, only confirm that the exchange succeeded.

            console.log("eBay OAuth authorization successful.");
            console.log(
                "Access token received:",
                Boolean(tokenData.access_token)
            );
            console.log(
                "Refresh token received:",
                Boolean(tokenData.refresh_token)
            );

            res.writeHead(200, {
                "Content-Type": "text/html"
            });

            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>eBay Connected</title>
                </head>

                <body style="font-family: Arial; text-align: center; padding: 50px;">

                    <h1>eBay Connected Successfully!</h1>

                    <p>
                        Your Card Profit Tracker has successfully
                        authorized with eBay.
                    </p>

                    <p>
                        You can close this window.
                    </p>

                </body>
                </html>
            `);

        } catch (error) {

            console.error(
                "eBay OAuth error:",
                error
            );

            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end(
                "Something went wrong while connecting to eBay."
            );
        }

        return;
    }

    // --------------------------------
    // eBay OAuth Declined
    // --------------------------------

    if (
        req.method === "GET" &&
        req.url.startsWith("/ebay/oauth/declined")
    ) {

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>eBay Connection Cancelled</title>
            </head>

            <body style="font-family: Arial; text-align: center; padding: 50px;">

                <h1>eBay Connection Cancelled</h1>

                <p>
                    Your Card Profit Tracker was not connected to eBay.
                </p>

            </body>
            </html>
        `);

        return;
    }

    // --------------------------------
    // API Test
    // --------------------------------

    if (req.url === "/api/test") {

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            success: true,
            message: "Card Profit API is working!"
        }));

        return;
    }

    // --------------------------------
    // Default
    // --------------------------------

    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end(
        "Card Profit API backend is running!"
    );
});

server.listen(PORT, () => {
    console.log(
        `Backend running on port ${PORT}`
    );
});
