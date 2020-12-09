import Vue from 'vue'
import Router from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

import Main from '../pages/Main'
import DataTable from '../pages/SqlTableView'
import CodeEditor from '../pages/CodeEditor'
import JsonDataView from '../pages/JsonDataView'
import FtpCmd from '../pages/FtpCmd'
import SftpView from '../pages/SFTPFormView'
import IFrame from '../pages/IFrameView'

NProgress.configure({showSpinner:false});
Vue.use(Router);


const router = new Router({
  mode: 'hash',
  routes: [
    {
      path: '/home',
      redirect: '/main'
    },
    {
      path: '/',
      redirect: '/main'
    },
    {
      path: '/error',
      component: Main,
      children: [{
        path: '400',
        component: Main
      },{
        path: '500',
        component: Main
      }]
    },
    {
      // 首页
      path: '/main',
      name: 'JsonDataView',
      component: JsonDataView
    },
    {
      // 表格
      path: '/data',
      name: 'DataTable',
      component: DataTable
    },
    {
      // 命令行，
      path: '/cmd',
      name: 'FtpCmd',
      component: FtpCmd
    },
    {
      // 编辑器
      path: '/editor',
      name: 'CodeEditor',
      component: CodeEditor
    },
    {
      path: '/sftp',
      name: 'SftpView',
      component: SftpView,
    },
    {
      path: '/frame',
      name: 'IFrame',
      component: IFrame
    }
  ]
});

// 路由跳转前验证
router.beforeEach((to, from, next) => {
  // 开启进度条
  NProgress.start();
  if (to.path.indexOf("/error") >= 0) {
    // 防止因重定向到error页面造成beforeEach死循环
    next()
  } else {
    console.log("goto",from,to)
    if(from.fullPath == to.fullPath){
      NProgress.done(); 
    }else{
      next()
    }
}
});

// 结束Progress
router.afterEach(() => {
  NProgress.done(); 
});

export default router