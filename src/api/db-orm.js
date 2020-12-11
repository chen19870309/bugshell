//引入框架
//var MYSQL = require('mysql')
var pg = require('pg');
var Sequelize = require('sequelize');
const Log = require('../logger')
let logger = Log.getLogger('Sequelize')
var showTables = false

const DBClientMap = new Map(); 
const DBTablesMap = new Map();

function TestConnect(config,then) {
    try{
    process.on('unhandledRejection',err => {
            then(err)
    }); 
    var test = new Sequelize(config.dbname,config.username,config.password,{
        dialect: config.type,
        host: config.host,
        port: config.port,
    })
    test.authenticate().then((r0,r1,r2) => {
        logger.info(r0,r1,r2)
        then()
    } )
    }catch(err){
        logger.error('connect host:'+config,err.message)
        then(err)
    }
    
}

function InitClient(config,schema){
    var key = config.host+config.port+config.username+schema
    var  client= DBClientMap.get(key)
    var dbname = schema?schema:config.dbname
    if(!client){
        logger.info('InitClient',config,schema)
        client = new Sequelize(dbname,config.username,config.password,{
            dialect: config.type,
            host: config.host,
            port: config.port,
            dialectOptions: {
                dateStrings: true,
                typeCast: true
            },
            timezone: '+08:00' //改为标准时区
        })
        DBClientMap.set(key,client)
    }
    return client;
}

function count(sql){
    var commands = sql.split(' ')
    var strCount = ""
    var append = false;
    commands.forEach(item => {
        if(append){
            strCount = strCount+ ' ' + item
        }
        if(item.trim().toLowerCase() == 'select'){
            strCount = 'select count(1) as COUNT '
        }
        if(item.trim().toLowerCase() == 'from'){
            strCount +=  'from '
            append = true
        }
    });
    logger.info('new countStr:',strCount)
    return strCount
}

function PGExec(host,sql,then){
    var key = "C"+host.host+host.port+host.username+host.dbname
    var client= DBClientMap.get(key)
    if(!client){
        var conString = "postgres://"+host.username+":"+host.password+"@"+host.host+":"+host.port+"/"+host.dbname
        client = new pg.Client(conString);
        DBClientMap.set(key,client)
        logger.info('init pg client =>',conString)
    }
    client.connect(function(err) {
        if(err) {
          then(err)
        }
        logger.info('exec',sql)
        client.query(sql, function(err, data) {
          if(err) {
            then(err)
          }else{
            logger.info('PGExec',data)
            then(null,data)
          }
          client.end();
        });
    });
}

async function ExecCommand(info,then){
    process.on('unhandledRejection',err => {
        then(err)
    });
    var client = InitClient(info.host,info.schema)
    var commands = info.cmd.split(' ')
    var type
    var sql = info.cmd.trim()
    var i = sql.indexOf(';')
    if(i!=-1){
        sql = sql.substring(0,i)
        logger.info('end sql ',i,sql)
    }
    if(sql == "show tables") 
    if(showTables){
        then(null,info,null)
    }else{
        showTables = true
        setTimeout(()=>{
            showTables = false 
        },1000)
    }
    var total
    var exec = true
    switch(commands[0].trim().toLowerCase()){
        case 'select':
            type = client.QueryTypes.SELECT;
            //统计一下返回的数据条数
            if(info.cmd.indexOf('limit')==-1){
                await client.query(count(info.cmd),{ type: type }).then(r1=>{
                    if(info.page> 50) info.page = 10
                    if(info.host.type == 'postgres'){
                        total =  parseInt(r1[0].count)
                        sql = sql + ' limit '+(info.page?info.page:10)+' offset '+(info.offset?info.offset:0)
                    }else{
                        sql = sql + ' limit '+(info.offset?info.offset:0)+','+(info.page?info.page:10)
                        total =  r1[0].COUNT
                    }
                    //logger.info('count',r1)
                    if(total>info.page){//没有分页的默认分页
                        exec = false;
                        client.query(sql,{ type: type }).then((r2=>{
                            //logger.info('R2',r2)
                            if(then)then(null,info,r2,total)
                        }))
                    }
                })
            }else{
                info.page = 1000
            }
            break;
        case 'update':
            type = client.QueryTypes.UPDATE;
            break;
        case 'delete':
            type = client.QueryTypes.DELETE;
            break;
        case 'insert':
            type = client.QueryTypes.INSERT;
            break;
        case 'show':
            if(info.host.type == 'postgres'){
                if(info.cmd == 'show tables'){
                    sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                } else {
                    //sql = 'select datname from pg_database';
                    //PG 绑定登陆的数据库
                    exec = false
                    if(then)then(null,info,[{'datname':info.host.dbname}],1)
                }
                type = client.QueryTypes.SELECT;
            }else{
                if(info.cmd == 'show tables'){
                    type = client.QueryTypes.SHOWTABLES;
                }else{
                    type = client.QueryTypes.SELECT;
                }
            }
            break;
        case 'create': //创建表
            type = client.QueryTypes.BULKUPDATE;
            break;
        case 'desc':
            var tableinfo = DBTablesMap.get(info.schema+commands[1])
            if(tableinfo){
                exec = false
                if(then)then(null,info,tableinfo,1)
            }
            if(info.host.type == 'postgres') {
                sql = "Select column_name,data_type,character_maximum_length from information_schema.columns where table_schema='public' and table_name='"+commands[1]+"';"
            }
        default:
            type = client.QueryTypes.SELECT;

    }
    if(exec)
    client.query(sql,{ type: type }).then((result=>{
        var pgs = new Array()
            if(commands[0] == 'desc'){ //保存表结构信息
                if(info.host.type == 'postgres'){
                    result.forEach((tb)=>{
                        pgs.push({'Field': tb.column_name })
                    })
                    logger.info(pgs)
                    DBTablesMap.set(info.schema+commands[1],pgs)
                }else{
                    DBTablesMap.set(info.schema+commands[1],result)
                }
            }
            if(info.host.type == 'postgres'){
                if(info.cmd == 'show tables'){
                    result.forEach((item)=>{ //返回用户表数据
                        pgs.push(item[0])
                    })
                }
                if(then)then(null,info,pgs,1)
            }else{
                if(then)then(null,info,result,1)
            }
    }))
}

exports.TestConnect = TestConnect;
exports.InitClient = InitClient;
exports.ExecCommand = ExecCommand;