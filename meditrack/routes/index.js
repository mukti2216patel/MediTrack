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
    const today = new Date();
    let user = await HospitalModel.findById(req.user._id).populate("equipments");
    console.log("User data:", user);
    if (!user) {
      return res.status(404).send("Hospital not found");
    }
    const activeEquipments = user.equipments.filter(equipment => {
      return !equipment.DateExpired || new Date(equipment.DateExpired) >= today;
    });
    res.render("show", { user, activeEquipments });
  } catch (err) {
    res.status(500).send("Error loading equipment data");
  }
});


router.get("/reminder", isLoggedIn, async (req, res) => {
  try {
    const today = new Date();
   
    const lowStockEquipments = await EquipmentModel.find({
      HospitalId: req.user._id,
      Quantity: { $lte: 5 },
    });

    const expiredEquipments = await EquipmentModel.find({
      HospitalId: req.user._id,
      DateExpired: { $lt: today },
    });

    const activeLowStockEquipments = lowStockEquipments.filter(equipment => {
      return !expiredEquipments.some(expired => expired._id.toString() === equipment._id.toString());
    });

    res.render("reminder", {
      user: req.user,
      lowStockEquipments: activeLowStockEquipments,
      expiredEquipments,
    });
  } catch (err) {
    console.error("Error fetching reminder data:", err);
    res.status(500).send("Error loading reminder data");
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

router.get('/update', async (req, res) => {
      res.render('update', { equipment: undefined });
});


router.post('/update', isLoggedIn, async (req, res) => {
  try {
  
      const { EquipmentId, EquipmentName, Quantity, Description, DateExpired } = req.body;
      console.log({ EquipmentId, EquipmentName, Quantity, Description, DateExpired });
      if (!EquipmentId || !EquipmentName || !Quantity || !Description || !DateExpired) {
          return res.status(400).json({ message: 'All fields are required' });
      }
      const equipment = await EquipmentModel.findOne({
        EquipmentId , HospitalId:req.user._id
      })
      console.log(equipment);
      equipment.EquipmentName = EquipmentName;
      equipment.Quantity = Quantity;
      equipment.Description = Description;
      equipment.DateExpired = DateExpired;
      await equipment.save();
      let hospital = await HospitalModel.findOne({_id:req.user._id});
      await hospital.save();
      res.redirect('/show');
  } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

router.post('/update', isLoggedIn, async (req, res) => {
  try {
      const { EquipmentId, EquipmentName, Quantity, Description, DateExpired } = req.body;
      console.log({ EquipmentId, EquipmentName, Quantity, Description, DateExpired });

      if (!EquipmentId || !EquipmentName || !Quantity || !Description || !DateExpired) {
          return res.status(400).json({ message: 'All fields are required' });
      }

      const equipment = await EquipmentModel.findOne({
        EquipmentId,
        HospitalId: req.user._id
      });

      if (!equipment) {
          return res.status(404).json({ message: 'Equipment not found' });
      }

      const previousQuantity = equipment.Quantity;
      const newQuantity = Number(Quantity);

      if (newQuantity < previousQuantity) {
          const quantityUsed = previousQuantity - newQuantity;
          equipment.UsageDates.push({
              date: new Date(),
              quantityUsed
          });
      }
      else if (newQuantity > previousQuantity) {
          const quantityAdded = newQuantity - previousQuantity;
          for (let i = 0; i < quantityAdded; i++) {
              equipment.UsageDates.pop();
          }
      }

      equipment.EquipmentName = EquipmentName;
      equipment.Quantity = newQuantity;
      equipment.Description = Description;
      equipment.DateExpired = DateExpired;

      await equipment.save();
      
      res.redirect('/show');
  } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({ message: 'Server error' });
  }
});



router.post('/search', isLoggedIn, async (req, res) => {
  console.log(req.body);
  const { EquipmentId } = req.body;
  console.log(EquipmentId);
  
  try {  
      // Check if user is logged in and get their hospital ID
      const hospitalId = req.user._id;  // Assuming req.user._id is the HospitalId

      // Search for equipment with both EquipmentId and HospitalId
      const equipment = await EquipmentModel.findOne({ 
          EquipmentId, 
          HospitalId: hospitalId 
      });
      
      console.log(equipment);
      
      if (equipment) { 
          res.render('update', { equipment });  
      } else {
          res.render('update', { equipment: undefined });
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error'); 
  }
});



// router.post('/transfer', isLoggedIn, async (req, res) => {
//   const { EquipmentId, NewHospitalId } = req.body;
  
//   try {
    
//     let equipment = await EquipmentModel.findOne({ 
//       EquipmentId: EquipmentId, 
//       HospitalId: req.user._id  
//     });

//     if (!equipment) {
//       return res.status(404).json({ message: 'Equipment not found in this hospital' });
//     }

//     equipment.HospitalId = NewHospitalId;
//     await equipment.save();

//     await HospitalModel.findByIdAndUpdate(req.user._id, {
//       $pull: { equipments: equipment._id }
//     });

   
//     await HospitalModel.findByIdAndUpdate(NewHospitalId, {
//       $push: { equipments: equipment._id }
//     });

//     res.status(200).json({ message: 'Equipment transferred successfully' });
//   } catch (error) {
//     console.error("Error transferring equipment:", error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


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
