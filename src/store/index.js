// const Store = require('electron-store');
import Vue from 'vue'
import Vuex from 'vuex'

import tagNav from './modules/tagNav'
const os = require('os');
const Log = require('../logger')
const sec = require('../api/sec')
let logger = Log.getLogger("store")


Vue.use(Vuex)

// let option={
//     name:"config",//文件名称,默认 config
//     fileExtension:"json",//文件后缀,默认json
//     cwd:app.getPath('userData'),//文件位置,尽量不要动
// //    encryptionKey:"aes-256-cbc" ,//对配置文件进行加密
//     clearInvalidConfig:true, // 发生 SyntaxError  则清空配置,
// }

// const store = new Store(option);
//如果需要加密存储 就用下面的
//const store = new Store({encryptionKey: '加密值'});	

let setItem = (key,data) => {
	var json = JSON.stringify(data);
	localStorage.setItem(key,json)
}

let getItem = (key) => {
	var str = localStorage.getItem(key);
	//console.log('getItem',key,str)
	if(str == null){
		return [];
	}else{
		return JSON.parse(str);
	}
}

const state = {
	Debug: true,
	updatadoc: true,
	savedoc: false,
	winlock: false,
	localdir: os.homedir(),
	SSH: [],
	FTP: [],
	REDIS: [],
	DataBases: [],
	CoderInfos: [],
	Coder: {},
	AuthInfo: {},
}

//set 方法
const mutations = {
	NewAuthUser(state,auth) {
		state.AuthInfo.forEach((item)=>{
			if(item.username == auth.username && item.password == sec.SHA256(auth.password)){
				return true
			}
		})
		state.AuthInfo.push({
			username:auth.username,
			password:sec.SHA256(auth.password),
			date: new Date()
		})
		setItem('AUTH_USER',state.AuthInfo)
	},
	setCoderInfo(state,info){
		var find = false;
		for(var i = 0; i < state.CoderInfos.length; i++) {
			if(state.CoderInfos[i].id === info.id){
				state.CoderInfos[i].code =info.code
				find = true;
				break;
			}
		}
		if(!find){
			state.CoderInfos.unshift(info)
		}
		console.log('setCoderInfo',find,info.id,info.code)
		setItem('CODE_DATA',state.CoderInfos)
	},
	addDBHost(state,host) {
		host.children.forEach((c)=>{
			if(c.children.length>0) c.children = []
		})
		var find = false;
		for(var i = 0; i < state.DataBases.length; i++) {
			if(state.DataBases[i].remote === host.remote){
				state.DataBases[i] = host
				find = true;
				break;
			}
		}
		if(!find){
			state.DataBases.unshift(host)
		}
		setItem('DBS',state.DataBases)
	},
	delDBHost(state,host) {
		for(var i = 0; i < state.DataBases.length; i++) {
			if(state.DataBases[i].id == host.id) {
				state.DataBases.splice(i,1)
			}
		}
		setItem('DBS',state.DataBases)
	},
	updateDBHost(state,host) {
		host.children.forEach((c)=>{
			if(c.children.length>0) c.children = []
		})
		for(var i = 0; i < state.DataBases.length; i++) {
			if(state.DataBases[i].id == host.id) {
				state.DataBases[i] = host
			}
		}
		setItem('DBS',state.DataBases)
	},
	addSshHost(state,host) {
		var find = false;
		for(var i = 0; i < state.SSH.length; i++) {
			if(state.SSH[i].remote === host.remote){
				find = true;
				break;
			}
		}
		if(!find){
			state.SSH.unshift(host)
			setItem('SSH',state.SSH)
		}
	},
	addFtpHost(state,host) {
		state.FTP.unshift(host)
		// store.set('FTP',state.FTP)
		setItem('FTP',state.FTP)
	},
	addRedisHost(state,host) {
		state.REDIS.unshift(host)
		// store.set('REDIS',state.REDIS)
		setItem('REDIS',state.REDIS)
	},
	updateSshHost(state,host) {
		for(var i = 0; i < state.SSH.length; i++) {
			if(state.SSH[i].id == host.id) {
				state.SSH[i] = host
			}
		}
		setItem('SSH',state.SSH)
	},
	delSshHost(state,host) {
		for(var i = 0; i < state.SSH.length; i++) {
			if(state.SSH[i].id == host.id) {
				state.SSH.splice(i,1)
			}
		}
		setItem('SSH',state.SSH)
	},
	updateFtpHost(state,host) {
		for(var i = 0; i < state.FTP.length; i++) {
			if(state.FTP[i].id == host.id) {
				state.FTP[i] = host
			}
		}
		setItem('FTP',state.FTP)
	},
	delFtpHost(state,host) {
		for(var i = 0; i < state.FTP.length; i++) {
			if(state.FTP[i].id == host.id) {
				console.log('del',host.id)
				state.FTP.splice(i,1)
			}
		}
		setItem('FTP',state.FTP)
	},
	updateRedisHost(state,host) {
		for(var i = 0; i < state.REDIS.length; i++) {
			if(state.REDIS[i].id == host.id) {
				state.REDIS[i] = host
			}
		}
		setItem('REDIS',state.REDIS)
	}
}

