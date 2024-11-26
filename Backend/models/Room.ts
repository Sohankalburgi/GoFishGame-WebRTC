import { Schema, model } from "mongoose";
import { User } from "../Manager/User";

interface Room {
    roomId : string,
    users : User[],
}

const RoomSchema = new Schema<Room>({
    roomId : {
        type : String,
        require : true,
    },
    users : {
        type : [],
    }
});

const RoomModel = model<Room>('Room',RoomSchema);

module.exports = RoomModel;
