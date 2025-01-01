const mongoose = require('mongoose');

// Define the schema
const marketingStrategyApplicationSchema = new mongoose.Schema({
    applicantFName: {
        type: String,
        required: true
    },
    applicantLName: {
        type: String,
        required: true
    },
    applicantEmail: {
        type: String,
        required: true
    },
    applicantPhone: {
        type: String,
        required: true
    },
    applicantOccupation: {
        type: String,
        required: true
    },
    currentMarketTriggers: {
        type: String,
        required: true
    },
    marketingStrategyGoal:{
        type: String,
        required: true
    },
    investmentMarketingBudget: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'creationDate', 
        updatedAt: 'modificationDate' 
      }
});

// Create the model
const MarketingStrategyApplication = mongoose.model('MarketingStrategyApplication', marketingStrategyApplicationSchema);

module.exports = MarketingStrategyApplication;