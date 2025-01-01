const Client = require('./models/Client');

class AppointmentBooking extends Client {
    constructor(name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink) {
        super(name, email, phone, location);

        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.appointmentType = appointmentType;
        this.appointmentStatus = appointmentStatus;
        this.appointmentNotes = appointmentNotes;
        this.meetingLink = meetingLink;
    }

    // Getters
    get clientName() {
        return this.name;
    }

    get clientEmail() {
        return this.email;
    }

    get clientPhone() {
        return this.phone;
    }

    get clientLocation() {
        return this.location;
    }

    get appointmentDate() {
        return this._appointmentDate;
    }

    get appointmentTime() {
        return this._appointmentTime;
    }

    get appointmentType() {
        return this._appointmentType;
    }

    get appointmentStatus() {
        return this._appointmentStatus;
    }

    get appointmentNotes() {
        return this._appointmentNotes;
    }

    get meetingLink() {
        return this._meetingLink;
    }

    // Setters
    set clientName(value) {
        this.name = value;
    }

    set clientEmail(value) {
        this.email = value;
    }

    set clientPhone(value) {
        this.phone = value;
    }

    set clientLocation(value) {
        this.location = value;
    }

    set appointmentDate(value) {
        this._appointmentDate = value;
    }

    set appointmentTime(value) {
        this._appointmentTime = value;
    }

    set appointmentType(value) {
        this._appointmentType = value;
    }

    set appointmentStatus(value) {
        this._appointmentStatus = value;
    }

    set appointmentNotes(value) {
        this._appointmentNotes = value;
    }

    set meetingLink(value) {
        this._meetingLink = value;
    }
}

window.AppointmentBooking = AppointmentBooking;

module.exports = AppointmentBooking;

  