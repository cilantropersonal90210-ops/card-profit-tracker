const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {

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
