<template>
<div class="jsdatawin">
<el-row ref="form" :model="form" class="in-form">
    <el-col :span="24">
        <el-input size="mini" v-model="form.keyname" placeholder="请输入内容">
            <template slot="prepend">keyname:</template>
            <el-button slot="append" icon="el-icon-search"></el-button>
        </el-input>
    </el-col>
</el-row>
<el-row >
    <div class="in-form-panel">
        <textarea ref="textarea" id="codebox"></textarea>
    </div>
</el-row>
<el-row>
    <el-col :span="24">
    <div class="button-box">
    <el-button size="mini" type="primary" @click="beautyText">格式化数据</el-button>
    <el-button size="mini" @click="restoreText" >还原数据</el-button>
    </div>
    </el-col>
</el-row>
</div>
</template>

<script type="text/ecmascript-6">
// 引入全局实例
// 核心样式
import 'codemirror/lib/codemirror.css'
import _CodeMirror from 'codemirror'
const clipboard = require('electron').clipboard;
// 引入主题后还需要在 options 中指定主题才会生效
import 'codemirror/theme/base16-light.css'
import 'codemirror/mode/javascript/javascript.js'
// 尝试获取全局实例
const CodeMirror = window.CodeMirror || _CodeMirror

export default {
    name: 'JsonDataView',
    data() {
        return {
            code: '',
            // 默认的语法类型
            mode: 'javascript',
            // 编辑器实例
            coder: null,
            options: {
                height: '200px',
                // 缩进格式
                tabSize: 2,
                // 主题，对应主题库 JS 需要提前引入
                theme: 'base16-light',
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
                    }
                }
            },
            form: {
            keyname: '',
            keydata: '',
            keydatabak: '',
            desc: ''
            }
        }
    },
    mounted() {
        this._initialize();
    },
    methods: {
        // 初始化
      _initialize () {
        // 初始化编辑器实例，传入需要被实例化的文本域对象和默认配置
        this.coder = CodeMirror.fromTextArea(this.$refs.textarea, this.options)
        // 编辑器赋值
        //this.coder.setValue(this.value || this.code)
        // 支持双向绑定
        this.coder.on('change', (coder) => {
          this.code = coder.getValue()
          if (this.$emit) {
            this.$emit('input', this.code)
          }
        })
      },
      beautyText() {
          console.log('beautyText',this.code);
          if(!this.keydatabak){
            this.keydatabak = this.code;
          }
          //this.keydata = JSON.stringify(this.code, null, "\t");
          var o = eval('('+this.code+')')
          console.log(o)
          //var str = {"name":"菜鸟教程", "site":"http://www.runoob.com"}
          this.code = JSON.stringify(o, null, "\t");
          this.coder.getDoc().setValue(this.code);
          this.coder.refresh();
      },
      restoreText() {
          if(this.code !== this.keydatabak){
          var o = eval('('+this.keydatabak+')')
          this.code = JSON.stringify(o);
          this.coder.getDoc().setValue(this.code);
          this.coder.refresh();
          }
      }
    }
}
</script>

<style>
.jsdatawin {
    margin: 10px;
}
  .in-form {
    margin: 10px;
    flex-grow: 1;
    display: flex;
    position: relative;
    height: 90%;
  }
  .in-form-panel {
    margin: 10px;
    height: 320px;
  }
  .el-row {
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .el-col {
    border-radius: 4px;
  }
.button-box {
    display: flex;
    align-items: center;
    justify-content: center;
}
  .CodeMirror {
    flex-grow: 1;
    z-index: 1;
    height: 100%;
  }
  .CodeMirror-code {
    line-height: 19px;
  }
</style>
