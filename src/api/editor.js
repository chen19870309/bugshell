"use strict"
var fs = require("fs");
var util=require("util")
var path = require('path');
var async = require('async');


function saveFile(filepath,value) {
    if(fs.existsSync(filepath)){
        fs.writeFileSync(filepath,value,{encoding:'utf8',flag:'w'}) 
    }else{
        fs.writeFileSync(filepath,value) 
    }
}


exports.saveFile = saveFile;
