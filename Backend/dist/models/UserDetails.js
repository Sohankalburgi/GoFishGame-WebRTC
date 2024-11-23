"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose = require("mongoose");
const UserDetailsSchema = mongoose.Schema({
    userId: {
        type: mongoose_1.SchemaTypes.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        require: true
    },
    dateOfBirth: {
        type: Date,
        require: true
    }
});
const UserDetail = new mongoose.model('UserDetail', UserDetailsSchema);
module.exports = UserDetail;
