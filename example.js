const express = require('express');
const router = express.Router();
const Mailarchiva = require("node-mailarchiva");

const mailarchiva = new Mailarchiva({
    "baseURL": "https://archiva.yoururl.com",
    "headers": {
        "Authorization": "ABC123BLAHBLAH"
    },
    "version": "v1" // or v2
});

router.get("/search/:email", async(req, res) => {
    try {
        var emails = await mailarchiva.findByEmail(req.params.email);
        res.send({ emails });
    } catch(err) {
        console.error(err);
        res.status(500).send(err);
    }
});

router.get("/single/:volid/:id", async (req, res) => {
    try {
        var body = await mailarchiva.get(req.params.volid, req.params.id);
        var attachments = await mailarchiva.attachments(req.params.volid, req.params.id);
        res.send({ body, attachments });
    } catch(err) {
        console.error(err);
        res.status(500).send(err);
    }
});

router.get("/attachment/:volid/:id/:filename", async (req, res) => {
    try {
        var file = await mailarchiva.attachment(req.params.volid, req.params.id, req.params.filename, res);
        res.attachment(req.params.filename);
        res.download(file);
    } catch(err) {
        console.error(err);
        res.status(500).send(err);
    }
});

module.exports = router;