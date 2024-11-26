"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserDetailsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        require: true
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
const UserDetail = (0, mongoose_1.model)('UserDetail', UserDetailsSchema);
module.exports = UserDetail;
