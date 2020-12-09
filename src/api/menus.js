/**
 * 菜单模版
 * 
 */

let TestMenu = [
     {
      label: "返回(B)",
      onClick: () => {
       this.message = "返回(B)";
       console.log("返回(B)");
      }
     },
     { label: "前进(F)", disabled: true },
     { label: "重新加载(R)", divided: true, icon: "el-icon-refresh" },
     { label: "另存为(A)..." },
     { label: "打印(P)...", icon: "el-icon-printer" },
     { label: "投射(C)...", divided: true },
     {
      label: "使用网页翻译(T)",
      divided: true,
      minWidth: 0,
      children: [{ label: "翻译成简体中文" }, { label: "翻译成繁体中文" }]
     },
     {
      label: "截取网页(R)",
      minWidth: 0,
      children: [
       {
        label: "截取可视化区域",
        onClick: () => {
         this.message = "截取可视化区域";
         console.log("截取可视化区域");
        }
       },
       { label: "截取全屏" }
      ]
     },
     { label: "查看网页源代码(V)", icon: "el-icon-view" },
     { label: "检查(N)" }
    ];

let FtpMainMenu = (f1,f2,f3) => { return [
        { label: "创建Ftp连接", divided: true, icon: "el-icon-refresh",onClick:f1},
        { label: "查看Ftp连接", icon: "el-icon-view",onClick:f2 },
        { label: "删除连接" ,onClick:f3}
    ]};
let LocalFileMenu = (f1,f2,f3,f4,f5,f6,f7) => { return [
    { label: "上传文件", icon: "el-icon-refresh",onClick:f1},
    { label: "上传目录", icon: "el-icon-refresh",onClick:f2},
    { label: "刷新本地目录", divided: true, icon: "el-icon-refresh",onClick:f3},
    { label: "打开目录", divided: true, icon: "el-icon-refresh",onClick:f4},
    { label: "批量上传", divided: true, icon: "el-icon-refresh",onClick:f6},
    { label: "删除", icon: "el-icon-refresh",onClick:f5},
    { label: "批量删除", icon: "el-icon-refresh",onClick:f7},
]};

let RemoteFileMenu = (f1,f2,f3,f4,f5,f6) => { return [
    { label: "下载文件", icon: "el-icon-refresh",onClick:f1},
    { label: "下载目录", icon: "el-icon-refresh",onClick:f2},
    { label: "刷新服务器目录", divided: true, icon: "el-icon-refresh",onClick:f3},
    { label: "批量下载", icon: "el-icon-refresh",onClick:f4},
    { label: "删除", icon: "el-icon-refresh",onClick:f5},
    { label: "批量删除", icon: "el-icon-refresh",onClick:f6},
]}

let FtpSubMenu = (f1,f2,f3) => { return [
        { label: "连接服务器", divided: true, icon: "el-icon-refresh" ,onClick:f1},
        { label: "查看详情", icon: "el-icon-view" ,onClick:f2},
        { label: "删除连接" ,onClick:f3}
    ]};

let SshMainMenu = (f1,f2,f3) => { return [
        { label: "创建SSH连接", divided: true, icon: "el-icon-refresh" ,onClick:f1},
        { label: "查看网页源代码(V)", icon: "el-icon-view" ,onClick:f2},
        { label: "配置详情页" ,onClick:f3}
    ]};

let SshSubMenu = (f1,f2,f3) => { return [
        { label: "连接服务器", divided: true, icon: "el-icon-refresh" ,onClick:f1},
        { label: "查看详情", icon: "el-icon-view" ,onClick:f2},
        { label: "删除连接" ,onClick:f3}
    ]};

let DBMainMenu = (f1,f2,f3) => { return [
    { label: "创建数据库连接", divided: true, icon: "el-icon-refresh" ,onClick:f1},
    { label: "查看网页源代码(V)", icon: "el-icon-view" ,onClick:f2},
    { label: "配置详情页" ,onClick:f3}
]}
let DBSubMenu = (f1,f2,f3) => { return [
    { label: "连接服务器", divided: true, icon: "el-icon-refresh" ,onClick:f1},
    { label: "查看详情", icon: "el-icon-view" ,onClick:f2},
    { label: "删除连接" ,onClick:f3}
]};
let RedisMainMenu = [
        { label: "创建Redis连接", divided: true, icon: "el-icon-refresh" },
        { label: "查看网页源代码(V)", icon: "el-icon-view" },
        { label: "配置详情页" }
    ]

let RedisSubMenu = [
        { label: "连接服务器", divided: true, icon: "el-icon-refresh" },
        { label: "断开连接", icon: "el-icon-view" },
        { label: "查看详情" }
    ];

export {
    SshMainMenu,
    SshSubMenu,
    FtpMainMenu,
    FtpSubMenu,
    RedisMainMenu,
    RedisSubMenu,
    DBMainMenu,
    LocalFileMenu,
    RemoteFileMenu,
}