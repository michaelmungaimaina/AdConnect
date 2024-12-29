/**
 * The Client Model for keeping the lead cpture data
 */

export class Client {
    constructor(clientId, clientName, clientEmail, clientPhone, clientCompay, clientLocation, clientStreet, clientProvince, clientZipCode) {
      this._clientID = clientId;
      this._clientName = clientName;
      this._clientEmail = clientEmail;
      this._clientPhone = clientPhone;
      this._clientCity = clientLocation;
      this._clientCompany = clientCompay;
      this._clientStreet = clientStreet;
      this._clientProvince = clientProvince;
      this._clientZip = clientZipCode;
    }
  
    // Getters
    get clientId() {
      return this._clientID;
    }
    get clientName() {
      return this._clientName;
    }
  
    get clientEmail() {
      return this._clientEmail;
    }
  
    get clientPhone() {
      return this._clientPhone;
    }
  
    get clientLocation() {
      return this._clientCity;
    }

    get clientCompany() {
      return this._clientCompany;
    }

    get clientProvince() {
      return this._clientProvince;
    }

    get clientStreet() {
      return this._clientStreet;
    }

    get clientZipCode() {
      return this._clientZip;
    }
  
    // Setters
    set clientId(value) {
      this._clientID = value;
    }
    set clientName(value) {
      this._clientName = value;
    }
  
    set clientEmail(value) {
      this._clientEmail = value;
    }
  
    set clientPhone(value) {
      this._clientPhone = value;
    }
  
    set clientLocation(value) {
      this._clientCity = value;
    }
    
    set clientCompany(value) {
      this._clientCompany = value;
    }

    set clientProvince(value) {
      this._clientProvince = value;
    }

    set clientStreet(value) {
      this._clientStreet = value;
    }

    set clientZipCode(value) {
      this._clientZip = value;
    }
    
  }
  