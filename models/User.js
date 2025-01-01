const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        required: true,
    },
    accesss_level: {
        type: String,
        required: true,
    },
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;