<template>
<el-dialog title="创建数据库连接" :visible.sync="show" @close='handelClose'>
<el-form :model="dbForm" :rules="rules" ref="dbForm" label-width="100px" class="demo-ruleForm">
  <el-form-item label="连接名" prop="name">
    <el-input size="mini" id="name" v-model="dbForm.name" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="主机" required>
  <el-col :span="18">
  <el-form-item prop="host">
    <el-input size="mini" id="host" v-model="dbForm.host" @focus="itemforcus"></el-input>
  </el-form-item>
  </el-col>
  <el-col class="line" :span="1">:</el-col>
  <el-col :span="5">
  <el-form-item prop="port">
    <el-input size="mini" v-model="dbForm.port"></el-input>
  </el-form-item>
  </el-col>
  </el-form-item>
  <el-form-item label="用户名" prop="username">
    <el-input size="mini" id="username" v-model="dbForm.username" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="密码" prop="password">
    <el-input size="mini" id="password" type="password" v-model="dbForm.password" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="数据库名" prop="dbname">
    <el-input size="mini" id="dbname" v-model="dbForm.dbname" @focus="itemforcus"></el-input>
  </el-form-item>
  <el-form-item label="类型" >
  <el-radio-group size="mini" v-model="dbForm.type">
      <el-radio-button size="mini" label="mysql"></el-radio-button>
      <el-radio-button size="mini" label="postgres"></el-radio-button>
      <!-- <el-radio-button size="mini" label="mssql"></el-radio-button>
      <el-radio-button size="mini" label="mariadb"></el-radio-button>
      <el-radio-button size="mini" label="sqlite"></el-radio-button> -->
    </el-radio-group>
  </el-form-item>
  <el-form-item>
    <el-button size="mini" type="primary" @click="submitForm('dbForm')">{{btnSave}}</el-button>
    <el-button size="mini" :icon="icon" @click="testConnect('dbForm')" :disabled="btnText">测试连接</el-button>
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
        this.id = item.id
        this.dbForm = item.host
      }
    },
    data() {
      return {
        id: 0,
        icon: '',
        btnSave: '保存连接',
        btnText: false,
        item: {},
        showNotify: false,
        dbForm: {
          name: '',
          host: '',
          port: 3306,
          username: '',
          password: '',
          dbname: '',
          type: 'mysql',
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
      if(this.host){
      var item = eval("("+this.host+")")
      this.id = item.id
      this.dbForm = item.host
      if(this.id ==0){
        this.btnSave = "新建连接"
      }else{
        this.btnSave = "保存数据"
      }
      }
      ipc.on('connect-reply', (event, res) => {
        this.icon = ""
        this.btnText = false
        if(res != 'success'){
            this.$message({
                type: 'error',
                message: '连接失败!'
            });
        }else{
            this.item.label= this.dbForm.name,
            this.item.remote= this.dbForm.username+'@'+this.dbForm.host+':'+this.dbForm.port,
            this.item.type = this.dbForm.type
            this.item.host = this.dbForm
            switch(this.dbForm.type){
              case 'mysql':
                break;
              case 'postgres':
                break;
            }
            this.$store.commit('updateDBHost',this.item);
            this.Notify('info','连接成功')
        }
      });
      ipc.on('clipboard-v',(event, res) => {
      if(target){
        switch(target.id){
          case 'name':
            this.dbForm.name = res;
            break;
          case 'host':
            this.dbForm.host = res;
            break;
          case 'username':
            this.dbForm.username = res;
            break;
          case 'password':
            this.dbForm.password = res;
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
            id:   this.id > 0 ? this.id : new Date().getTime() ,
            icon: 'el-icon-coin',
            label: this.dbForm.name,
            remote: this.dbForm.username+'@'+this.dbForm.host+':'+this.dbForm.port,
            type: this.dbForm.type,
            host: this.dbForm,
            children: [],
            }
            if(this.dbForm.dbname.trim() != ''){
              item.children.push({
                pid: item.id,
                id: 'DB-'+this.dbForm.dbname,
                label:this.dbForm.dbname,
                type:'databases',
                icon:'el-icon-folder',
                host: this.dbForm,
                children: [],
              })
            }
            var r = this.$store.commit('addDBHost',item);
            console.log('addDBHost',r)
            this.show = false
            this.$message({
                type: 'success',
                message: '成功!'
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
            this.btnText = true
            ipc.send('test-connect',this.dbForm);
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      Notify(type,msg){
        setTimeout(()=>{
          this.showNotify = false
        },300)
        if(this.showNotify) return
        this.showNotify = true
        this.$message({
          type: type,
          message: msg
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