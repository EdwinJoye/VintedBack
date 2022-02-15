const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

// IMPORT DU MODELE USER
const User = mongoose.model("User", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: {
    MARQUE: String,
    TAILLE: Number,
    ETAT: String,
    COULEUR: String,
    EMPLACEMENT: String,
  },
  owner: {
    account: {
      username: String,
      phone: String,
      avatar: {
        secure_url: String,
      },
    },
    _id: String,
  },
  product_image: {
    secure_url: String,
  },
});

// ROUTE CREATION CLIENT
app.post("creation/client/", async (req, res) => {
  try {
    const existingUser = await User.findOne({ name: req.fields.name });
    if (existingUser === null) {
      const newUser = new User();
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});
// 1. Importer Cloudinary
const cloudinary = require("cloudinary").v2;

// 2. Configurer Cloudinary
cloudinary.config({
  cloud_name: "dm0sv9nfx",
  api_key: "486331723414319",
  api_secret: "_4RYGSRPLe8dOzgnUBkFRmaXv8c",
  secure: true,
});
//CONNEXION A LA BDD
mongoose.connect("mongodb://127.0.0.1/cloudinary");

//CREATION DU SERVEUR
const app = express();
app.use(formidable());

app.post("/offer/publish", async (req, res) => {
  console.log();
  console.log(Object.keys(req.files));

  console.log(req.files.picture.name); // name: 'nike-air-max-90-cuban-link.jpg',
  console.log(req.files.picture.path); // path: '/var/folders/kz/968j_5wx05b_ds5021_4mm580000gn/T/upload_b6e9ec7de1468d9496f232454fe18b68',
  console.log(req.files.picture.type); // type: 'image/jpeg',

  try {
    // 3. Envoyer le fichier vers Cloudinary
    const result = await cloudinary.uploader.upload(req.files.picture.path);

    // secure_url qui doit être sauvegardée dans la BDD
    console.log(result.secure_url);

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

//DEMARRAGE DU SERVEUR
app.listen(3000, () => {
  console.log("Serveur has started !");
});
