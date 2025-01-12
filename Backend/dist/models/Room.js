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
    },
    playerDeck: {
        type: [],
    },
    mainDeck: {
        type: [],
    },
    numberOfPlayers: {
        type: Number,
    },
    set: {
        type: [],
    },
    currentUser: {
        type: String,
    },
    askUser: {
        type: String,
        default: null,
    }
});
const RoomModel = (0, mongoose_1.model)('Room', RoomSchema);
module.exports = RoomModel;
