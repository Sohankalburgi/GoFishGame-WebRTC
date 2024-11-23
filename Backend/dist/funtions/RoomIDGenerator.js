"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoom = generateRoom;
function generateRoom(len) {
    let roomId = "";
    for (let i = 0; i < len; i++) {
        roomId = roomId.concat(String.fromCharCode(Math.floor(Math.random() * (122 - 65 + 1)) + 65));
    }
    console.log(roomId);
    return roomId;
}
