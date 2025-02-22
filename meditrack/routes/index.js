const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const HospitalModel = require("./users");
const EquipmentModel = require("./Equipment");

const JWT_SECRET = "your_secret_key";

router.get("/", (req, res) => {
  res.render("login");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  let {
    HospitalName,
    HospitalType,
    HospitalId,
    Address,
    Contact,
    Email,
    Password,
    AdminName,
    LicenseId,
    YearOfEstablishment,
  } = req.body;
  try {
    let existHospital = await HospitalModel.findOne({ LicenseId });
    if (existHospital) {
      return res.redirect("/login");
    }

    const newHospital = new HospitalModel({
      HospitalName,
      HospitalType,
      HospitalId,
      Address,
      Contact,
      Email,
      AdminName,
      LicenseId,
      YearOfEstablishment,
    });

    const salt = await bcrypt.genSalt(10);
    newHospital.Password = await bcrypt.hash(Password, salt);

    await newHospital.save();
    const token = jwt.sign(
      { id: newHospital._id, Email: newHospital.Email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token);
    res.redirect("/profile");
  } catch (err) {
    res.redirect("/register");
  }
});

router.post("/login", async (req, res) => {
  const { HospitalId, Email, Password } = req.body;
  try {
    const hospital = await HospitalModel.findOne({
      HospitalId: Number(HospitalId),
    });

    if (!hospital) {
      return res.status(400).send("Hospital not found");
    }

    if (!hospital.Password) {
      return res.status(500).send("Hospital password not found in database");
    }

    const isMatch = await bcrypt.compare(Password, hospital.Password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign(
      { id: hospital._id, Email: hospital.Email },
      JWT_SECRET
    );
    res.cookie("token", token);
    res.redirect("/profile");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.get("/show", isLoggedIn, async (req, res) => {
  if (!req.user) {
    return res.status(401).send("User is not authenticated");
  }

  try {
    console.log(req.user);
    console.log(req.user._id); 
    let user = await HospitalModel.findById(req.user._id).populate("equipments");
    console.log("User data:", user);
    if (!user) {
      return res.status(404).send("Hospital not found");
    }
    res.render("show", { user });
  } catch (err) {
    res.status(500).send("Error loading equipment data");
  }
});


router.get("/add", isLoggedIn, (req, res) => {
  res.render("add", { user: req.user });
});

router.post("/add", isLoggedIn, async (req, res) => {
  let {
    EquipmentId,
    EquipmentName,
    Category,
    Description,
    Quantity,
    Status,
    Location,
    DateExpired,
    Manufacturer,
    Price,
    UsageDates,
  } = req.body;
  
  let hid = req.user._id;
  console.log(hid);
  console.log(req.user);
  let hospital = await HospitalModel.findOne({ _id: hid });
  if (!hospital) {
    return res.status(404).send("Hospital not found.");
  }
  let existingEquipment = await EquipmentModel.findOne({
    EquipmentId: EquipmentId,
    HospitalId: hid, 
  });

  if (existingEquipment) {
    return res.status(400).send("This equipment is already registered in this hospital.");
  }

  let newEquipment = new EquipmentModel({
    EquipmentId,
    EquipmentName,
    Category,
    Description,
    Quantity,
    Status,
    Location,
    DateExpired,
    Manufacturer,
    Price,
    HospitalId: hid,
    UsageDates,
  });
  console.log(newEquipment);
  await newEquipment.save();

  // Add the new equipment to the hospital's equipments list (make sure it's plural)
  hospital.equipments.push(newEquipment._id);  // Update to 'equipments' not 'Equipment'
  await hospital.save();

  res.redirect('/show');
});




router.get("/reminder", isLoggedIn, (req, res) => {
  res.render("reminder", { user: req.user });
});

router.get("/update", isLoggedIn, (req, res) => {
  res.render("update", { user: req.user });
});

router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", { user: req.user });
});

router.post("/profile", (req, res) => {
  res.redirect("/profile");
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send("Access Denied");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT:", decoded); // Log decoded token for debugging
   
    req.user = {
      _id: decoded.id, // Map the decoded 'id' to '_id' field
      Email: decoded.Email, // Ensure Email is mapped as well
    };
    
    next();
  } catch (err) {
    console.error("Error decoding JWT:", err);
    return res.status(400).send("Invalid Token");
  }
}


router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
