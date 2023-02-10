const { exec } = require("child_process");
const express = require('express')
//var FileReader = require('filereader')
//import express from express

const { resolve } = require('path');
const { readdir } = require('fs').promises;
const fs = require('fs');
const app = express()
const port = 8000

//const cors    = require('cors');
const busboy  = require('connect-busboy');
const workfolder    = "" // currennt folder
//const jsdom = require("jsdom")
//const { JSDOM } = jsdom
//global.DOMParser = new JSDOM().window.DOMParser
var DOMParser = require('xmldom').DOMParser;

async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}

app.use(express.json());
//app.use(cors);
app.use(busboy({ highWaterMark: 2 * 1024 * 1024 })); // Insert the busboy middle-ware

///* 
function propername(filename) {
    const folder    = apk2folder(filename);
    for (let i=0; i < 100; i++) {
        const name = folder + i + ".apk";
        if (! fs.existsSync(name)) return name;
    }
    return null;
}
app.route('/upload').post((req, res) => {
    var uploadname = "test.json";
    req.pipe(req.busboy); // Pipe it trough busboy

    req.busboy.on('field', (fieldname, data, filename) => {
        console.log(fieldname, data);

        if (fs.existsSync(data)) {
            uploadname = propername(data);
        } else {
            uploadname = data;
        }
    });

    req.busboy.on('file', (fieldname, file, filename) => {
        console.log(fieldname);

        // Create a write stream of the new file
        const fstream = fs.createWriteStream("./" + workfolder + "/" + uploadname);
        // Pipe it trough
        file.pipe(fstream);
        console.log(file)

        // On finish of the upload
        fstream.on('close', () => {
            console.log(`Upload of '${filename}' finished`);
            res.send(uploadname)
            //res.redirect('back');
        });
    });
});

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.post('/clean',   clean);
app.post('/unpack',  unpack);
app.post('/getname', getpackagename);
app.post('/replace', replace);
app.post('/repack',  repack);

function clean(req, res) {
    const apkname   = req.body.apkname;
    const folder    = apk2folder(apkname);

    exec("rm -rf " + folder, (error, stdout, stderr) => {
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
        const ret = JSON.stringify({res: stdout})
        res.send(ret)
    })
}

function unpack(req, res) {
    const apkname = req.body.apkname;

    exec("./apktool d " + apkname, (error, stdout, stderr) => {
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
        const ret = JSON.stringify({res: stdout})
        res.send(ret)
    })
}

function repack(req, res) {
    const apkname   = req.body.apkname;
    const folder    = apk2folder(apkname);
    const outname   = folder + "-unsigned.apk"

    exec("./apktool b --use-aapt2 " + folder + " -o " + outname, (error, stdout, stderr) => {
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
        fs.rename(outname, "public/" + outname, (err) => {
            if (err) throw err
            console.log('Successfully renamed - AKA moved!')
        })
        const ret = JSON.stringify({name: outname})
        res.send(ret)
    })
}

function apk2folder(apkname) {
    const index = apkname.indexOf(".apk");
    return apkname.substring(0, index);
}

function getpackagename(req, res) {
    const apkname   = req.body.apkname;
    const folder    = apk2folder(apkname);
    const path      = "./"+folder+"/"+"AndroidManifest.xml";
    
    fs.readFile(path, function (err, data) {
        if (err) throw err;
     
        //console.log(data.toString());
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.toString(),"text/xml");
        console.log(xmlDoc);
        const list = xmlDoc.getElementsByTagName("activity")
        console.log("activity",list);
        var packagename = null;
        for (let i=0; i < list.length; i++) {
            //console.log(list[i]);
            const name      = list[i].getAttribute("android:name");
            const elIntents = xmlDoc.getElementsByTagName("intent-filter")
            const elCategory=  (elIntents)?  elIntents[0].getElementsByTagName("category"): null;
            const category  = (elCategory)? elCategory[0].getAttribute("android:name"): null;
            
            console.log(name, category);

            if (category == "android.intent.category.LAUNCHER") {
                packagename = name;
                break;
            }
        }

        const ret = JSON.stringify({name: packagename})
        res.send(ret)
    });
}

function replacefile(filename, search, replacement) {
    fs.readFile(filename, 'utf8', function (err, data) {
        const re    = new RegExp(search, "g");
        const mm    = data.match(re);

        if (err) return console.log(err);
        if (! mm) return;
            
        console.log(mm);
        const result = data.replace(re, replacement);
        fs.writeFile(filename, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

function replace(req, res) {
    const apkname   = req.body.apkname;
    const folder    = apk2folder(apkname);
    const search1    = "Lcom\/sobox\/myui"; // "sobox"
    const replace1   = "Lcom\/nobox\/myui"; // "nobox"
    const search2    = "com\.sobox\.myui";  // "sobox"
    const replace2   = "com\.nobox\.myui";  // "nobox"
    
    (async () => {
        for await (const filepath of getFiles(folder)) {
            replacefile(filepath, search1, replace1);
        }
        for await (const filepath of getFiles(folder)) {
            replacefile(filepath, search2, replace2);   // To-DO
        }
        const ret = JSON.stringify({res: "ok"})
        res.send(ret)
    })()
}

