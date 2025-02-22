const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect("mongodb://localhost:27017/meditrack");

const EquipmentSchema = create({
    EquipmentId:String,
    EquipmentName:String,
    Category:Array,
    Description:String,
    Quantity:Number,
    Status:Boolean,
    Location:String,
    DateAdded:Date,
    DateExpired:Date,
    HospitalId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Hospital'
    }
});
EquipmentSchema.plugin(plm);
module.exports = mongoose.model("Equipment" , EquipmentSchema);
