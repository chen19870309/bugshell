<template>
<el-collapse v-model="activeNames" @change="handleChange">
<el-collapse-item :title="title" name="1">
<el-row >
    <div class="in-sql-panel">
        <textarea ref="textarea" id="codebox" v-model="value" ></textarea>
    </div>
</el-row>
<el-row>
        <div align="right">
        <el-button size="mini" >清空</el-button>
        <el-button size="mini" type="primary" @click="SendSqlCmd" :icon="loading" :disabled="btnRun">执行</el-button>
        </div>
</el-row>
</el-collapse-item>
<el-collapse-item title="数据表格" name="2">
<el-row >
    <DataTable :columns="columns" :rows="rows" :total="total" :page="page" :cur="curpage" @next="nextPage"/>
</el-row>
</el-collapse-item>
</el-collapse>
</template>

<script>
const clipboard = require('electron').clipboard;
const ipc = require('electron').ipcRenderer;
import DataTable from './dialog/Table.vue'


import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'
import _CodeMirror from 'codemirror'
// 引入主题后还需要在 options 中指定主题才会生效
require("codemirror/addon/edit/matchbrackets");
require("codemirror/addon/selection/active-line");
import 'codemirror/theme/base16-light.css'
import 'codemirror/mode/sql/sql.js'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/hint/sql-hint'
// 尝试获取全局实例
const CodeMirror = window.CodeMirror || _CodeMirror


export default {
    name:"sql-table",
    data() {
        return {
            title:'编辑sql/(empty)',
            schema: '',
            host:{},
            activeNames: ['1','2'],
            columns: [],
            rows: [],
            total: 0,
            value: '',
            page: 10,
            curpage: 0,
            showNotify: true,
            loading: '',
            btnRun: false,
            coder: null,
            options: {
                height: 128,
                // 缩进格式
                tabSize: 2,
                // 主题，对应主题库 JS 需要提前引入
                theme: 'base16-light',
                mode: 'text/x-sql',
                startIndent: true,
                // 显示行号
                lineNumbers: true,
                line: true,
                extraKeys: {
                    'Ctrl-C': function(cm) {
                    console.log('ctrl-c',cm.getSelection())
                    clipboard.writeText(cm.getSelection())
                    },
                    'Ctrl-V': function(cm) {
                    console.log('ctrl-v',cm.getCursor())
                    let pos = {};
                    pos.line = cm.getCursor().line;
                    pos.ch = cm.getCursor().ch;
                    cm.replaceRange(clipboard.readText(),pos)
                    },
                },
                hintOptions: {
                    completeSingle: false,
                }
            },
        }
    },
    watch: {
      $route(){
        this.coder.setValue('')
        this.coder.refresh()
        this.connectDb()
      }
    },
    mounted() {
        this._initialize();
        ipc.on('db-schema-change',(event,data)=>{//切换数据库
            console.log(data.tables)
            this.schema = data.schema
            this.title = '当前数据库为/'+data.schema
            if(data.tables)
            this.coder.setOption('hintOptions',{
                completeSingle: false,
                tables: data.tables,
            })
        })
        ipc.on('db-cmd-reply',(event,data)=>{
            this.loading = ''
            this.btnRun = false
            console.log('db-cmd-reply',data)
            if(data.err){
                this.Notify(data.err)
                return
            }
            if(data.total) {
                this.total = data.total
            }
            if(data.page) {
                this.page = data.page
            }
            if(data.result.length>0){
                this.columns = []
                var i = 0
                for(var key in data.result[0]){
                    this.columns.push({text:key,dataIndex:i})
                    i++
                }
                this.rows = []
                data.result.forEach((item)=>{
                    var data = []
                    this.columns.forEach((col)=>{
                        data.push(item[col.text])
                    })
                    this.rows.push(data)
                })
            }else{
                this.$notify.info({
                    message: '返回0条数据',
                });
                this.columns = []
                this.rows = []
                this.total = 0
                this.page = 10
            }
        })
    },
    methods: {
        // 初始化
      _initialize () {
        // 初始化编辑器实例，传入需要被实例化的文本域对象和默认配置
        this.coder = CodeMirror.fromTextArea(this.$refs.textarea, this.options)
        this.coder.on('keypress',()=>{
            this.coder.showHint()
        }) 
        // 连接数据库
        this.connectDb()
      },
      SendSqlCmd(){
          var sql = this.coder.getSelection()
          if(sql.trim().length<10){ //可选中执行sql
              sql = this.coder.getValue()
          }
          this.curpage = 0
          this.btnRun = true
          this.loading='el-icon-loading'
          ipc.send('sql-cmd',{host:this.host,schema:this.schema,cmd:sql,page:this.page})
      },
      nextPage(offset){//翻页组件
          this.btnRun = true
          this.loading='el-icon-loading'
          var sql = this.coder.getSelection()
          if(sql.trim().length<10){ //可选中执行sql
              sql = this.coder.getValue()
          }
          ipc.send('sql-cmd',{host:this.host,schema:this.schema,cmd:this.coder.getValue(),page:this.page,offset:offset})
      },
      async Notify(msg){
        if(this.showNotify){
            this.showNotify = false
            setTimeout(()=>{
                this.showNotify = true
            },200)
            this.$notify.error({
                title: 'SQL执行错误',
                message: msg,
            });
        }
      },
      connectDb(){
          console.log('connectDb',this.$route.query)
          if(this.$route.query.id){
              var data = this.$store.getters.getDBInfo(this.$route.query.id)
              if(data){
                  if(data.host.dbname) {
                      this.schema = data.host.dbname
                      this.totle = '当前数据库为/'+data.host.dbname
                  }
                  this.host = data.host
                  this.host.id = this.$route.query.id
                  //if(data.host.dbname){
                    //ipc.send('sql-show-tables',{host:this.host,schema:this.schema,cmd:"show tables"}) //不主动加载表信息
                  //}else{
                    ipc.send('sql-show-databases',{host:this.host,cmd:"show databases"}) 
                  //}
              }
          }
      }
    },
    components: {
        DataTable,

    }
}
</script>
<style>
.el-collapse-item__header {
  height: 24px;
  background-color:  #eee;
}
.el-collapse-item__content {
  border-width: 1px;
  padding-bottom: 0px;
  border-style: solid;
  border-color: #a9c6c9;
}
.in-sql-panel{
    height: 256px;
}
</style>