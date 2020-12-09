// let fs = require('fs')
// let ftp = require('ftp')
// const dns = require('dns');
// const dgram = require('dgram');
// var Redis = require('ioredis');
// //10.9.41.244:6379,10.9.41.245:6379,10.9.41.245:6380,10.9.41.244:6380
// var cluster = new Redis.Cluster(
//     [
//     {
//       port: 6379,
//       host: '10.9.41.244'
//     },
//     {
//       port: 6379,
//       host: '10.9.41.245'
//     },
//     {
//       port: 6380,
//       host: '10.9.41.244'
//     },
//     {
//       port: 6380,
//       host: '10.9.41.245'
//     }
//     ]);

// const net = require('net');
// const server = net.createServer();
// const clients = {};//保存客户端的连接
// var client = null;//当前客户连接
// var uid = 0;
// server.on('connection',(socket)=>{
//     //启动心跳机制
//     var isOnline = !0;
//     var keepAliveTimer = socket.timer = setInterval(()=>{
//         if(!isOnline){
//             client = socket;
//             quit(socket.nick);
//             return;
//         }
//         if(socket.writable){
//             isOnline = !1;
//             socket.write('::');
//         }else{
//             client = socket;
//             quit(socket.nick);
//         }
//     },3000);
//     socket.on('end',()=>{
//         console.log(`client disconnected.\n\r`);
//         socket.destroy();
//     });
//     socket.on('error',(error)=>{
//         console.log(error.message);
//     });
//     socket.on('data',(chunk)=>{
//         client = socket;
//         var msg = JSON.parse(chunk.toString());
//         if(msg.cmd=='keep'){
//             isOnline = !0;
//             return;
//         }
//         dealMsg(msg);
//     });
// });
// server.on('error',(err)=>{
//     console.log(err);
// });
// server.on('listening',()=>{
//     console.log(`listening on ${server.address().address}:${server.address().port}\n\r`);
// });
// server.listen(8060);//启动监听
// /**
//  * 处理用户信息
//  */
// function dealMsg(msg){
//     const cmd = msg.cmd;
//     const funs = {
//         'login':login,
//         'chat':chat,
//         'quit':quit,
//         'exit':quit
//     };
//     if(typeof funs[cmd] !== 'function') return !1;
//     funs[cmd](msg);
// }
// /**
//  * 释放连接资源
//  */
// function freeConn(conn){
//     conn.end();
//     delete clients[conn.uuid];
//     conn.timer&&clearInterval(conn.timer);
// }
// /**
//  * 用户首次进入聊天室
//  */
// function login(msg){
//     var uuid = '';
//     uuid = getRndStr(15)+(++uid);//产生用户ID
//     client.write(`欢迎你，${msg.nick}：这里总共有${Object.keys(clients).length}个小伙伴在聊天.\r\n`)
//     client.nick = msg.nick;
//     client.uuid = uuid;
//     clients[uuid] = client;
//     broadcast(`系统：${msg.nick}进入了聊天室.`);

// }
// /**
//  * 广播消息
//  */
// function broadcast(msg){
//     Object.keys(clients).forEach((uuid)=>{
//         if((clients[uuid]!=client)& clients[uuid].writable){
//             clients[uuid].write(msg);
//         }
//     });
// }
// /**
//  * 退出聊天室
//  */
// function quit(nick){
//     var message = `小伙伴${nick}退出了聊天室.`;
//     broadcast(message);
//     freeConn(client);
// }

// function chat(msg){
//     if(msg.msg.toLowerCase()=='quit'||msg.msg.toLowerCase()=='exit'){
//         quit(msg.nick);
//         return ;
//     }
//     var message = `${msg.nick}说：${msg.msg}`;
//     broadcast(message);
// }   
// /**
//  * 随机指定长度(len)的字符串
//  */
// function getRndStr(len=1){
//     var rndStr = '';
//     for (; rndStr.length < len; rndStr += Math.random().toString(36).substr(2));
//     return rndStr.substr(0, len);
// }



export const testRedis = () => {
  // console.log()
  // dns.lookup('www.baidu.com', (err, address, family) => {
  //   console.log('address: %j family: IPv%s', address, family);
  // });
//   const crypto = require('crypto');
// const secret = 'abcdefg';
// const hash = crypto.createHmac('sha256', secret)
//                    .update('I love cupcakes')
//                    .digest('hex');
// console.log(hash);
  // cluster.set("foo", "bar");
  // cluster.get("foo", (err, res) => {
  //   // res === 'bar'
  //   console.log(res)
  //   consile.log(err)
  // });

// //创建dgram.Sockrt的新实例，不使用new
// const server = dgram.createSocket('udp4');

// //error发生错误时触发
// server.on('error', (err) => {
//   console.log(`服务器异常：\n${err.stack}`);
//   //关闭一个socket之后触发，一旦触发，则这个socket上将不会触发新的message事件。
//   server.close();
// });
// //当有新的数据包被socket接收时，message事件会被触发
// server.on('message', (msg, rinfo) => {
//   console.log(`服务器接收到来自 ${rinfo.address}:${rinfo.port} 的 ${msg}`);
// });

// //开始监听数据包信息时触发
// server.on('listening', () => {
//   const address = server.address();
//   console.log(`服务器监听 ${address.address}:${address.port}`);
// });

// server.bind(41234);
// // 服务器监听 0.0.0.0:41234
}