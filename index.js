const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//CONNEXION A LA BDD
mongoose.connect("mongodb://127.0.0.1/cloudinary");

//CREATION DU SERVEUR
const app = express();
app.use(formidable());

//////////////////////////////////////////        CREATION DU COMPTE USER ET OFFER     ////////////////////////////////////////////////////////////////////////////////////

// IMPORT DU MODELE USER
const Offer = mongoose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    avatar: Object, // nous verrons plus tard comment uploader une image
  },
  token: String,
  hash: String,
  salt: String,
});

// ROUTE CREATION CLIENT
app.post("/creation/client/", async (req, res) => {
  try {
    // ON VERIFIE QUE L'ON ENVOIE BIEN UN USERNAME
    if (req.fields.username === undefined) {
      res.status(400).json({ message: "Missing parameter" });
    } else {
      // ON VERIFIE QUE L'EMAIL EN BASE DE DONNEES EST BIEN DISPO

      const isUserExist = await User.findOne({ email: "test" });
      console.log(isUserExist);
      if (isUserExist !== null) {
        res
          .status(400)
          .json({ message: "This email is already has an account" });
      } else {
        console.log(req.fields);

        //Etape 1 : Hasher le mot de passe
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(64);

        // ETAPE 2 : création d'un nouvel user
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          token: token,
          hash: hash,
          salt: salt,
        });

        // Etape 3 : sauvegarder ce nouvel utilisateur dans la BDD
        await newUser.save();
        res.json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      }
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });
    if (user === null) {
      res.status(401).json({ message: "Unauthorized ! 1" });
    } else {
      console.log(user.hash, "hash à comparer");
      const newHash = SHA256(req.fields.password + user.salt).toString(
        encBase64
      );
      console.log(newHash, "Mon nouveau hash");
      if (user.hash === newHash) {
        res.json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized ! 2" });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/////////////////////////////////////////        UTILISATION DU MIDDLEWARE   ///////////////////////////////////////////////////////////////////////////////

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    console.log(req.headers.authorization);
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    }).select("account _id email");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      req.user = user;
      console.log(req.user);
      return next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// console.log(isAuthenticated);
// SI AUTHENTIFICATION REUSSIE ALORS CREATION DU OFFER

//////////////////////////////////////////        IMPORTER DANS LE CLOUDINARY    //////////////////////////////////////////////////////////////////////////////////////

// 1. Importer Cloudinary
const cloudinary = require("cloudinary").v2;

// 2. Configurer Cloudinary
cloudinary.config({
  cloud_name: "dm0sv9nfx",
  api_key: "486331723414319",
  api_secret: "_4RYGSRPLe8dOzgnUBkFRmaXv8c",
  secure: true,
});

app.post("/offer/publish", isAuthenticated, async (req, res) => {
  // console.log();
  // console.log(Object.keys(req.files));
  // 3. Envoyer le fichier vers Cloudinary
  const result = await cloudinary.uploader.upload(req.files.picture.path);
  // console.log(req.files.picture.name); // name: 'nike-air-max-90-cuban-link.jpg',
  // console.log(req.files.picture.path); // path: '/var/folders/kz/968j_5wx05b_ds5021_4mm580000gn/T/upload_b6e9ec7de1468d9496f232454fe18b68',
  // console.log(req.files.picture.type); // type: 'image/jpeg',
  const newOffer = new Offer({
    product_name: req.fields.name,
    product_description: req.fields.description,
    product_price: req.fields.price,
    product_details: [
      {
        condition: req.fields.condition,
        city: req.fields.city,
        brand: req.fields.brand,
        size: req.fields.size,
        color: req.fields.color,
      },
    ],
    owner: req.user,
    product_image: result.secure_url,
  });
  try {
    // secure_url qui doit être sauvegardée dans la BDD
    console.log(result.secure_url);

    return res.json(newOffer);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

//DEMARRAGE DU SERVEUR
app.listen(3000, () => {
  console.log("Serveur has started !");
});
