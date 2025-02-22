var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const HospitalModel = require("./Hospital");
const EquipmentModel = require("./Equipment");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

router.get("/", function (req, res, next) {
  res.render("register", { title: "Express" });
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  let {
    HospitalName,
    HospitalType,
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
      Address,
      Contact,
      Email,
      AdminName,
      LicenseId,
      YearOfEstablishment,
    });

    await HospitalModel.register(newHospital, Password);
    passport.authenticate("local")(req, res, () => {
      res.redirect("/profile");
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.redirect("/register");
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
  })
);

router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile");
});

router.get("/addequipment", isLoggedIn, (req, res) => {
  res.render("Add");
});

router.post("/addequipment", isLoggedIn, async (req, res) => {
  let {
    EquipmentId,
    EquipmentName,
    Category,
    Description,
    Quantity,
    Status,
    Location,
    DateAdded,
    DateExpired,
    Manufacturer,
    Price,
  } = req.body;

  try {
    let hospital = await HospitalModel.findById(req.session.passport.user);
    if (!hospital) {
      return res.redirect("/login");
    }
    const newEquipment = new EquipmentModel({
      EquipmentId,
      EquipmentName,
      Category,
      Description,
      Quantity,
      Status,
      Location,
      DateAdded,
      DateExpired,
      Manufacturer,
      Price,
      HospitalId: hospital._id,
    });

    await newEquipment.save();
    hospital.MedicalEquipments.push(newEquipment._id);
    await hospital.save();
    res.redirect("/profile");
  } catch (err) {
    console.error("Error adding equipment:", err);
    res.redirect("/addequipment");
  }
});

router.get("/editequipment/:id", isLoggedIn, async (req, res) => {
  try {
    const equipment = await EquipmentModel.findById(req.params.id);
    if (!equipment) {
      return res.redirect("/profile");
    }
    res.render("edit", { equipment });
  } catch (err) {
    console.error("Error fetching equipment:", err);
    res.redirect("/profile");
  }
});

router.post("/editequipment/:id", isLoggedIn, async (req, res) => {
  const {
    EquipmentId,
    EquipmentName,
    Category,
    Description,
    Quantity,
    Status,
    Location,
    DateAdded,
    DateExpired,
    Manufacturer,
    Price,
  } = req.body;

  try {
    await EquipmentModel.findByIdAndUpdate(req.params.id, {
      EquipmentId,
      EquipmentName,
      Category,
      Description,
      Quantity,
      Status,
      Location,
      DateAdded,
      DateExpired,
      Manufacturer,
      Price,
    });
    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating equipment:", err);
    res.redirect("/editequipment/" + req.params.id);
  }
});

router.post("/deleteequipment/:id", async (req, res) => {
  try {
    await EquipmentModel.findByIdAndDelete(req.params.id);
    res.redirect("/profile");
  } catch (err) {
    console.error("Error deleting equipment:", err);
    res.status(500).send("Error deleting equipment");
  }
});

router.get("/lowstock", isLoggedIn, async (req, res) => {
  try {
    const hospital = await HospitalModel.findById(req.session.passport.user);
    if (!hospital) {
      return res.redirect("/login");
    }
    let allequiofuser = await HospitalModel.findById(hospital._id).populate(
      "MedicalEquipments"
    );
    let lowstockequi = allequiofuser.MedicalEquipments.filter(
      (equipment) => equipment.Quantity <= 5
    );
    let expiredequi = allequiofuser.MedicalEquipments.filter((equipment)=> equipment.DateExpired <= Date.now());
    res.render('lowstock' , {lowequipments:lowstockequi , expiredequipments:expiredequi});
  } catch (err) {
    console.error("Error fetching hospital equipment:", err);
    res.redirect("/profile");
  }
});



router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
    }
    res.redirect("/");
  });
});

module.exports = router;
