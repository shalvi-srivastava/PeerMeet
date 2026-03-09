import "../App.css";
import { Link, useNavigate } from "react-router";
import { SitemarkIcon } from "../sign-in-side/components/CustomIcons";
export default function Landing() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <SitemarkIcon/>
        </div>
        <div className="navlist">
          {/* <p
            onClick={() => {
              router("/random");
            }}
          >
            Join as Guest
          </p> */}
          <p
            onClick={() => {
              router("/auth");
            }}
          >
            Register
          </p>
          <div
            onClick={() => {
              router("/auth");
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>
      </nav>
      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#4876ef" }}>Connect</span> with your team
          </h1>
          <p>Bridge the distance with PeerMeet</p>
          <div role="button">
            <Link to={"/auth"} className="customAnchor">
              Get Started
            </Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>
    </div>
  );
}
