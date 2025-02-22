var express = require('express');
var router = express.Router();
const HospitalModel = require('./Hospital');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy(userModel.authenticate()));
const EquipmentModel = require('./Equipment');

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  let { HospitalName, HospitalType, Address, Contact, Email, Password, AdminName, LicenseId, YearOfEstablishment } = req.body;
  
  try {
    let existHospital = await HospitalModel.findOne({ LicenseId });
    if (existHospital) {
      return res.redirect('/login');
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
    await HospitalModel.register(newHospital, Password);
    passport.authenticate('local')(req, res, () => {
      res.redirect('/profile');
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.redirect('/register');
  }
});

router.get('/login' , async(req , res)=>{
  res.render('login');
})

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/',
  successRedirect: '/profile',
}));

router.get('/profile' , isLoggedIn , (req , res)=>{
    res.render('profile');
});

router.get('/addequipment' , isLoggedIn , (req , res)=>{
  res.render('Add');
})

router.post('/addequipment' , isLoggedIn , (req , res)=>{
    let{}
})


router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});
module.exports = router;
