import { AuthProvider } from "./contexts/AuthContext";
import Authentication from "./pages/Authentication";
import Landing from "./pages/Landing";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import VideoMeetComponent from "./pages/VideoMeet";
import Home from "./pages/Home";
import History from "./pages/History";
import Error from "./pages/Error";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/:url" element={<Error />} />
            <Route path="/home/:url" element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
