const express = require('express')
const fs = require('fs');
const app = express()
const port = 3000

var cors = require('cors');
app.use(cors());

bb.extend(app, {
    upload: true,
    path: './files'
});

