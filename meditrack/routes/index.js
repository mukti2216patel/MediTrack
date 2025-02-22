const express = require("express");
const router = express.Router();
const HospitalModel = require("./users");
const EquipmentModel = require("./Equipment");
const passport = require("passport");
const localStrategy = require('passport-local');
passport.use(new localStrategy(HospitalModel.authenticate()));

function isLoggedIn(req, res, next) {
    console.log("Authenticated:", req.isAuthenticated());  // Log the authentication status
   
  console.log(req);
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

router.get("/", (req, res) => {
  res.render("login");
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
    YearOfEstablishment
  } = req.body;
  
  try {
    let existHospital = await HospitalModel.findOne({ LicenseId });
    if (existHospital) {
      console.log("Hospital already exists:", existHospital);
      return res.redirect("/login");  // Redirect to login if hospital exists
    }

    const newHospital = new HospitalModel({
      HospitalName,
      HospitalType,
      Address,
      Contact,
      Email,
      AdminName,
      LicenseId,
      YearOfEstablishment
    });

    HospitalModel.register(newHospital, req.body.Password).then(
      function(){
        passport.authenticate('local')(req , res,function(){
          res.redirect('/profile');
        })
      }
    )
  } catch (err) {
    console.log("Error during registration:", err);
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
    successRedirect: "/profile"
  })
);

router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", { user: req.user }); // Pass the user data to the profile page
});


// Logout Route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
