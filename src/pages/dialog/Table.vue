<template>
<div class="table-box">
  <div v-if="columns.length>0">
  <div class="table-win" >
    <table class="gridtable" id="tb_1">
        <thead>
            <tr>
                <!-- 屏蔽选中框<th align="center" width="22px"><el-checkbox @change="allSelectedChange"/></th> -->
                <th v-for="(column, cindex) in columns" :key="cindex">{{column.text}}</th>
                <th align="center" >操作</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, rindex) in rows" :key="rindex">
                <!-- <td align="center" width="22px"><el-checkbox v-model="selectedByIndex[rindex]" /></td> -->
                <td v-for="(column, cindex) in columns" :key="cindex">
                <el-popover
                  placement="bottom"
                  width="300"
                  trigger="click"
                  :content=row[column.dataIndex]>
                  <span  class="td-ctx" slot="reference">{{row[column.dataIndex]}}</span>
                </el-popover>
                </td>
                <td align="center" ><span @click="ShowObj(rindex)">查看<i class="el-icon-view"></i></span></td>
                <!-- |<span>编辑<i class="el-icon-edit"></i></span>|<span>删除<i class="el-icon-delete"></i></span> -->
            </tr>
        </tbody>
    </table>
  </div>
  <div align="right">
    <el-pagination layout="prev, pager, next" :page-size.sync="page" :total="total" @current-change="handleCurrentChange" ></el-pagination>
  </div>
  </div>
  <div class="table-win" v-else >
    暂无数据
  </div>
</div>
</template>

<script>
const ipc = require('electron').ipcRenderer;
export default {
  name: "table",
  props: {
    columns: Array,
    rows: Array,
    total: Number,
    page: Number,
  },
  data: function() {
    return {
      obj:{},
      showObj: false,
      selectedByIndex: [],
    };
  },
  watch: {
    columns(){
      this._initTable()
    }
  },
  mounted() {
    if(this.columns.length>0){
      this._initTable()
    }
  },
  methods: {
    _initTable(){
      var tTD; //用来存储当前更改宽度的Table Cell,避免快速移动鼠标的问题 
    var table = document.getElementById("tb_1");
    if(table!=null && table.rows != null)
    for (var j = 0; j < table.rows[0].cells.length; j++) {
      table.rows[0].cells[j].onmousedown = function () { 
      //记录单元格 
      tTD = this; 
      if (event.offsetX > tTD.offsetWidth - 10) { 
        tTD.mouseDown = true; 
        tTD.oldX = event.x; 
        tTD.oldWidth = tTD.offsetWidth; 
      } 
    }; 
    table.rows[0].cells[j].onmouseup = function () { 
      //结束宽度调整 
      if (tTD == undefined) tTD = this; 
      tTD.mouseDown = false; 
      tTD.style.cursor = 'default'; 
    }; 
    table.rows[0].cells[j].onmousemove = function () { 
      //更改鼠标样式 
      if (event.offsetX > this.offsetWidth - 10) 
        this.style.cursor = 'col-resize'; 
      else 
        this.style.cursor = 'default'; 
      //取出暂存的Table Cell 
      if (tTD == undefined) tTD = this; 
      //调整宽度 
      if (tTD.mouseDown != null && tTD.mouseDown == true) { 
        tTD.style.cursor = 'default'; 
        if (tTD.oldWidth + (event.x - tTD.oldX)>0) 
          tTD.width = tTD.oldWidth + (event.x - tTD.oldX); 
          //调整列宽 
          tTD.style.width = tTD.width; 
          tTD.style.cursor = 'col-resize'; 
          //调整该列中的每个Cell 
          table = tTD; 
          while (table.tagName != 'TABLE') table = table.parentElement; 
          for (var j = 0; j < table.rows.length; j++) { 
            table.rows[j].cells[tTD.cellIndex].width = tTD.width; 
          } 
      } 
      }; 
      } 
    },
    allSelectedChange: function(selected) {
      this.selectedByIndex = this.rows.map(r => selected);
    },
    handleCurrentChange(cur) {
      this.$emit('next',(this.page*(cur-1)))
    },
    ShowObj(index){
      var cols = []
      this.columns.forEach((col)=>{
        this.obj[col.text] = this.rows[index][col.dataIndex]
        cols.push({key:col.text,value:this.rows[index][col.dataIndex]})
      })
      ipc.send('dataitem-message',{showDataItem:true,DataItem:cols})
    }
  },
};
</script>
<style>
.table-box{
  width: 100%;
  min-height: 100px;
  color:#424200;
  border-width: 1px;
  border-color: #eee;
  border-style: double;
  overflow:scroll;
}
.table-win{
  width: 100%;
  height: 100%;
  overflow:scroll;
}
.td-ctx.el-popover__reference{
  width: 80px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
table.gridtable {
      font-family: verdana,arial,sans-serif;
      font-size:14px;
      color:#003366;
      border-width: 1px;
      border-color: #eee;
      border-collapse: collapse;
 }
 table.gridtable th {
     border-width: 1px;
     padding: 3px;
     border-style: solid;
     background-color: #dedede;
 }
 table.gridtable td {
     border-width: 1px;
     padding: 2px;
     border-style: solid;
     min-width:50px;
     max-width:200px;
     overflow:hidden;
     text-overflow:ellipsis;
     background-color: #ffffff;
}
table.hovertable {
      font-family: verdana,arial,sans-serif;
      font-size:11px;
      color:#333333;
      border-width: 1px;
      border-collapse: collapse;
 }
 table.hovertable th {
     background-color:#c3dde0;
     border-width: 1px;
     padding: 8px;
     border-color: #a9c6c9;
 }
 table.hovertable tr {
     background-color:#d4e3e5;
 }
 table.hovertable td {
     border-width: 1px;
     padding: 8px;
     border-style: solid;
     border-color: #a9c6c9;
 }
</style>