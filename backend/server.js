const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("Card Profit API backend is running!");
});

server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
