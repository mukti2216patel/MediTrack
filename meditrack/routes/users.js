const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect("mongodb://localhost:27017/meditrack");

const HospitalSchema = new mongoose.Schema({
  HospitalName: {
    type: String,
    required: true
  },
  HospitalId:{
    type: String,
    required: true
  },
  HospitalType: {
    type: String,
    required: true
  },
  Address: {
    type: String,
    required: true
  },
  Contact: {
    type: String,
    required: true
  },
  Email: {
    type: String,
    required: true,
    unique: true
  },
  Password: {
    type: String,
    required: true
  },
  AdminName: {
    type: String,
    required: true
  },
  LicenseId: {
    type: Number,
    required: true,
    unique: true
  },
  YearOfEstblishment: {
    type: Number,
    required: true
  },
  MedicalEquipments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment"
  }]
});

HospitalSchema.plugin(plm);

module.exports = mongoose.model("Hospital", HospitalSchema);
