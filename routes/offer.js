const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").V2;

// IMPORT DU MODELE USER
const Offer = require("../models/Offer");

router.post("/offer/publish", async (req, res) => {
  console.log(req.files);
  console.log(req.fields);
  res.json("Hello World");
});
