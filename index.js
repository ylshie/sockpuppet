const { exec } = require("child_process");
const express = require('express')
var FileReader = require('filereader')
//import express from express

const fs = require('fs');
const app = express()
const port = 3000

//const cors    = require('cors');
const busboy  = require('connect-busboy');
const workfolder    = "" // currennt folder
//const jsdom = require("jsdom")
//const { JSDOM } = jsdom
//global.DOMParser = new JSDOM().window.DOMParser
var DOMParser = require('xmldom').DOMParser;

app.use(express.json());
//app.use(cors);
app.use(busboy({ highWaterMark: 2 * 1024 * 1024 })); // Insert the busboy middle-ware

///* 
app.route('/upload').post((req, res, next) => {
    var uploadname = "test.json";
    req.pipe(req.busboy); // Pipe it trough busboy

    req.busboy.on('field', (fieldname, data, filename) => {
        console.log(fieldname, data);

        uploadname = data;
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
            res.redirect('back');
        });
    });
});
//*/
/*
app.post('/record', function(request, response){
   console.log("got data");
   console.log(request);

   response.send("OK");    // echo the result back
});
*/
app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.post('/unpack',   unpack);
app.post('/getname', getpackagename);

function unpack(req, res) {
    const apkname = req.body.apkname;

    exec("apktool d " + apkname, (error, stdout, stderr) => {
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

function apk2folder(apkname) {
    return "myui";
}

function getpackagename(req, res) {
    const apkname   = req.body.apkname;
    const folder    = apk2folder(apkname);
    const path      = "./"+folder+"/"+"AndroidManifest.xml";
    /*
    var fr=new FileReader();
    fr.onload=function(){
        //document.getElementById('output').textContent=fr.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fr.result,"text/xml");
        console.log(xmlDoc);
        const ret = JSON.stringify({name: "myui"})
        res.send(ret)
    }
    fr.readAsText();
    */
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

function replacename(req, res) {
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

