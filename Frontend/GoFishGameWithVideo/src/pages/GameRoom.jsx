import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from "socket.io-client";
import { flushSync } from "react-dom";

const URL = 'http://localhost:3000';


const GameRoom = () => {
  const { roomId, userId } = useParams();
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const localVideoRef = useRef(null);
  const sendingPc = useRef(null);
  const receivingPc = useRef(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
  const remoteVideoRef = useRef(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState();
  const [socket, setSocket] = useState();

  async function getCam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    flushSync(() => {
      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
    })

    if (!localVideoRef.current) {
      return;
    }
    localVideoRef.current.srcObject = new MediaStream([videoTrack]);

  }

  useEffect(() => {
    if (localVideoRef && localVideoRef.current) {
      getCam();
    }
  }, [localVideoRef.current])

  useEffect(() => {
    if (!localVideoTrack || !localAudioTrack) {
      return; // Wait until both tracks are set
    }
    const socket = io(URL);
    console.log("check track", localAudioTrack);
    socket.on('connected', () => {
      console.log("The User Joined the Server");
    })

    socket.emit('joinRoom', { roomId, userId });

    socket.on('joined', (currentUserId) => {
      console.log(`The User Joined The Room ${currentUserId}`);
    })

    socket.on('user-joined', async (targetUserId) => {
      console.log(`The Other Peer Joined the room ${targetUserId}`);
      const peerConnection = new RTCPeerConnection();
      sendingPc.current = peerConnection;

      const localStream = new MediaStream([localVideoTrack, localAudioTrack]);
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.onicecandidate = async (e) => {
        console.log("local receiveing ice candidate");
        if (e.candidate) {
          socket.emit('add-ice-candidate', {
            roomId,
            candidate: e.candidate,
            type: "sender"
          });
        }
      }

      peerConnection.onnegotiationneeded = async () => {
        console.log("On negotiation needed");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      }
      
      const stream = new MediaStream();
      setTimeout(() => {
        const track1 = peerConnection.getTransceivers()[0].receiver.track;
        const track2 = peerConnection.getTransceivers()[1].receiver.track;
        console.log(track1);
        if (track1.kind === "video") {
          setRemoteAudioTrack(track2);
          setRemoteVideoTrack(track1);
        } else {
          setRemoteAudioTrack(track1);
          setRemoteVideoTrack(track2);
        }
        remoteVideoRef.current.srcObject?.addTrack(track1);
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.srcObject?.addTrack(track2);



      }, 5000);


    });

    socket.on("offer", async ({ offer, roomId }) => {
      console.log("offer received");

      const peerConnection = new RTCPeerConnection();
      receivingPc.current = peerConnection;

      if (localVideoTrack && localAudioTrack) {
        const localStream = new MediaStream([localVideoTrack, localAudioTrack]);
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
      }

      peerConnection.onicecandidate = async (e) => {

        console.log("remote receiveing ice candidate");
        if (e.candidate) {
          socket.emit('add-ice-candidate', {
            roomId,
            candidate: e.candidate,
            type: "receiver"
          });
        }
      }

      const stream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }

      setRemoteMediaStream(stream);



      window.pcr = peerConnection;

      peerConnection.ontrack = (e) => {
        console.log('track is added');

      }


      setTimeout(() => {
        const track1 = peerConnection.getTransceivers()[0].receiver.track;
        const track2 = peerConnection.getTransceivers()[1].receiver.track;
        console.log(track1);
        if (track1.kind === "video") {
          setRemoteAudioTrack(track2);
          setRemoteVideoTrack(track1);
        } else {
          setRemoteAudioTrack(track1);
          setRemoteVideoTrack(track2);
        }
        remoteVideoRef.current.srcObject?.addTrack(track1);
        remoteVideoRef.current.srcObject?.addTrack(track2);
      }, 5000);

     
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });

    // eslint-disable-next-line no-unused-vars
    socket.on('answer', async ({ answer, roomId }) => {
      console.log("on answer recieved");

      const pc = sendingPc.current;
      if (!pc) {
        console.error("Sending PC not found");
        return pc;
      }
      try {
        pc.setRemoteDescription(answer);
        console.log("Remote description set for sending PC");
        // pc.addTrack(localAudioTrack);
        // pc.addTrack(localVideoTrack);

      } catch (err) {
        console.error("Error setting remote description for sending PC:", err);
      }
      console.log("loop closed");
    })

    socket.on('add-ice-candidate', async ({ candidate, roomId, type }) => {
      console.log("add ice candidate from remote");
      console.log({ candidate, type });
      if (type == "sender") {
        const pc = receivingPc.current;
        if (!pc) {
          console.error("receicng pc nout found");
        } else {
          // console.error(pc.ontrack)
        }
        await pc?.addIceCandidate(candidate);

      } else if (type === "receiver") {
        const pc = sendingPc.current;
        if (!pc || !pc.remoteDescription) {
          console.error("sending pc nout found")
        } else {
          // console.error(pc.ontrack)
        }
        await pc?.addIceCandidate(candidate);

      }
    })
    setSocket(socket);
  }, [localVideoRef.current, remoteVideoRef.current])

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);

      }
    }
  }, [localVideoRef.current, remoteVideoRef.current])


  // const addTrack = async () => {
  //   const pc = sendingPc.current;
  //   console.log(pc);
  //   if (localVideoTrack) {
  //     console.log("local video Track added", localAudioTrack);
  //     pc.addTrack(localVideoTrack);
  //   }

  //   if (localAudioTrack) {
  //     console.log("local audio Track added", localVideoTrack);
  //     pc.addTrack(localAudioTrack);
  //   }
  // }
  // const addTrackRec = async () => {
  //   const pc = receivingPc.current;
  //   console.log(pc);
  //   if (localVideoTrack) {
  //     console.log("local video Track added", localAudioTrack);
  //     pc.addTrack(localVideoTrack);
  //   }

  //   if (localAudioTrack) {
  //     console.log("local audio Track added", localVideoTrack);
  //     pc.addTrack(localAudioTrack);
  //   }
  //   return pc;

  // }

  return (
    <>
      <video ref={localVideoRef} autoPlay={true}></video>
      {/* <button onClick={() => addTrack()}>sendStream</button>
      <button onClick={() => addTrackRec()}>receiverSendStream</button> */}
      <video ref={remoteVideoRef} autoPlay={true}></video>
    </>
  )
}

export default GameRoom