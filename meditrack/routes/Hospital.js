const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect("mongodb://localhost:27017/meditrack");

const hospitalSchema = create({
  HospitalName:String , 
  HospitalType:String,
  Address:String,
  Contact:String , 
  Email:String,
  Password:String,
  AdminName:String,
  LicenseId:Number,
  YearOfEstblishment:Number,
  MedicalEquipments:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Equipment"
  }
});

hospitalSchema.plugin(plm);
module.exports = mongoose.model("Hospital" , hospitalSchema);

