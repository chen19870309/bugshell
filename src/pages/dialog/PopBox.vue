<template>
<div class="popbox" id="popbox">
    <div class="pop-layer" id="back-layer" style="background-image: url(bgimage.gif);">
        <div class="pop-box" id="context" >
            <el-form ref="loginForm" :model="form" :rules="rules" label-width="60px" class="login-box">
            <h3 class="login-title">欢迎登录</h3>
            <el-form-item label="账号" prop="username">
                <el-input type="text" placeholder="请输入账号" v-model="form.username"/>
            </el-form-item>
            <el-form-item label="密码" prop="password">
                <el-input type="password" placeholder="请输入密码" v-model="form.password"/>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" v-on:click="onSubmit('loginForm')">登录</el-button>
            </el-form-item>
            </el-form>
        </div>
    </div>
</div>
</template>

<script>
const ipc = require('electron').ipcRenderer;
  export default {
    name: "遮盖窗口",
    data() {
      return {
        form: {
          username: '',
          password: ''
        },
        show: !this.$store.getters.checkAuthInfo({}),
        // 表单验证，需要在 el-form-item 元素中增加 prop 属性
        rules: {
          username: [
            {required: true, message: '账号不可为空', trigger: 'blur'}
          ],
          password: [
            {required: true, message: '密码不可为空', trigger: 'blur'}
          ]
        },
      }
    },
    mounted() {
        this.ShowBox(!this.$store.state.Debug)
        ipc.on('win-lock',(event,arg)=>{
            this.ShowBox(arg.winlock)
            this.$store.state.winlock = arg.winlock
        })
    },
    watch: {
        show(val){
            this.ShowBox(val)
        }
    },
    methods: {
      ShowBox(val){
          if(val){
                document.getElementById("back-layer").style.display = "block"
                document.getElementById("context").style.display = "block"
            }else{
                document.getElementById("back-layer").style.display = "none"
                document.getElementById("context").style.display = "none"
            }
      },
      onSubmit(formName) {
        // 为表单绑定验证功能
        this.$refs[formName].validate((valid) => {
          if (valid) {
            // 使用 vue-router 路由到指定页面，该方式称之为编程式导航
            //this.$router.push("main");
            if(this.$store.getters.checkAuthInfo(this.form)){
                this.$store.commit('NewAuthUser',this.form)
                this.$store.state.winlock = false
                this.ShowBox(false)
            }else{
                this.$notify.error({
                    title: '错误',
                    message: '用户名密码错'
                });
            }
          } else {
            return false;
          }
        });
      }
    }
  }
</script>

<style>
.pop-layer {
    display: none;
    background-color: #B3B3B3;
    position: absolute;
    top:0;
    left:0;
    bottom:0;
    right:0;
    z-index: 10;
    height: 100%;
}

.pop-box {
    display: block;
    background-color: #FFFFFF;
    z-index: 11;
    text-align: center;
    position:absolute;
    opacity:0.5;
    top: 50%;
    left: 50%;
    margin-top: -150px;
    margin-left: -150px;
}

.login-box {
    position:absolute;
    border: 1px solid #DCDFE6;
    background-color: #FFFFFF;
    width: 256px;
    padding: 35px 35px 15px 35px;
    border-radius: 5px;
    -webkit-border-radius: 5px;
    -moz-border-radius: 5px;
    box-shadow: 0 0 25px #909399;
}

</style>