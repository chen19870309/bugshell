"use strict"
let Client = require('ssh2-sftp-client');
var ssh2 = require("ssh2");
var util=require("util")
var events=require("events");
const Log = require('../logger')
let logger = Log.getLogger('ssh2-sftp')
//var Client = require("ssh2").Client;
var fs = require("fs");
var path = require('path');
//var async = require('async');


var callback = new Function();

function CDRemoteSFTP(server,path,then) {
	var remotepath
	var isPath;
	var sftp = new Client();
		sftp.connect(server).then(()=>{
			return sftp.exists(path);
		}).then(
			data => {
				isPath = data
			}
		).then(()=>{
			if(isPath){
				return sftp.list(path);
			}else{
				return null;
			}
		}
		).then(
			data => {
				then(null,path,data,server)
			}
		).then(()=>{
			sftp.end()
		}).catch(err =>{
			console.log(err)
			then(err)
		})
}

function ListRemoteSFTP(server,then) {
	var remotepath
	var sftp = new Client();
		sftp.connect(server).then(()=>{
			return sftp.cwd();
		}).then(
			data => {
				remotepath = data
			}
		).then(()=>{
			return sftp.list(remotepath);
		}
		).then(
			data => {
				then(null,remotepath,data,server)
			}
		).then(()=>{
			sftp.end()
		}).catch(err =>{
			console.log(err)
			then(err)
		})
}

function CloseRemoteSFTP(server,then) {
	try{
		getSftpClient(server).end();
		if(then)then()
	}catch(err){
		if(then)then(err)
	}
}
 
/**
* 描述：连接远程电脑
* 参数：server 远程电脑凭证；then 回调函数
* 回调：then(conn) 连接远程的client对象
*/
function Connect(server, then){
	var conn = new Client();
	conn.on('ready', function(){
		console.log("connect ready",server);
		then(conn);
	}).on('error', function(err){
		console.log("connect error!",err);
	}).on('end', function() {
		console.log("connect end!");
	}).on('close', function(had_error){
		console.log("connect close");
	}).connect(server);
}
 
/**
* 描述：运行shell命令
* 参数：server 远程电脑凭证；cmd 执行的命令；then 回调函数
* 回调：then(err, data) ： data 运行命令之后的返回数据信息
*/
function Shell(server, cmd, then){
	Connect(server, function(conn){
		conn.shell(function(err, stream){
			console.log("shell",cmd,err)
			if(err){
				then(err);
			}else{// end of if
				var buf = "";
				stream.on('close', function(){						
					conn.end();						
					then(err, buf);
				}).on('data', function(data){
					buf=buf+data;					
				}).stderr.on('data', function(data) {
					console.log('stderr: ' + data);
				});	
				stream.end(cmd);		
			}							
		});
	});	
}

function UploadFile(info , then, dirprocess,callback){
	var sftp = new Client();
	var localPath = path.join(info.path,info.filename)
	var remotePath = info.remotePath + sftp.remotePathSep + info.filename
	sftp.connect(info.host).then(()=>{
		logger.info("start upload",localPath)
		if(fs.statSync(localPath).isDirectory()){
			sftp.on('upload', info => {
				logger.info("Listener: Uploaded",info);
				if(dirprocess)dirprocess(info.source)
			});
			return sftp.uploadDir(localPath,remotePath);
		}else{
			if(callback){
				return sftp.fastPut(localPath,remotePath,{step:(t,c,a)=>{
					callback(t,a,info.filename)
				}});
			}else{
				return sftp.fastPut(localPath,remotePath);
			}
		}
	}).then(()=>{
			sftp.end()
			logger.info("end upload",localPath)
			then(null,remotePath,info)
	}).catch(err =>{
			console.log(err)
			then(err)
	})
}


function DownloadFile(data, then,process){
	var localPath = path.join(data.localPath,data.filename)
	var sftp = new Client();
		sftp.connect(data.host).then(()=>{
			return sftp.stat(data.path+sftp.remotePathSep+data.filename)
		}).then( stats => {
			var rpath = data.path+sftp.remotePathSep+data.filename
			if(stats.isDirectory){
				sftp.on('download', info => {
					logger.info("Listener: Download",info);
					var dfile = {}
					dfile.remotefilename = info.source
					sftp.stat(info.source).then(sfile => {
						dfile.remotesize = sfile.size
						dfile.filename = info.destination
						dfile.size = 0;
						dfile.start = new Date();
						if(sfile.size>1024*1024){
							process(dfile)
						}
					})
					// if(process)process(info.source)
				});
				return sftp.downloadDir(rpath,localPath)
			}else{
				var dfile = {}
				dfile.remotefilename = rpath
				dfile.remotesize = stats.size
				dfile.filename = localPath
				dfile.key = data.host.host + data.host.username
				dfile.size = 0;
				dfile.start = new Date();
				if(dfile.remotesize>1024*1024){
					process(dfile)
				}
				//console.log(process,callback)
				return sftp.fastGet(rpath,localPath);
			}
		}).then(()=>{
			//MonitorLocal()
			sftp.end()
			then(null,localPath,data)
		}).catch(err =>{
			console.log(err)
			then(err)
		})
}

