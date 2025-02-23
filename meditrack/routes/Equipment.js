const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/meditrack");

const EquipmentSchema = new mongoose.Schema({
    EquipmentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    EquipmentName: {
        type: String,
        required: true,
        trim: true
    },
    Category: {
        type: [String],
        required: true,
        enum: ['Diagnostic', 'Therapeutic', 'Surgical', 'Monitoring', 'Others'],
    },
    Description: {
        type: String,
        required: true
    },
    Quantity: {
        type: Number,
        required: true,
        min: 0
    },
    Status: {
        type: Boolean,
        default: true 
    },
    Location: {
        type: String,
        required: true
    },
    DateExpired: {
        type: Date,
        required: false
    },
    Manufacturer: {
        type: String,
        required: false
    },
    Price: {
        type: Number,
        required: false,
        min: 0
    },
    HospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
        index: true
    },
    UsageDates: {
        type: [Date], // Array of dates to track each usage
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model("Equipment", EquipmentSchema);
