const mongoose = require('mongoose');

// Define the schema
const clientSchema = new mongoose.Schema({
    clientID: {
        type: String,
        required: true,
        unique: true
    },
  clientName: {
    type: String,
    required: true,
  },
  clientEmail: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  clientPhone: {
    type: String,
    required: true
  },
  clientCompany: {
    type: String,
    default: 'N/A',
    trim: true
  },
  clientLocation: {
    type: String,
    default: 'N/A',
    trim: true
  },
  clientStreet: {
    type: String,
    default: 'N/A',
    trim: true
  },
  clientProvince: {
    type: String,
    default: 'N/A',
    trim: true
  },
  clientZip: {
    type: String,
    default: '0000',
    trim: true
  }
}, {
    timestamps: {
        createdAt: 'creationDate', 
        updatedAt: 'modificationDate' 
      }
});

clientSchema.index({ clientEmail: 1 });  // Add index for clientEmail field
clientSchema.index({ clientPhone: 1 });  // Add index for clientPhone field

// Create the model
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;