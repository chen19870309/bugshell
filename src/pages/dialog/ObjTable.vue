<template>
<div id="objDiv" class="ObjDiv">
    <div id="headBar"  align="right">
        <span @click="hideWin"><i class="el-icon-remove-outline"></i></span>
        <span @click="hideWin"><i class="el-icon-circle-close"></i></span>
    </div>
    <div class="ObjBody">
    <table class="objtable" id="tb_2">
        <thead>
            <tr>
                <th >字段名</th>
                <th >内容</th>
                <th >操作</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(col, index) in columns" :key="index">
                <td align="center" width="80px">
                <el-popover
                  placement="top"
                  width="200"
                  trigger="click"
                  :content="col.key" >
                  <span class="td-ctx" slot="reference">{{col.key}}</span>
                </el-popover>
                </td>
                <td width="278px" >
                <el-popover
                  placement="top"
                  width="300"
                  trigger="click"
                  :content="col.value" >
                  <span class="td-ctx" slot="reference">{{col.value}}</span>
                </el-popover>
                </td>
                <td align="center" width="22px"><span @click="copyvalue(col.value)">复制<i class="el-icon-copy-document"></i></span></td> 
            </tr>
        </tbody>
    </table>
    </div>
</div>
</template>

<script>
const clipboard = require('electron').clipboard;
const ipc = require('electron').ipcRenderer;
function dragFunc(id) {
    var Drag = document.getElementById(id);
    var Head = document.getElementById('headBar');
    Head.onmousedown = function(event) {
        var ev = event || window.event;
        event.stopPropagation();
        var disX = ev.clientX - Drag.offsetLeft;
        var disY = ev.clientY - Drag.offsetTop;
        document.onmousemove = function(event) {
            var ev = event || window.event;
            Drag.style.left = ev.clientX - disX + "px";
            Drag.style.top = ev.clientY - disY + "px";
            Head.style.cursor = "move";
        };
    };
    Head.onmouseup = function() {
        document.onmousemove = null;
        this.style.cursor = "default";
    };
};
export default {
  name: "obj-table",
  props: {
      columns: Array,
      show: {
          type: Boolean,
          default: false, 
      },
      info: {
          type: String,
          default: '',
      }
  },
  data: function() {
      return {
          ctx: {},
      }
  },
  watch: {
    columns(val) {
        console.log(val)
    },
    show(val){
        var Drag = document.getElementById("objDiv");
        if(val){
            Drag.style.display='block'
        }else{
            Drag.style.display='none'
        }
    }
  },
  mounted() {
        dragFunc("objDiv");
        if(this.show){
            var Drag = document.getElementById("objDiv");
            Drag.style.display='block'
        }
  },
  methods: {
      hideWin(){
          this.show = false
          ipc.send('dataitem-message',{showDataItem:false,DataItem:[]})
      },
      copyvalue(val){
          clipboard.writeText(val.toString())
          this.$message({
            type: 'success',
            message: '复制成功'
          });
      },
      editvalue(col){
        this.$prompt('修改'+col.key+" 原值为:"+col.value, '编辑字段内容', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        }).then(({ value }) => {
            col.value = value
            //TODO: 触发编辑列数据的效果
            var i = eval('('+this.info+')')
            var sql = 'update '+ h.table + 'set ' + col.key+"= ? where id = ? "
            var params = [];
            params.push(value)
            params.push(i.id)
            ipc.send('sql-cmd',{host:i.host,params,schema:i.schema,cmd:sql})
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '取消输入'
          });       
        });
      }
  }
}
</script>

<style>
.ObjDiv{
    display: none;
	width:420px;
    max-height: 400px;
	background-color:white;
	position:absolute;
	top:50%;
	left:60%;
    padding: 5px 5px 5px 5px ;
    font-size: 16px;
	transform:translateX(-50%) translateY(-50%);
	-moz-transform:translateX(-50%) translateY(-50%);
	-webkit-transform:translateX(-50%) translateY(-50%);
	-ms-transform:translateX(-50%) translateY(-50%);
	border-radius:5px;
    border: 1px solid #DCDFE6;
	box-shadow:3px 3px  10px gray;
    z-index: 99;
}
.ObjBody {
    max-height: 380px ;
    overflow-y: scroll;
}
table.objtable {
      font-family: verdana,arial,sans-serif;
      font-size:14px;
      color:#003366;
      width: 100%;
      border-width: 1px;
      border-color: #eee;
      border-collapse: collapse;
 }
table.objtable th {
     border-width: 1px;
     padding: 3px;
     border-style: solid;
     background-color: #dedede;
 }
 table.objtable td {
     border-width: 1px;
     padding: 2px;
     border-style: solid;
     min-width:50px;
     max-width:180px;
     overflow:hidden;
     text-overflow:ellipsis;
     background-color: #ffffff;
}
</style>