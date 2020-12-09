const {app,Menu,dialog ,BrowserWindow,globalShortcut,clipboard} = require('electron');//引入electron
const SSHClient = require("ssh2").Client;
const utf8 = require('utf8');
const Log = require('./src/logger')
const sftp = require('./src/api/ssh-sftp.js')
const ftp = require('./src/api/ftp-client.js')
const db  = require('./src/api/db-orm.js')
var fs = require("fs");
var path = require('path');
//var async = require('async');
let logger = Log.getLogger()
let win;
let markdown;
let appMenu;
let redis;
let ssh;
let cpdata;
let cc = 0;
let downloading = false //下载状态
let downloadList = []   //下载的任务队列
const CtrlV = 'Command+v'
const SSHWinMap = new Map(); //缓存的窗口对象
const SFTPMap = new Map();   //缓存的远程服务器文件目录对象啊
let windowConfig = {
  width:800,
  height:600,
  webPreferences: {
    nodeIntegration: true
  }
};//窗口配置程序运行窗口的大小

let xtermConfig = { //独立的xterm窗口
  width:725,
  height:422,
  useContentSize: true,
  webPreferences: {
    nodeIntegration: true
  }
};//窗口配置程序运行窗口的大小

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let Redis = require('ioredis');

var dfiles = []
var dfile = {} //正在下载的文件详情
var ufile = {}

function createXterm(term){
  logger.info('createXterm',term)
  let sshwin = new BrowserWindow(xtermConfig);//创建一个窗口
  sshwin.loadURL(`file://${__dirname}/src/web-xterm.html`);
  //sshwin.webContents.openDevTools();  //开启调试工具
  sshwin.on('close',() => {
    //回收BrowserWindow对象
    SSHWinMap.delete(term.id);
  });
  sshwin.on('resize',() => {
    sshwin.reload();
    sshwin.focus()
  })
  sshwin.webContents.on('did-finish-load', function(){
    sshwin.webContents.send('xterm-init',JSON.stringify(term));
  });
  SSHWinMap.set(term.id,sshwin)
  sshwin.show()
  sshwin.focus()
}
//一步函数还真是糟糕的状态
function tables(info,results){
  //return new Promise((resolve)=>{
    let tables = {}
    results.forEach((table) => {
      info.cmd = 'desc '+table
      db.ExecCommand(info,(err,sever,item)=>{
        if(item){
          var cols = new Array()
          item.forEach((f)=>{
            cols.push(f.Field)
          })
          //logger.info(table,cols)
          tables[table]=cols
        }
      })
    })
    return tables
    //resolve(tables)
  //})
}

function dbback(err,info,results,total){
  //logger.info('dbback',err,results)
  if(err){
    win.webContents.send('db-cmd-reply',{err:err.message})
    return
  }
  if(results){
    if(info.cmd == "show tables" && results != null){
      win.webContents.send('menu-db-tables',{host:info.host,schema:info.schema,tables:results})
      var tabs = tables(info,results)
      setTimeout(()=>{ //等5秒获取表结构信息
        win.webContents.send('db-schema-change',{schema:info.schema,tables:tabs})
      },5000)
    }else if(info.cmd == "show databases"){
      win.webContents.send('menu-db-schema',{host:info.host,schema:results})
    }else{
      win.webContents.send('db-cmd-reply',{result:results,total:total,page:info.page})
    }
  }else{
    win.webContents.send('db-cmd-reply',{result:[],total:0,page:10})
  }
}

function createWindow(){
  logger.info('createWindow')
  Menu.setApplicationMenu(null)
  win = new BrowserWindow(windowConfig);//创建一个窗口
  win.loadURL(`file://${__dirname}/dist/index.html`);//在窗口内要展示的内容index.html 就是打包生成的index.html
  // win.loadURL(`file://${__dirname}/src/markdown.html`);
  win.webContents.openDevTools();  //开启调试工具
  win.on('close',() => {
    //回收BrowserWindow对象
    win = null;
  });
  win.on('resize',() => {
    win.webContents.send('mainwin-resize',win.getContentSize())
  })
  //testRedis();
}
app.whenReady().then(()=>{
  //事件处理定时器
  setInterval(() => {
    let view = BrowserWindow.getFocusedWindow();
    if(view){
      if(!globalShortcut.isRegistered(CtrlV)){
        globalShortcut.register(CtrlV, function () {
          let view = BrowserWindow.getFocusedWindow();
          let txt = clipboard.readText()
          //logger.info('Command+V',txt,view)
          if(view && txt){
            view.send('clipboard-v',txt)
          }
        })
      }
    }else{
      if(globalShortcut.isRegistered(CtrlV)){
        logger.info('app is not active ureguist:',CtrlV)
        globalShortcut.unregisterAll();
      }
      try{
        //TODO :监控活动状态，超过时间不活动后锁定窗口
        //win.webContents.send('win-lock',{winlock:true})
      }catch(err){
        logger.error('lock win',err)
      }
    }
    MonitorDownLocal()
  },1000)
  
});
app.on('will-quit',()=>{
  globalShortcut.unregisterAll();
});
app.on('ready',createWindow);
app.on('window-all-closed',() => {
  logger.info('quit app')
  app.quit();
});
app.on('activate',() => {
  if(win == null){
    createWindow();
  }
});

