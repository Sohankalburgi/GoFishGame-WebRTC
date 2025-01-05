import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { io } from "socket.io-client";
import ReactPlayer from 'react-player'
export const Game = () => {
  const { roomId, userId } = useParams();
  const socket = useRef(null);
  const streamRef = useRef(null);
  const localVideoRef = useRef();
  const peerConnections = useRef(new Map());
  const remoteVideosRef = useRef(new Map()); // To manage remote video elements
  const remoteDomRef = useRef(null);

  const createPeerConnection = (userId, CurrentSocketId) => {
    const pc = new RTCPeerConnection({
 
    });
    console.log("userId in the peer connection", userId);

    // Setup track listener for each peer
    pc.ontrack = (event) => {
      const remoteStream = new MediaStream(event.streams[0]);
      const remoteVideo = document.createElement('video');
      console.log("ontrack triggered for userId:", userId);
      remoteVideo.srcObject = remoteStream;
      remoteVideo.autoplay = true; // Start playing automatically
      remoteVideo.muted = true; // Mute the remote video (optional)
      remoteVideosRef.current.set(userId, remoteVideo);
      remoteDomRef.current.appendChild(remoteVideo);
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        socket.current.emit("add-ice-candidate", {
          roomId,
          targetUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log("on negotiation needed ,sending offer");
      const offer = pc.localDescription;
      socket.emit("send-offer", {
        roomId, offer, userId, CurrentSocketId
      });
    }

    peerConnections.current.set(userId, pc);
    console.log("the peer connections on set Create", peerConnections.current);
    return pc;
  };

  useEffect(() => {
    const URL = "http://localhost:3000";
    socket.current = io(URL);
    console.log(userId);

    socket.current.on("connected", () => {
      console.log("Connected to server");
    });

    socket.current.on("joined", (userId) => {
      console.log(`user joined with the id : ${userId}`)
    })

    // Setting up the local video stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        streamRef.current = stream;
        // After getting local media stream, join the room
        socket.current.emit("joinRoom", { roomId, userId });
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    socket.current.on("user-joined", async (userId) => {
      console.log(`${userId} joined the room`);
      // Create a peer connection for this new user
      const pc = createPeerConnection(userId);
      console.log("the returned pc", pc)
      streamRef.current?.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));

      // Wait for ICE candidates from this new peer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Offer created", pc);

      const CurrentSocketId = socket.current.id;
      console.log("current socket id", CurrentSocketId);
      // Send the offer to the new user
      socket.current.emit("send-offer", { roomId, offer, userId, CurrentSocketId });
    });

    socket.current.on("offer", async (offer, userId, CurrentSocketId) => {
      console.log("Received offer from", CurrentSocketId);
      // Create peer connection for this sender
      const pc = createPeerConnection(userId, CurrentSocketId);
      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer back to the sender
      socket.current.emit("answer", { roomId, answer, userId, CurrentSocketId });
    });

    socket.current.on("answer", async (answer, userId) => {
      console.log("Received answer from", userId);
      const pc = peerConnections.current.get(userId);
      console.log(pc);


      await pc.setRemoteDescription(answer);

    });

    socket.current.on("add-ice-candidate", async (userId, ice) => {
      console.log("Received ICE candidate from", userId);
      const pc = peerConnections.current.get(userId);
      if (pc) {
        await pc.addIceCandidate(ice);
      }
    });

    socket.current.on("housefull", () => {
      console.log("The room is full");
      return;
    });

    return () => {
      peerConnections.current.forEach((pc) => pc.close());
      socket.current?.disconnect();
    };
  }, []);

  return (
    <div className="text-4xl">
      Game {roomId}
      <video ref={localVideoRef} width={500} autoPlay height={500} muted />
      <div ref={remoteDomRef}></div>
    </div>
  );
};
