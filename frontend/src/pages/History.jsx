import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton } from "@mui/material";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // TODO: show snackbar
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="historyPage">
      <div className="historyHeader">
        <IconButton onClick={() => navigate("/home")} className="backBtn">
          <HomeIcon />
        </IconButton>
        <h2>Meeting History</h2>
      </div>

      <div className="historyList">
        {meetings.length > 0 ? (
          meetings.map((e) => (
            <Card
              key={e._id || `${e.meetingCode}-${e.date}`}
              className="historyCard"
              variant="outlined"
            >
              <CardContent>
                <Typography className="meetingCode">
                  Code: {e.meetingCode}
                </Typography>

                <Typography className="meetingDate">
                  Date: {formatDate(e.date)}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="emptyState">No meeting history found.</p>
        )}
      </div>
    </div>
  );
}
