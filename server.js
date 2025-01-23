require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const moment = require("moment-timezone");
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.json());
// Enable CORS for all origins
app.use(cors());

app.use(cors({
    origin: ['127.0.0.1'], // frontend domains
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Serve API routes under `/api`
app.use('/api', express.json()); // Ensure requests to `/api` parse JSON bodies

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

/*/ Handle frontend routing by redirecting all non-API requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});*/

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));

    // MySQL Connection
// Create a connection pool to your SQL database hosted on Truehost
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root',      
    password: process.env.DB_PASSWORD,  
    database:  process.env.DB_NAME || 'adconnect' 
});

async function connectAndStartServer() {
    try {
        // Get a connection from the pool
        const connection = await db.getConnection();
        
        console.log('Connected to MySQL database.');

        // Start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on ${process.env.APP_API_URL}:${PORT}`);
        });

        // Release the connection back to the pool
        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

// Call the function to start the server
connectAndStartServer();

// Endpoint to create a user
app.post('/api/users', async (req, res) => {
    try {
        console.log(req.body); 
        const {name, email, password, role, access_level } = req.body;

        // Validate input data
        if (!name || !email || !password || !role || !access_level) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // SQL query to fetch a user by ID and EMAIL
        const query1 = 'SELECT * FROM users WHERE name = ? AND email = ?';

        // Execute the query
        const [rows] = await db.execute(query1, [name, email]);

        // Check if a user was found
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User Already Exists!' });
        }

        // SQL query to insert the new user
        const query = `
            INSERT INTO users (id, name, email, password, role, access_level, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the query
        const [result] = await db.execute(query, [clientID, name, email, password, role, access_level, createdAt]);

        console.log(result);

        // Respond with success message
        res.status(200).json({
            message: 'User created successfully',
            user: {
                clientID,
                name,
                email,
                password,
                role,
                access_level,
                createdAt
            }
        });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the user' });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        // SQL query to fetch all users
        const query = 'SELECT * FROM users';

        // Execute the query
        const [users] = await db.execute(query);

        // Respond with the list of users
        res.status(200).json(users);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching users' });
    }
});

// Get a single user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // SQL query to fetch a user by ID
        const query = 'SELECT * FROM users WHERE id = ?';

        // Execute the query
        const [rows] = await db.execute(query, [userId]);

        // Check if a user was found
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with the user
        res.status(200).json(rows[0]);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the user' });
    }
});

// Update a user by ID
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const {name, email, password, role, access_level, created_at } = req.body;

        // Check if the user exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user in the database
        const query = `
            UPDATE users 
            SET name = ?, email = ?, password = ?, role = ?, access_level = ?, created_at = ?
            WHERE id = ?
        `;
        await db.execute(query, [name, email, password, role, access_level, createdAt, userId]);

        // Respond with a success message
        res.status(200).json({ 
            message: 'User updated successfully', 
            user: { id: userId, name, email, password, role, access_level , createdAt} 
        });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the user' });
    }
});


// Delete a user by ID
app.delete('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('Deleting user with ID:', userId);

        // Check if the user exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        console.log('Existing user:', existingUser);

        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // SQL query to delete the user
        const query = 'DELETE FROM users WHERE id = ?';
        console.log('SQL Query:', query, 'Params:', [userId]);

        await db.execute(query, [userId]);

        // Respond with a success message
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error details:', error.message || error);
        res.status(500).json({ error: 'An error occurred while deleting the user' });
    }
});

// Format timestamp for EAT
const clientID = moment().tz("Africa/Nairobi").format("YYYYMMDDHHmmssSSS");
const createdAt = moment().tz("Africa/Nairobi").format("YYYY-MM-DD HH:mm:ss:SS");
// Create a new client (lead)
app.post('/api/clients', async (req, res) => {
    try {
        console.log(req.body); // Log the request body for debugging
        const { clientId, clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription } = req.body;

        // Check if any of the variables are null
        if (clientId === null || clientName === null || clientEmail === null || clientPhone === null || clientCompany === null || clientLocation === null || clientStreet === null || clientProvince === null || clientZipCode === null || clientSource === null || clientStatus === null || clientSubScription === null) {
            return res.status(400).json({ error: 'All fields are required and cannot be null' });
        }

        // Check if the client already exists based on email or phone
        const checkQuery = `
            SELECT * FROM clients 
            WHERE clientEmail = ? OR clientPhone = ?
        `;
        const [existingClient] = await db.execute(checkQuery, [clientEmail, clientPhone]);

        if (existingClient.length > 0) {
            const errorMessage = existingClient[0].clientEmail === clientEmail
                ? 'Email already exists'
                : 'Phone number already exists';
            return res.status(400).json({error:`${errorMessage}` });
        }

        // Insert the new client into the database
        const insertQuery = `
            INSERT INTO clients (clientID, clientName, clientEmail, clientPhone, clientCity, clientCompany, clientStreet, clientProvince, clientZip, clientSource, clientStatus, clientSubScription,created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.execute(insertQuery, [`${clientID}`, clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription, `${createdAt}`]);

        // Respond with success
        res.status(201).json({ message: 'Lead created successfully', lead: { clientId: `${clientID}`, clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription} });
    } catch (error) {
        console.error(`Backend Error: `, error); // Log the error for debugging
        res.status(500).json({ error: `${error.message}` }); // Send the error message in the response
    }
});