function MSG(msg,topic){
  var data = {
    msg: msg
  }
  win.webContents.send('process-message',data)
  if(topic){
    win.webContents.send(topic,msg)
  }
}
function ERROR(msg,topic){
  var data = {
    icon: 'el-icon-error',
    msg: msg
  }
  win.webContents.send('process-message',data)
  if(topic){
    win.webContents.send(topic,msg)
  }
}
function PROCESS(msg,topic){
  var data = {
    icon: 'el-icon-loading',
    msg: msg
  }
  win.webContents.send('process-message',data)
  if(topic){
    win.webContents.send(topic,msg)
  }
}


// 主进程中
const ipcMain = require('electron').ipcMain;

ipcMain.on('clipboard-c',function(event, arg) {
  logger.info('Ctrl+C',arg)
  cpdata = arg
});

ipcMain.on('asynchronous-message', function(event, arg) {
  event.sender.send('asynchronous-reply', 'pong');
});
//展示数据明细
ipcMain.on('dataitem-message',function(env,arg){
  //logger.info('dataitem-message',arg)
  win.webContents.send('dataitem-message',arg)
})
//打开独立的xterm窗口
ipcMain.on('open-xterm',function(event,term) {
  var host = {
    host: term.ssh.host,
    port: term.ssh.port,
    username: term.ssh.username,
    password: term.ssh.password,
    //readyTimeout: 2000,
    //privateKey: '/home/steel/.ssh/id_rsa'
  }
  createXterm(host)
});

ipcMain.on('test-connect', function(event, arg) {
  logger.info('test-connect => '+arg.host)
  PROCESS('test-connect => '+arg.host)
  switch(arg.type) {
    case 'ssh2':
    case 'sftp':
    var client = new SSHClient();
    client.on('ready',() => {
      logger.info("connect ssh success!",arg)
      MSG("connect ssh success! "+arg.host)
      event.reply('connect-reply','success')
      client.end();
    }).on('error',(err)=>{
      logger.error("connect ssh failed!",arg,err)
      ERROR("connect ssh failed! "+arg.host+" :"+err.message)
      event.reply('connect-reply',err.message)
      client.end();
    }).connect({
      host: arg.host,
      port: arg.port,
      user: arg.username,
      password: arg.password,
      // readyTimeout: 2000,
      //privateKey: '/home/steel/.ssh/id_rsa'
    })
      break;
    case 'ftp':
      ftp.ListRemoteFTP({
        host: arg.host,
        port: arg.port,
        user: arg.username,
        password: arg.password,
      },(err,cwd,list)=>{
        if(err){
          logger.error("connect ftp failed!",arg,err)
          ERROR("connect ftp failed! "+arg.host+" :"+err.message)
          event.reply('connect-reply',err.message)
        }else{
          MSG("connect ftp success! "+arg.host)
          event.reply('connect-reply','success')
        }
      })
      break;
    case 'mysql':
      db.TestConnect(arg,(err)=>{
        if(err){
          logger.error("connect "+arg.type+" failed!",arg,err)
          ERROR("connect  "+arg.type+"  failed! "+arg.host+" :"+err.message)
          event.reply('connect-reply',err.message)
        }else{
          MSG("connect ftp success! "+arg.host)
          event.reply('connect-reply','success')
        }
      })
      break;
    default:
      ERROR("connect  "+arg.host+" failed -> unknow host.type ["+arg.type+"]")
  }
});

