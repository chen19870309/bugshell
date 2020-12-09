<template>
<div id="idOuterDiv" class="CsOuterDiv">
<div>
<el-row>
  <el-col :span="24">文件名: <marquee behavior="scroll"><span>{{current.filename}}</span></marquee></el-col>
</el-row>
<el-row>
  <el-col :span="24">
  <el-progress :text-inside="true" :stroke-width="20" :percentage="current.percent" status="current.status"></el-progress>
  </el-col>
</el-row>
<el-row>
  <el-col :span="24">{{current.type}}速度: {{current.speed}}</el-col>
</el-row>
<el-row>
  <el-col :span="24">{{current.type}}持续时间: {{current.lastting}}</el-col>
</el-row>
<el-row>
  <el-col :span="24">预计剩余时间: {{current.remminng}}</el-col>
</el-row>
<el-row>
  <el-col :span="16">文件大小: {{current.size}}/{{current.remotesize}}</el-col>
</el-row>
</div>
</div>
</template>

<script>
const ipc = require('electron').ipcRenderer;
function dragFunc(id) {
    var Drag = document.getElementById(id);
    Drag.onmousedown = function(event) {
        var ev = event || window.event;
        event.stopPropagation();
        var disX = ev.clientX - Drag.offsetLeft;
        var disY = ev.clientY - Drag.offsetTop;
        document.onmousemove = function(event) {
            var ev = event || window.event;
            Drag.style.left = ev.clientX - disX + "px";
            Drag.style.top = ev.clientY - disY + "px";
            Drag.style.cursor = "move";
        };
    };
    Drag.onmouseup = function() {
        document.onmousemove = null;
        this.style.cursor = "default";
    };
};

export default {
    name: "拖拽窗口",
    data() {
        return {
            show: false,
            jobs:[],
            current:{},
        }
    },
    watch: {
        show(val){
            var Drag = document.getElementById("idOuterDiv");
            if(val && this.jobs.length>0){
                Drag.style.display='block'
            }else{
                Drag.style.display='none'
            }
        }
    },
    mounted() {
        dragFunc("idOuterDiv");
        ipc.on('sftp-job',(event,arg)=>{
            console.log(arg.job)
            this.Append(arg.job)
            if(arg.show && !this.show){
                this.show = true
            }
            if(!arg.show && this.show){
                this.show = false
            }
        })
    },
    methods: {
        Append(job){
            this.current = job
            if(this.jobs.length == 0){
                this.jobs.unshift(job)
            }else{
                var find = false;
                for(var i=0;i<this.jobs.length;i++){
                    if(this.jobs[i].filename == job.filename){
                        find = true
                        this.jobs[i]=job
                    }
                    if(!find){
                        this.jobs.unshift(job)
                    }
                }
            }
            //console.log(this.jobs)
        }
    }
}

</script>

<style>
 .el-row {
    margin-bottom: 4px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .el-col {
    border-radius: 4px;
  }

.CsOuterDiv {
    display: none;
	width:256px;
	background-color: #CCFFCC;
	position:absolute;
	top:50%;
	left:60%;
    padding: 15px 15px 15px 15px ;
    font-size: 12px;
	transform:translateX(-50%) translateY(-50%);
	-moz-transform:translateX(-50%) translateY(-50%);
	-webkit-transform:translateX(-50%) translateY(-50%);
	-ms-transform:translateX(-50%) translateY(-50%);
	border-radius:5px;
    border: 1px solid #DCDFE6;
	box-shadow:3px 3px  10px gray;
    z-index: 99;
}

</style>