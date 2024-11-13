import { Socket } from "socket.io";

const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const User = require('./models/UserModel')
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

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
})


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
})


io.on('connection', (socket:Socket) => {
  console.log('a user connected');
  
  socket.emit('connected', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});



server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});