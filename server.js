const express = require('express')
const app = express()
const port = 3000
const { exec } = require("child_process");

app.use(express.static('.'))

app.get('/unpack', (req, res) => {
    exec("apktool d myui.apk", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            res.send(error.message)
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            res.send(stderr.message)
            return;
        }
        console.log(`stdout: ${stdout}`);
        res.send(stdout)
    })
  //res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

