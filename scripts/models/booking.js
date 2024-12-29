export class Booking extends User {
    constructor(name, email, phone, location, date, time, id) {
      super(name, email, phone, location); //parent constructor
      this._date = date;
      this._time = time;
      this._id = id;
    }
  
    // Getters
    get date() {
      return this._date;
    }
  
    get time() {
      return this._time;
    }
  
    get id() {
      return this._id;
    }
  
    // Setters
    set date(value) {
      this._date = value;
    }
  
    set time(value) {
      this._time = value;
    }
  
    set id(value) {
      this._id = value;
    }
  }
  