// Get all clients (leads)
app.get('/api/clients', async (req, res) => {
    try {
        // SQL query to fetch all clients
        const query = 'SELECT * FROM clients';

        // Execute the query
        const [clients] = await db.execute(query);

        // Respond with the list of clients
        res.status(200).json(clients);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the clients' });
    }
});


// Get a single client (lead) by ID
app.get('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;

        // SQL query to fetch the client by ID
        const query = 'SELECT * FROM clients WHERE id = ?';
        
        // Execute the query
        const [clients] = await db.execute(query, [clientId]);

        // Check if client exists
        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Respond with the client
        res.status(200).json(clients[0]);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the client' });
    }
});

app.post('/api/sendSubsequentEmail', async (req, res) => {
    const { clientID } = req.body;
    console.log(clientID)
    try {
        // Get client details
        const [client] = await db.execute('SELECT * FROM clients WHERE clientID = ?', [clientID]);
        console.log(client)
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        console.log(`Client Subscription Value: "${client[0].clientSubScription}`);
        if (client[0].clientSubScription?.trim().toUpperCase() !== 'SUBSCRIBED') {
            return res.status(400).json({ error: 'Client is not subscribed to marketing emails' });
        }

        // Fetch email template based on current status
        const [template] = await db.execute('SELECT subject, body FROM email_templates WHERE status = ?', [
            client[0].clientStatus,
        ]);

        if (!template) {
            return res.status(404).json({ error: `No email template found for status: ${client.clientStatus}` });
        }

        // Replace placeholders
        const emailBody = template.body
           .replace(/\$\{clientName\}/g, client[0].clientName);
        //const emailBody = template[0].body.replace('[NAME]', client[0].clientName);

        // Send email
        await sendSubSequentEmail(client[0].clientEmail, template[0].subject, emailBody);

        // Increment client status
        const statusOrder = [
            '1ST CONTACT',
            '2ND CONTACT',
            '3RD CONTACT',
            '30TH CONTACT',
            '5TH CONTACT'
            // Add up to '30TH CONTACT'
        ];
        const currentStatusIndex = statusOrder.indexOf(client[0].clientStatus.trim().toUpperCase());
        const newStatus =
            currentStatusIndex !== -1 && currentStatusIndex < statusOrder.length - 1
                ? statusOrder[currentStatusIndex + 1]
                : client[0].clientStatus; // Keep current status if it's the last one

        // Update client status and timestamp
        await db.execute(
            `UPDATE clients SET clientStatus = ?, created_at = ? WHERE clientID = ?`,
            [newStatus, createdAt, clientID]
        );

        res.status(200).json({ message: 'Email sent and status updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while sending the email' });
    }
});

