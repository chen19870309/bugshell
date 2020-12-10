# bugshell
nodejs electron 练手项目
## 编译
make build

## 运行
electron .

## 打包 (默认打的是win64的包)
make package

### 依赖的第三方包主要有
```
"vue": "^2.5.16"                    //vue
"xterm": "^4.9.0"                   //shell 窗口
"xterm-addon-fit": "^0.4.0"         //大小自适应
"codemirror": "^5.58.3"             //编辑器
"element-ui": "^2.14.1"             //主界面
"ftp": "^0.3.10"                    //ftp协议
"log4js": "^1.0.0"                  //日志框架
"mysql2": "^2.2.5"                  //mysql驱动
"sequelize": "^6.3.5"               //连接池以及orm框架
"ssh2": "^0.8.9"                    //ssh协议
"ssh2-sftp-client": "^5.3.2"        //sftp协议
"utf8": "^1.0.0"                    //编码集
```