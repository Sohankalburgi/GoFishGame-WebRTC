import { Socket } from "socket.io";

export interface User{
    userId : string,
    name : string,
    socket : Socket
}