// Endpoint to fetch email template by status
app.get('/api/emailTemplate', async (req, res) => {
    try {
        const { status } = req.query;

        // Validate that the status is provided
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        // Query the database for the template corresponding to the provided status
        const query = 'SELECT subject, body FROM email_templates WHERE status = ?';
        const [result] = await db.execute(query, [status]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'No email template found for this status' });
        }

        // Respond with the template details
        res.status(200).json({
            subject: result[0].subject,
            body: result[0].body,
        });
    } catch (error) {
        console.error('Error fetching email template:', error);
        res.status(500).json({ error: 'An error occurred while fetching the email template' });
    }
});

// Unsubscribe a lead by ID
app.put('/api/unsubscribeLead', async (req, res) => {
    const { clientID } = req.body;
    try {
        if (!clientID) {
            return res.status(404).json({ error: 'No Lead Id Passed' });
        }

        // Update client status and timestamp
        await db.execute(
            `UPDATE clients SET clientSubScription = ?, created_at = ? WHERE clientID = ?`,
            ['UNSUBSCRIBED', createdAt, clientID]
        );

        res.status(200).json({ message: 'Lead Unsubscribed Successfully!' });
    } catch(error){
        console.error(error);
        res.status(500).json({ error: 'An error occurred while unsubscribing!' });
    }
});

// Update a lead by ID
app.put('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { clientEmail, clientPhone, clientName, company, ...otherFields } = req.body;

        // SQL query to check if the client exists
        const checkQuery = 'SELECT * FROM clients WHERE id = ?';
        const [existingClient] = await db.execute(checkQuery, [clientId]);

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SQL query to update the client
        const updateQuery = `
            UPDATE clients
            SET clientEmail = ?, clientPhone = ?, clientName = ?, company = ?, updated_at = CURRENT_TIMESTAMP
            ${Object.keys(otherFields).length > 0 ? `, ${Object.keys(otherFields).map(field => `${field} = ?`).join(', ')}` : ''}
            WHERE id = ?
        `;

        // Collect values to update
        const updateValues = [clientEmail, clientPhone, clientName, company, ...Object.values(otherFields), clientId];

        // Execute the update query
        await db.execute(updateQuery, updateValues);

        // Respond with the updated client data
        res.status(200).json({
            message: 'Lead updated successfully',
            client: { clientId, clientEmail, clientPhone, clientName, company, ...otherFields }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the lead' });
    }
});


// Delete a lead by ID
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;

        // SQL query to check if the client exists
        const checkQuery = 'SELECT * FROM clients WHERE clientID = ?';
        const [existingClient] = await db.execute(checkQuery, [clientId]);

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SQL query to delete the client
        const deleteQuery = 'DELETE FROM clients WHERE clientID = ?';
        await db.execute(deleteQuery, [clientId]);

        // Respond with a success message
        res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the lead' });
    }
});


