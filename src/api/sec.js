const crypto = require('crypto')
let aesecb = 'aes-128-ecb'
let encode = 'uth-8'

function MD5(data) {
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase()
}

function SHA256(data) {
    return crypto.createHash('sha256').update(data).digest('hex').toLowerCase()
}



export{
    MD5,
    SHA256,
}