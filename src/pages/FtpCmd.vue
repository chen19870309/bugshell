<template>
    <div class='console' id='xterm'></div>
</template>

<script>
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit"
import "xterm/css/xterm.css";
import "xterm/lib/xterm.js";
const clipboard = require('electron').clipboard;
const ipc = require('electron').ipcRenderer;
export default {
    name: 'Cmd',
    props: {
        ftpid: {
             type: String,
             default: '',
        },
        title: {
             type: String,
             default: 'Xterm$ '
        },
        msg: {
            type: String,
            default: '',
        },
        theme: {
            type: String,
            default: '{"background":"#FFFCEC","curor":"help"}'
        }
    },
    data() {
        return {
            row: 0,
            term: "",
            input: '',
            copy: '',
            ftpid: '',
            prefix: '',
            // 历史指令
            histIndex: 0,
            ssh: false,
            histCommandList: [],
            currentOffset: Number,
            termOptions: {
                scrollback: 800
            },
        }
    },
    mounted() {
        this.initTerm();
    },
    watch: {
        title(val,oldval) {
            console.log('title',val,oldval)
            this.prefix = val
            this.term.prompt()
        },
        ftpid(val) {
            this.ftpid = val
        }
    },
    methods: {
        initTerm() {
            this.term = new Terminal ({
                cols: 130,
                renderType: "canvas",
                convertEol: true,
                cursorStyle: "block",
                cursorBlink: true,
                scrollback: this.termOptions.scrollback,
                screenKeys: true,
                theme: {
                    "background":"#424200",
                    "foreground":"#FFFCEC",
                    "curor":"help"
                }
            });
            this.term.open(document.getElementById("xterm"));
            if(this.row == 0) {
            const fitAddon = new FitAddon();
            this.term.loadAddon(fitAddon);
            fitAddon.fit()
            }
            let _this = this;
            this.term.prompt = () => {
                if(this.prefix.length>0){
                _this.term.write(this.prefix)
                }
            }
            // 接收asynchronous-reply返回的消息
            ipc.on('ftp-cmd-reply', (event, arg) => {
                this.term.write('\r\n'+arg+'\r\n')
                this.term.prompt()
            })
            this.term.onKey(function(ev) {
                const e = ev.domEvent.keyCode
                const printable = !ev.domEvent.altKey && !ev.domEvent.altGraphKey && !ev.domEvent.ctrlKey && !ev.domEvent.metaKey
                // 每行开头前缀长度 @ashinWu:$ 
                let threshold = _this.prefix.length
                if(_this.ssh) threshold = 0
                // 总偏移(长度) = 输入+前缀
                let fixation = _this.input.length + threshold
                // 当前x偏移量
                let offset = _this.term._core.buffer.x
                _this.currentOffset = fixation
                //console.log(ev.key,e,offset,fixation)
                if(!printable){
                    console.log('alt',ev.domEvent.altKey,e)
                    console.log('ctrl',ev.domEvent.ctrlKey,e)
                    console.log('meta',ev.domEvent.metaKey,e)
                    if(ev.domEvent.ctrlKey && e == 67){ //Ctrl+C
                        clipboard.writeText(_this.term.getSelection())
                    }
                    if(ev.domEvent.ctrlKey && e == 86){ //Ctrl+V
                        var data = clipboard.readText().trim()
                        _this.input = _this.input + data
                        _this.term.write(data)
                    }
                    return
                }
                switch(e) {
                    // 回车键
                    case 13:
                        _this.handleInput()
                        _this.input = ''
                        break;
                    // 退格键
                    case 8:
                        if (offset > threshold) {
                        _this.term._core.buffer.x = offset - 1
                        // \x1b[?K: 清除光标至行末的"可清除"字符
                        _this.term.write('\x1b[?K' + _this.input.slice(offset - threshold))
                        // 保留原来光标位置
                        const cursor = _this.bulidData(fixation - offset, '\x1b[D')
                        _this.term.write(cursor)
                        _this.input = `${_this.input.slice(0, offset - threshold - 1)}${_this.input.slice(offset - threshold)}`
                        }
                        break;
                    case 35:
                        const cursor = _this.bulidData(fixation - offset, '\x1b[C')
                        _this.term.write(cursor)
                        break;
                    // 方向盘上键
                    case 38:
                        if (_this.histCommandList[_this.histIndex - 1]) {
                        // 将光标重置到末端
                        _this.term._core.buffer.x = fixation
                        let b1 = '', b2 = '', b3 = '';
                        // 构造退格(模拟替换效果) \b \b标识退一格; \b\b  \b\b表示退两格...
                        for (let i = 0; i < _this.input.length; i++) {
                            b1 = b1 + '\b'
                            b2 = b2 + ' '
                            b3 = b3 + '\b'
                        }
                        _this.term.write(b1 + b2 + b3)
                        _this.input = _this.histCommandList[_this.histIndex - 1]
                        _this.term.write(_this.histCommandList[_this.histIndex - 1])
                        _this.histIndex--
                        }
                        break;
                         // 方向盘下键
                        case 40:
                            if (_this.histCommandList[_this.histIndex + 1]) {
                            // 将光标重置到末端
                            _this.term._core.buffer.x = fixation  
                            let b1 = '', b2 = '', b3 = '';
                            // 构造退格(模拟替换效果) \b \b标识退一格; \b\b  \b\b表示退两格...
                            for (let i = 0; i < _this.histCommandList[_this.histIndex].length; i++) {
                                b1 = b1 + '\b'
                                b2 = b2 + ' '
                                b3 = b3 + '\b'
                            }
                            _this.input = _this.histCommandList[_this.histIndex + 1]
                            _this.term.write(b1 + b2 + b3)
                            _this.term.write(_this.histCommandList[_this.histIndex + 1])
                            _this.histIndex++
                            }
                            break;
                        // 方向盘左键
                        case 37:
                            if (offset > threshold) {
                                _this.term.write(ev.key)
                            }
                            break;
                        // 方向盘右键
                        case 39:
                            if (offset < fixation) {
                                _this.term.write(ev.key)
                            }
                            break;
                    default:
                        if (printable) {
                            // 限制输入最大长度 防止换行bug
                            if (fixation >= _this.term.cols)  return
                                // 不在末尾插入时 要拼接
                                if (offset < fixation) {
                                    _this.term.write('\x1b[?K' + `${ev.key}${_this.input.slice(offset - threshold)}`)
                                    const cursor = _this.bulidData(fixation - offset, '\x1b[D')
                                    _this.term.write(cursor)
                                    _this.input = `${_this.input.slice(0, offset - threshold)}${ev.key}${_this.input.slice(offset - threshold)}`
                                } else {
                                    _this.term.write(ev.key)
                                    _this.input += ev.key
                                }
                            _this.histIndex = _this.histCommandList.length
                        }
                        break;
                }
            });
      
        },
        // 在这里处理自定义输入...
        handleInput() {
        // 判断空值
        this.term.write('\r\n')
        if (this.input.trim()) {
        // 记录历史命令
        if (this.histCommandList[this.histCommandList.length - 1] !== this.input) {
            this.histCommandList.push(this.input)
            this.histIndex = this.histCommandList.length
        }
        const command = this.input.trim().split(' ')
        const result = this.handelCmd(this.input.trim());
        //console.log(this.input,result)
        switch (command[0]) {
            case 'help': 
                this.term.writeln('\x1b[40;33;1m\nthis is a web terminal demo based on xterm!\x1b[0m\n此demo模拟shell上下左右和退格键效果\n')
                break
            case 'ssh':
                this.ssh = true
                break;
            case 'exit':
                if(this.ssh) this.ssh = false
                break;
            case 'clear':
                this.term.write('\x1b[2J');
                break;
            default://echo
                break
            }
        }
            if (!this.ssh){
                this.term.prompt()
            }
        },

        bulidData(length, subString) {
        let cursor = ''
        for (let i = 0; i < length; i++) {
            cursor += subString
        }
        return cursor;
        },

        handelCmd(cmd) {
            //处理业务逻辑
            console.log(cmd)
            if(this.ssh){
                ipc.send('ssh-message',cmd);
                return 'ack'
            }else{
                var data = {
                    host: this.prefix,
                    key: this.ftpid,
                    localpath: this.$store.state.localdir,
                    cmd: cmd,
                }
                let result = ipc.send('ftp-cmd',data);
                return null
            }
        }
    }

}
</script>

<style>
.console {
    flex-grow: 1;
    display: flex;
    position: relative;
    height: 100%;
    width: 100%;
    background: #424200;
}
</style>