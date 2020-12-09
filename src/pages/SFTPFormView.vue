<template>
<el-collapse v-model="activeNames" @change="handleChange">
<el-collapse-item title="服务器文件目录列表" name="1">
<el-row ref="form" :gutter="10">
<el-col :span="12">
<el-input size="mini" v-model="form_local" placeholder="本地目录">
    <template slot="prepend">Local:</template>
</el-input>
</el-col>
<el-col :span="12">
<el-input size="mini" v-model="form_remote" placeholder="远程目录">
    <template slot="prepend">Remote:</template>
</el-input>
</el-col>
</el-row>
<el-row ref="sftp" :gutter="10">
<el-col :span="12">
<div class="files-box">
<el-scrollbar class="sftpwin">
<el-input size="mini"
  placeholder="输入关键字进行过滤"
  v-model="filterlocal">
</el-input>
    <el-tree
      class="filter-tree"
      :data="localfiles"
      show-checkbox
      node-key="id"
      @node-click="nodeClick"
      @node-contextmenu="localMenuShow"
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      :render-content="renderContent"
      ref="local">
    </el-tree>
</el-scrollbar>
</div>
</el-col>
<el-col :span="12">
<div class="files-box">
<el-scrollbar class="sftpwin">
<el-input size="mini"
  placeholder="输入关键字进行过滤"
  v-model="filterremote">
</el-input>
    <el-tree
      class="filter-tree"
      :data="remotefiles"
      show-checkbox
      node-key="id"
      default-expand-all
      @node-click="nodeClick"
      @node-contextmenu="remoteMenuShow"
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      :render-content="renderContent"
      ref="remote">
    </el-tree>
</el-scrollbar>
</div>
</el-col>
</el-row>
</el-collapse-item>
<el-collapse-item title="远程服务器Console窗口" name="2">
<el-row ref="console" :gutter="10">
<el-col :span="24">
<div class="console-inner" style="border: 2px solid #eee;">
<Console :title="title" :ftpid="ftpid" :msg="message" />
</div>
</el-col>
</el-row>
</el-collapse-item>
</el-collapse>
</template>

