<template>
  <div id="app">
        <MyMenu/>
  <el-container>
  <el-container style=" border: 1px solid #eee;">
   <el-aside  v-bind:style="{ width: menuWidth + 'px', height: height+'px' }" id="aside">
        <TreeMenu />
    </el-aside>

    <el-main v-bind:style="{ height: height+'px' }">
      <!-- 标签展示区域 -->
      <div class="right-nav">
      <TagNav></TagNav>
      </div>
      <!-- 标签动态路由区域 -->
      <div class="right-inner" style="border: 2px solid #eee;">
        <keep-alive :include="tagNavList">
          <router-view></router-view>
        </keep-alive>
      </div>
    </el-main>
    </el-container>
    <el-footer style=" height:22px; border: 2px solid #eee; font-size: 12px; color: #424210;">
      <i :class="processicon"></i>
      <span>{{message}}</span>
    </el-footer>
  </el-container>
  <PopBox/>
  <DragBox/>
  <ObjTable :show.sync="showDataItem" :columns="columns" />
  </div>
</template>

<script>
import ObjTable from  "./pages/dialog/ObjTable.vue";
import PopBox from "./pages/dialog/PopBox.vue";
import DragBox from "./pages/dialog/DragBox.vue";
import TagNav from "./pages/tagNav.vue";
import MyMenu from './pages/Menu.vue'
import TreeMenu from './pages/TreeMenu.vue'
import {testRedis} from './api/redis-client'
const ipc = require('electron').ipcRenderer;
export default {
  methods: {
    startHacking () {
      //this.$router.push("data");
      testRedis()
      this.$notify({
        title: 'It works!',
        type: 'success',
        message: 'We\'ve laid the ground work for you. It\'s time for you to build something epic!',
        duration: 5000
      })
    },
    // 清空之前缓存的所有标签以及缓存数据
    closeAllTags() {
        this.$store.dispatch('tagNav/clearAllTag');
    }
  },
  computed: {
    tagNavList() {
        return this.$store.state.tagNav.cachedPageName;
    }
  },
  mounted() {
    //this.startHacking();
    //ipc.send('open-directory-dialog','openDirectory');
    ipc.on('process-message',(event,msg) => {
      console.log(msg)
      if(msg.icon){
        this.processicon = msg.icon
      }else{
        this.processicon = 'el-icon-info'
      }
      this.message = msg.msg
    });
    ipc.on('dataitem-message',(event,arg) => {
      this.showDataItem = false
      this.showDataItem = arg.showDataItem
      this.columns = arg.DataItem
    })
    ipc.on('mainwin-resize',(event,arg) =>{
      this.height = arg[1] - 100;
      console.log('height=',this.height)
    })
    this.initAside();//调节侧边栏
  },
  data() {
    return {
      menuWidth: 230,
      height: 478,
      input: '',
      message: '准备就绪!',
      processicon: 'el-icon-info',
      showLogin: true,
      showDataItem: false,
      DataItem: [],
      columns: []
    }
  },
  methods: {
    initAside(){
      let _this = this
      var app = document.getElementById("app");
      var resize = document.getElementById("aside");
      var tmp = resize
      resize.onmousedown = function(e) {
        let _this = this
        // 颜色改变提醒
        if (event.offsetX > tmp.offsetWidth - 10) { 
          tmp.mouseDown = true; 
          tmp.oldX = event.x; 
          tmp.oldWidth = tmp.offsetWidth; 
        } else {
          return
        }
      }
      app.onmousemove = function(e) {
        if (event.offsetX > resize.offsetWidth - 20) 
          resize.style.cursor = 'col-resize'; 
        else {
          resize.style.cursor = 'default'; 
        }
        // 计算并应用位移量
        if (tmp.mouseDown != null && tmp.mouseDown == true) { 
            console.log(tmp.width,event.x , tmp.oldX)
            tmp.style.cursor = 'default'; 
            if (tmp.oldWidth + (event.x - tmp.oldX)>0) 
              tmp.width = tmp.oldWidth + (event.x - tmp.oldX); 
              //调整列宽 
              tmp.style.width = tmp.width; 
              tmp.style.cursor = 'col-resize'; 
              _this.menuWidth = tmp.width; 
          }
        };
        app.onmouseup = function() {
          tmp.mouseDown = false; 
          tmp.style.cursor = 'default'; 
          // 颜色恢复
          tmp.style.background = "";
          //app.onmousemove = null;
          //app.onmouseup = null;
        };
      }
  },
  components: {
    MyMenu,
    TreeMenu,
    TagNav,
    PopBox,
    DragBox,
    ObjTable,
  }
}
</script>

<style>
#app {
  font-family: Helvetica, sans-serif;
}
.el-main {
  padding: 0;
}
.right-nav {
  position: absolute;
  height: 20px;
  border: 1px solid #eee; 
}
.right-inner {
  margin-top: 20px;
  height: calc(100vh - 120px);;
}
.el-aside {
display: block;
position: relative;
}

html {
    overflow:hidden;
}
body {
  margin: 8px;
}
</style>
