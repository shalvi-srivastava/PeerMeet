import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import SendIcon from "@mui/icons-material/Send";
import "../videoComponent.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import InputAdornment from "@mui/material/InputAdornment";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../environment";

const server_url = server;

const VideoTile = React.memo(function VideoTile({ stream, socketId }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="remoteVideoWrapper">
      <video ref={videoRef} data-socket={socketId} autoPlay playsInline />
    </div>
  );
});

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();

  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(false);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // TODO
  // if(isChrome() === false) {

  // }

  useEffect(() => {
    // console.log("HELLO");
    getPermissions();
  }, []);

  useEffect(() => {
    return () => {
      try {
        socketRef.current?.disconnect();
      } catch {}

      try {
        localVideoref.current?.srcObject
          ?.getTracks()
          ?.forEach((track) => track.stop());
      } catch {}

      connections = {};
    };
  }, []);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);
    }
  }, [video, audio]);
  let getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoAvailable,
        audio: audioAvailable,
      });

      window.localStream = stream;
      localVideoref.current.srcObject = stream;

      setVideo(videoAvailable);
      setAudio(audioAvailable);

      connectToSocketServer(); // connect AFTER stream ready
    } catch (e) {
      console.log(e);
    }
  };

  let getUserMediaSuccess = (stream) => {
    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        track.enabled = false;
      };
    });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    }
  };

  let getDislayMediaSuccess = (stream) => {
    const screenTrack = stream.getVideoTracks()[0];

    for (let id in connections) {
      const sender = connections[id]
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) sender.replaceTrack(screenTrack);
    }

    screenTrack.onended = () => {
      const camTrack = window.localStream.getVideoTracks()[0];
      for (let id in connections) {
        const sender = connections[id]
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) sender.replaceTrack(camTrack);
      }
    };
  };

  let gotMessageFromServer = async (fromId, message) => {
    const signal = JSON.parse(message);

    if (fromId === socketIdRef.current) return;

    // Create peer if it doesn't exist
    if (!connections[fromId]) {
      const pc = new RTCPeerConnection(peerConfigConnections);
      connections[fromId] = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ ice: event.candidate }),
          );
        }
      };

      pc.ontrack = (event) => {
        setVideos((prev) => {
          const exists = prev.find((v) => v.socketId === fromId);
          if (exists) return prev;

          return [
            ...prev,
            {
              socketId: fromId,
              stream: event.streams[0],
            },
          ];
        });
      };

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, window.localStream);
        });
      }
    }

    const pc = connections[fromId];

    if (signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

      if (signal.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit(
          "signal",
          fromId,
          JSON.stringify({ sdp: pc.localDescription }),
        );
      }
    }

    if (signal.ice) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
      } catch (e) {
        console.log("ICE error", e);
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }

        setVideos((videos) => videos.filter((v) => v.socketId !== id));
      });
      socketRef.current.on("existing-users", (users) => {
        users.forEach((socketListId) => {
          const pc = new RTCPeerConnection(peerConfigConnections);

          connections[socketListId] = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          pc.ontrack = (event) => {
            setVideos((prev) => {
              const exists = prev.find((v) => v.socketId === socketListId);
              if (exists) return prev;

              return [
                ...prev,
                {
                  socketId: socketListId,
                  stream: event.streams[0],
                },
              ];
            });
          };

          if (window.localStream) {
            window.localStream.getTracks().forEach((track) => {
              pc.addTrack(track, window.localStream);
            });
          }

          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ sdp: pc.localDescription }),
              );
            });
        });
      });
      socketRef.current.on("user-joined", (id) => {
        const pc = new RTCPeerConnection(peerConfigConnections);

        connections[id] = pc;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ ice: event.candidate }),
            );
          }
        };

        pc.ontrack = (event) => {
          setVideos((prev) => {
            const exists = prev.find((v) => v.socketId === id);
            if (exists) return prev;

            return [
              ...prev,
              {
                socketId: id,
                stream: event.streams[0],
              },
            ];
          });
        };

        if (window.localStream) {
          window.localStream.getTracks().forEach((track) => {
            pc.addTrack(track, window.localStream);
          });
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    window.localStream
      ?.getVideoTracks()
      .forEach((t) => (t.enabled = !t.enabled));
    setVideo((v) => !v);
  };

  let handleAudio = () => {
    window.localStream
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = !t.enabled));
    setAudio((a) => !a);
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    navigate("/home");
  };

  // const openChat = () => {
  //   setModal(true);
  //   setNewMessages(0);
  // };

  // const closeChat = () => {
  //   setModal(false);
  // };
  const toggleChat = () => {
    setModal((prev) => {
      const next = !prev;

      // Chat is opening → clear unread
      if (next === true) {
        setNewMessages(0);
      }

      return next;
    });
  };

  // let handleMessage = (e) => {
  //   setMessage(e.target.value);
  // };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [...prev, { sender, data }]);

    if (socketIdSender !== socketIdRef.current && showModal === false) {
      setNewMessages((prev) => prev + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className="lobbyScreen">
          <div className="lobbyCard">
            <h2>Enter Lobby</h2>

            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
              className="dark-textfield"
            />

            <Button
              variant="contained"
              onClick={connect}
              disabled={!username.trim()}
              className="primaryBtn"
            >
              Connect
            </Button>

            <div className="lobbyVideo">
              <video ref={localVideoref} autoPlay muted />
            </div>
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          {showModal ? (
            <div className="chatRoom">
              <div className="chatContainer">
                <h1>Messages</h1>

                <div className="chattingDisplay">
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div
                          className="chatMessage"
                          key={`${item.sender}-${index}`}
                        >
                          <p className="chatSender">{item.sender}</p>
                          <p className="chatText">{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="noMessages">No Messages Yet</p>
                  )}
                </div>

                <div className="chattingArea">
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    label="Enter your message"
                    variant="outlined"
                    fullWidth
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); // stops new line
                        if (message.trim()) {
                          sendMessage();
                        }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={sendMessage}
                            className="sendBtn"
                            disabled={!message.trim()}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="buttonContainers">
            <IconButton onClick={handleVideo} className="controlBtn">
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleAudio} className="controlBtn">
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <Badge
              badgeContent={newMessages}
              max={999}
              color="error"
              invisible={showModal || newMessages === 0}
            >
              <IconButton onClick={toggleChat} className="controlBtn">
                <ChatIcon />
              </IconButton>
            </Badge>

            {/* <button
              onClick={() =>
                addMessage("Test incoming message", "Peer", "FAKE_SOCKET_ID")
              }
            >
              Simulate Incoming Message
            </button> */}

            {screenAvailable ? (
              <IconButton onClick={handleScreen} className="controlBtn">
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            ) : null}

            <IconButton
              onClick={handleEndCall}
              className="controlBtn endCallBtn"
            >
              <CallEndIcon />
            </IconButton>
          </div>

          <video
            className="meetUserVideo"
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className="conferenceView">
            {videos.map((video) => (
              <VideoTile
                key={video.socketId}
                socketId={video.socketId}
                stream={video.stream}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
