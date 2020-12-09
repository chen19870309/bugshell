<template>
<el-dialog title="创建(S)FTP连接" :visible.sync="show" @close='handelClose'>
<el-form :model="sftpForm" :rules="rules" ref="sftpForm" label-width="100px" class="demo-ruleForm">
  <el-form-item label="连接名" prop="name">
    <el-input size="mini" id="name" v-model="sftpForm.name" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="主机" required>
  <el-col :span="18">
  <el-form-item prop="host">
    <el-input size="mini" id="host" v-model="sftpForm.host" @focus="itemforcus"></el-input>
  </el-form-item>
  </el-col>
  <el-col class="line" :span="1">:</el-col>
  <el-col :span="5">
  <el-form-item prop="port">
    <el-input size="mini" v-model="sftpForm.port"></el-input>
  </el-form-item>
  </el-col>
  </el-form-item>
  <el-form-item label="用户名" prop="username">
    <el-input size="mini" id="username" v-model="sftpForm.username" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="密码" prop="password">
    <el-input size="mini" id="password" type="password" v-model="sftpForm.password" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="类型" >
  <el-radio-group size="mini" v-model="sftpForm.type">
      <el-radio-button size="mini" label="sftp"></el-radio-button>
      <el-radio-button size="mini" label="ftp"></el-radio-button>
    </el-radio-group>
  </el-form-item>
  <el-form-item>
    <el-button size="mini" type="primary" @click="submitForm('sftpForm')">立即创建</el-button>
    <el-button size="mini" :icon="icon" @click="testConnect('sftpForm')">测试连接</el-button>
  </el-form-item>
</el-form>
</el-dialog>
</template>
<script>
  let target;
  const clipboard = require('electron').clipboard;
  const ipc = require('electron').ipcRenderer;
  export default {
    props: {
      show: {
             type: Boolean,
             default:false
         },
      host: {
          type: String,
          default: "{}"
      }
    },
    watch: {
      host(val,oldval){
        var item = eval("("+val+")")
        if(item.sftp)this.sftpForm = item.sftp
        if(item.ftp)this.sftpForm = item.ftp
      }
    },
    data() {
      return {
        icon: '',
        item: {},
        sftpForm: {
          name: '',
          host: '',
          port: 22,
          username: '',
          password: '',
          type: 'sftp',
          resource: '',
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
            this.item.label= this.sftpForm.name,
            this.item.remote= this.sftpForm.username+'@'+this.sftpForm.host+':'+this.sftpForm.port,
            this.item.type = this.sftpForm.type
            switch(this.sftpForm.type){
              case 'ftp':
                this.item.ftp = this.sftpForm
                break;
              case 'sftp':
                this.item.sftp = this.sftpForm
                break;
            }
            this.$store.commit('updateFtpHost',this.item);
            this.$message({
                type: 'success',
                message: '连接成功!'
            });
        }
      });
      ipc.on('clipboard-v',(event, res) => {
      if(target){
        switch(target.id){
          case 'name':
            this.sftpForm.name = res;
            break;
          case 'host':
            this.sftpForm.host = res;
            break;
          case 'username':
            this.sftpForm.username = res;
            break;
          case 'password':
            this.sftpForm.password = res;
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
            icon: 'el-icon-connection',
            label: this.sftpForm.name,
            remote: this.sftpForm.username+'@'+this.sftpForm.host+':'+this.sftpForm.port,
            type: this.sftpForm.type,
            }
            switch(this.sftpForm.type){
              case 'ftp':
                item.ftp = this.sftpForm
                break;
              case 'sftp':
                item.sftp = this.sftpForm
                break;
            }
            var r = this.$store.commit('addFtpHost',item);
            console.log('addFtpHost',r)
            this.show = false
            this.$message({
                type: 'success',
                message: '创建成功!'
            });
            this.$emit('callback')
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
            ipc.send('test-connect',this.sftpForm);
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      clearForm(formName) {
        this.$refs[formName].resetFields();
      },
      itemforcus(event) {
        //console.log(event.target)
        target = event.target
      }
    }
  }
</script>