function ConnectCallBack(err,path,files,host){
  var key = host.host+host.username;
  if(host.user){
    key = host.host+host.user
  }
  if(err){
    ERROR('sftp connect :'+ host.username+'@'+host.host+' failed! '+err.message)
  }else{
    MSG('sftp connect :'+ host.username+'@'+host.host+' success!')
  }
  var data = {
    host: host,
    remotepath: path,
    files: files,
  }
  //logger.info("set cache",key,data)
  SFTPMap.set(key,data)
  pushFiles(files)
  win.webContents.send('sftp-list',data)
}

ipcMain.on('sftp-connect',function(env,host){
  PROCESS('start connectting '+host.type+'://'+ host.username+'@'+host.host+'...')
  var key = host.host+host.username;
  var info = SFTPMap.get(key)
  if(info){
    console.log('get',key,info.remotepath)
    var data = {
      host:host,
      path:info.remotepath,
      type:host.type,
    }
    changdir(data)
  }else{
    if(host.type == "sftp"){
      sftp.ListRemoteSFTP(host,ConnectCallBack)
    }else if(host.type == "ftp"){
      ftp.ListRemoteFTP({
        host: host.host,
        port: host.port,
        user: host.username,
        password: host.password,
      },ConnectCallBack)
    }
  }
});
function DirCallBack(err,path,files,host) {
  if(err){
    ERROR('sftp connect : failed!'+err.message)
    return 
  }else{
    MSG('sftp connect :'+ host.username+'@'+host.host+' success!')
    var info = {
      host: host,
      remotepath: path,
      files: files,
    }
    var key =host.host+host.username
    if(host.user){
      key = host.host+host.user
    }
    SFTPMap.set(key,info)
    pushFiles(files)
    win.webContents.send('sftp-list',info)
  }
}
//遍历新目录
function changdir(data){
  logger.info('changdir',data)
  if(data.host.type == "sftp"){
    sftp.CDRemoteSFTP(data.host,data.path,DirCallBack)
  }else{ //ftp
    ftp.CDRemoteFTP(data.host,data.path,DirCallBack)
  }
}
ipcMain.on('sftp-change-dir',function(env,data){
  changdir(data)
});

function MonitorDownLocal(){
	try{
  //logger.info("MonitorLocal",dfile) //多文件由于js的单线程执行问题，会阻塞
  // if(dfiles.length==0)return
  // dfiles.forEach((dfile,index)=>{
  if(!dfile.filename)return
  var stat = fs.statSync(dfile.filename)//文件名
	if(stat.size < dfile.remotesize){
    logger.info("MonitorLocal",dfile)
		if(stat.size>1024*1024){
			dfile.size = (stat.size/1024/1024).toFixed(2) +"M"
		}else{
			dfile.size = (stat.size/1024).toFixed(2) +"K" //大小
		}
		var t = new Date()
		var cost = t.getTime() - dfile.start.getTime()
		dfile.speed = (stat.size/(cost)).toFixed(2)//速度
		dfile.percent = parseInt(100*stat.size/dfile.remotesize) //进度
    dfile.lastting = parseInt(cost/1000) //持续时间
    if(dfile.lastting>60){
      var t = dfile.lastting%60 +"秒"
      var m = parseInt(dfile.lastting/60)+"分"
      dfile.lastting = m+t
    }else{
      dfile.lastting += "秒"
    }
    dfile.remminng = parseInt((dfile.remotesize - stat.size) / dfile.speed/1000)
    if(dfile.remminng>60){
      var t = dfile.remminng%60 +"秒"
      var m = parseInt(dfile.remminng/60)+"分"
      dfile.remminng = m+t
    }else{
      dfile.remminng += "秒"
    }
    if(dfile.speed>1024){
      dfile.speed = (dfile.speed/1024).toFixed(2) +"M/s"
    }else{
      dfile.speed = dfile.speed +"K/s"
    }
    sftpMonitor(dfile)
    //logger.info("MonitorLocal",dfile)
	}else{
    MSG('sftp download :'+ dfile.filename +' success!','ftp-cmd-reply')
    dfile.percent = 100
    sftpMonitor(dfile)
    //dfiles.splice(index,1)
    dfile={}
  }
  // })
	}catch(err){
    logger.error("MonitorLocal",err)
	}
}

