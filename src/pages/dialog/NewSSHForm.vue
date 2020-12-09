<template>
<el-dialog title="创建连接" :visible.sync="show" @close='handelClose'>
<el-form :model="sshForm" :rules="rules" ref="sshForm" label-width="100px" class="demo-ruleForm">
  <el-form-item label="连接名" prop="name">
    <el-input size="mini" id="name" v-model="sshForm.name" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="主机" required>
  <el-col :span="18">
  <el-form-item prop="host">
    <el-input size="mini" id="host" v-model="sshForm.host" @focus="itemforcus"></el-input>
  </el-form-item>
  </el-col>
  <el-col class="line" :span="1">:</el-col>
  <el-col :span="5">
  <el-form-item prop="port">
    <el-input size="mini" v-model="sshForm.port"></el-input>
  </el-form-item>
  </el-col>
  </el-form-item>
  <el-form-item label="用户名" prop="username">
    <el-input size="mini" id="username" v-model="sshForm.username" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="密码" prop="password">
    <el-input size="mini" id="password" type="password" v-model="sshForm.password" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="公钥" prop="pubkey">
    <el-input type="textarea" id="pubkey" v-model="sshForm.pubkey" ></el-input>
  </el-form-item>
  <el-form-item>
    <el-button size="mini" type="primary" @click="submitForm('sshForm')">立即创建</el-button>
    <el-button size="mini" @click="genRsaKey()">生成RSA密钥</el-button>
    <el-button size="mini" @click="getPubKey()">复制公钥</el-button>
    <el-button size="mini" :icon="icon" @click="testConnect('sshForm')">测试连接</el-button>
  </el-form-item>
</el-form>
</el-dialog>
</template>
<script>
  let target;
  const clipboard = require('electron').clipboard;
  const ipc = require('electron').ipcRenderer;
  var NodeRSA = require('node-rsa');
  export default {
    props: {
      show: {
             type: Boolean,
             default:false
         },
    },
    data() {
      return {
        icon: '',
        sshForm: {
          name: '',
          host: '',
          port: 22,
          username: '',
          password: '',
          type: 'ssh2',
          resource: '',
          pubkey: '',
          prikey:'',
        },
        rules: {
          name: [
            { required: true, message: '请输入连接名称', trigger: 'blur' }
          ],
          host: [
            { required: true, message: '输入主机名', trigger: 'change' }
          ],
          username: [
            { required: true, message: '输入用户名', trigger: 'change' }
          ],
          password: [
            { required: true, message: '密码不能为空', trigger: 'blur' }
          ]
        }
      };
    },
    mounted() {
      ipc.on('connect-reply', (event, res) => {
        this.icon = ""
        if(res != 'success'){
            this.$message({
                type: 'error',
                message: '连接失败!'
            });
        }else{
          this.$message({
                type: 'success',
                message: '连接成功!'
          });
        }
      })
      ipc.on('clipboard-v',(event, res) => {
      if(target){
        switch(target.id){
          case 'name':
            this.sshForm.name = res;
            break;
          case 'host':
            this.sshForm.host = res;
            break;
          case 'username':
            this.sshForm.username = res;
            break;
          case 'password':
            this.sshForm.password = res;
            break;
          default:
            console.log('uncatch:'+res)
        }
      }
      });
    },
    methods: {
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            var item = {
            id:   new Date().getTime() ,
            icon: 'el-icon-monitor',
            label: this.sshForm.name,
            remote: this.sshForm.username+'@'+this.sshForm.host+':'+this.sshForm.port,
            ssh: this.sshForm,
            type: 'ssh',
            }
            var r = this.$store.commit('addSshHost',item);
            this.$emit('callback')
            console.log('addSshHost',r)
            this.show = false
            this.$message({
                type: 'success',
                message: '创建成功!'
            });
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      testConnect(fromName){
        this.$refs[fromName].validate((valid) => {
          if (valid) {
            this.icon = 'el-icon-loading'
            ipc.send('test-connect',this.sshForm);
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      clearForm(formName) {
        this.$refs[formName].resetFields();
      },
      genRsaKey() {
        var key = new NodeRSA({b: 1024}); //生成新的1024位长度密钥
        var pubkey = key.exportKey('public')
        var prikey = key.exportKey('private')
        this.sshForm.pubkey = pubkey
        this.sshForm.prikey = prikey
      },
      getPubKey() {
        if(this.sshForm.pubkey){
          clipboard.writeText(this.sshForm.pubkey)
          this.$message({
            type: 'success',
            message: '复制成功!'
          });
        }else{
          this.$message({
            type: 'error',
            message: '请先生成公钥!'
          });
        }
      },
      itemforcus(event) {
        //console.log(event.target)
        target = event.target
      }
    }
  }
</script>