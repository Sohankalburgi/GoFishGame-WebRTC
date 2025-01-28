import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { flushSync } from "react-dom";
import Card from "./Card";
import { checkSet } from "../functions/SetChecker";
import toast from "react-hot-toast";

const URL = "http://localhost:3000";

const GameRoom = () => {
  const { roomId, userId } = useParams();
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const localVideoRef = useRef(null);
  const sendingPc = useRef(null);
  const receivingPc = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
  const remoteVideoRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
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
    });

    if (!localVideoRef.current) {
      return;
    }
    localVideoRef.current.srcObject = new MediaStream([videoTrack]);
  }

  useEffect(() => {
    if (localVideoRef && localVideoRef.current) {
      getCam();
    }
  }, [localVideoRef.current]);

  useEffect(() => {
    if (!localVideoTrack || !localAudioTrack) {
      return; // Wait until both tracks are set
    }
    const socket = io(URL);
    console.log("check track", localAudioTrack);
    socket.on("connected", () => {
      console.log("The User Joined the Server");
    });

    socket.emit("joinRoom", { roomId, userId });

    socket.on("joined", (currentUserId) => {
      console.log(`The User Joined The Room ${currentUserId}`);
    });

    socket.on("user-joined", async (targetUserId) => {
      console.log(`The Other Peer Joined the room ${targetUserId}`);
      const peerConnection = new RTCPeerConnection();
      sendingPc.current = peerConnection;

      const localStream = new MediaStream([localVideoTrack, localAudioTrack]);
      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.onicecandidate = async (e) => {
        console.log("local receiveing ice candidate");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            roomId,
            candidate: e.candidate,
            type: "sender",
          });
        }
      };

      peerConnection.onnegotiationneeded = async () => {
        console.log("On negotiation needed");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      };

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
        localStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, localStream));
      }

      peerConnection.onicecandidate = async (e) => {
        console.log("remote receiveing ice candidate");
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            roomId,
            candidate: e.candidate,
            type: "receiver",
          });
        }
      };

      const stream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }

      setRemoteMediaStream(stream);

      window.pcr = peerConnection;

      peerConnection.ontrack = (e) => {
        console.log("track is added");
      };

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
      socket.emit("answer", { roomId, answer });
    });

    // eslint-disable-next-line no-unused-vars
    socket.on("answer", async ({ answer, roomId }) => {
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
    });

    socket.on("add-ice-candidate", async ({ candidate, roomId, type }) => {
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
          console.error("sending pc nout found");
        } else {
          // console.error(pc.ontrack)
        }
        await pc?.addIceCandidate(candidate);
      }
    });
    setSocket(socket);
  }, [localVideoRef.current, remoteVideoRef.current]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      }
    }
  }, [localVideoRef.current, remoteVideoRef.current]);

  const [roomCard, setRoomCard] = useState(null);
  const [startGame, setStartGame] = useState(false);

  const [askButton, setAskButton] = useState(false);
  const [fishButton, setFishButton] = useState(false);
  const [sendButton, setSendButton] = useState(false);
  const [deckClick, setDeckClick] = useState(false);

  const [activeIndex, setActiveIndex] = useState(null); // State to track the active card

  const [cardNameAsked, setCardNameAsked] = useState("");

  const handleStartGame = async () => {
    socket.emit("startGame", { roomId, userId });
  };

  useEffect(() => {
    if (socket) {
      socket.on("StartState", ({ room }) => {
        console.log("the room ", room);
        setRoomCard(room);
        setStartGame(true);
      });

      socket.on("card-present", ({ room, cardName }) => {
        console.log("card-present");
        setRoomCard(room);
        setSendButton(false);
        setFishButton(true);
        setCardNameAsked(cardName);
      });

      socket.on("card-not-present", ({ room, cardName }) => {
        console.log("card-not-present");
        setRoomCard(room);
        setFishButton(false);
        setSendButton(true);
        setCardNameAsked(cardName);
      });

      socket.on("fish", ({ room, cardName }) => {
        console.log("fish is receiveed");
        setDeckClick(true);
      });

      socket.on("saved-draw-card", ({ room }) => {
        setRoomCard(room);
        setAskButton(false);
      });

      socket.on("send-card", async ({ room }) => {
        setRoomCard(room);
        setAskButton(false);
      });
      socket.on("set", async ({ room }) => {
        setRoomCard(room);
      });

      socket.on("You-Won", () => {
        alert("You won the Game !!!")
      });
      socket.on("You-Lost", () => {
        alert("you lost the Game !!!");
      });
    }
  }, [
    socket,
    fishButton,
    sendButton,
    askButton,
    cardNameAsked,
    deckClick,
    roomCard,
  ]); // Listen to changes in the socket object.

  useEffect(() => {
    if (roomCard) {
      const deck = roomCard.playerDeck.find((user) => user.userId === userId);
      const checkDeck = checkSet(deck.deck);
      if (checkDeck.length == 0) {
        console.log("there is no set");
      } else {
        console.log("there is set");
        socket.emit("set", { userId, checkDeck, roomId });
      }
      if (roomCard.mainDeck.length === 0) {
        console.log("game ended");
        socket.emit("end-game", { roomId });
      }
      if (deck.deck.length === 0) {
        console.log("draw the card from pile");
        setDeckClick(false);
        socket.emit("save-draw-card", { roomId, userId });
      }
    }
  }, [roomCard, setRoomCard]);

  const handleCardClick = (index) => {
    setActiveIndex(index === activeIndex ? null : index); // Toggle active card
  };

  const handleAsk = async () => {
    const cardName = roomCard.playerDeck.find((user) => user.userId === userId)
      .deck[activeIndex];
    if (!cardName) {
      toast.error("Please Select a Card");
      return;
    }
    setAskButton(true);
    socket.emit("ask", { roomId, cardName, userId });
  };

  const handleFish = async () => {
    setFishButton(true);
    const cardName = cardNameAsked;
    socket.emit("fish", { roomId, cardName, userId });
  };

  const handleSend = async () => {
    setSendButton(false);
    const cardName = cardNameAsked;
    socket.emit("send-card", { roomId, cardName, userId });
  };

  const handleDrawCard = async () => {
    setDeckClick(false);
    socket.emit("save-draw-card", { roomId, userId });
  };


  const [copied, setCopied] = useState(false);
  const textToCopy = roomId;

  const handleCopy = () => {

    toast.success('Room ID Copied to Clipboard');
    navigator.clipboard.writeText(textToCopy)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };

  return (
    <div className="w-full h-screen flex flex-row">
      {/* Left Section: Video Streams */}
      <div className="w-1/4 mx-2 mt-2 flex flex-col gap-4">
        <h3 className="text-center">Local User</h3>
        <video
          ref={localVideoRef}
          className="border border-black rounded-md"
          autoPlay
          width={400}
        ></video>
        <h3 className="text-center">Remote User</h3>
        <video
          ref={remoteVideoRef}
          className="border border-black rounded-md"
          autoPlay
          width={400}
        ></video>
        <button>

        </button>
        <div>

          <button onClick={handleCopy} className={`bg-slate-200 p-1 px-3 w-full rounded-xl ${copied ? 'bg-yellow-300' : ""}`}>
            Share the Room ID :  {roomId}
          </button>
        </div>
        <button
          className="p-2 bg-red-500 text-white rounded-md disabled:bg-red-100"
          onClick={handleStartGame}
          disabled={startGame ? true : false}
        >
          Start Game
        </button>
      </div>

      {/* Right Section: Game Card Area */}
      <div className="w-3/4 flex flex-col items-center gap-[6.5rem]  p-4 bg-green-500 relative">
        {/* Player 1 Deck */}
        <div
          className={`flex items-center justify-center p-4 bg-green-500 mt-5 rounded-md ${roomCard && roomCard.currentUser === userId
            ? "opacity-50 pointer-events-none"
            : ""
            }`}
        >
          <div className="flex relative">
            {roomCard &&
              roomCard.playerDeck
                .find((user) => user.userId !== userId)
                .deck.map((type, index) => (
                  <Card
                    isShow={false}
                    type={type}
                    index={index}
                    total={
                      roomCard.playerDeck.find((user) => user.userId === userId)
                        .deck.length
                    }
                    key={index}
                  />
                ))}
          </div>
        </div>

        {/* Central Pile (Question Mark Card) */}
        <div className="flex justify-center items-center">
          <div
            className={` w-24 h-32 bg-white mx-10 rounded-xl shadow-lg 
            flex flex-col justify-center items-center 
            overflow-hidden transform transition-all duration-300 
            hover:w-28 hover:h-36    hover:p-4 hover:z-10 hover:rotate-0`}
          >
            <div>
              {/* Card Content */}
              <div className="text-center ">
                <h2 className="text-sm sm:text-sm md:text-sm text-blue-950 font-bold">
                  Your - Set Count{" "}
                  {roomCard &&
                    roomCard.set.find((user) => user.userId == userId).count}
                </h2>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleDrawCard()}
            className={`disabled:bg-slate-800 w-24 h-32 bg-white  rounded-xl shadow-lg 
            flex flex-col justify-center items-center 
            overflow-hidden transform transition-all duration-300 
            hover:w-28 hover:h-36 hover:p-4 hover:z-10 hover:rotate-0`}
            disabled={deckClick === true ? false : true}
          >
            <div>
              {/* Card Content */}
              <div className="text-center ">
                <h2 className="text-7xl sm:text-7xl md:text-7xl text-blue-950 font-bold">
                  ?
                </h2>
              </div>
            </div>
          </button>

          <div
            className={` w-24 h-32 bg-white  rounded-xl shadow-lg 
            flex flex-col justify-center items-center 
            overflow-hidden transform transition-all duration-300 
            hover:w-28 hover:h-36 hover:p-4 mx-10 hover:z-10 hover:rotate-0`}
          >
            <div>
              {/* Card Content */}
              <div className="text-center ">
                <h2 className="text-sm sm:text-sm md:text-sm text-blue-950 font-bold">
                  Opponent - Set Count{" "}
                  {roomCard &&
                    roomCard.set.find((user) => user.userId != userId).count}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex gap-3 absolute right-10">
            {roomCard && roomCard.currentUser === userId ? (
              <button
                disabled={askButton}
                className="bg-orange-400 p-6 disabled:bg-blue-950 rounded-full text-white font-bold shadow-2xl shadow-orange-500 hover:scale-110 transition-all"
                onClick={() => handleAsk()}
              >
                Ask
              </button>
            ) : roomCard && roomCard.askUser ? (
              <>
                <button
                  disabled={fishButton}
                  onClick={() => handleFish()}
                  className="bg-orange-400 p-6 disabled:bg-blue-950 rounded-full text-white font-bold shadow-2xl shadow-orange-500 hover:scale-110 transition-all"
                >
                  Go Fish !!!
                </button>
                <button
                  disabled={sendButton}
                  onClick={() => handleSend()}
                  className="bg-orange-400 p-6 rounded-full disabled:bg-blue-950 text-white font-bold shadow-2xl shadow-orange-500 hover:scale-110 transition-all"
                >
                  Send Card
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Player 2 Deck */}
        <div
          className={`flex flex-row gap-10 items-center justify-center p-4 bg-green-500 rounded-md ${roomCard && roomCard.currentUser !== userId
            ? "opacity-50 pointer-events-none"
            : ""
            }`}
        >
          <div className="flex relative">
            {roomCard &&
              roomCard.playerDeck
                .find((user) => user.userId === userId)
                .deck.map((type, index) => (
                  <Card
                    isShow={true}
                    type={type}
                    index={index}
                    total={
                      roomCard.playerDeck.find((user) => user.userId === userId)
                        .deck.length
                    }
                    key={index}
                    isActive={activeIndex === index}
                    onClick={() => handleCardClick(index)} // Fixed click handler
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
