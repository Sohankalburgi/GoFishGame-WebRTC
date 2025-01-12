import { Schema, model } from "mongoose";
import { User } from "../Manager/User";

interface playerDeck {
    userId : string;
    deck : any[];
}
interface cardSet{
    userId : string,
    count: number,
}


interface Room {
    roomId : string;
    users : User[];
    playerDeck : playerDeck[];
    mainDeck : any[];
    numberOfPlayers : number;
    set : cardSet[];
    currentUser : string;
    askUser : null | string;
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
    set:{
        type : [],
    },
    currentUser :{
        type : String,
    },
    askUser :{
        type : String,
        default : null,
    }
});

const RoomModel = model<Room>('Room',RoomSchema);

module.exports = RoomModel;

