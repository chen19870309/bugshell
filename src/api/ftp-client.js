"use strict"
var fs = require("fs");
var path = require('path');
let Client = require('ftp');

const Log = require('../logger')
let logger = Log.getLogger('ftp')

function UploadFile(info , then, dirprocess,fileprocess){
    var localPath = path.join(info.path,info.filename)
    var stat = fs.statSync(localPath)
    if(stat.isDirectory()){
        uploadDir(info , then, dirprocess,fileprocess)
    }else{
        uploadFile(info , then, fileprocess)
    }
}

function uploadDir(info , then, dirprocess){
    var ftp = new Client();
    var localPath = path.join(info.path,info.filename)
    var remotePath = info.remotePath + "/" + info.filename
    var Fs = []
    fs.readdir(localPath, function(err, files) {
        files.forEach((file,i)=>{
        var pathname = path.join(localPath, file)
        fs.stat(pathname, (err, stats) => { // 读取文件信息
            if(err){
                logger.error("stat:",pathname,err.message)
            }else{
                if(stats.isFile()){
                    Fs.push({
                        localpath:pathname,
                        filename: file,
                    })
                }
            }
        })
        })
    })
    ftp.on('ready', function() {
        ftp.mkdir(info.filename,(err)=>{
            logger.info('mkdir',info.filename,err)
        })
        ftp.cwd(info.filename,(err)=>{
            logger.info('cwd',info.filename,err)
        })
        ftp.binary()
        Fs.forEach((item,index)=>{
            dirprocess(item.filename)
            logger.info('upload',index,item.localpath)
            ftp.put(item.localpath,item.filename,function(err){
                if (err) {
                    logger.error('upload file',localPath,'failed!',err)
                }
            })
        })
        ftp.end()
        if(then)then(null,remotePath,info)
    });
    ftp.connect({
        host: info.host.host,
        port: info.host.port,
        user: info.host.username,
        password: info.host.password,
    });
}

function uploadFile(info , then, dirprocess){
    var ftp = new Client();
    var localPath = path.join(info.path,info.filename)
    var remotePath = info.remotePath + "/" + info.filename
    try{
    ftp.on('ready', function() {
        var ps = info.remotePath.split("/")
        ftp.cwd(ps[ps.length-1],(err,cur)=>{
            logger.info('cwd',info.remotePath,cur,err)
        })
        //ftp.binary()
        logger.info('start ftp.put',localPath, info.filename)
        ftp.put(localPath, info.filename,function(err) {
          if (err) {
              logger.error('upload file',localPath,'failed!',err)
          }
          ftp.end()
          if(then)then(null,remotePath,info)
        });
    });
    }catch(err){
        if(err){
            ftp.end()
            if(then)then(err)
        }
    }
    // connect to localhost:21 as anonymous
    ftp.connect({
        host: info.host.host,
        port: info.host.port,
        user: info.host.username,
        password: info.host.password,
    });
}

function ListRemoteFTP(server,then){
    var ftp = new Client();
    ftp.on('ready', function() {
        ftp.pwd((err,cwd)=>{
            if(err){
                logger.error(' ftp pwd error',err)
                if(then)then(err)
            }else{
                ftp.list(cwd,(err,list)=>{
                    if(err){
                        logger.error(' ftp list error',cwd,err)
                        if(then)then(err)
                    }else{
                        //logger.error(' ftp list success',cwd,list,server)
                        //console.dir(list)
                        if(then)then(null,cwd,list,server)
                    }
                })
            }
        })
    })
    ftp.connect(server);
}

function CDRemoteFTP(server,cwd,then){
    server.user = server.username
    var ftp = new Client();
    ftp.on('ready', function() {
        ftp.list(cwd,(err,list)=>{
            if(err){
                logger.error(' ftp list error',cwd,err)
                    if(then)then(err)
            }else{
                logger.error(' ftp list success',cwd,list,server)
                console.dir(list)
                if(then)then(null,cwd,list,server)
            }
        })
    })
    ftp.connect(server);
}

function Delete(data,then){
    var ftp = new Client();
    ftp.on('ready', function() {
        ftp.cwd(data.path,(err,cur)=>{
            logger.info('cwd',data.path,cur,err)
        })
        ftp.list(data.path,(err,list)=>{
            list.forEach((file,index)=>{
                if(file.name == data.filename && file.type == "-"){ // 文件
                    console.log('deal',file.name , data.filename)
                    ftp.delete(data.filename,(err)=>{
                        then(err)
                        ftp.end()
                    })
                }
            })
        })
        then(null)
    })
    ftp.connect({
        host: data.host.host,
        port: data.host.port,
        user: data.host.username,
        password: data.host.password,
    });
}

function DownloadFile(data,then,process){
    var ftp = new Client();
    try{
    ftp.on('ready', function() {
        ftp.cwd(data.path,(err,cur)=>{
            logger.info('cwd',data.path,cur,err)
        })
        ftp.get(data.filename,function(err, stream) {
            if (err){
                ftp.end()
                if(then)then(err)
            }else{
                var dfile = {}
                var localPath = path.join(data.localPath,data.filename)
				dfile.remotesize = 0
				dfile.filename = localPath
                dfile.size = 0;
                dfile.name = data.filename
                dfile.key = data.host.host + data.host.username
				dfile.start = new Date();
				process(dfile)
                stream.once('close', function() { 
                    ftp.end(); 
                    then(null,data.localPath,data)
                });
                stream.pipe(fs.createWriteStream(localPath));

            }
        })
    })
    }catch(err){
        if(err){
            ftp.end()
            if(then)then(err)
        }
    }
    ftp.connect({
        host: data.host.host,
        port: data.host.port,
        user: data.host.username,
        password: data.host.password,
    });
}


exports.UploadFile = UploadFile;
exports.DownloadFile = DownloadFile;
exports.ListRemoteFTP = ListRemoteFTP;
exports.CDRemoteFTP = CDRemoteFTP;
exports.Delete = Delete;