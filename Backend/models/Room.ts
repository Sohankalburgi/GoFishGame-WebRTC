import { Schema, model } from "mongoose";
import { User } from "../Manager/User";

interface Room {
    roomId : string,
    users : User[],
    playerDeck : any[],
    numberOfPlayers : number,
    turn : number
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
    numberOfPlayers : {
        type : Number,
    },
<<<<<<< HEAD

=======
    turn :{
        type : Number,
    }
>>>>>>> 4f08a23e505ea017fab11ebfd2df751a38d08101
});

const RoomModel = model<Room>('Room',RoomSchema);

module.exports = RoomModel;
