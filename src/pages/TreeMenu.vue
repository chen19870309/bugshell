<template>
<div class="tree-menu" >
<el-input
  placeholder="输入关键字进行过滤"
  v-model="filterText">
</el-input>
<div class="tree-detail" >
<el-tree
  class="filter-tree"
  :data="data"
  :props="defaultProps"
  node-key="id"
  @node-click="nodeClick"
  @node-contextmenu="popMenuShow"
  :filter-node-method="filterNode"
  :render-content="renderContent"
  :default-expanded-keys="exCols"
  ref="tree">
</el-tree>
</div>
<NewSSHForm :show="show1" @callback="freshMenu" />
<SSHFormView :show="show2" :host="hostinfo" @callback="freshMenu"/>
<NewSFTPForm :show="show3" :host="sftpinfo" @callback="freshMenu"/>
<DBConnectView :show="show4" :host="dbinfo" @callback="freshMenu"/>
</div>
</template>
<script>
import NewSSHForm from './dialog/NewSSHForm.vue'
import NewSFTPForm from './dialog/NewSFTPForm.vue'
import SSHFormView from './dialog/SSHFormView.vue'
import DBConnectView from './dialog/DBConnectView.vue'
import { SshMainMenu,SshSubMenu,FtpMainMenu,FtpSubMenu ,RedisMainMenu,RedisSubMenu,DBMainMenu } from '../api/menus'
const ipc = require('electron').ipcRenderer;
export default {
    data() {
      return {
        exCols: ['ssh', 'ftp','database'],
        treeClickCount: 0,
        message: '',
        filterText: '',
        hostinfo: '',
        sftpinfo: '',
        dbinfo: '',
        data: [
          this.$store.getters.getSSHHosts,
          this.$store.getters.getFTPHosts,
          this.$store.getters.getDBHosts,
        ],
        defaultProps: {
          children: 'children',
          label: 'label'
        },
        show1: false,
        show2: false,
        show3: false,
        show4: false,
      };
    },
    mounted() {
      ipc.on('menu-db-schema',(event,arg)=>{
        var item = this.$store.getters.getDBInfo(arg.host.id)
        console.log(item,arg)
        if(!item) return
        var schema = {
          id: arg.host.id,
          icon: item.icon,
          label: item.label,
          type: item.type,
          remote: item.remote,
          host: item.host,
          children: [],
        }
        arg.schema.forEach((d)=>{
          schema.children.push({
            pid: schema.id,
            id: 'DB-'+d.Database,
            label:d.Database,
            type:'databases',
            icon:'el-icon-folder',
            host: item.host,
            children: [],
          })
        })
        this.$store.commit('updateDBHost',schema);
        this.freshMenu()
      })
      ipc.on('menu-db-tables',(event,arg)=>{
        var item = this.$store.getters.getDBInfo(arg.host.id)
        console.log(item,arg)
        if(item.children && item.children.length>0){
          item.children.forEach((c)=>{
            console.log(c,arg)
            if(c.label == arg.schema){
              c.icon = 'el-icon-folder'
              c.children = []
              arg.tables.forEach((t)=>{
                c.children.push({label:t,
                type:'tables',
                icon:'el-icon-tickets',
                schema: arg.schema,
                host: item.host,
                id:'tables',
                })
              })
            }
          })
        }
        this.freshMenu()
      })
    },
    methods: {
      freshMenu() {
        this.data = [
          this.$store.getters.getSSHHosts,
          this.$store.getters.getFTPHosts,
          this.$store.getters.getDBHosts
        ]
        this.show1 = false
        this.show2 = false
        this.show3 = false
        this.show4 = false
        console.log('freshMenu',this.show1,this.show2)
      },
      filterNode(value, data) {
        if (!value) return true;
        return data.label.indexOf(value) !== -1;
      },
      nodeClick(value,data,tree) {
        switch (value.id) {
          case 'ssh':
          case 'ftp':
          case 'redis':
          case 'database':
            break;
          default:
            //记录点击次数
            this.treeClickCount++;
            //单次点击次数超过2次不作处理,直接返回,也可以拓展成多击事件
            if (this.treeClickCount >= 2) {
              return;
            }
            //计时器,计算300毫秒为单位,可自行修改
            this.timer = window.setTimeout(() => {
              if (this.treeClickCount == 1) {
                //把次数归零
                this.treeClickCount = 0;
              } else if (this.treeClickCount > 1) {
                //把次数归零
                this.treeClickCount = 0;
                switch(value.type){
                  case 'ftp':
                  case 'sftp':
                    this.$router.push({path:"/sftp?id="+value.id+"&title="+value.remote});
                    break;
                  case 'ssh':
                    ipc.send('open-xterm',value);
                    break;
                  case 'mysql':
                  case 'postgres':
                    this.$router.push({path:"/data?id="+value.id+"&title="+value.remote});
                    break;
                  case 'databases':
                    ipc.send('sql-show-tables',{
                      host: value.host,
                      schema: value.label,
                      cmd: 'show tables',
                    })
                    value.icon="el-icon-loading"
                    this.exCols.pop()
                    this.exCols.push(value.id)
                    if(this.$router.query){
                      if(this.$router.query.id != value.id){
                        this.$router.push({path:"/data?id="+value.pid+"&title="+value.host.username+'@'+value.host.host+':'+value.host.port});
                      }
                    }else{
                      this.$router.push({path:"/data?id="+value.pid+"&title="+value.host.username+'@'+value.host.host+':'+value.host.port});
                    }
                    break;
                  case 'tables':
                    break;
                  default:

                }
              }
            }, 300);

        }
      },
      renderContent (h, { node, data, store }) {
        return (
        <span>
        <i class={data.icon}></i>
        <span> {node.label}</span>
        </span>
        )
      },
      popMenuShow(env,value,data,tree) {
        switch(value.id){
          case 'ftp':
            this.$contextmenu({
            items:FtpMainMenu(
            ()=>{
              this.show3 = false
              this.show3 = true}),
            event,
            customClass: "class-a",
            zIndex: 3,
            minWidth: 230
            });
            break;
          case 'database':
            this.$contextmenu({
            items:DBMainMenu(
            ()=>{
              this.show4 = false
              this.show4 = true}),
            event,
            customClass: "class-a",
            zIndex: 3,
            minWidth: 230
            });
            break;
          case 'ssh':
            this.$contextmenu({
            items:SshMainMenu(()=>{
              this.show1 = false
              this.show1 = true
            }),
            event,
            customClass: "class-a",
            zIndex: 3,
            minWidth: 230
            });
            break;
          default:
            if(value.type == 'databases'|| value.type == 'tables'){

            }else{
              this.popMenuFun(value)
            }
        }
      },
      popMenuFun(value){
        var  e = this
        this.$contextmenu({
            items:FtpSubMenu(()=>{ //打开连接
              switch(value.type){
                case 'ssh':
                  ipc.send('open-xterm',value);
                  break;
                case 'ftp':
                case 'sftp':
                  this.$router.push({path:"/sftp?id="+value.id+"&title="+value.remote});
                  break;
                case 'mysql':
                  this.$router.push({path:"/data?id="+value.id+"&title="+value.remote});
                  break;
                default:
              }
            },()=>{ //查看详情
              e.show1 = false
              e.show2 = false
              switch(value.type){
                case 'ssh':
                  e.hostinfo = JSON.stringify(value)
                  e.show2 = true
                  break;
                case 'ftp':
                case 'sftp':
                  e.sftpinfo = JSON.stringify(value)
                  e.show3 = false
                  e.show3 = true
                  break;
                case 'mysql':
                  e.dbinfo = JSON.stringify(value)
                  e.show4 = false
                  e.show4 = true
                  break;
                case 'databases':
                case 'tables':
                default:

              }
            },()=>{ //删除节点
              this.$confirm('删除当前节点'+value.remote+', 是否继续?', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
              }).then(()=>{
              switch(value.type){
                case 'ssh':
                  this.$store.commit('delSshHost',value);
                  break;
                case 'ftp':
                case 'sftp':
                  this.$store.commit('delFtpHost',value);
                  break;
                case 'redis':
                  this.$store.commit('delRedisHost',value);
                  break;
                case 'mysql':
                  this.$store.commit('delDBHost',value);
                  break;
                case 'databases':
                case 'tables':
                default:
                  console.log(value)
              }
              this.freshMenu();
              });
            }),
            event,
            customClass: "class-a",
            zIndex: 3,
            minWidth: 230
          });
      }
    },
    watch: {
      filterText(val) {
        this.$refs.tree.filter(val);
      },
    },
    components: {
      NewSSHForm,
      SSHFormView,
      NewSFTPForm,
      DBConnectView,
    }
  }
</script>

<style>
.el-tree>.el-tree-node{
min-width: 100%;
display:inline-block;
}
.tree-menu {
  height: 100%;
}
.tree-detail {
  padding:1px 5x 1px 1px;
  border: 2px solid #eee;
  overflow-x: scroll;
  overflow-y: hidden;
}
</style>
