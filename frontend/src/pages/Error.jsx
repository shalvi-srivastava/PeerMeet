import { useNavigate } from "react-router-dom";

export default function Error() {
  const navigate = useNavigate();

  return (
    <div className="err-container">
      <h1 className="err-code">404</h1>
      <h2 className="err-title">Page Not Found</h2>
      <p className="err-text">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <button className="err-btn" onClick={() => navigate("/")}>
        Go Back Home
      </button>
    </div>
  );
}
