import { SchemaType, SchemaTypes } from "mongoose";

const mongoose = require("mongoose");


const UserDetailsSchema = mongoose.Schema({
    userId : {
        type : SchemaTypes.ObjectId,
        ref : 'User'
    },
    name : {
        type : String,
        require : true
    },
    dateOfBirth : {
        type : Date,
        require : true
    }
})

const UserDetail = new mongoose.model('UserDetail',UserDetailsSchema);

module.exports = UserDetail;