<script>
const Log = require('../logger')
let logger = Log.getLogger("ftp")
const path = require('path')
const fs = require('fs')
const ipc = require('electron').ipcRenderer;
import { LocalFileMenu,RemoteFileMenu } from '../api/menus'
import Console from './FtpCmd.vue'
export default {
  name: 'SFTP',
    data() {
      return {
        id: 0,
        treeClickCount: 0,
        ftpid: '',
        message: '',
        title: 'ftp$ ',
        activeNames: ['1','2'],
        form: {
          local: '',
          remote: '',
        },
        filterlocal: '',
        loadlocal: false,
        filterremote: '',
        localfiles: [],
        remotefiles: [],
        form_local: '',
        form_remote: '',
        host: {}
      };
    },
    watch: {
      $route(){
        this._init()
      },
      filterlocal(val){
        this.$refs.local.filter(val);
      },
      filterremote(val){
        this.$refs.remote.filter(val);
      },
      form_local(val){
        try{
          fs.accessSync(val,fs.constants.R_OK | fs.constants.W_OK)
          var stat = fs.statSync(val)
          if(stat&&stat.isDirectory()){
            this.dirLocal(val,this)
            this.$store.state.localdir = val
          }
        }catch(err){
          logger.error('form_local',val,err)
          //console.log(err)
        }
      },
      form_remote(val){
        var data = {
          'path': val,
          'host': this.host,
        }
        if(this.form_remote != this.form.remote){
          ipc.send('sftp-change-dir',data)
        }
      }
    },
    mounted() {
      this._init()
      ipc.on('sftp-list',(event,args)=>{
        this.dirRemote(args.remotepath,args.files,this)
      })
      ipc.on('sftp-download-success',(event,val)=>{
        this.dirLocal(this.form.local,this)
        if(val.open){
          this.$router.push({path:"/editor?file="+val.path+"&title="+val.title});
        }
      })
      ipc.on('sftp-upload-success',(event,val)=>{
        ipc.send('sftp-connect',this.host)
      })
    },
    methods: {
      _init() {
        var data = this.$store.getters.getFtpInfo(this.$route.query.id)
        this.dirLocal(this.$store.state.localdir,this)
        if(data){
          this.title = '['+data.remote+']'
          if(data.type=='ftp') this.host = data.ftp
          if(data.type == 'sftp') this.host = data.sftp
          this.host.type = data.type
          ipc.send('sftp-connect',this.host)
          this.ftpid = this.host.host+this.host.username
        }else{
          //处理报错
        }
      },
      handleChange(val) {
        console.log(val);
      },
      nodeClick(value,data,tree) {
        this.treeClickCount++;
        this.timer = window.setTimeout(() => {
          if (this.treeClickCount >= 2) {
            //把次数归零
            this.treeClickCount = 0;
          }
        }, 300);
        if (this.treeClickCount > 2) {
              return;
        }
        console.log(value,this.treeClickCount)
        switch (value.type) {
          case 'dir':
            if(this.treeClickCount == 2){
              if(value.label != "."){
                var p = path.join(this.form.local,value.label)
                this.dirLocal(p,this)
              }else{
                this.form_local = value.path
                this.form.local = this.form_local
                this.dirLocal(this.form.local,this)
              }
            }
            break;
          case 'r-dir'://切换远程目录
            if(this.treeClickCount == 2){
              var data = {
                'path': this.form.remote+"/"+value.label,
                'host': this.host,
              }
              ipc.send('sftp-change-dir',data)
            }
            break;
          case 'file':
            if(this.treeClickCount == 2){
              if(value.stat.size > 1024*1024){
                this.$confirm('当前文件'+value.label+'的大小超过1M, 是否继续打开?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
                }).then(()=>{
                  this.$router.push({path:"/editor?file="+value.path+"&title="+value.label});
                });
              }else{
                this.$router.push({path:"/editor?file="+value.path+"&title="+value.label});
              }
            }
            break;
          case 'r-file'://下载到本地并打开
            if(this.treeClickCount == 2){
            var data = {
              'path': this.form.remote,
              'filename': value.label,
              'host': this.host,
              'localPath': path.join(this.form.local,".cache",this.host.host),
              'open': true,
            }
            if(!fs.existsSync(data.localPath)){
              var result = fs.mkdirSync(data.localPath,{ recursive: true })
              console.log('mkdirSync',data.localPath,reault)
            }
            if(value.stat.size > 1024*1024){
              this.$confirm('远程文件'+value.label+'的大小'+(value.stat.size/1024/1024).toFixed(2)+'M, 是否继续打开?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
                }).then(()=>{
                  ipc.send('sftp-download-file',data)
                });
            }else{
              ipc.send('sftp-download-file',data)
            }
            }
            break;
          default:
            console.log(value,this.treeClickCount)
        }
      },
      filterNode(value, data) {
        if (!value) return true;
        return data.label.indexOf(value) !== -1;
      },
      renderContent(h, { node, data, store }) {
        return (
          <span class="custom-tree-node">
            <i class={data.icon}></i>
            <span>{node.label}</span>
          </span>);
      },
      remoteMenuShow(env,value,data,tree){
          this.$contextmenu({
          items:RemoteFileMenu(
            ()=>{this.downloadfile(value)},
            ()=>{this.downloaddir(value)},
            ()=>{this.freshRemote()},
            ()=>{this.batchdownload()},
            ()=>{this.deleteRemote(value)},
            ()=>{this.batchDelRemote()},
          ),
          event,
          customClass: "class-a",
          zIndex: 3,
          minWidth: 230
        });
      },
      downloadfile(file){
        var data = {
            'path': this.form.remote,
            'filename': file.label,
            'host': this.host,
            'localPath': this.form.local,
            'isTmp': true,
        }
        this.$confirm('是否开始下载'+file.label, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
          }).then(()=>{
            ipc.send('sftp-download-file',data)
        });
      },
      downloaddir(dir){
        this.downloadfile(dir)
      },
      freshRemote(){
        ipc.send('sftp-connect',this.host)
      },
      batchdownload(){
        var nodes = this.$refs.remote.getCheckedNodes()
        nodes.forEach((node,i)=>{
          console.log(i,node)
            this.downloadfile(node)
        })
      },
      deleteRemote(file){
        var data = {
          'path': this.form.remote,
          'filename': file.label,
          'host': this.host,
          'localPath': this.form.local,
        }
        ipc.send('sftp-delete-file',data)
      },
      batchDelRemote(){
        var nodes = this.$refs.remote.getCheckedNodes()
        nodes.forEach((node,i)=>{
          console.log(i,node)
            this.deleteRemote(node)
        })
      },
      localMenuShow(env,value,data,tree){
        this.$contextmenu({
          items:LocalFileMenu(
            ()=>{this.uploadfile(value)},
            ()=>{this.uploaddir(value)},
            ()=>{this.freshlocal()},
            ()=>{this.openLocalDir(value)},
            ()=>{
              this.deleteLocal(value)
              this.dirLocal(this.$store.state.localdir,this)
            },
            ()=>{this.batchupload()},
            ()=>{
              this.batchdel()
              this.dirLocal(this.$store.state.localdir,this)
            }
          ),
          event,
          customClass: "class-a",
          zIndex: 3,
          minWidth: 230
        });
      },
      uploadfile(file){
        var data = {
            'path': this.form.local,
            'filename': file.label,
            'host': this.host,
            'remotePath': this.form.remote,
        }
        this.$confirm('是否开始上传'+file.label, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
          }).then(()=>{
            ipc.send('sftp-upload-file',data)
        });
      },
      uploaddir(dir){
        this.uploadfile(dir)
      },
      freshlocal(){
        this.dirLocal(this.$store.state.localdir,this)
      },
      openLocalDir(dir){
        var p = path.join(this.form.local,dir.label)
        this.$store.state.localdir = p
        this.dirLocal(p,this)
      },
      deleteLocal(file){
        try{
        switch(file.type){
          case 'file':
            fs.unlinkSync(file.path) //删除文件
            break;
          case 'dir':
          fs.rmdirSync(file.path) //删除目录
            break;
        }
        }catch(err){
          this.$notify.error({
          title: '错误',
          message: '删除失败:'+err.message
          });
        }
      },
      batchupload(){ //批量上传
        var nodes = this.$refs.local.getCheckedNodes()
        nodes.forEach((node,i)=>{
          console.log(node)
          this.uploadfile(node)
        })
      },
      batchdel(){ //批量删除
        var nodes = this.$refs.local.getCheckedNodes()
        nodes.forEach((node,i)=>{
          console.log('del',node)
          this.deleteLocal(node)
        })
      },
      dirRemote(dir,files,e) {
        if(files == null) return;
        e.form.remote = dir;
        e.form_remote = dir;
        e.remotefiles = [];
        files.forEach((f,index) => {
          e.id++;
          if(f.type == 'd'){
            e.remotefiles.push({"icon":"el-icon-folder","label":f.name,"type":"r-dir","path":dir,"id":e.id,"stat":f})
          }else{
            e.remotefiles.push({"icon":"el-icon-document","label":f.name,"type":"r-file","path":dir,"id":e.id,"stat":f})
          }
        })
      },
      dirLocal(dir,e) {
        window.setTimeout(() => {
          e.loadlocal = false;
        }, 500);
        if(e.loadlocal) return;
        logger.info('dirLocal',dir)
        e.loadlocal = true;
        e.form.local = dir;
        e.form_local = dir;
        e.localfiles = [];
        fs.readdir(dir, function(err, files) {
          //e.message = '遍历本地目录:'+dir
          if(err) {
            //e.message = '遍历本地目录失败:'+err.message
            return
          }else{
            console.log(files)
            //e.localfiles.push({"icon":"el-icon-folder","label":".","path":e.form.local,"type":"dir","id":0,})
            files.forEach((filename, index) => {
              let pathname = path.join(dir, filename)
              fs.stat(pathname, (err, stats) => { // 读取文件信息
                if(err){
                  //e.message = '获取文件信息失败:'+err.message
                }else{
                  e.id++;
                  if(stats.isDirectory()){
                    e.localfiles.push({"icon":"el-icon-folder","label":filename,"type":"dir","path":pathname,"id":e.id,"stat":stats})
                  }else{
                    e.localfiles.push({"icon":"el-icon-document","label":filename,"type":"file","path":pathname,"id":e.id,"stat":stats})
                  }
                }
              });
            });
          }
        });
      }
    },
    components: {
      Console,
    }
  };
</script>

<style>
.sftpwin {
    align-items: center;
    justify-content: center;
    height: 100%;
    border: 2px solid #eee;
}
.console-inner {
  align-items: center;
  justify-content: center;
  margin: 1px;
  height: 100%;
}
.files-box {
  height: 300px;
}
.el-row {
    margin-bottom: 1px;
    &:last-child {
      margin-bottom: 0;
    }
}
.el-col {
    border-radius: 4px;
}

.el-collapse-item__header {
  height: 24px;
  background-color:  #eee;
}

</style>