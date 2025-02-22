const mongoose = require('mongoose');

// Define the Hospital schema
const hospitalSchema = new mongoose.Schema({
  HospitalName: {
    type: String,
    required: true,
    trim: true
  },
  HospitalType: {
    type: String,
    required: true,
    trim: true
  },
  HospitalId: {
    type: Number,
    required: true,
    unique: true
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
    unique: true,
    lowercase: true
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
    type: String,
    required: true,
    unique: true
  },
  YearOfEstablishment: {
    type: Number,
    required: true
  },
  equipments: [{  // Reference to the Equipment Model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'  // Reference to Equipment collection
  }]
}, { timestamps: true , autoIndex:false });  // Automatically adds createdAt and updatedAt

// Create and export the Hospital model
const HospitalModel = mongoose.model('Hospital', hospitalSchema);

module.exports = HospitalModel;
