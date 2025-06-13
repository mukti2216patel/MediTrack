const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const HospitalModel = require("./users");
const EquipmentModel = require("./Equipment");
const dotenv = require('dotenv');
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET;

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
    console.log(err);
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
      return res.redirect("/register");
    }
    if (!hospital.Password) {
      return res.redirect("/register");
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
    let user = await HospitalModel.findById(req.user._id).populate(
      "equipments"
    );
    console.log("User data:", user);
    if (!user) {
      return res.status(404).send("Hospital not found");
    }
    const activeEquipments = user.equipments.filter((equipment) => {
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
    const soon = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    const lowStockEquipments = await EquipmentModel.find({
      HospitalId: req.user._id,
      Quantity: { $lte: 5 },
    });

    const expiredEquipments = await EquipmentModel.find({
      HospitalId: req.user._id,
      DateExpired: { $lt: today },
    });

    const activeLowStockEquipments = lowStockEquipments.filter((equipment) => {
      return !expiredEquipments.some(
        (expired) => expired._id.toString() === equipment._id.toString()
      );
    });

    const expiringSoonEquipments = await EquipmentModel.find({
      HospitalId: req.user._id,
      DateExpired: { $gt: today, $lte: soon }, // ✅ correct field name
    });

    res.render("reminder", {
      user: req.user,
      lowStockEquipments: activeLowStockEquipments,
      expiredEquipments,
      expiringSoonEquipments,
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
    return res
      .status(400)
      .send("This equipment is already registered in this hospital.");
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

  hospital.equipments.push(newEquipment._id);
  await hospital.save();

  res.redirect("/show");
});

router.get("/reminder", isLoggedIn, (req, res) => {
  res.render("reminder", { user: req.user });
});

router.get("/update", async (req, res) => {
  res.render("update", { equipment: undefined });
});

router.post("/update", isLoggedIn, async (req, res) => {
  try {
    const { EquipmentId, EquipmentName, Quantity, Description, DateExpired } =
      req.body;
    console.log({
      EquipmentId,
      EquipmentName,
      Quantity,
      Description,
      DateExpired,
    });
    if (
      !EquipmentId ||
      !EquipmentName ||
      !Quantity ||
      !Description ||
      !DateExpired
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const equipment = await EquipmentModel.findOne({
      EquipmentId,
      HospitalId: req.user._id,
    });
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    const previousQuantity = equipment.Quantity;
    const newQuantity = Number(Quantity);
    if (newQuantity < previousQuantity) {
      const quantityUsed = previousQuantity - newQuantity;
      equipment.UsageDates.push({
        date: new Date(),
        quantityUsed,
      });
    }
    equipment.EquipmentName = EquipmentName;
    equipment.Quantity = newQuantity;
    equipment.Description = Description;
    equipment.DateExpired = DateExpired;
    await equipment.save();
    res.redirect("/show");
  } catch (error) {
    console.error("Error updating equipment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/record", isLoggedIn, async (req, res) => {
  const hospitalId = req.user._id;
  const equipments = await EquipmentModel.find({
    HospitalId: hospitalId,
  }).select("EquipmentId EquipmentName UsageDates");
  console.log(equipments);
  res.render("record", { equipments });
});

router.post("/search", isLoggedIn, async (req, res) => {
  console.log(req.body);
  const { EquipmentId } = req.body;
  console.log(EquipmentId);

  try {
    const hospitalId = req.user._id;

    const equipment = await EquipmentModel.findOne({
      EquipmentId,
      HospitalId: hospitalId,
    });

    console.log(equipment);

    if (equipment) {
      res.render("update", { equipment });
    } else {
      res.render("update", { equipment: undefined });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const hospital = await HospitalModel.findById(req.user._id).populate(
      "equipments"
    );

    if (!hospital) {
      return res.status(404).send("Hospital not found");
    }

    const today = new Date();
    const totalequi = hospital.equipments;

    // Filter active equipment (not expired)
    const activeEquipments = hospital.equipments.filter((equipment) => {
      return !equipment.DateExpired || new Date(equipment.DateExpired) >= today;
    });

    // Filter expired equipment
    const expiredEquipments = hospital.equipments.filter((equipment) => {
      return equipment.DateExpired && new Date(equipment.DateExpired) < today;
    });

    // Filter low stock equipment (stock less than or equal to 5)
    const lowStockEquipments = hospital.equipments.filter((equipment) => {
      return equipment.Quantity <= 5;
    });

    const categoryCount = {
      Diagnostic: await EquipmentModel.countDocuments({
        HospitalId: req.user._id,
        Category: { $in: ["Diagnostic"] },
      }),
      Therapeutic: await EquipmentModel.countDocuments({
        HospitalId: req.user._id,
        Category: { $in: ["Therapeutic"] },
      }),
      Surgical: await EquipmentModel.countDocuments({
        HospitalId: req.user._id,
        Category: { $in: ["Surgical"] },
      }),
      Monitoring: await EquipmentModel.countDocuments({
        HospitalId: req.user._id,
        Category: { $in: ["Monitoring"] },
      }),
      Others: await EquipmentModel.countDocuments({
        HospitalId: req.user._id,
        Category: { $in: ["Others"] },
      }),
    };

    res.render("profile", {
      hospital,
      totalequi,
      activeEquipments,
      expiredEquipments,
      lowStockEquipments,
      categoryCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading profile data");
  }
});

async function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const decoded = await jwt.verify(token, JWT_SECRET);
    req.user = {
      _id: decoded.id,
      Email: decoded.Email,
    };
    next();
  } catch (err) {
    console.error("Error decoding JWT:", err);
    return res.redirect("/login");
  }
}

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
