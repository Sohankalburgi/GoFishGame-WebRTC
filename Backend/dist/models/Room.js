"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RoomSchema = new mongoose_1.Schema({
    roomId: {
        type: String,
        require: true,
    },
    users: {
        type: [],
    }
});
const RoomModel = (0, mongoose_1.model)('Room', RoomSchema);
module.exports = RoomModel;
