# Node Mailarchiva

A library for interacting with [Mailarchiva Email Archiver](https://www.mailarchiva.com/)

## Installation

`npm install node-mailarchiva`

## Config

This library uses [config](https://www.npmjs.com/package/config) to set configuration settings.

config/sample.json

```
{
    "mailarchiva": {
        "baseURL": "https://archiva.yoururl.com",
        "headers": {
            "Authorization": "ABC123BLAHBLAH"
        }
    }
}
```

## Usage

Eg. of usage in an Express app:

```
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
```

## License

Copyright 2019 Jason Norwood-Young

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.