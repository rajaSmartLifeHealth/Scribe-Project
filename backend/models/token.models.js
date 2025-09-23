const mongoose = require('mongoose')

const blackSchema = new mongoose.Schema({
    blackToken:{
        type:String,
        required:true
    }

},{
    versionKey:false
})


const BlackTokenModel = mongoose.model('BlackToken',blackSchema)

module.exports ={
    BlackTokenModel
}