function AppendDfiles(file){
  if(dfiles.length == 0){
    dfiles.unshift(file)
  }else{
      var find = false;
      for(var i=0;i<dfiles.length;i++){
          if(dfiles[i].filename == file.filename){
              find = true
              dfiles[i] = file
          }
          if(!find){
            dfiles.unshift(file)
          }
      }
  }
}

function stepdownload(file){
  //AppendDfiles(file)
  var files = SFTPMap.get(file.key).files
  files.forEach((item,i)=>{
    if(file.name == item.name){
      file.remotesize = item.size
    }
  })
  dfile = file
  logger.info("stepdownload",file)
}
//下载远程文件到本地
ipcMain.on('sftp-download-file',function(env,data){
  logger.info('start download file: ',data)
  if(data.open){
    if(!fs.existsSync(data.localPath)){
      fs.mkdirSync(data.localPath,"0755")
    }
  }
  sftp_download_file(data,stepdownload)
});



ipcMain.on('sftp-upload-file',function(env,data){
  logger.info('start upload file: ',data)
  sftp_upload_file(data)
});

ipcMain.on('sftp-delete-file',function(env,data){
  logger.info('start delete file: ',data)
  sftp_delete(data)
});


// 绑定打开对话框事件
ipcMain.on('open-directory-dialog', function (event,p) {
    dialog.showOpenDialog({
      properties: [p]
    },function (files) {
        if (files){// 如果有选中
          // 发送选择的对象给子进程
          logger.info(files)
  //         event.sender.send('selectedItem', files[0])
        }
    })
  });
  

ipcMain.on('redis-message', function(event, arg) {
  const args = arg.trim().split(' ')
  const cmd = []
  for(var i=0;i<args.length;i++){
    if(args[i].trim().length>0){
      console.log("push",i,args[i])
      cmd.push(args[i])
    }
  }
  switch(cmd[0]) {
    case 'open':
    event.returnValue = 'ack'
    break;
    case 'ssh':
    event.returnValue = 'ack'
    testSSH()
    break;
    case 'info':
      redis.info().then(function(data,err) {
        event.returnValue = data
      })
    break;
    case 'randomkey':
    redis.randomkey().then(function(data,err) {
      event.returnValue = data
    })
    break;
    case 'get':
    redis.get(cmd[1], function (err, result) {
      if (err) {
        event.returnValue = err
        console.error(err);
      } else {
        event.returnValue = result
      }
    });
    break;
    case 'del':
    redis.del(cmd[1]).then(function(err) {
      event.returnValue = err
    });
    break;
    case 'set':
    redis.set(cmd[1],cmd[2]).then(function(data,err) {
      event.returnValue = data
    })
    break;
    default:
      event.returnValue = 'pong';
  }
});

function testRedis(){
  redis = new Redis({
    port: 6380,          // Redis port
    host: '10.9.41.245',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: 'bb410fa6337743689c15092a2d6ee30b',
    db: 0
  })
  // redis.set("foo", "bar"); // returns promise which resolves to string, "OK"

  // the format is: redis[SOME_REDIS_COMMAND_IN_LOWERCASE](ARGUMENTS_ARE_JOINED_INTO_COMMAND_STRING)
  // the js: ` redis.set("mykey", "Hello") ` is equivalent to the cli: ` redis> SET mykey "Hello" `
  
  // ioredis supports the node.js callback style
  // redis.get("foo", function (err, result) {
  //   if (err) {
  //     console.error(err);
  //   } else {
  //     console.log(result); // Promise resolves to "bar"
  //   }
  // });

  // var info = redis.info();
  // info.then(function(data,err) {
  //   logger.info(data)
  // })
}

function testSSH(){
  ssh = new SSHClient();
  ssh.on('ready',() => {
    logger.info("SSH ready!")
    ssh.shell(function(err,stream){
      if(err) {
        logger.err("SSH error :",err);
      }
      stream.on('data',function(d){
        var res = utf8.decode(d.toString("binary"));
        logger.info("SSH return :",res);
        win.webContents.send('asynchronous-reply',res);
      })
      .on('error',function(){
        logger.error("SSH error !");
        ssh.end();
      })
      ipcMain.on('ssh-message', function(event, arg) {
        logger.info("SSH get :",arg);
        stream.write(arg+"\n")
        //event.reply('asynchronous-reply','ack')
        // stream.on('data',function(d){
        //   console.log("SSH return :",utf8.decode(d.toString("binary")));
        //   event.returnValue = utf8.decode(d.toString("binary"))
        // })
      });
    });
  }).connect({
    host: '10.7.100.123',
    port: 22,
    user: 'baseuser',
    password: '3HpWQ0roMOnDGVsi'
  });
}




