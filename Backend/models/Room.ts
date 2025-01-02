import { Schema, model } from "mongoose";
import { User } from "../Manager/User";

interface Room {
    roomId : string,
    users : User[],
    playerDeck : any[],

    mainDeck : any[],
    numberOfPlayers : number
}

const RoomSchema = new Schema<Room>({
    roomId : {
        type : String,
        require : true,
    },
    users : {
        type : [],
    },
    playerDeck : {
        type : [],
    },
    mainDeck : {
        type : [],
    },
    numberOfPlayers : {
        type : Number,
    },
});

const RoomModel = model<Room>('Room',RoomSchema);

module.exports = RoomModel;
