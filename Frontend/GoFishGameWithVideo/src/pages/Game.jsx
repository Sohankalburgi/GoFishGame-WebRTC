import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { io } from "socket.io-client";

export const Game = () => {
  const { roomId, userId } = useParams();
  const localVideoTrack = useRef(null);
  const localAudioTrack = useRef(null);
  const socket = useRef(null);
  const [stream, setStream] = useState(null);
  const localVideoRef = useRef();
  const peerConnections = useRef(new Map());
  const remoteVideosRef = useRef(new Map()); // To manage remote video elements
  const remoteDomRef = useRef(null);

  const createPeerConnection = async(targetUserId) => {
    const pc = new RTCPeerConnection();
    console.log("userId in the peer connection", targetUserId);

   
   
    // Setup track listener for each peer
    pc.ontrack = (event) => {
      console.log("on track", targetUserId);
      // if (event.streams.length === 0) {
      //   console.log("No media stream received from the peer");
      //   return; // Early exit if no streams are available
      // } else {
      //   const remoteStream = new MediaStream(event.streams[0]);
      //   console.log("remtoe statrer", remoteStream);
      //   const remoteVideo = document.createElement('video');
      //   remoteVideo.id = targetUserId;
      //   console.log("ontrack triggered for userId:", targetUserId);
      //   remoteVideo.srcObject = remoteStream;
      //   remoteVideo.autoplay = true; // Start playing automatically
      //   remoteVideo.muted = true; // Mute the remote video (optional)
      //   remoteVideosRef.current.set(targetUserId, remoteVideo);
      //   remoteDomRef.current.appendChild(remoteVideo);
      // }

    };

    setTimeout(async () => {
      let track1 = null;
      let track2 = null;
      if (pc.getTransceivers()[0]) {
        track1 = await pc.getTransceivers()[0].receiver.track;
      }
      if (pc.getTransceivers()[1]) {
        track2 = await pc.getTransceivers()[1].receiver.track;
      }

      if (track1 && track2) {
        const remoteStream = new MediaStream();
        remoteStream.addTrack(track1);
        remoteStream.addTrack(track2);

        const remoteVideo = document.createElement('video');
        remoteVideo.id = targetUserId;
        remoteVideo.srcObject = remoteStream;
        remoteVideo.autoplay = true;
        remoteVideosRef.current.set(targetUserId, remoteVideo);
        remoteDomRef.current.appendChild(remoteVideo);
      } else {
        console.error("Failed to retrieve tracks.");
      }
    }, 200);


    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("add-ice-candidate", {
          roomId,
          targetUserId,
          candidate: event.candidate,
        });
      }
    };
    pc.onnegotiationneeded = async () => {
      console.log("on negotiation needed ,sending offer");
      console.log("on negotistation : user", targetUserId);
      console.log("on pc nego", pc);
     
      try {
        
        const offer = await pc.createOffer();
       
        await pc.setLocalDescription(offer);
        socket.current.emit("send-offer", { roomId, offer, targetUserId });
      } catch (error) {
        console.error("Negotiation error:", error);
      }
    }
    

    if (!peerConnections.current.has(targetUserId)) {
      peerConnections.current.set(targetUserId, pc);
    }

    console.log("the peer connections on set Create", peerConnections.current);
    return pc;
  };

  useEffect(() => {
    const URL = "http://localhost:3000";
    socket.current = io(URL);


    socket.current.on("connected", () => {
      console.log("Connected to server");
    });

    socket.current.on("joined", (userId) => {
      console.log(`user joined with the id : ${userId}`)

    })
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        console.log("stream is adding")
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        console.log("navigator vid", videoTrack);
        console.log("navigator aud ", audioTrack);

        localAudioTrack.current = audioTrack;
        localVideoTrack.current = videoTrack;

        console.log("the ref navig au", localAudioTrack.current);
        console.log("the ref nav vid", localVideoTrack.current);
        localVideoRef.current.srcObject = new MediaStream([videoTrack]);

        console.log("stream is added");
        // After getting local media stream, join the room
        socket.current.emit("joinRoom", { roomId, userId });
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    // Setting up the local video stream


    socket.current.on("user-joined", async (targetUserId) => {
      console.log(`${targetUserId} joined the room`);
      // Create a peer connection for this new user

      const pc = await createPeerConnection(targetUserId);
      console.log("the returned pc", pc)

      await pc.addTransceiver(localAudioTrack.current);
      await pc.addTransceiver(localVideoTrack.current);
      // Wait for ICE candidates from this new peer
      const offer = await pc.createOffer();
      
      await pc.setLocalDescription(new RTCSessionDescription(offer));
      peerConnections.current.set(targetUserId, pc);
      // Send the offer to the new user
      socket.current.emit("send-offer", { roomId, offer, targetUserId });



    });


    socket.current.on("offer", async (offer, roomId, targetUserId) => {
      console.log("Received offer from", targetUserId);

      const pc =await  createPeerConnection(targetUserId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process queued ICE candidates
      if (pc._iceCandidateQueue) {
        pc._iceCandidateQueue.forEach(async (candidate) => {
          try {
            await pc.addIceCandidate(candidate);
            console.log("Queued ICE candidate added successfully.");
          } catch (err) {
            console.error("Error adding queued ICE candidate:", err);
          }
        });
        pc._iceCandidateQueue = []; // Clear the queue after processing
      }



      const answer = await pc.createAnswer();
  
      
      peerConnections.current.set(targetUserId, pc);

      socket.current.emit("answer", { roomId, answer, targetUserId });
    });


    socket.current.on("answer", async (answer, targetUserId) => {
      console.log("Received answer from", targetUserId);
      const pc = peerConnections.current.get(targetUserId);
      console.log(pc);
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      peerConnections.current.set(targetUserId, pc);
    });

    socket.current.on("add-ice-candidate", async (targetUserId, currentUserId, ice) => {
      console.log("Received ICE candidate from", currentUserId);

      const pc = peerConnections.current.get(currentUserId);
      if (!pc) {
        console.error(`PeerConnection for ${currentUserId} not found.`);
        return;
      }

      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(ice);
          console.log("ICE candidate added successfully.");
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      } else {
        console.log("Remote description is not yet set. Queuing ICE candidate.");
        if (!pc._iceCandidateQueue) {
          pc._iceCandidateQueue = [];
        }
        pc._iceCandidateQueue.push(ice);
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

  useEffect(() => {
    console.log("rendedingfdas")
  }, [localAudioTrack, localVideoTrack,localVideoRef])

  return (
    <div className="text-4xl">
      Game {roomId}
      <video ref={localVideoRef} width={500} height={500} autoPlay />

      <div ref={remoteDomRef}></div>
    </div>
  );
};