// ftp 的命令窗口的相关操作
function pushFiles(files){
  var msg = ''
  files.forEach((f,index) => {
    var size = f.size/1024
    if(size > 1024){
      msg = msg + f.type+'\t'+(size/1024).toFixed(2) +'M\t\t' + f.name + '\r\n'
    }else{
      msg = msg + f.type+'\t'+size.toFixed(2)+'K\t\t' + f.name + '\r\n'
    }
  })
  win.webContents.send('ftp-cmd-reply',msg)
}

function getNewPath(p1,p2) {
  if(p2.startsWith("/")){
    return p2
  }
  if(p2 == '..'){
    var np = '/'
    const ps = p1.split('/')
    for(var i=0;i<ps.length-1;i++){
      if(ps[i].length>=1&&ps[i+1].length>=1){
        np = np + ps[i] + "/"
      }
    }
    return np
  }
  return p1+'/'+p2
}

ipcMain.on('ftp-cmd',function(event,data){
  var hostinfo = SFTPMap.get(data.key)
  const args = data.cmd.trim().split(' ')
  const command = []
  for(var i=0;i<args.length;i++){
    if(args[i].trim().length>0){
      console.log("push",i,args[i])
      command.push(args[i])
    }
  }
  switch(command[0]){
    case 'get':
      var cmd = {
        'path': hostinfo.remotepath,
        'filename': command[1],
        'host': hostinfo.host,
        'localPath':data.localpath,
      }
      sftp_download_file(cmd,stepdownload)
      break;
    case 'put':
      var cmd = {
        'path': data.localpath,
        'filename': command[1],
        'host': hostinfo.host,
        'remotePath':hostinfo.remotepath,
      }
      sftp_upload_file(cmd)
      break;
    case 'mget':
    case 'mput':
      break;
    case 'rename':
      break;
    case 'mkdir':
      break;
    case 'delete':
    case 'rmdir':
      var cmd = {
        'path': hostinfo.remotepath,
        'filename': command[1],
        'host': hostinfo.host,
        'localPath':data.localpath,
      }
      sftp_delete(cmd)
      break;
    case 'ls':
      //logger.info(data.key,SFTPMap)
      var files = SFTPMap.get(data.key).files
      pushFiles(files)
      break;
    case 'pwd':
      win.webContents.send('ftp-cmd-reply',SFTPMap.get(data.key).remotepath)
      break;
    case 'cd':
      if(command.length == 2){
        var info = SFTPMap.get(data.key)
        var data = {
          host: info.host,
          path: getNewPath(info.remotepath, command[1])
        }
        changdir(data)
      }
      break;
    default:
      win.webContents.send('ftp-cmd-reply',"不可识别的命令:"+data.cmd)
  }
})

function sftpMonitor(state) {
  var filesize = state.remotesize
  if(state.remotesize > 1024*1024){
    filesize = (state.remotesize/1024/1024).toFixed(2)+"M"
  }else{
    filesize = (state.remotesize/1024).toFixed(2)+"K"
  }
  var data = {
        job:{
          filename: state.filename,
          type: state.type,
          status: "warning",
          percent: state.percent,
          speed: state.speed,
          lastting: state.lastting,
          remminng: state.remminng,
          size: state.size,
          remotesize: filesize,
        },
        show: true
      }
    if(state.percent==100)data.show = false
    win.webContents.send('sftp-job',data)
}

function DownLoadCallBack(err,localpath,data) {
  if(err){
    ERROR('sftp download :'+ data.filename +' failed!'+err.message,'ftp-cmd-reply')
    logger.error('sftp-download-file failed!',data,err)
  }else{
    MSG('sftp download :'+ data.filename +' success!','ftp-cmd-reply')
    logger.info('sftp-download-file success!',localpath)
    var res = {
      'title': data.filename,
      'path': localpath,
    }
    if(data.open){
      res.open =true
    }
    win.webContents.send('sftp-download-success',res)
  }
}

function sftp_download_file(data,process){
  PROCESS('start download file: '+data.filename,'ftp-cmd-reply')
  if(data.host.type == "sftp"){
    sftp.DownloadFile(data,DownLoadCallBack,process)
  }else{
    ftp.DownloadFile(data,DownLoadCallBack,process)
  }
}

