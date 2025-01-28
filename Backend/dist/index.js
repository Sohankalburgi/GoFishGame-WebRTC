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
let player = 0;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
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
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});
app.use(cors());
app.use(express.json());
mongoose
    .connect("mongodb+srv://sohankalburgi2:pkKkkqnvo0I4MxQh@cluster0.bppet.mongodb.net/GoFish")
    .then(() => {
    console.log("Mongo DB Connection is Established");
})
    .catch((error) => console.log(error));
app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "username and password client error" });
    }
    if (yield User.findOne({ username })) {
        return res.status(400).json({ success: false, message: "username already exist" });
    }
    const hashedPassword = yield bcrypt.hash(password, 14);
    const user = new User({ username, password: hashedPassword });
    yield user.save();
    return res.status(200).json({ success: true, message: "User created" });
}));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield User.findOne({ username });
    if (!user) {
        return res.status(400).json({ success: false, message: "user not found, Please Login" });
    }
    if (!(yield bcrypt.compare(password, user.password))) {
        return res.status(400).json({ success: false, message: "password is wrong" });
    }
    return res.status(200).json({ success: true, message: "user authenticated", token: user._id });
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
        return res.status(400).json({ success: false, message: "Players cannot be zero" });
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
    return res.status(200).json({ success: true, message: roomId });
}));
app.post('/joinRoom', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.body;
    const room = yield RoomModel.findOne({ roomId });
    if (!room) {
        return res.status(400).json({ success: false, message: "Room not found" });
    }
    else {
        return res.status(200).json({ success: true, message: "Room found entering to room" });
    }
}));
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('connected', socket.id);
    // socket when join Room is made, it is given with the roomId
    socket.on('joinRoom', (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, userId }) {
        console.log("join Room is triggerd " + roomId + "and " + userId);
        const user = yield User.findById({ _id: userId });
        const room = yield RoomModel.findOne({ roomId });
        if (!room || !user) {
            console.log('either user or room is not found');
            return;
        }
        console.log(room.users);
        // saving the socket Id instead of socket
        room.users.push({
            userId,
            socketId: socket.id,
        });
        console.log("**********", room.users.length, room.numberOfPlayers);
        // if the users with length is 4 then start the Game.
        if (room.users.length <= room.numberOfPlayers) {
            // socket is created with the roomId 
            socket.join(roomId);
            // saving the socket id in the room database
            yield room.save();
            console.log(`user : ${userId} entered room : ${roomId}`);
            socket.emit("joined", userId);
            socket.broadcast.to(roomId).emit("user-joined", userId);
        }
        else {
            // if the players exceed 4 then emit housefull
            socket.emit("housefull");
        }
    }));
    socket.on("startGame", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, userId }) {
        // getting the room 
        console.log("the start Game is triggered with room", roomId);
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.log("the room is null");
            return;
        }
        // the stack of card is created (shuffled)
        const mainDeck = yield deckFunc.getDeck();
        console.log(mainDeck);
        // divide the stack/pile of cards to 4 players
        const playerDeckArray = [];
        let i = 0;
        let j = 0;
        while (i < room.numberOfPlayers) {
            playerDeckArray.push(mainDeck.slice(j, j + 5));
            j += 5;
            i++;
        }
        i = 0;
        while (i < room.numberOfPlayers) {
            room.playerDeck.push({ userId: room.users[i].userId, deck: playerDeckArray[i] });
            i++;
        }
        //remove first 10 elements from main Deck
        mainDeck.splice(0, room.numberOfPlayers * 5);
        // save the playerDeck in the room model to store the card state of the each player
        room.mainDeck = mainDeck;
        room.currentUser = userId;
        const setArray = [];
        room.users.forEach((user) => {
            setArray.push({
                userId: user.userId,
                count: 0
            });
        });
        console.log("playerDeck", room.playerDeck);
        console.log(mainDeck);
        room.set = setArray;
        yield room.save();
        // sending the info to the room players
        room.users.forEach((user) => {
            io.to(user.socketId).emit('StartState', { room });
        });
    }));
    socket.on("add-ice-candidate", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, type, candidate }) {
        const room = yield RoomModel.findOne({ roomId });
        const senderSocketid = socket.id;
        const receivingUser = room.users.find((user) => user.socketId !== senderSocketid);
        io.to(receivingUser.socketId).emit('add-ice-candidate', ({ candidate, type }));
    }));
    // write the gameplay logic below to this ask
    socket.on('ask', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { cardName, roomId, userId } = data;
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.error("Room not found");
            return;
        }
        const ReceiverUser = room.users.find((user) => user.userId !== userId);
        const ReceiverDeck = room.playerDeck.find((deck) => deck.userId === ReceiverUser.userId).deck;
        const countCard = ReceiverDeck.filter((card) => card.charAt(1) === cardName.charAt(1)).length;
        room.askUser = ReceiverUser.userId;
        yield room.save();
        if (countCard === 0) {
            io.to(ReceiverUser.socketId).emit('card-not-present', { cardName, room });
        }
        else if (countCard > 0) {
            io.to(ReceiverUser.socketId).emit('card-present', { cardName, room });
        }
        // emit if there is card exist => card-present
        // else emit => card-not-present
        // change the currentUser to the nextUser
        // change the askUser to the nextUser from null
    }));
    socket.on('fish', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomId, cardName, userId } = data;
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.error("Room not found");
            return;
        }
        const ReceiverUser = room.users.find((user) => user.userId !== userId);
        room.askUser = null;
        yield room.save();
        io.to(ReceiverUser.socketId).emit('fish', { room, cardName });
    }));
    socket.on('save-draw-card', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomId, userId } = data;
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.error("Room not found");
            return;
        }
        const nextUser = room.users.find((user) => user.userId !== userId);
        const currentUser = room.users.find((user) => user.userId === userId);
        const popCard = room.mainDeck.pop();
        const reciverDeckIndex = room.playerDeck.findIndex((user) => user.userId === userId);
        const updateRoom = yield RoomModel.findOneAndUpdate({ roomId }, {
            $set: { currentUser: nextUser.userId },
            $push: { [`playerDeck.${reciverDeckIndex}.deck`]: popCard },
            $pop: { mainDeck: 1 }
        }, { new: true } // To return the updated document
        );
        io.to(nextUser.socketId).emit('saved-draw-card', { room: updateRoom });
        io.to(currentUser.socketId).emit('saved-draw-card', { room: updateRoom });
    }));
    socket.on('send-card', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomId, cardName, userId } = data;
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.error("Room not found");
            return;
        }
        const senderUser = room.users.find((user) => user.userId === userId);
        const receivingUser = room.users.find((user) => user.userId !== userId);
        let senderDeck = room.playerDeck.find((user) => user.userId === userId).deck;
        const CardReceived = senderDeck.filter((card) => card.charAt(1) === cardName.charAt(1));
        senderDeck = senderDeck.filter((card) => !CardReceived.includes(card));
        const senderDeckIndex = room.playerDeck.findIndex((user) => user.userId === userId);
        const receiverDeckIndex = room.playerDeck.findIndex((user) => user.userId !== userId);
        // let receiverDeck =  room.playerDeck.find((user:any)=>user.userId === receivingUser.userId).deck;
        // receiverDeck.push(CardReceived);
        // room.playerDeck.find((user:any)=> user.userId !== userId).deck = receiverDeck; 
        // senderDeck = senderDeck.filter((card:string)=> !CardReceived.includes(card));
        // room.playerDeck.find((user:any)=> user.userId === userId).deck = senderDeck;
        // room.askUser = null;
        // room.currentUser = receivingUser.userId;
        const updatedRoom = yield RoomModel.findOneAndUpdate({ roomId }, {
            $set: { askUser: null, currentUser: receivingUser.userId, [`playerDeck.${senderDeckIndex}.deck`]: senderDeck },
            $push: { [`playerDeck.${receiverDeckIndex}.deck`]: { $each: CardReceived } },
        }, { new: true });
        room.users.forEach((user) => {
            io.to(user.socketId).emit('send-card', { room: updatedRoom });
        });
    }));
    socket.on('set', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, checkDeck, roomId } = data;
        console.log(userId, checkDeck, roomId);
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.error("Room not found");
            return;
        }
        const currentCount = room.set.findIndex((user) => user.userId === userId);
        const playerDeckIndex = room.playerDeck.findIndex((user) => user.userId === userId);
        const playerDeck = room.playerDeck[playerDeckIndex].deck.filter((card) => !checkDeck.includes(card));
        const updatedRoom = yield RoomModel.findOneAndUpdate({ roomId, "set.userId": userId }, {
            $set: { [`playerDeck.${playerDeckIndex}.deck`]: playerDeck,
            },
            $inc: {
                "set.$.count": 1
            }
        }, { new: true });
        room.users.forEach((user) => {
            io.to(user.socketId).emit('set', { room: updatedRoom });
        });
    }));
    socket.on('end-game', (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId }) {
        const room = yield RoomModel.findOne({ roomId });
        if (!room) {
            console.error("Room not found");
            return;
        }
        let maxCountUserId = null;
        let max = 0;
        room.set.forEach((user) => {
            if (max < user.count) {
                max = user.count;
                maxCountUserId = user.userId;
            }
        });
        const winnerUser = room.users.find((user) => user.userId === maxCountUserId);
        const loserUser = room.users.find((user) => user.userId !== maxCountUserId);
        io.to(winnerUser.socketId).emit('You-Won');
        io.to(loserUser.socketId).emit('You-Lost');
    }));
    // socket.on("gamePlay", async (data: GamePlayData) => {
    //   const { cardName, roomId, userId } = data;
    //   const currCard = cardName.toUpperCase();
    //   // Retrieve the room and validate
    //   const room = await RoomModel.findOne({ roomId });
    //   if (!room) {
    //     console.error("Room not found");
    //     return;
    //   }
    //   //get the user based on userId
    //   const user = room.users.find((users: userSchema) => users.userId === userId);
    //   // if (playerNumber === selectPlayer) {
    //   //   // Inform the client that the action is invalid
    //   //   console.log("You cannot fish cards from your own deck");
    //   //   socket.emit("actionAcknowledged", {
    //   //     success: false,
    //   //     message: "You cannot fish the cards from your own deck",
    //   //   });
    //   //   return; // Stop processing furtherroom
    //   // }
    //   // console.log("The player currently active is: ", playerNumber);
    //   //A player cannot ask for a card if he doesnt have it
    //   const currPlayer = room.playerDeck.find((player : any) => player.userId === userId);
    //   const currPlayerDeck = currPlayer.deck;
    //   console.log(currPlayerDeck);
    //   if (!(currPlayerDeck.includes(currCard))) {
    //     console.log("you cannot ask for cards which you dont have")
    //   }
    //   // Retrieve the selected player's deck
    //   const selectPlayerDeck = room.playerDeck[selectPlayer - 1] as string[];
    //   const count = selectPlayerDeck.filter((card) => card === currCard).length;
    //   if (count === 0) {
    //     // If the selected player doesn't have the card, use the main deck
    //     if (room.mainDeck.length > 0) {
    //       let cardFromMainDeck = room.mainDeck[room.mainDeck.length - 1];
    //       if (cardFromMainDeck !== currCard) {
    //         selectPlayerDeck.push(cardFromMainDeck);
    //         room.mainDeck.pop(); // Remove the card from the main deck
    //         room.playerDeck[selectPlayer - 1] = selectPlayerDeck;
    //         // Save the room state
    //         await room.save();
    //       } else {
    //         while (cardFromMainDeck === currCard) {
    //           selectPlayerDeck.push(cardFromMainDeck);
    //           room.mainDeck.pop();
    //           if (room.mainDeck.length > 0) {
    //             cardFromMainDeck = room.mainDeck[room.mainDeck.length - 1];
    //           } else {
    //             socket.to(room).emit("Game ended wait for results");
    //             break; // Exit the loop if no cards are left in the main deck
    //           }
    //         }
    //         room.playerDeck[selectPlayer - 1] = selectPlayerDeck;
    //         // Save the room state
    //         await room.save();
    //       }
    //     } else {
    //       // Handle the case where the main deck is empty
    //       socket.to(room).emit("Game ended wait for results");
    //       console.log("Main deck is empty, game logic for ending required.");
    //     }
    //   }
    // });
    socket.on('offer', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomId, offer } = data;
        const room = yield RoomModel.findOne({ roomId });
        const user = room.users.find((userAgent) => userAgent.socketId !== socket.id);
        io.to(user.socketId).emit('offer', { offer, roomId });
    }));
    socket.on('answer', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomId, answer } = data;
        const room = yield RoomModel.findOne({ roomId });
        const currentSocketId = socket.id;
        const user = room.users.find((userAgent) => {
            return userAgent.socketId !== currentSocketId;
        });
        io.to(user.socketId).emit("answer", { answer, roomId });
    }));
    socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('user disconnected');
        const rooms = yield RoomModel.find({ "users.socketId": socket.id });
        rooms.forEach((room) => __awaiter(void 0, void 0, void 0, function* () {
            room.users = room.users.filter((x) => x.socketId != socket.id);
            yield room.save();
        }));
    }));
});
const HOST = "0.0.0.0";
server.listen(3000, HOST, () => {
    console.log('server running at http://localhost:3000');
});
