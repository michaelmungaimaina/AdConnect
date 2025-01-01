import Client from './models/Client';

export class MarketingStrategyApplication extends Client {
    constructor(name, email, phone, applicantOccupation, currentMarketTriggers, marketingStrategyGoal, investmentMarketingBudget) {
        super(name, email, phone);

        // Split name into first and last name
        const nameParts = name.split(' ');
        this.applicantFName = nameParts[0];  // First word as first name
        this.applicantLName = nameParts.slice(1).join(' '); // Remaining words as last name

        this.applicantOccupation = applicantOccupation;
        this.currentMarketTriggers = currentMarketTriggers;
        this.marketingStrategyGoal = marketingStrategyGoal;
        this.investmentMarketingBudget = investmentMarketingBudget;
    }

    // Getters and Setters
    get applicantFName() {
        return this._applicantFName;
    }

    set applicantFName(value) {
        this._applicantFName = value;
    }

    get applicantLName() {
        return this._applicantLName;
    }

    set applicantLName(value) {
        this._applicantLName = value;
    }

    get applicantEmail() {
        return this.email;
    }

    set applicantEmail(value) {
        this.email = value;
    }

    get applicantPhone() {
        return this.phone;
    }

    set applicantPhone(value) {
        this.phone = value;
    }

    get applicantOccupation() {
        return this.applicantOccupation;
    }

    set applicantOccupation(value) {
        this.applicantOccupation = value;
    }

    get currentMarketTriggers() {
        return this.currentMarketTriggers;
    }

    set currentMarketTriggers(value) {
        this.currentMarketTriggers = value;
    }

    get marketingStrategyGoal() {
        return this.marketingStrategyGoal;
    }

    set marketingStrategyGoal(value) {
        this.marketingStrategyGoal = value;
    }

    get investmentMarketingBudget() {
        return this.investmentMarketingBudget;
    }

    set investmentMarketingBudget(value) {
        this.investmentMarketingBudget = value;
    }
}

window.MarketingStrategyApplication = MarketingStrategyApplication;
module.exports = MarketingStrategyApplication;