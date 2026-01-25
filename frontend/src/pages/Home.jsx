import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, TextField } from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";
import { SitemarkIcon } from "../sign-in-side/components/CustomIcons";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;

    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch (err) {
      console.error("Failed to join meeting:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="homeComponent">
      <div className="navBar">
        <SitemarkIcon />
        <div className="navActions">
          <Button
            className="historyBtn"
            onClick={() => navigate("/history")}
            disableElevation
          >
            History
          </Button>

          <Button className="logoutBtn" onClick={handleLogout} disableElevation>
            Logout
          </Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div className="contentBox">
            <h1>
              Quality video calls, <br />
              built for focused meets
            </h1>

            <div className="joinRow">
              <TextField
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                label="Meeting Code"
                placeholder="Enter meeting code"
                variant="outlined"
                fullWidth
                className="dark-textfield"
              />

              <Button
                onClick={handleJoinVideoCall}
                variant="contained"
                className="joinBtn"
              >
                Join
              </Button>
            </div>
          </div>
        </div>

        <div className="rightPanel">
          <img src="/logo3.png" alt="PeerMeet logo" />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
