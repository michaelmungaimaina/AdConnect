const mysql = require('mysql2');

// Debug the config
console.log("Database config:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}
);

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root',      
    password: process.env.DB_PASSWORD,  
    database:  process.env.DB_NAME || 'adconnect' 
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database.');

    const createDbQuery = 'CREATE DATABASE IF NOT EXISTS adconnect';
    const createTableUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id varchar(24) PRIMARY KEY ,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(15) NOT NULL,
      access_level VARCHAR(10) NOT NULL,
      created_at VARCHAR(24) NOT NULL,
    );
  `;
  const createEmailTemplates = `
    CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL
);
  `;
  const createTableLeads = `
    CREATE TABLE IF NOT EXISTS clients (
      clientID BIGINT PRIMARY KEY ,
      clientName VARCHAR(255) NOT NULL,
      clientEmail VARCHAR(255) NOT NULL,
      clientPhone VARCHAR(255) NOT NULL,
      clientCity VARCHAR(255) NULL,
      clientCompany VARCHAR(255) NULL,
      clientStreet VARCHAR(255) NULL,
      clientProvince VARCHAR(255) NULL,
      clientZip VARCHAR(255) NULL,
      clientSource VARCHAR(150) DEFAULT 'WEBSITE',
      clientStatus VARCHAR(150) DEFAULT '1st CONTACT',
      clientSubScription VARCHAR(150) DEFAULT 'SUBSCRIBED',
      created_at TIMESTAMP
    );
  `;
  
  // Create Contact info:
    const createTableAppointments = `
    CREATE TABLE IF NOT EXISTS appointments (
    clientId BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULL,
    appointmentDate VARCHAR(255) NOT NULL,
    appointmentTime VARCHAR(255) NOT NULL,
    appointmentType VARCHAR(255) NOT NULL,
    appointmentStatus VARCHAR(255) DEFAULT 'N/ATTENDED',
    appointmentNotes TEXT NULL,
    meetingLink TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `;

    // Create ratings table SQL query
    const createTableMarketingStrategy = `
CREATE TABLE IF NOT EXISTS marketing_strategy (
    applicationDate VARCHAR(30) PRIMARY KEY,
    applicantFName VARCHAR(255) NOT NULL, 
    applicantLName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    occupation VARCHAR(50) NOT NULL,
    marketTriggers TEXT NOT NULL,
    strategyGoal TEXT NOT NULL,
    strategyInvestment TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'N/SOLVED',
    created_at VARCHAR(24)
);`;

       // Create database and tables
    db.query(createDbQuery, (err) => {
        if (err) {
            console.error('Error creating database:', {
                message: err.message,
                code: err.code,
                stack: err.stack,
            });
            return;
        }
        console.log('Database created or already exists.');

        db.changeUser({ database: 'adconnect' }, (err) => {
            if (err) {
                console.error('Error switching to database "elixir_salon":', {
                    message: err.message,
                    code: err.code,
                    stack: err.stack,
                });
                return;
            }
            console.log('Switched to database "elixir_salon".');

            // Helper function to execute and debug queries
            const executeQuery = (query, description) => {
                db.query(query, (err, results) => {
                    if (err) {
                        console.error(`Error executing query for ${description}:`, {
                            query,
                            message: err.message,
                            code: err.code,
                            stack: err.stack,
                        });
                    } else {
                        console.log(`${description} executed successfully.`);
                    }
                });
            };

            // Create leads table
            executeQuery(createTableLeads, 'leads table');

            // Create apointments table
            executeQuery(createTableAppointments, 'appointments table');

            // Create strategy table
            executeQuery(createTableMarketingStrategy, 'market strategy table');
            
            // Close the database connection
            db.end((err) => {
                if (err) {
                    console.error('Error closing the database connection:', {
                        message: err.message,
                        code: err.code,
                        stack: err.stack,
                    });
                } else {
                    console.log('Database connection closed.');
                }
            });
        });
    });
});