// Create a new appointment booking
app.post('/api/appointments', async (req, res) => {
    try {
        console.log(req.body);

        const { 
            clientName, 
            clientEmail, 
            clientPhone, 
            clientLocation,
            appointmentDate, 
            appointmentTime, 
            appointmentType, 
            appointmentStatus, 
            appointmentNotes, 
            meetingLink 
        } = req.body;

        // Check if all required fields are provided
        if (!appointmentDate || !clientPhone) {
            return res.status(400).json({ error: 'Missing required fields: appointmentDate, or service' });
        }

        // SQL query to insert a new appointment
        const insertQuery = `
            INSERT INTO appointments (clientId,name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the insert query
        const [result] = await db.execute(insertQuery, [clientID, clientName, clientEmail, clientPhone, clientLocation, 
            appointmentDate, appointmentTime, appointmentType, appointmentStatus, 
            appointmentNotes, meetingLink]);

        // Respond with the newly created appointment
        res.status(201).json({
            message: 'Appointment Booked successfully',
            appointment: {
                //id: result.insertId, // Auto-generated ID after insertion
                clientID, clientName, clientEmail, clientPhone, clientLocation, 
        appointmentDate, appointmentTime, appointmentType, appointmentStatus, 
        appointmentNotes, meetingLink
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while booking the appointment' });
    }
});


// Get all appointments
app.get('/api/appointments', async (req, res) => {
    try {
        console.log('Getting all appointments');

        // SQL query to fetch all appointments
        const query = 'SELECT * FROM appointments';

        // Execute the query
        const [appointments] = await db.execute(query);

        // Respond with the fetched appointments
        res.status(200).json({
            message: 'Appointment(s) retrieved successfully',
            appointments
        });
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: 'An error occurred while retrieving appointments' });
    }
});


// Get a single appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        // SQL query to fetch the appointment by ID
        const query = 'SELECT * FROM appointments WHERE clientId = ?';

        // Execute the query with the appointment ID
        const [appointment] = await db.execute(query, [appointmentId]);

        // If the appointment does not exist, return 404
        if (appointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Respond with the fetched appointment
        res.status(200).json(appointment[0]);
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: 'An error occurred while retrieving the appointment' });
    }
});

app.get('/api/appointments-by-date/:appointmentDate', async (req, res) => {
    try {
        const appointmentDate = req.params.appointmentDate;

        // Log the input date for debugging
        console.log('Received appointmentDate:', appointmentDate);

        // Fetch appointments from the database
        const query = 'SELECT appointmentTime FROM appointments WHERE appointmentDate = ?';
        const [appointments] = await db.execute(query, [appointmentDate]);

        // Log the database result
        console.log('Database response:', appointments);

        if (appointments.length === 0) {
            return res.status(404).json({ error: 'No appointments found for the given date' });
        }

        res.status(200).json({
            message: 'Appointment time(s) retrieved successfully',
            appointmentTime: appointments,
        });
    } catch (error) {
        console.error('Backend Error:', error);
        res.status(500).json({ error: 'An error occurred while retrieving appointment times' });
    }
});



// Update an appointment by ID
app.put('/api/appointments/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { clientId, appointmentDate, service, status, notes } = req.body;

        // SQL query to check if the appointment exists
        const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';
        const [existingAppointment] = await db.execute(checkQuery, [appointmentId]);

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to update the appointment
        const updateQuery = `
            UPDATE appointments 
            SET clientId = ?, name = ?, email = ?, phone = ?, location = ?, appointmentDate = ?, appointmentTime = ?, appointmentType = ?, status = ?, notes = ?, meetingLink = ?
            WHERE clientId = ?
        `;

        // Execute the update query
        await db.execute(updateQuery, [clientId, appointmentDate, service, status, notes, appointmentId]);

        // Respond with a success message
        console.log('Appointment updated successfully');
        res.status(200).json({
            message: 'Appointment updated successfully',
            appointment: {
                id: appointmentId,
                clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, status, notes, meetingLink
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: 'An error occurred while updating the appointment' });
    }
});


// Delete an appointment by ID
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        // SQL query to check if the appointment exists
        const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';
        const [existingAppointment] = await db.execute(checkQuery, [appointmentId]);

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to delete the appointment
        const deleteQuery = 'DELETE FROM appointments WHERE clientId = ?';
        await db.execute(deleteQuery, [appointmentId]);

        // Respond with a success message
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: 'An error occurred while deleting the appointment' });
    }
});


// Create a new marketing strategy application
app.post('/api/marketing-strategy-applications', async (req, res) => {
    try {
        console.log(req.body);

        // Extract the necessary fields from the request body
        const { applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status} = req.body;

        // SQL query to insert a new application
        const insertQuery = `
            INSERT INTO marketing_strategy (applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the query to insert the new application into the database
        const [result] = await db.execute(insertQuery, [`${clientID}`, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status, `${createdAt}`]);

        // Respond with a success message and the inserted application data
        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: result.applicationId, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(400).json({ error: error.message });
    }
});


// Get all marketing strategy applications
app.get('/api/marketing-strategy-applications', async (req, res) => {
    try {
        console.log('Getting all applications');

        // SQL query to get all applications from the database
        const selectQuery = 'SELECT * FROM marketing_strategy';

        // Execute the query to fetch the applications
        const [applications] = await db.execute(selectQuery);

        // Respond with a success message and the list of applications
        res.status(200).json({
            message: 'Application(s) retrieved successfully',
            applications
        });
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});


// Get a single marketing strategy application by ID
app.get('/api/marketing-strategy-applications/:id', async (req, res) => {
    try {
        const applicationId = req.params.id;

        // SQL query to fetch the application by ID
        const selectQuery = 'SELECT * FROM marketing_strategy WHERE applicationId = ?';
        
        // Execute the query to get the application
        const [application] = await db.execute(selectQuery, [applicationId]);

        // If no application found, return a 404 error
        if (application.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Respond with the application data
        res.status(200).json(application[0]);
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});


// Update a marketing strategy application by ID
app.put('/api/marketing-strategy-applications/:id', async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status } = req.body;

        // SQL query to check if the application exists
        const checkQuery = 'SELECT * FROM marketing_strategy WHERE applicationId = ?';
        const [existingApplication] = await db.execute(checkQuery, [applicationId]);

        // If the application does not exist, return 404
        if (existingApplication.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // SQL query to update the application
        const updateQuery = `
            UPDATE marketing_strategy_applications
            SET applicationDate = ?, applicantFName = ?, applicantLName = ?, email = ?, phone = ?, occupation = ?, marketTriggers = ?, strategyGoal = ?, status = ?
            WHERE applicationId = ?
        `;

        // Execute the query to update the application
        await db.execute(updateQuery, [
            applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status
        ]);

        // Respond with a success message and the updated application data
        res.status(200).json({
            message: 'Application updated successfully',
            application: {
                id: applicationId,
                applicationDate, applicantName, email, phone, occupation, marketTriggers, strategyGoal, status
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});


/**
 * Send a welcome email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendWelcomeEmail(clientName, clientEmail) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Welcome to Adconnect â€“ Your Partner in Real Estate Marketing Success ðŸŽ‰',
        html: `
           <body style="font-family: Arial, sans-serif; color: #fff; padding: 20px">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(to right, #4d4c4b, #646464);
      border-radius: 10px;
    ">
        <p style="line-height: 1.5;">
            Hello <span style="font-weight: bold;">${clientName},</span> Misgina Fitwi Here,
        </p>
        <p style="line-height: 1.5;">
            Welcome to <a href="www.adconnet.co.ke" style="color: #4abc4f;
            font-weight: bold;
            font-size: large;
            transition: color 0.3s ease;
            text-decoration: none;">Adconnect!</a> Weâ€™re
            thrilled to have you on board ðŸŽ‰.
        </p>
        <p style="line-height: 1.5;">
            Our mission is simple: to help real estate companies like yours succeed
            through powerful, targeted ads, professional social media management, and
            more. At <a href="https://adconnect.co.ke" style="color: #4abc4f;
            font-weight: bold;
            font-size: large;
            transition: color 0.3s ease;
            text-decoration: none;">AdConnect</a>, we
            know that your success is our success ðŸ’ª.
        </p>
        <p style="line-height: 1.5;">Here's what you can expect:</p>
        <ul>
            <li>
                âœ¨ Proven strategies to attract and convert leads through Facebook and
                social media advertising.
            </li>
            <li>
                ðŸ”§ Expert support from our experienced developers, content editors, and
                marketing professionals.
            </li>
            <li>
                ðŸ“ˆ Ongoing guidance to keep your digital marketing at the cutting edge.
            </li>
        </ul>
        <p style="line-height: 1.5;">Weâ€™re here to take the complexity out of digital marketing for you.</p>
        <p style="line-height: 1.5;">
            <a href="https://adconnect.co.ke/index.html?value-video-opt-in=true" style="display: inline-block;
            padding: 5px 30px;
            background-color: #f65730;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
            text-decoration: none;
            transition: background-color 0.3s ease;">
                Book a Free Consultation Today
            </a>
        </p style="line-height: 1.5;">
        <p style="line-height: 1.5;">Looking forward to helping you grow!</p>
        <p style="line-height: 1.5;">Warm regards,<br /></p>
        <p style="line-height: 1.5;">
            Misgina Fitwi<br />
            <a href="https://adconnect.co.ke" style="color: #4abc4f;
        text-decoration: none;">Adconnect Team</a><br />
            Phone: 0790064130
        </p>
        <footer style="text-align: center;
        margin-top: 30px;
        color: #fff;
        font-size: 14px;">
            <p style="font-size: x-large; font-weight: bolder; color: #6d6d6d">
                Powered By <br /><span style="color: #4abc4f;
                font-weight: bold;
                font-size: large;
                transition: color 0.3s ease;
                text-decoration: none;">AdConnect</span>
            </p>
            <p style="line-height: 1.5;">
                <a href="https://adconnect.co.ke/unsubscribe" style="color: #f65730;
                text-decoration: none;
                margin-top: -10px;">Unsubscribe</a>
            </p>
        </footer>
    </div>
</body>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully!');
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
} 
/**
 * Send a welcome email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendBookingEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Meeting Confirmation: Consultation with Adconnect Team',
        html: `
           <body style="font-family: Arial, sans-serif; color: #fff; padding: 20px">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(to right, #4d4c4b, #646464);
      border-radius: 10px;
    ">
        <p style="line-height: 1.5;">
            Dear <span style="font-weight: bold;">${clientName},</span>
        </p>
        <p style="line-height: 1.5;">
            We are writing to confirm that you have scheduled a consultation meeting with us as follows:.
        </p>
        <p style="line-height: 1.5;"> <br>
            <b>Date: </b> ${meetingDate}. <br>
            <b>Time: </b> ${meetingTime} EAT. <br>
            <b>Location: </b> ${meetingLocation}. <br>
            <b>Agenda: </b> ${meetingAgenda}. <br>
            <br>
        </p>
        <p style="line-height: 1.5;">
            <a href='${meetingLink}' style="display: inline-block;
            padding: 5px 30px;
            background-color: #f65730;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
            text-decoration: none;
            transition: background-color 0.3s ease;">
                Proceed to Meeting
            </a>
            </p>
        <p style="line-height: 1.5;">If you have any questions or need to reschedule, don't hesitate to contact the undersigned.</p>
       
        <p style="line-height: 1.5;">Looking forward to connecting with you.</p>

        <p style="line-height: 1.5;">Warm regards,<br /></p>
        <p style="line-height: 1.5;">
            Misgina Fitwi<br />
            <a href="https://adconnect.co.ke" style="color: #4abc4f;
        text-decoration: none;">Adconnect Team</a><br />
            Phone: 0790064130
        </p>
        <footer style="text-align: center;
        margin-top: 30px;
        color: #fff;
        font-size: 14px;">
            <p style="font-size: x-large; font-weight: bolder; color: #6d6d6d">
                Powered By <br /><span style="color: #4abc4f;
                font-weight: bold;
                font-size: large;
                transition: color 0.3s ease;
                text-decoration: none;">AdConnect</span>
            </p>
            <p style="line-height: 1.5;">
                <a href="https://adconnect.co.ke/unsubscribe" style="color: #f65730;
                text-decoration: none;
                margin-top: -10px;"></a>
            </p>
        </footer>
    </div>
</body>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Booking email sent successfully!');
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
}

/**]
 * Function for sending follow-up emails
 */
async function sendSubSequentEmail(to, subject, body) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: `${to}`, // Recipient email
        subject: `${subject}`,
        html: `${body}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Follow-Up Email sent successfully!');
    } catch (error) {
        console.error('Error sending follow-up email:', error);
        throw error;
    }
}

/**
 * Send a email to admin
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendBookingReactionEmail(clientName, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: 'info@adconnect.co.ke', // Recipient email
        subject: `New Appointment - ${clientName}`,
        html: `
           <body style="font-family: Arial, sans-serif; color: #fff; padding: 20px">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(to right, #4d4c4b, #646464);
      border-radius: 10px;
    ">
        <p style="line-height: 1.5;">
            A new appointment has been scheduled:
        </p>
        <p style="line-height: 1.5;"> <br>
            <b>Client Name: </b> ${clientName}. <br>
            <b>Date: </b> ${meetingDate}. <br>
            <b>Time: </b> ${meetingTime} EAT. <br>
            <b>Location: </b> ${meetingLocation}. <br>
            <b>Agenda: </b> ${meetingAgenda}. <br>
            <br>
        </p>
        <p style="line-height: 1.5;">
            <a href='${meetingLink}' style="display: inline-block;
            padding: 5px 30px;
            background-color: #f65730;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
            text-decoration: none;
            transition: background-color 0.3s ease;">
                Proceed to Meeting
            </a>
            </p>
            
        <footer style="text-align: center;
        margin-top: 30px;
        color: #fff;
        font-size: 14px;">
            <p style="font-size: x-large; font-weight: bolder; color: #6d6d6d">
                Powered By <br /><span style="color: #4abc4f;
                font-weight: bold;
                font-size: large;
                transition: color 0.3s ease;
                text-decoration: none;">AdConnect</span>
            </p>
            <p style="line-height: 1.5;">
                <a href="https://adconnect.co.ke/unsubscribe" style="color: #f65730;
                text-decoration: none;
                margin-top: -10px;"></a>
            </p>
        </footer>
    </div>
</body>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Booking email sent successfully!');
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
}

app.post('/api/send-booking-reaction-email', async (req, res) => {
    const { clientName,  meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink } = req.body;

    if (!clientName || !meetingDate || !meetingTime || !meetingLocation || !meetingAgenda || !meetingLink) {
        console.log('All fields are required');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        console.log(req.body);
        await sendBookingReactionEmail(clientName, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink);
        console.log('Booking email sent successfully');
        res.status(200).json({ message: 'Reaction email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

app.post('/api/send-booking-email', async (req, res) => {
    const { clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink } = req.body;

    if (!clientName || !clientEmail || !meetingDate || !meetingTime || !meetingLocation || !meetingAgenda || !meetingLink) {
        console.log('All fields are required');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        console.log(req.body);
        await sendBookingEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink);
        console.log('Booking email sent successfully');
        res.status(200).json({ message: 'Booking email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Send a welcome email to the client
app.post('/api/send-welcome-email', async (req, res) => {
    const { clientName, clientEmail } = req.body;

    if (!clientName || !clientEmail) {
        console.log('Client name and email are required');
        return res.status(400).json({ error: 'Client name and email are required' });
    }

    try {
        console.log(req.body);
        await sendWelcomeEmail(clientName, clientEmail);
        console.log('Welcome email sent successfully');
        res.status(200).json({ message: 'Welcome email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Configure the Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Your mail server domain
    port: process.env.SMTP_PORT, // Typically 587 for TLS or 465 for SSL
    secure: true, // True for SSL, false for TLS
    auth: {
        user: process.env.EMAIL_USER, // email from the .env file
        pass: process.env.EMAIL_PASS, // email password or app password
    },
});

// Load your OAuth2 credentials
const credentialsPath = path.join(__dirname, 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Initialize OAuth2 client
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Token file path (to store access and refresh tokens)
const tokenPath = path.join(__dirname, 'token.json');

// Get and store the token (for one-time authorization)
async function getAndStoreToken() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Ensures a refresh token is returned
        scope: ['https://www.googleapis.com/auth/calendar'], // The required scope for calendar access
    });

    console.log('Authorize this app by visiting this URL:', authUrl);

    // After visiting the URL, paste the authorization code here
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from the page: ', async (code) => {
        rl.close();

        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);

            // Save the token to a file for later use
            fs.writeFileSync(tokenPath, JSON.stringify(tokens));
            console.log('Token stored to', tokenPath);
        } catch (err) {
            console.error('Error retrieving access token', err);
        }
    });
}

// Set credentials (load tokens from file)
function setCredentials() {
    if (fs.existsSync(tokenPath)) {
        const token = fs.readFileSync(tokenPath, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        console.error('No token file found. Run `getAndStoreToken` to authorize the app.');
    }
}

// Function to convert "2025-01-20 10:00:00" into the ISO 8601 format "2025-01-20T10:00:00-07:00"
function convertToISO8601(dateTimeString) {
    const [date, time] = dateTimeString.split(' ');  // Split the date and time
    const formattedDateTime = new Date(`${date}T${time}+03:00`);  // Append time zone offset
    return formattedDateTime.toISOString();  // Convert to ISO format
}

// Create a Google Meet Link (via Calendar Event)
async function createMeetLink(summary, startDateTime, endDateTime) {
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    try {
        const event = {
            summary: summary || 'Adconnect Online Consultation', // Replace with your event summary
            start: {
                dateTime: convertToISO8601(startDateTime), // Replace with your time
                timeZone: 'Africa/Nairobi',
            },
            end: {
                dateTime: convertToISO8601(endDateTime), //'2025-01-20T11:00:00-07:00' Replace with your time
                timeZone: 'Africa/Nairobi',
            },
            conferenceData: {
                createRequest: {
                    requestId: 'random-string-or-id',
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        const hangoutLink =
            response.data.conferenceData?.entryPoints?.find(
                (point) => point.entryPointType === 'video'
            )?.uri;

        if (hangoutLink) {
            console.log('Google Meet Link:', hangoutLink);
        } else {
            console.log('No Google Meet link generated.');
        }

        return hangoutLink || null;
    } catch (error) {
        console.error('Error creating Google Meet event:', error.response?.data || error.message);
    }
}

// API Endpoint to create Google Meet link
app.post('/api/create-meet-link', async (req, res) => {
    console.log('Request Body:', req.body);  // Log the request body
    const { eventTitle, startDateTime, endDateTime } = req.body;

    if (!eventTitle || !startDateTime || !endDateTime) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const meetLink = await createMeetLink(eventTitle, startDateTime, endDateTime);
        if (meetLink) {
            return res.json({ meetLink });
        } else {
            return res.status(500).json({ error: 'Failed to create Google Meet link' });
        }
    } catch (error) {
        console.error('Error in creating Google Meet link:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Example usage
(async () => {
    if (!fs.existsSync(tokenPath)) {
        await getAndStoreToken(); // Authorize the app and store the token
    } else {
        setCredentials(); // Load the token and set it in the OAuth2 client
        const meetLink = await createMeetLink('Adconnect Online Consultation','2025-01-20 10:00:00', '2025-01-20 10:30:00');
        console.log('Generated Google Meet link:', meetLink);
    }
})();

app.post('/api/test-server', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

// 404 Not Found middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Export the app for testing
module.exports = app;