function Delete(data,then) {
	var sftp = new Client();
	var rpath = data.path+sftp.remotePathSep+data.filename
	sftp.connect(data.host).then(()=>{
		return sftp.stat(rpath)
	}).then( stats => {
		if(stats.isDirectory){
			return sftp.rmdir(rpath,true)
		}else{
			return sftp.delete(rpath);
		}
	}).then(()=>{
		sftp.end()
		then(null,data.path)
	}).catch(err =>{
		console.log(err)
		then(err)
	})
}
 
/**
* 描述：获取远程文件路径下文件列表信息
* 参数：server 远程电脑凭证；
*		remotePath 远程路径；
*		isFile 是否是获取文件，true获取文件信息，false获取目录信息；
*		then 回调函数
* 回调：then(err, dirs) ： dir, 获取的列表信息
*/
function GetFileOrDirList(server, remotePath, isFile, then){
	var cmd = "find " + remotePath + " -type "+ (isFile == true ? "f":"d") + "\r\nexit\r\n";	
	Shell(server, cmd, function(err, data){
		var arr = [];
		var remoteFile = [];
		arr = data.split("\r\n");
		arr.forEach(function(dir){
			if(dir.indexOf(remotePath) ==0){
				remoteFile.push(dir);
			}
		});
		then(err, remoteFile);
	});
}
 
/**
* 描述：控制上传或者下载一个一个的执行
*/
function Control(){
	events.EventEmitter.call(this);
}
util.inherits(Control, events.EventEmitter); // 使这个类继承EventEmitter
 
var control = new Control();
 
control.on("donext", function(todos, then){
	if(todos.length > 0){
		var func = todos.shift();
		func(function(err, result){
			if(err){
				throw err;	
				then(err);
			}else{			
				control.emit("donext", todos, then);					
			}
		});
	}else{			
		then(null);
	}
});
 
 
/**
* 描述：下载目录到本地
* 参数：server 远程电脑凭证；
*		remotePath 远程路径；
*		localDir 本地路径，
*		then 回调函数
* 回调：then(err)
*/
function DownloadDir(server, remoteDir,localDir, then){
	GetFileOrDirList(server, remoteDir, false, function(err, dirs){
		if(err){
			throw err;
		}else{
			GetFileOrDirList(server, remoteDir, true, function(err, files){
				if(err){
					throw err;
				}else{					
					dirs.shift();
					dirs.forEach(function(dir){	
						var tmpDir = path.join(localDir, dir.slice(remoteDir.length+1)).replace(/[//]\g/, '\\');
						// 创建目录
						fs.mkdirSync(tmpDir);				
					});
					var todoFiles = [];
					files.forEach(function(file){
						var tmpPath = path.join(localDir, file.slice(remoteDir.length+1)).replace(/[//]\g/, '\\');
						todoFiles.push(function(done){
							DownloadFile(server, file, tmpPath, done);							
							console.log("downloading the "+file);
						});// end of todoFiles.push						
					});
					control.emit("donext", todoFiles, then);
				}
			});
		}
	});
}
 
/**
* 描述：获取windows上的文件目录以及文件列表信息
* 参数：destDir 本地路径，
*		dirs 目录列表
*		files 文件列表
*/
function GetFileAndDirList(localDir, dirs, files){
	var dir = fs.readdirSync(localDir);
	for(var i = 0; i < dir.length; i ++){
		var p = path.join(localDir, dir[i]);
		var stat = fs.statSync(p); 
		if(stat.isDirectory())
		{
			dirs.push(p);
			GetFileAndDirList(p, dirs, files);
		}
		else
		{
			files.push(p);
		}
	}
}

 
exports.Shell = Shell;
exports.UploadFile = UploadFile;
exports.DownloadFile = DownloadFile;
exports.ListRemoteSFTP = ListRemoteSFTP;
exports.CDRemoteSFTP = CDRemoteSFTP;
exports.Delete = Delete;