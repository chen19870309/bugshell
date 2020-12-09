<template>
<div class="my-menu">
<el-menu
  :default-active="activeIndex2"
  mode="horizontal"
  @select="handleSelect"
  background-color="#545c64"
  text-color="#fff"
  active-text-color="#ffd04b">
  <el-menu-item index="1">处理中心</el-menu-item>
  <el-submenu index="2">
    <template slot="title">我的工作台</template>
    <el-menu-item index="2-1">创建SSH连接</el-menu-item>
    <el-menu-item index="2-2">创建(S)FTP连接</el-menu-item>
    <el-submenu index="2-4">
      <template slot="title">创建数据库连接</template>
      <el-menu-item index="shell">命令行</el-menu-item>
      <el-menu-item index="editor">编辑器</el-menu-item>
      <el-menu-item index="data">数据表格</el-menu-item>
    </el-submenu>
  </el-submenu>
</el-menu>
</div>
</template>


<script>
export default {
    data() {
      return {
        activeIndex: '1',
        activeIndex2: '2'
      };
    },
    methods: {
      handleSelect(key, keyPath) {
        console.log(key, keyPath);
        switch(key){
          case 'shell':
          this.$router.push("cmd");
          break;
          case 'editor':
          this.$router.push("editor");
          break;
          case 'data':
          this.$router.push("data");
          break;
          default:
          this.$router.push("frame");
        }
      }
    }
  }
</script>