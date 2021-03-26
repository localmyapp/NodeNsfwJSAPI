// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const nsfwModel = require("./src/NSFWModel");

nsfwModel.init();
// make all the files in 'public' available
app.use(express.static("public"));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/views/index.html");
});
let cache = [];
let discordVideo = [".gif", ".mp4", ".webm"];

async function classify(url, req, res) {
    console.log(req.url + ":" + url);
    const hash = url;

    try {
        if (!cache[hash]) {
            cache[hash] = await nsfwModel.classify(url);
        }
        res.json(cache[hash]);
    } catch (err) {
        res.status(500);
        res.send("wtf");
        console.log(err);
    }
}
app.get("/api/json/graphical", (req, res) => {
    res.json(nsfwModel.list)
})
app.get("/api/json/graphical/classification/*", async (req, res) => {
    let url = req.url.replace("/api/json/graphical/classification/", "");
    if (!url) return
    let body = {}
    let allowed = true;
    body.error = "Not allowed"
    res.status(405);
    if (!url.startsWith("https://cdn.discordapp.com/")) {
        res.status(415);
        body.error = "Only allow https://cdn.discordapp.com/"
        res.json(body);
        allowed = false;
    }
    if (allowed)
        for (const discordVideoKey in discordVideo) {
            if (url.endsWith(discordVideo[discordVideoKey])) {
                allowed = false;
                if (url.startsWith("https://cdn.discordapp.com/")) {
                    url = url + "?format=png";
                    url = url.replace(
                        "https://cdn.discordapp.com/",
                        "https://media.discordapp.net/"
                    );
                    allowed = true;
                    break;
                }
            }
        }
    if (!allowed) {
        res.json(body);
        return;
    }
    await classify(url, req, res);
});

app.post("/api/*", (request, response) => {
    console.dir(request.body);
    response.writeHead(200, {"Content-Type": "text/html"});
    response.end("404");
});
// listen for requests :)
const listener = app.listen(process.env.PORT || 5656, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