function UploadCallBack(err,remotepath,data) {
  if(err){
    ERROR('sftp upload :'+ data.filename +' failed!'+err.message,'ftp-cmd-reply')
    logger.error('sftp-upload-file failed!',data,err)
  }else{
    MSG('sftp upload :'+ data.filename +' success!','ftp-cmd-reply')
    logger.info('sftp-upload-file success!',remotepath)
    var res = {
      'title': data.filename,
      'path': remotepath,
    }
    win.webContents.send('sftp-upload-success',res)
  }
}

function UpDirState(file) {
  MSG('start upload :'+ file +' !','ftp-cmd-reply')
}
// 文件上传进度
function UpFileState(t,a,filename){
  if(!ufile.filename){
    ufile.type= "上传"
    ufile.filename = filename
    ufile.start = new Date()
    ufile.remotesize = a
  }
  if(t < a){
		if(t>1024*1024){
			ufile.size = (t/1024/1024).toFixed(2) +"M"
		}else{
			ufile.size = (t/1024).toFixed(2) +"K" //大小
		}
		var ti = new Date()
		var cost = ti.getTime() - ufile.start.getTime()
		ufile.speed = (t/(cost)).toFixed(2)//速度
		ufile.percent = parseInt(100*t/ufile.remotesize) //进度
    ufile.lastting = parseInt(cost/1000) //持续时间
    if(ufile.lastting>60){
      var t0 = ufile.lastting%60 +"秒"
      var m = parseInt(ufile.lastting/60)+"分"
      ufile.lastting = m+t0
    }else{
      ufile.lastting += "秒"
    }
    ufile.remminng = parseInt((ufile.remotesize - t) / ufile.speed/1000)
    if(ufile.remminng>60){
      var t1 = ufile.remminng%60 +"秒"
      var m = parseInt(ufile.remminng/60)+"分"
      ufile.remminng = m+t1
    }else{
      ufile.remminng += "秒"
    }
    if(ufile.speed>1024){
      ufile.speed = (ufile.speed/1024).toFixed(2) +"M/s"
    }else{
      ufile.speed = ufile.speed +"K/s"
    }
    sftpMonitor(ufile)
  }else{
    MSG('sftp upload :'+ ufile.filename +' success!','ftp-cmd-reply')
    ufile.percent = 100
    sftpMonitor(ufile)
    //dfiles.splice(index,1)
    ufile={}
  }
}

function sftp_upload_file(data){
  PROCESS('start upload file: '+data.filename,'ftp-cmd-reply')
  if(data.host.type=="sftp"){
    sftp.UploadFile(data,UploadCallBack,UpDirState,UpFileState)
  }else{
    ftp.UploadFile(data,UploadCallBack)
  }
}

function sftp_delete(data){
  PROCESS('start delete file: '+data.filename,'ftp-cmd-reply')
  if(data.host.type == 'sftp'){
  sftp.Delete(data,(err) => {
    if(err){
      ERROR('sftp delete :'+ data.filename +' failed!'+err.message,'ftp-cmd-reply')
    }else{
      MSG('sftp delete :'+ data.filename +' success!','ftp-cmd-reply')
      changdir(data)
    }
  })
  }else{
    ftp.Delete(data,(err) => {
      if(err){
        ERROR('sftp delete :'+ data.filename +' failed!'+err.message,'ftp-cmd-reply')
      }else{
        MSG('sftp delete :'+ data.filename +' success!','ftp-cmd-reply')
        changdir(data)
      }
    })
  }
}




//数据库相关操作：
ipcMain.on('sql-cmd',(env,arg) => {
  logger.info("sql-cmd",arg.cmd)
  // db.InitClient({
  //   host:'127.0.0.1',
  //   port: 3306,
  //   dialect: 'mysql',
  //   dbname: 'blog',
  //   username: 'blog',
  //   password: 'blogpipe'
  // })
  //db.ExecCommand('select * from b3_pipe_tags',dbback)
  //db.ExecCommand('show tables',dbback)
  db.ExecCommand(arg,dbback)
})

ipcMain.on('sql-show-tables',(env,arg) => {
  //logger.info("sql-show-tables",arg)
  db.ExecCommand(arg,dbback)
})

ipcMain.on('sql-show-databases',(env,arg) => {
  //logger.info("sql-show-databases",arg)
  db.ExecCommand(arg,dbback)
})
