const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const EBAY_ENDPOINT =
    "https://card-profit-tracker.onrender.com/ebay/notifications";

const server = http.createServer((req, res) => {

    // Allow your frontend to access the backend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // eBay Marketplace Account Deletion verification
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

        const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;

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

    // API test
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

    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("Card Profit API backend is running!");
});

server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
