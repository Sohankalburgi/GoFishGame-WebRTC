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
    .connect("mongodb://localhost:27017/GoFish")
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
            socketId: socket.id
        });
        console.log("**********", room.users.length, room.numberOfPlayers);
        // if the users with length is 4 then start the Game.
        if (room.users.length <= room.numberOfPlayers) {
            io.to(roomId).emit("joined");
            // socket is created with the roomId 
            socket.join(roomId);
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
        const mainDeck = yield deckFunc.getDeck();
        console.log(mainDeck);
        // divide the stack/pile of cards to 4 players
        const playerDeck = [];
        let i = 0;
        let j = 0;
        while (i < room.numberOfPlayers) {
            playerDeck.push(mainDeck.slice(j, j + 5));
            j += 5;
            i++;
        }
        // save the playerDeck in the room model to store the card state of the each player
        room.playerDeck = playerDeck;
        yield room.save();
        // sending the info to the room players
        io.to(roomId).emit('startState', room);
    }));
    socket.on('onicecandidate', (data) => {
        console.log(data);
        io.to(data.roomId).emit('onicecandidate', data);
    });
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
