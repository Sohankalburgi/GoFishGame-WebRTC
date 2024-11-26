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
    const { userId } = req.body;
    // generating the random roomID
    const roomId = generateRoom.generateRoom(10);
    // rooms are generated and stored in the DB
    const room = new RoomModel({
        roomId,
        users: []
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
        const userDetails = yield UserDetail.findOne({ userId });
        const room = yield RoomModel.findOne({ roomId });
        if (!room || !userDetails) {
            console.log('either user or room is not found');
            return;
        }
        console.log(room.users);
        // saving the socket Id instead of socket
        room.users.push({
            userId,
            socketId: socket.id
        });
        // saving the socket id in the room database
        yield room.save();
        console.log(`user : ${userId} entered room : ${roomId}`);
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
server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
