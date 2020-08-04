const get_classes = require('./scraper.js')
const express = require("express")
const exp = express()

exp.get("/", (req, res) => {
    res.json('home page')
});

// /EECS280
// /MUSEUMS420
exp.get('/:classname', (req, res) => {
    get_classes.fos(req.params.classname).then(class_data => {
        console.table(class_data)
        res.json(class_data);
    });
}); 
const port = process.env.PORT || 5000
exp.listen(port, () => console.log(`backend server listening on port ${[port]}!`)); 