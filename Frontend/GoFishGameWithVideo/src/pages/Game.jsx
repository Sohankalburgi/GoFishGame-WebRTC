import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router';

import { io } from "socket.io-client"



export const Game = () => {
  const {roomId} = useParams();
  const [socket, setSocket] = useState(null);
  const [stream,setStream] = useState(null);
  const remoteVideoRef = useRef({});
  const localVideoRef = useRef();
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(()=>{
    const URL = 'http://localhost:3000';
    const socket = io(URL);
    socket.on('connected',()=>{
      console.log('Connected to server');
    })
    // setting up the local video stream
    navigator.mediaDevices.getUserMedia({video:true,audio:true}).then((stream)=>{
      localVideoRef.current.srcObject = stream;
      setStream(stream);
    }).catch((err) => console.error("Error accessing media devices:", err));


    const userId = localStorage.getItem('token');

    socket.emit('joinRoom',({roomId,userId}),()=>{
      console.log('joinRoom room');
    });
    socket.on('housefull',()=>{
      console.log("housefull");
    })

    // creating the peer connection 
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Public STUN server
      ],
    });
    setPeerConnection(pc);

    // adding the local stream to the peer connection
    stream?.getTracks().forEach((track) => pc.addTrack(track, stream));
    console.log(pc);
    
    // listening for ice candidates for the ip address of the peer
    pc.onicecandidate = (event) => {
      console.log(event.candidate)
      if (event.candidate) {
        socket.current.emit("onicecandidate", {roomId:"uCNJyexb]S", ice: event.candidate });
      }
    };


    setSocket(socket);
  },[])

  return (
    <div className='text-4xl'>Game {roomId}
    <video ref={localVideoRef} width={500} autoPlay height={500}></video>
    </div>
  )
}
