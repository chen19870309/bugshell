import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'

import VueRouter from 'vue-router'
import router from './router'
import store from './store'
import Contextmenu from "vue-contextmenujs"

// import 'xe-utils'
// import VXETable from 'vxe-table'
// import 'vxe-table/lib/style.css'

Vue.use(Contextmenu);
Vue.use(VueRouter)
Vue.use(ElementUI)
// Vue.use(VXETable)


new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
