"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

//model import 
const User = require('./models/UserModel');
const UserDetail = require('./models/UserDetails');
const RoomModel = require('./models/Room');

//function import
const generateRoom = require('./funtions/RoomIDGenerator');
const deckFunc = require('./funtions/CardStackShuffler');
const app = express();
const server = createServer(app);
const io = new Server(server);
app.use(express.json());

mongoose
    .connect("mongodb://localhost:27017/GoFish")
    .then(() => {
    console.log("Mongo DB Connection is Established");
})
    .catch((error) => console.log(error));

app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "username and password client error" });
    }
    if (yield User.findOne({ username })) {
        return res.status(400).json({ error: "username already exist" });
    }
    const hashedPassword = yield bcrypt.hash(password, 14);
    const user = new User({ username, password: hashedPassword });
    yield user.save();
    return res.status(200).json({ message: "User created" });
}));

app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield User.findOne({ username });
    if (!user) {
        return res.status(400).json({ error: "user not found, Please Login" });
    }
    if (!(yield bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "password is wrong" });
    }
    return res.status(200).json({ message: "user authenticated" });
}));

app.post('/userdetails', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name, dateOfBirth } = req.body;
    const user = yield User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    const userDetail = new UserDetail({ userId, name, dateOfBirth });
    yield userDetail.save();
    return res.status(200).json({ message: "Successful" });
}));

app.post('/startGame', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // getting the user data
    const { userId, numberOfPlayers } = req.body;
    if (numberOfPlayers == 0) {
        return res.status(400).json({ error: "Players cannot be zero" });
    }
    // generating the random roomID
    const roomId = generateRoom.generateRoom(10);
    // rooms are generated and stored in the DB
    const room = new RoomModel({
        roomId,
        users: [],
        numberOfPlayers
    });
    yield room.save();
    return res.status(200).json({ message: roomId });
}));

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('connected', socket.id);
    // socket when join Room is made, it is given with the roomId
    socket.on('joinRoom', (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, userId }) {
        console.log("join Room is triggerd " + roomId + "and " + userId);
        const user = yield User.findById(userId);
        const room = yield RoomModel.findOne({ roomId });
        if (!room || !user) {
            console.log('either user or room is not found');
            return;
        }
        console.log(room.users);
        // Assign a unique client number based on the number of users in the room
        const clientNum = room.users.length + 1;

        room.users.push({
            userId,
            socketId: socket.id,
            playerNum : clientNum
        });
        // if the users with length is 4 then start the Game.
        if (room.users.length == room.numberOfPlayers ) {
            // socket is created with the roomId 
            //first client join room and then we send messages to clients in that room
            socket.join(roomId);
            //sending message to client in room 
            io.to(roomId).emit(`joined room with id ${roomId}`);
            
            // saving the socket id in the room database
            yield room.save();
            console.log(`user : ${userId} entered room : ${roomId}`);
        }
        else {
            // if the players exceed 4 then emit housefull
            socket.emit("housefull");
        }
    }));

    socket.on("startGame", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId }) {
        // getting the room 
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.log("the room is null");
            return;
        }
        // the stack of card is created (shuffled)
        const mainDeckCards = yield deckFunc.getDeck();
        console.log(mainDeck);
        // divide the stack/pile of cards to 4 players
        // slice operation only creates an additional sub array but do not modify subarray
        //so after putting the e;lements into player deck we want to remove those elements from main deck
        const playerDeck = [];
        let i = 0;
        let j = 0;
        while (i < room.numberOfPlayers) {
            playerCards = mainDeck.splice(j, 5);
            playerDeck.push(playerCards);
            j += 5;
            i++; 
        }
        // save the playerDeck in the room model to store the card state of the each player
        room.playerDeck = playerDeck;
        room.mainDeck = mainDeckCards;
        yield room.save();
        socket.emit('startState', room);
    }));
    //event -> gamePlay involves the game 
    //data => contains card selected by the user and the player from whom he/ she want to fish the cards from
    socket.on('gamePlay', (data) =>{
        //extract the data
        // selectPlayer => select the player from whom the cards have to be fished
        // playerNum => contains the number assigned to current player
        const { cardName, selectPlayer, playerNum } = data;
        let currCard = cardName.toUpperCase();
        if(playerNum == selectPlayer){
            //here we are sending to client that action cannot be performed
            socket.emit('actionAcknowledged', {
                success: false,
                message: 'you cannot fish the cards from your own deck'
            });
            return; // Don't proceed further if the data is invalid
        }
        //retrieved the deck of cards of the selected user
        let selectPlayerDeck = RoomModel.playerDeck[selectPlayer - 1];
        //find the number of elements in selected deck that 
        // corresponds to card asked by user
        let count = selectPlayerDeck.filter(card => card == currCard).length;
        if(count == 0){
            //the selected user doesn't have the card the curr player asked for
            //so retrieve the card from maindeck and put it to selectPlayerDeck
            if(mainDeck.length > 0){
                let cardFromMainDeck = mainDeck[mainDeck.length - 1];
                if(cardFromMainDeck != currCard){
                    selectPlayerDeck.push(cardFromMainDeck);
                    mainDeck.pop();
                }
                else{
                    while(cardFromMainDeck == currCard){
                        selectPlayerDeck.push(cardFromMainDeck);
                        mainDeck.pop();
                        if(mainDeck.length > 0){
                            cardFromMainDeck = mainDeck[mainDeck.length - 1];
                        } else {
                            // End the loop if no cards are left in mainDeck
                            break;
                        }
                    }
                }
            }
            else{
                //if main deck is zero then the game ends that logic 
                //has to be figured out
            }
            
            
        }  

    })
    socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('user disconnected');
        const rooms = yield RoomModel.find({ "users.socketId": socket.id });
        rooms.forEach((room) => __awaiter(void 0, void 0, void 0, function* () {
            room.users = room.users.filter((x) => x.socketId != socket.id);
            yield room.save();
        }));
    }));
});
server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
