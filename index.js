const express = require("express");
const formidableMiddleware = require("express-formidable");
const axios = require("axios");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const app = express();
app.use(formidableMiddleware());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
});
const User = mongoose.model("User", {
  username: String,
  email: String,
  hash: String,
  token: String,
  salt: String,
  favories: { type: Array, default: [] },
});

////////////////////////// User login /////////////////////
app.post("/user/login", async (req, res) => {
  try {
    const { password, email } = req.fields;
    console.log(password);
    console.log(email);
    const user = await User.findOne({ email: email });
    if (user) {
      const salt = user.salt;
      const hash = user.hash;
      const hashToCompare = SHA256(password + salt).toString(encBase64);
      console.log(hashToCompare);
      console.log(hash);
      console.log(salt);

      if (hash === hashToCompare) {
        res.status(200).json({
          message: "password ok",
        });
      } else {
        res.status(401).json({
          message: "password error",
        });
      }
    } else {
      res.status(401).json({
        message: "user not found, Unauthorized",
      });
    }
  } catch (error) {}
});

////////////////////////// User signup /////////////////////

app.post("/user/signup", async (req, res) => {
  try {
    console.log("signup");
    const { username, email, password } = req.fields;
    const user = await User.findOne({ email: email });
    if (user) {
      res.status(409).json({
        message: "user already exist with this mail",
      });
    } else {
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const user = new User({
        username: username,
        email: email,
        hash: hash,
        token: token,
        salt: salt,
      });
      const newUser = await user.save();

      res.status(200).json({
        newUser,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
});

////////////////////////// User favories /////////////////////

////////////////////////// home route /////////////////////

app.get("/", (req, res) => {
  res.status(200).json({
    message: "welcome to marvel world",
  });
});

////////////////////////// comics route /////////////////////

app.post("/comics", async (req, res) => {
  let params = {};
  if (req.fields) {
    params = { ...req.fields };
  }
  console.log(params);
  //   params keys: title, limit, skip
  try {
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${process.env.MARVEL_API_KEY}`,
      { params }
    );
    console.log(response.data);
    res.status(200).json({
      comics: response.data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
    console.log(error.message);
  }
});

////////////////////////// characters route /////////////////////

app.get("/characters", async (req, res) => {
  const params = req.query;
  console.log(params);
  //   params keys: name, limit, skip
  console.log("characters");
  try {
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.MARVEL_API_KEY}`,
      { params }
    );
    // console.log(response.data);
    console.log(response.data);

    res.status(200).json({
      characters: response.data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
    console.log(error.message);
  }
});

////////////////////////// comics:id route /////////////////////

app.get("/comics/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics/${id}?apiKey=${process.env.MARVEL_API_KEY}`
    );

    console.log(response.data);
    res.status(200).json({
      comic_data: response.data,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
    console.log(error.message);
  }
});

///////////////////////////////// all routes //////////////////////////

app.all("*", (req, res) => {
  res.status(400).json({
    message: "Ooops!, page not found",
  });
});

app.listen(5000, () => console.log("server  is running"));
