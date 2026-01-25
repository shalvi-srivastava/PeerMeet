import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please Provide Info !" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "Invalid username or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "Invalid username or password" });
    }
    let token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();
    res.status(httpStatus.OK).json({ token: token });
  } catch (err) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ error: "Username already exists !" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(20).toString("hex");

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
      token,
    });
    await newUser.save();
    return res.status(httpStatus.CREATED).json({
      token,
      message: "User registered successfully",
    });
  } catch (err) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
    console.log(err);
  }
};


const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    }

    const meetings = await Meeting.find({ user_id: user.username });
    res.status(httpStatus.OK).json(meetings);
  } catch (e) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong" });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    res
      .status(httpStatus.CREATED)
      .json({ message: "Added code to history" });
  } catch (e) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong" });
  }
};

export { login, register, addToHistory, getUserHistory };
