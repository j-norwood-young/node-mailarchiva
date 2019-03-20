var express = require('express');
var router = express.Router();
var mailarchiva = require("node-mailarchiva");

router.get("/search/:email", async(req, res) => {
    try {
        var emails = await mailarchiva.findByEmail(req.params.email);
        res.send({ emails });
    } catch(err) {
        console.error(err);
        res.send(500, err);
    }
});

router.get("/single/:volid/:id", async (req, res) => {
    try {
        var body = await mailarchiva.get(req.params.volid, req.params.id);
        var attachments = await mailarchiva.attachments(req.params.volid, req.params.id);
        console.log(body);
        res.send({ body, attachments });
    } catch(err) {
        console.error(err);
        res.send(500, err);
    }
});

router.get("/attachment/:volid/:id/:filename", async (req, res) => {
    try {
        var file = await mailarchiva.attachment(req.params.volid, req.params.id, req.params.filename, res);
        console.log(file);
        res.attachment(req.params.filename);
        res.download(file);
    } catch(err) {
        console.error(err);
        res.send(500, err);
    }
});

module.exports = router;