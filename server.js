'use strict';
// grab the packages we need
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require('serve-static');

const RESPONSE_ENUM = {
    ERROR: 'api/error.json',
    PROGRESS: 'api/progress.json',
    SUCCESS: 'api/success.json'
};

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(serveStatic(path.join(__dirname)));

app.post('/api/users', function(req, res) {
    const contents = fs.readFileSync(path.join(__dirname, RESPONSE_ENUM.ERROR), 'utf8');
    res.type('json');
    res.send(contents);
});

app.listen(port);
console.log(`Server started! At http://localhost:${port}`);