const getters = {
	checkAuthInfo: (state,getters) => (auth) => {
		var ok = state.Debug
		state.AuthInfo = getItem("AUTH_USER")
		if(state.AuthInfo.length == 0) return true //没有设定用户授权信息
		if(auth == null || auth.username == null){
			if(state.AuthInfo.length == 0) ok = true
			else ok = state.Debug 
		}
		state.AuthInfo.forEach((item)=>{
			if(item.username == auth.username && item.password == sec.SHA256(auth.password)){
				console.log(item,auth,sec.SHA256(auth.password))
				ok = true
			}
		})
		return ok
	},
	getEditorInfo: (state,getters) => (id) => {
		state.CoderInfos = getItem('CODE_DATA')
		for(var i = 0; i < state.CoderInfos.length; i++) {
			if(state.CoderInfos[i].id == id){
				return state.CoderInfos[i].code
			}
		}
		return "null";
	},
	getFtpInfo: (state,getters) => (id) => {
		for(var i = 0; i < state.FTP.length; i++) {
			console.log("index->"+i,state.FTP[i].id,id)
			if(state.FTP[i].id == id){
				return state.FTP[i]
			}
		}
		return null
	},
	getDBInfo: (state,getters) => (id) => {
		for(var i = 0; i < state.DataBases.length; i++) {
			console.log("index->"+i,state.DataBases[i].id,id)
			if(state.DataBases[i].id == id){
				return state.DataBases[i]
			}
		}
		return null
	},
	getSSHHosts(state) {
		//return state.SSH
		// state.SSH = store.get('SSH')
		// if(state.SSH.length==0){
		// 	state.SSH = [{
		// 		id: 9,
		// 		icon: 'el-icon-edit',
		// 		label: '三级 1-1-1'
		// 	  }, {
		// 		id: 10,
		// 		icon: 'el-icon-edit',
		// 		label: '三级 1-1-2 ---- 3.1415926 - test looooooooooooooooooooooooooooooooooooog item '
		// 	  }]
		// }
		state.SSH = getItem('SSH')
		if(state.SSH.length==0){
			return {
				id: 'ssh',
				icon: 'el-icon-s-platform',
				label: 'ssh连接',
			}
		}else{
			return {
				id: 'ssh',
				icon: 'el-icon-s-platform',
				label: 'ssh连接',
				children: state.SSH,
			}
		}
	},
	getFTPHosts(state) {
		state.FTP = getItem('FTP')
		if(state.FTP.length==0){
			return {
				id: 'ftp',
				icon: 'el-icon-upload',
				label: 'ftp连接',
			}
		}else{
			return {
				id: 'ftp',
				icon: 'el-icon-upload',
				label: 'ftp连接',
				children: state.FTP,
			}
		}
	},
	getDBHosts(state) {
		state.DataBases = getItem('DBS')
		if(state.DataBases.length==0){
			return {
				id: 'database',
				icon: 'el-icon-office-building',
				label: '数据库连接',
			}
		}else{
			state.DataBases.forEach((db)=>{
				db.children = []; //清空数据库表信息
			})
			return {
				id: 'database',
				icon: 'el-icon-s-help',
				label: '数据库连接',
				children: state.DataBases,
			}
		}
	},
	getRedisHosts(state) {
		state.REDIS = getItem('REDIS')
		if(state.REDIS.length==0){
			return {
				id: 'redis',
				icon: 'el-icon-link',
				label: 'redis连接',
			}
		}else{
			return {
				id: 'redis',
				icon: 'el-icon-link',
				label: 'redis连接',
				children: state.REDIS,
			}
		}
	}
}

const actions = {

}

export default new Vuex.Store({
	state,
	actions,
	mutations,
	getters,
	modules: {
		tagNav:tagNav
	},
})