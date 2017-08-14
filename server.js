'use strict';
// grab the packages we need
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const path = require('path');
const serveStatic = require('serve-static');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(serveStatic(path.join(__dirname)));

app.post('/api/users', function(req, res) {
    res.type('json');
    const contents = fs.readFileSync(path.join(__dirname, 'api/error.json'), 'utf8');
    res.send(contents);
});

app.listen(port);
console.log(`Server started! At http://localhost:${port}`);
