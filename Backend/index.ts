import { Socket } from "socket.io";

const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');


//model import 
const User = require('./models/UserModel');
const UserDetail = require('./models/UserDetails');
const RoomModel = require('./models/Room');

//function import
const generateRoom = require('./funtions/RoomIDGenerator')

const app = express();
const server = createServer(app);
const io = new Server(server);



app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/GoFish")
  .then(() => {
    console.log("Mongo DB Connection is Established");
  })
  .catch((error:any) => console.log(error));

app.post('/register',async (req:any,res:any)=>{
  const {username, password} = req.body;

  if(!username || !password){
    return res.status(400).json({ error: "username and password client error" });
  }

  if(await  User.findOne({username})){
    return res.status(400).json({ error: "username already exist" });
  }

  const hashedPassword:string =  await bcrypt.hash(password,14);

  const user = new User({username,password :hashedPassword});
  await user.save();

  return res.status(200).json({message : "User created"})
});


app.post('/login', async(req:any, res:any)=>{
  const {username,password} = req.body;

  const user = await User.findOne({username});
  if(!user){
    return res.status(400).json({error:"user not found, Please Login"});
  }

  if(!await bcrypt.compare(password,user.password)){
    return res.status(400).json({error : "password is wrong"});
  }
  return res.status(200).json({message : "user authenticated"});
});


app.post('/userdetails',async(req : any,res : any)=>{
  const { userId,name,dateOfBirth } = req.body;
  
  const user = await User.findById(userId);

  if(!user){
    return res.status(404).json({error:"User not found"});
  }

  const userDetail = new UserDetail({ userId, name, dateOfBirth });
  await userDetail.save();
  return res.status(200).json({message:"Successful"});

});

app.post('/startGame',async(req : any,res : any)=>{
  // getting the user data
  const { userId } = req.body;
  
  // generating the random roomID
  const roomId = generateRoom.generateRoom(10);

  // rooms are generated and stored in the DB
  const room = new RoomModel({
    roomId,
    users : []
  })

  await room.save();

  return res.status(200).json({message : roomId});

})



io.on('connection', (socket:Socket) => {
  console.log('a user connected');
  
  socket.emit('connected', socket.id);


  // socket when join Room is made, it is given with the roomId
  socket.on('joinRoom',async ({roomId, userId})=>{
    
    console.log("join Room is triggerd "+ roomId + "and "+ userId);
    const userDetails = await UserDetail.findOne({userId});
    
    const room = await RoomModel.findOne({roomId});

    
    if(!room || !userDetails){
      console.log('either user or room is not found');
      return;
    }

    console.log(room.users)

    // saving the socket Id instead of socket
    room.users.push({
      userId,
      socketId:socket.id
    });

    // saving the socket id in the room database
    await room.save();
    console.log(`user : ${userId} entered room : ${roomId}`);
    
  })

  socket.on('disconnect', async () => {
    console.log('user disconnected');
    const rooms = await RoomModel.find({"users.socketId":socket.id});
    rooms.forEach(async (room:any)=>{
      room.users = room.users.filter((x :any)=> x.socketId!=socket.id)
      await room.save();
    })
  });
});



server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});