const mongoose = require('mongoose');

// Define the schema
const appointmentBookingSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    clientEmail: {
        type: String,
        required: true
    },
    clientPhone: {
        type: String,
        required: true
    },
    clientLocation: {
        type: String,
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    appointmentType: {
        type: String,
        required: true
    },
    appointmentStatus: {
        type: String,
        required: true
    },
    appointmentNotes: {
        type: String,
        required: true
    },
    meetingLink: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'creationDate', 
        updatedAt: 'modificationDate' 
      }
});

const AppointmentBooking = mongoose.model('AppointmentBooking', appointmentBookingSchema);

module.exports = AppointmentBooking;