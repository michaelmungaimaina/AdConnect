require('dotenv').config();
const express = require('express');
const mysql2 = require('mysql2');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./models/User');
const Client = require('./models/Client');
const AppointmentBooking = require('./models/AppointmentBooking');
const MarketingStrategyApplication = require('./models/MarketingStrategyApplication');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

function CurrentTime() {
    const currentDate = new Date();
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}


// Middleware
app.use(bodyParser.json());
app.use(express.json());
// Enable CORS for all origins
app.use(cors());

app.use(cors({
    origin: ['127.0.0.1'], // Replace with your frontend domains
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve API routes under `/api`
app.use('/', express.json()); // Ensure requests to `/api` parse JSON bodies

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Handle frontend routing by redirecting all non-API requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// User
app.post('/api/users', async (req, res) => {
    try {
        const { id, name, email, role, access_level } = req.body;
        const newUser = new User({ id, name, email, role, access_level });
        await newUser.save();
        res.status(200).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Endpoint to create a user
app.post('/api/users', async (req, res) => {
    try {
        const { id, name, email, role, access_level } = req.body;

        // Validate input data
        if (!id || !name || !email || !role || !access_level) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // SQL query to insert the new user
        const query = `
            INSERT INTO users (id, name, email, role, access_level)
            VALUES (?, ?, ?, ?, ?)
        `;

        // Execute the query
        const [result] = await db.execute(query, [id, name, email, role, access_level]);

        // Respond with success message
        res.status(200).json({
            message: 'User created successfully',
            user: {
                id,
                name,
                email,
                role,
                access_level
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
        const { name, email, role, access_level } = req.body;

        // Check if the user exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user in the database
        const query = `
            UPDATE users 
            SET name = ?, email = ?, role = ?, access_level = ?
            WHERE id = ?
        `;
        await db.execute(query, [name, email, role, access_level, userId]);

        // Respond with a success message
        res.status(200).json({ 
            message: 'User updated successfully', 
            user: { id: userId, name, email, role, access_level } 
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

        // Check if the user exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // SQL query to delete the user
        const query = 'DELETE FROM users WHERE id = ?';
        await db.execute(query, [userId]);

        // Respond with a success message
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the user' });
    }
});

/**
 * Function for getting the current date & time
 * @returns dat-time (yyyyMMddHHmmss)
 * 
 */
const getCurrentDatetime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Create a new client (lead)
app.post('/api/clients', async (req, res) => {
    try {
        console.log(req.body); // Log the request body for debugging
    
        const { clientId, clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode} = req.body;

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
                currentDateTime = new Date();
            return res.status(400).json({ error: `${getCurrentDatetime()} ${errorMessage}` });
        }

        // Insert the new client into the database
        const insertQuery = `
            INSERT INTO clients (clientID, clientName, clientEmail, clientPhone, clientCity, clientCompany, clientStreet, clientProvince, clientZip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.execute(insertQuery, [`${getCurrentDatetime()}`, clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode]);

        // Respond with success
        res.status(201).json({ message: 'Lead created successfully', lead: { clientId: `${getCurrentDatetime()}`, clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode} });
    } catch (error) {
        console.error(`Backend Error: ${getCurrentDatetime()}`, error); // Log the error for debugging
        res.status(500).json({ error: `${getCurrentDatetime()} ${error.message}` }); // Send the error message in the response
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
        const checkQuery = 'SELECT * FROM clients WHERE id = ?';
        const [existingClient] = await db.execute(checkQuery, [clientId]);

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SQL query to delete the client
        const deleteQuery = 'DELETE FROM clients WHERE id = ?';
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
            clientId,
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
        if (!clientId || !appointmentDate || !clientPhone) {
            return res.status(400).json({ error: 'Missing required fields: clientId, appointmentDate, or service' });
        }

        // SQL query to insert a new appointment
        const insertQuery = `
            INSERT INTO appointments (clientId,name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the insert query
        const [result] = await db.execute(insertQuery, [clientId, clientName, clientEmail, clientPhone, clientLocation, 
            appointmentDate, appointmentTime, appointmentType, appointmentStatus, 
            appointmentNotes, meetingLink]);

        // Respond with the newly created appointment
        res.status(201).json({
            message: 'Appointment Booked successfully',
            appointment: {
                //id: result.insertId, // Auto-generated ID after insertion
                clientId, clientName, clientEmail, clientPhone, clientLocation, 
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
        const { applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status} = req.body;

        // SQL query to insert a new application
        const insertQuery = `
            INSERT INTO marketing_strategy (applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status)
            VALUES (?, ?, ,?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the query to insert the new application into the database
        const [result] = await db.execute(insertQuery, [applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status]);

        // Respond with a success message and the inserted application data
        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: result.applicationId, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status
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
        subject: 'Welcome to Adconnect – Your Partner in Real Estate Marketing Success 🎉',
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
            text-decoration: none;">Adconnect!</a> We’re
            thrilled to have you on board 🎉.
        </p>
        <p style="line-height: 1.5;">
            Our mission is simple: to help real estate companies like yours succeed
            through powerful, targeted ads, professional social media management, and
            more. At <a href="https://adconnect.co.ke" style="color: #4abc4f;
            font-weight: bold;
            font-size: large;
            transition: color 0.3s ease;
            text-decoration: none;">AdConnect</a>, we
            know that your success is our success 💪.
        </p>
        <p style="line-height: 1.5;">Here's what you can expect:</p>
        <ul>
            <li>
                ✨ Proven strategies to attract and convert leads through Facebook and
                social media advertising.
            </li>
            <li>
                🔧 Expert support from our experienced developers, content editors, and
                marketing professionals.
            </li>
            <li>
                📈 Ongoing guidance to keep your digital marketing at the cutting edge.
            </li>
        </ul>
        <p style="line-height: 1.5;">We’re here to take the complexity out of digital marketing for you.</p>
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