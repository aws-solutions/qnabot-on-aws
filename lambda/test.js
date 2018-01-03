var _=require('lodash')
var fs=require('fs')

var ls=fs.readdirSync(__dirname)
module.exports=_.fromPairs(ls.filter(x=>x!=="test.js")
.map(x=>{
    console.log("Loading:"+x)
    return [x,require("./"+x+"/test")]
}))

