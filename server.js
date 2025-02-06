require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const nodemailer = require('nodemailer');
const config = require('./config');
const readline = require('readline');
const multer = require('multer');
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const app = express();


// Middleware
app.use(bodyParser.json());
app.use(express.json());
// Enable CORS for all origins
app.use(cors());

app.use(cors({
    origin: ['http://127.0.0.1:3000', 'http://127.0.0.1:63342', 'http://localhost:63342', 'https://adconnect.com'],
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

console.log("DB Config:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? "****" : "MISSING",
    database: process.env.DB_NAME
});

// MySQL Connection
const db = mysql.createPool(config.db);
// Check database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error Connecting to Database:', err);
        return;
    }
    console.log('✅ Connected to the MySQL database.');
    connection.release(); // Always release the connection back to the pool

    // Start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on ${process.env.APP_API_URL || 'http://localhost'}:${PORT}`);
    });
});

// Multer Configuration for File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${clientID()}${path.extname(file.originalname)}`),
});
// Serve static files from the "uploads" directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


// Function to handle user creation (register a new user)
app.post('/api/users', (req, res) => {
    const {name, email, password, role, access_level} = req.body;

    // Validate that all required fields are provided
    if (!name || !email || !password || !role || !access_level) {
        return res.status(400).json({error: 'All fields are required'});
    }

    // Check if a user with the same name and email already exists
    const query1 = 'SELECT * FROM users WHERE name = ? AND email = ?';
    db.query(query1, [name, email], (err, rows) => {
        if (err) {
            console.error(err); // Log the error
            return res.status(500).json({error: 'Database error'}); // Return a server error response
        }
        // If the user already exists, return an error
        if (rows.length > 0) {
            return res.status(400).json({error: 'User Already Exists!'});
        }


        // Insert the new user into the database
        const query = `INSERT INTO users (id, name, email, password, role, access_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.query(query, [clientID(), name, email, password, role, access_level, createdAt()], (err) => {
            if (err) {
                console.error(err); // Log the error
                return res.status(500).json({error: 'Database error'}); // Return a server error response
            }

            // Return a success response with the generated user information
            res.status(201).json({
                message: 'User created successfully',
                user: {clientID, name, email, role, access_level, createdAt},
            });
        });
    });
});

// Function to handle user authentication (Login user)
app.post('/api/auth', (req, res) => {
    const {email, password} = req.body;
    // Ensure email and password values are provided
    if (!email || !password) {
        return res.status(400).json({error: 'Email and password are required'});
    }
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, rows) => {
        // Log database error if any occurs
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Database error'});
        }
        // Check if user exists in the database
        if (rows.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }
        // Return login success message along with username
        res.status(200).json({message: 'Login successful', username: rows[0].name});
    });
});


// Endpoint to get all users
app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Database error'});
        }
        res.status(200).json(users);
    });
});

// Endpoint to get user by id
app.get('/api/users/:id', (req, res) => {
    const {id} = req.params; // Extract the user ID from request parameters
    const query = 'SELECT * FROM users WHERE id = ?'; // Query to retrieve the user by ID
    db.query(query, [id], (err, rows) => {
        if (err) {
            console.error(err); // Log the error if any occurs
            return res.status(500).json({error: 'Database error'}); // Send a 500 response for database error
        }
        if (rows.length === 0) {
            return res.status(404).json({error: 'User not found'}); // Send a 404 response if no user is found
        }
        res.status(200).json(rows[0]); // Send the user data in a success response
    });
});
// Endpoint to update user by id
app.put('/api/users/:id', (req, res) => {
    const {id} = req.params; // Extract the user ID from request parameters
    const {name, email, password, role, access_level} = req.body; // Extract the fields to be updated from the request body
    const query = `UPDATE users SET name = ?, email = ?, password = ?, role = ?, access_level = ? WHERE id = ?`; // Query to update the user
    db.query(query, [name, email, password, role, access_level, id], (err) => {
        if (err) {
            console.error(err); // Log the error if any occurs
            return res.status(500).json({error: 'Database error'}); // Send a 500 response for database error
        }
        res.status(200).json({message: 'User updated successfully'}); // Send a success response
    });
});

// Endpoint to delete user by id
app.delete('/api/users/:id', (req, res) => {
    const {id} = req.params; // Extract the user ID from request parameters
    const query = 'DELETE FROM users WHERE id = ?'; // Query to delete the user
    db.query(query, [id], (err) => {
        if (err) {
            console.error(err); // Log the error if any occurs
            return res.status(500).json({error: 'Database error'}); // Send a 500 response for database error
        }
        res.status(200).json({message: 'User deleted successfully'}); // Send a success response
    });
});

// Format timestamp for EAT
/**
 * Function for getting the current date & time
 * @returns dat-time (yyyyMMddHHmmss)
 *
 */
const clientID = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};
const createdAt = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Create a new client (lead)
// Endpoint to add a new client
app.post('/api/clients', (req, res) => {
    console.log(req.body); // Log the request body for debugging
    const {clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription } = req.body;

    // Check if any of the variables are null
    if (!clientName || !clientEmail || !clientPhone || !clientCompany || !clientLocation || !clientStreet || !clientProvince || !clientZipCode || !clientSource || !clientStatus || !clientSubScription) {
        return res.status(400).json({ error: 'All fields are required and cannot be null' });
    }

    // Insert the new client into the database
    const insertQuery = `
        INSERT INTO clients (clientID, clientName, clientEmail, clientPhone, clientCity, clientCompany, clientStreet, clientProvince, clientZip, clientSource, clientStatus, clientSubScription, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [clientID(), clientName, clientEmail, clientPhone, clientCompany, clientLocation, clientStreet, clientProvince, clientZipCode, clientSource, clientStatus, clientSubScription, createdAt()], (err) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Failed to Create Lead' });
        }

        // Respond with success
        res.status(201).json({
            message: 'Lead created successfully',
            lead: {
                clientID,
                clientName,
                clientEmail,
                clientPhone,
                clientCompany,
                clientLocation,
                clientStreet,
                clientProvince,
                clientZipCode,
                clientSource,
                clientStatus,
                clientSubScription,
                createdAt
            },
        });
    });
});

// Endpoint to generate and download Excel
app.post("/api/download/excel", async (req, res) => {
    try {
        const leads = req.body.leads;
        console.log("Received leads:", leads); // Log the received data

        if (!leads || !Array.isArray(leads)) {
            return res.status(400).send("Invalid leads data");
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Leads");

        // Set Title
        const titleRow = worksheet.addRow(["LEADS DATA"]);
        titleRow.font = { size: 12, bold: true , color: { argb: "FFFFFFFF" },};
        titleRow.alignment = { vertical: "middle", horizontal: "left" };

        //worksheet.addRow([]); // Empty row for spacing

        // Define Columns & Style Header
        worksheet.columns = [
            { header: "LEAD ID", key: "clientID", width: 15 },
            { header: "NAME", key: "clientName", width: 25 },
            { header: "EMAIL", key: "clientEmail", width: 30 },
            { header: "PHONE", key: "clientPhone", width: 12 },
            { header: "SOURCE", key: "clientSource", width: 10 },
            { header: "STATUS", key: "clientStatus", width: 15 },
            { header: "DATE CREATED", key: "created_at", width: 25 },
        ];

        // Style headers (bold + background color)
        const headerRow = worksheet.getRow(1); // Header is at row 3
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.alignment = { horizontal: "left", vertical: "middle" };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F65730" }, // Background color
            };
        });

        // Add Rows (Data)
        leads.forEach((lead) => worksheet.addRow(lead));

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send response
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${clientID()}_leads.xlsx`
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.send(buffer);
    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).send("Error generating Excel file");
    }
});

// Endpoint to check if a client (lead) already exists
app.post('/api/lead-exists', (req, res) => {
    console.log(req.body); // Debugging request body
    const { clientEmail, clientPhone } = req.body;

    // Validate request
    if (!clientEmail || !clientPhone) {
        return res.status(400).json({ error: 'Email and phone are required' });
    }

    // Check if the client already exists
    const checkQuery = `
        SELECT * FROM clients
        WHERE clientEmail = ? OR clientPhone = ?
    `;

    db.query(checkQuery, [clientEmail, clientPhone], (err, existingClient) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (existingClient.length > 0) {
            const errorMessage = existingClient[0].clientEmail === clientEmail
                ? 'Email already exists'
                : 'Phone number already exists';

            return res.status(200).json({
                exists: true,
                message: errorMessage,
            });
        }

        // If no client found, return a success response indicating non-existence
        res.status(200).json({ exists: false, message: "Client does not exist" });
    });
});

// Endpoint to get all clients (leads)
app.get('/api/clients', (req, res) => {
    const query = 'SELECT * FROM clients';

    db.query(query, (err, clients) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'An error occurred while fetching the clients' });
        }

        res.status(200).json(clients);
    });
});

// Endpoint to get a single client (lead) by ID
app.get('/api/clients/:id', (req, res) => {
    const clientId = req.params.id;
    const query = 'SELECT * FROM clients WHERE id = ?';

    db.query(query, [clientId], (err, clients) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'An error occurred while fetching the client' });
        }

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.status(200).json(clients[0]);
    });
});

// Endpoint to send a subsequent email to a client
app.post('/api/sendSubsequentEmail', (req, res) => {
    const { clientID } = req.body;
    console.log(clientID);

    const clientQuery = 'SELECT * FROM clients WHERE clientID = ?';
    db.query(clientQuery, [clientID], (err, client) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (client.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        console.log(`Client Subscription Value: "${client[0].clientSubScription}"`);
        if (client[0].clientSubScription?.trim().toUpperCase() !== 'SUBSCRIBED') {
            return res.status(400).json({ error: 'Client is not subscribed to marketing emails' });
        }

        const templateQuery = 'SELECT subject, body FROM email_templates WHERE status = ?';
        db.query(templateQuery, [client[0].clientStatus], (err, template) => {
            if (err) {
                console.error('Database Error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (template.length === 0) {
                return res.status(404).json({ error: `No email template found for status: ${client[0].clientStatus}` });
            }

            const emailBody = template[0].body.replace(/\$\{clientName\}/g, client[0].clientName);
            sendSubSequentEmail(client[0].clientEmail, template[0].subject, emailBody)
                .then(() => {
                    const statusOrder = ['1ST CONTACT', '2ND CONTACT', '3RD CONTACT', '30TH CONTACT', '5TH CONTACT'];
                    const currentStatusIndex = statusOrder.indexOf(client[0].clientStatus.trim().toUpperCase());
                    const newStatus =
                        currentStatusIndex !== -1 && currentStatusIndex < statusOrder.length - 1
                            ? statusOrder[currentStatusIndex + 1]
                            : client[0].clientStatus;

                    const updateQuery = 'UPDATE clients SET clientStatus = ?, updated_at = CURRENT_TIMESTAMP WHERE clientID = ?';
                    db.query(updateQuery, [newStatus, clientID], (err) => {
                        if (err) {
                            console.error('Database Error:', err);
                            return res.status(500).json({ error: 'Database error' });
                        }
                        res.status(200).json({ message: 'Email sent and status updated successfully!' });
                    });
                })
                .catch((err) => {
                    console.error('Email Sending Error:', err);
                    res.status(500).json({ error: 'An error occurred while sending the email' });
                });
        });
    });
});

// Endpoint to fetch email template by status
app.get('/api/emailTemplate', async (req, res) => {
    try {
        const { status } = req.query;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const query = 'SELECT subject, body FROM email_templates WHERE status = ?';
        const [result] = await db.execute(query, [status]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'No email template found for this status' });
        }
        res.status(200).json({ subject: result[0].subject, body: result[0].body });
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
        await db.execute(
            `UPDATE clients SET clientSubScription = ?, created_at = ? WHERE clientID = ?`,
            ['UNSUBSCRIBED', new Date(), clientID]
        );
        res.status(200).json({ message: 'Lead Unsubscribed Successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while unsubscribing!' });
    }
});

/// Update a lead by ID
app.put('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    const { clientEmail, clientPhone, clientName, company, ...otherFields } = req.body;

    // SQL query to check if the client exists
    const checkQuery = 'SELECT * FROM clients WHERE id = ?';

    db.query(checkQuery, [id], (err, existingClient) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Prepare update query and values
        const updateQuery = `
            UPDATE clients
            SET clientEmail = ?, clientPhone = ?, clientName = ?, company = ?, updated_at = CURRENT_TIMESTAMP
                ${Object.keys(otherFields).length > 0 ? `, ${Object.keys(otherFields).map(field => `${field} = ?`).join(', ')}` : ''}
            WHERE id = ?
        `;
        const updateValues = [clientEmail, clientPhone, clientName, company, ...Object.values(otherFields), id];

        // Execute the update query
        db.query(updateQuery, updateValues, (updateErr) => {
            if (updateErr) {
                console.error(updateErr);
                return res.status(500).send('Database error');
            }

            // Respond with the updated client data
            res.status(200).json({
                message: 'Lead updated successfully',
                client: { id, clientEmail, clientPhone, clientName, company, ...otherFields }
            });
        });
    });
});


// Delete a lead by ID
app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;

    // SQL query to check if the client exists
    const checkQuery = 'SELECT * FROM clients WHERE clientID = ?';

    db.query(checkQuery, [id], (err, existingClient) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        // If client does not exist, return 404
        if (existingClient.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SQL query to delete the client
        const deleteQuery = 'DELETE FROM clients WHERE clientID = ?';

        db.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
                console.error(deleteErr);
                return res.status(500).send('Database error');
            }

            // Respond with a success message
            res.status(200).send('Lead deleted successfully');
        });
    });
});



/// Create a new appointment booking
app.post('/api/appointments', (req, res) => {
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
        return res.status(400).json({ error: 'Missing required fields: appointmentDate, or clientPhone' });
    }

    // SQL query to insert a new appointment
    const insertQuery = `
        INSERT INTO appointments (clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink,created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

    db.query(insertQuery, [clientID(), clientName, clientEmail, clientPhone, clientLocation, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink, createdAt()], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'An error occurred while booking the appointment' });
        }

        // Respond with the newly created appointment
        res.status(201).json({
            message: 'Appointment Booked successfully',
            appointment: {
                // auto-generated ID will be in result.insertId
                clientName, clientEmail, clientPhone, clientLocation,
                appointmentDate, appointmentTime, appointmentType, appointmentStatus,
                appointmentNotes, meetingLink
            }
        });
    });
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
    console.log('Getting all appointments');

    // SQL query to fetch all appointments
    const query = 'SELECT * FROM appointments';

    // Execute the query
    db.query(query, (err, appointments) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: 'An error occurred while retrieving appointments' });
        }

        // Respond with the fetched appointments
        res.status(200).json(appointments);
    });
});

// Get a single appointment by ID
app.get('/api/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;

    // SQL query to fetch the appointment by ID
    const query = 'SELECT * FROM appointments WHERE clientId = ?';

    // Execute the query with the appointment ID
    db.query(query, [appointmentId], (err, appointment) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: 'An error occurred while retrieving the appointment' });
        }

        // If the appointment does not exist, return 404
        if (appointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Respond with the fetched appointment
        res.status(200).json(appointment[0]);
    });
});

// Get appointments by appointment date
app.get('/api/appointments-by-date/:appointmentDate', (req, res) => {
    const appointmentDate = req.params.appointmentDate;

    // Log the input date for debugging
    console.log('Received appointmentDate:', appointmentDate);

    // SQL query to fetch appointments for the given date
    const query = 'SELECT appointmentTime FROM appointments WHERE appointmentDate = ?';

    // Execute the query
    db.query(query, [appointmentDate], (err, appointments) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while retrieving appointment times' });
        }

        // Log the database result
        console.log('Database response:', appointments);

        if (appointments.length === 0) {
            return res.status(404).json({ error: 'No appointments found for the given date' });
        }

        res.status(200).json({
            message: 'Appointment time(s) retrieved successfully',
            appointmentTime: appointments,
        });
    });
});

// Reschedule meeting and Notify client
app.put('/api/rescheduleMeeting', (req, res) => {
    const {
        clientId, name, email, phone, location, appointmentDate, appointmentTime,
        appointmentType, appointmentStatus, appointmentNotes, meetingLink
    } = req.body;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [clientId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to update the appointment
        const updateQuery = `
            UPDATE appointments
            SET clientId = ?, name = ?, email = ?, phone = ?, location = ?, appointmentDate = ?,
                appointmentTime = ?, appointmentType = ?, status = ?, notes = ?, meetingLink = ?, created_at = ?
            WHERE clientId = ?
        `;

        // Execute the update query
        db.query(updateQuery, [clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink, createdAt(), clientId], (updateErr) => {
            if (updateErr) {
                console.error('Backend Error:', updateErr);
                return res.status(500).json({ error: 'An error occurred while updating the appointment' });
            }

            // Send Email Notification
            sendRescheduleEmail(name.split(' ')[0], email, appointmentDate, appointmentTime, location, appointmentNotes, meetingLink);
            sendBookingReactionEmail(name.split(' ')[0], appointmentDate, appointmentTime, location, appointmentNotes, meetingLink);

            // Respond with a success message
            console.log('Meeting Rescheduled successfully');
            res.status(200).json({
                message: 'Meeting Rescheduled successfully',
                appointment: {
                    clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink
                }
            });
        });
    });
});

// Reminder notification to client
app.put('/api/reminder-email', (req, res) => {
    console.log(req.body);
    const { clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink } = req.body;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [clientId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        /* SQL query to update the appointment reminder status
       const updateQuery =
           UPDATE appointments
           SET clientId = ?, name = ?, email = ?, phone = ?, location = ?, appointmentDate = ?, appointmentTime = ?, appointmentType = ?, status = ?, notes = ?, meetingLink = ?, created_at = ?
           WHERE clientId = ?
       ;*/

        // Execute the update query
        // await db.execute(updateQuery, [clientId,name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink, createdAt, clientId]);

        // Split name to get first name
        const [fname] = name.split(' ');

        // Send Email Notification
        sendReminderEmail(fname, email, appointmentDate, appointmentTime, location, appointmentNotes, meetingLink);

        // Respond with a success message
        console.log('Reminder Sent successfully');
        res.status(200).json({
            message: 'Reminder Sent successfully',
            appointment: {
                clientId, name, email, phone, location, appointmentDate, appointmentTime, appointmentType, appointmentStatus, appointmentNotes, meetingLink
            }
        });
    });
});

// Update an appointment by ID
app.put('/api/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;
    const { status } = req.body;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [appointmentId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to update the appointment
        const updateQuery = `
            UPDATE appointments
            SET appointmentStatus = ?
            WHERE clientId = ?
        `;

        // Execute the update query
        db.query(updateQuery, [status, appointmentId], (updateErr) => {
            if (updateErr) {
                console.error('Backend Error:', updateErr);
                return res.status(500).json({ error: 'An error occurred while updating the appointment' });
            }

            // Respond with a success message
            console.log('Appointment Status updated successfully');
            res.status(200).json({
                message: 'Appointment Status updated successfully',
                appointment: {
                    id: appointmentId,
                    status
                }
            });
        });
    });
});

// Delete an appointment by ID
app.delete('/api/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;

    // SQL query to check if the appointment exists
    const checkQuery = 'SELECT * FROM appointments WHERE clientId = ?';

    db.query(checkQuery, [appointmentId], (err, existingAppointment) => {
        if (err) {
            console.error('Backend Error:', err);
            return res.status(500).json({ error: 'An error occurred while checking the appointment' });
        }

        // If the appointment does not exist, return 404
        if (existingAppointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // SQL query to delete the appointment
        const deleteQuery = 'DELETE FROM appointments WHERE clientId = ?';

        db.query(deleteQuery, [appointmentId], (deleteErr) => {
            if (deleteErr) {
                console.error('Backend Error:', deleteErr);
                return res.status(500).json({ error: 'An error occurred while deleting the appointment' });
            }

            // Respond with a success message
            res.status(200).json({ message: 'Appointment deleted successfully' });
        });
    });
});


// Get all Video Data
app.get('/api/video-data-active', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM video WHERE status = \'ACTIVE\'';
    console.log('Executing video-data');
    // Execute the query
    db.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching video data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;

        // Modify the response to include full image URLs
        result = result.map(item => ({
            ...item,
            video: item.video ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.video)}` : null
        }));
        console.log(result);
        // Respond with the list of about data
        res.status(200).json(result);
    });
});

// Get all Video Data
app.get('/api/video-data', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM video';
    console.log('Executing video-data');
    // Execute the query
    db.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching video data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;

        // Modify the response to include full image URLs
        result = result.map(item => ({
            ...item,
            video: item.video ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.video)}` : null
        }));
        console.log(result);
        // Respond with the list of about data
        res.status(200).json(result);
    });
});

const upload = multer({ storage: storage });

// Upload Video
app.post('/api/video-data', upload.single('video'), (req, res) => {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded File Data:", JSON.stringify(req.file, null, 2));

    const { title, created_by, status } = req.body;

    // Validate input data (including the file)
    if (!title || !created_by ||!status || !req.file) {
        return res.status(400).json({ error: 'All fields are required, including the icon file.' });
    }

    const filePath = req.file ? req.file.path : null;
    if (!filePath) {
        return res.status(400).json({ error: 'File upload failed.' });
    }

    // Check if the title already exists in the database
    const query1 = 'SELECT * FROM video WHERE title = ?';
    db.query(query1, [title], (error, result) => {
        if (error) {
            console.error('Database Error:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: 'Title Already Exists!' }); // 409 Conflict
        }

        // SQL query to insert the new about data into the database
        const query = `
            INSERT INTO video (id, title, created_by, video, status, created_on)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Generate the correct URL for the image
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${serverUrl}api/uploads/${req.file.filename}`;

        db.query(query, [clientID(),title, created_by, filePath, status,createdAt()], (error, result) => {
            if (error) {
                console.error('Database Error:', error);
                return res.status(500).json({ error: 'An error occurred while creating the about info' });
            }

            res.status(201).json({
                message: 'Video Uploaded successfully',
                about: {
                    id: result.insertId,
                    title,
                    created_by,
                    createdAt,
                    status,
                    video: imageUrl //Returns the correct video URL
                }
            });
        });
    });
});

// Update Video Status By ID
app.put('/api/video-data-update-status/:id', (req, res) => {
    const { id } = req.params;
    const {title,
        created_by,
        video,
        status,
        created_on } = req.body;
    console.log(req.body);

    // Check if required fields are present
    if (!status || !created_by) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query1 = 'SELECT * FROM video WHERE id = ?';
    // Check if the data exists
    db.query(query1, [id], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        //update all status
        const updateQuery = 'UPDATE video SET status = \'INACTIVE\'';
        db.query(updateQuery, (err, results) => {
            if (err) {
                console.error('Error updating database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }
            console.log('Updated all status');

            // Update query
            const query = `
                UPDATE video
                SET status = ?, created_on = ?
                WHERE id = ?
            `;

            db.query(query, [status, createdAt(), id], (err, updateResults) => {
                if (err) {
                    console.error('Error updating info:', err);
                    return res.status(500).json({ error: 'Error updating the about info' });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes detected' });
                }

                // Respond with success message
                res.status(200).json({
                    message: 'Data updated successfully',
                    about: {
                        id,
                        status,
                        createdAt
                    }
                });
            });
        });
    });
});

// Delete an Video Data by ID
app.delete('/api/video-data/:id', (req, res) => {
    try {
        const id = req.params.id;
        console.log('Deleting user with ID:', id);

        // Check if the info exists
        db.query('SELECT * FROM video WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Info not found' });
            }

            // SQL query to delete the info
            const query = 'DELETE FROM video WHERE id = ?';
            console.log('SQL Query:', query, 'Params:', [id]);

            db.query(query, [id], (err, deleteResults) => {
                if (err) {
                    console.error('Error deleting info:', err);
                    return res.status(500).json({ error: 'Error deleting the About Info' });
                }

                // Respond with a success message
                res.status(200).json({ message: 'Info deleted successfully' });
            });
        });
    } catch (error) {
        // Handle errors
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Get all About Data - Active
app.get('/api/about-data-active', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM about where status = "ACTIVE"';
    console.log('Executing about-data');
    // Execute the query
    db.query(query, (error, about) => {
        if (error) {
            console.error('Error fetching about data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;
        // Modify the response to include full image URLs
        about = about.map(item => ({
            ...item,
            icon: item.icon ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.icon)}` : null
        }));
        console.log(about);
        // Respond with the list of about data
        res.status(200).json(about);
    });
});

// Get all About Data
app.get('/api/about-data', (req, res) => {
    // SQL query to fetch all about data
    const query = 'SELECT * FROM about';
    console.log('Executing about-data');
    // Execute the query
    db.query(query, (error, about) => {
        if (error) {
            console.error('Error fetching about data:', error);
            return res.status(500).json({error: 'An error occurred while fetching about data'});
        }

        const serverUrl = `${req.protocol}://${req.get('host')}`;
        // Modify the response to include full image URLs
        about = about.map(item => ({
            ...item,
            icon: item.icon ? `${process.env.APP_API_URL}api/uploads/${path.basename(item.icon)}` : null
        }));
        console.log(about);
        // Respond with the list of about data
        res.status(200).json(about);
    });
});

app.post('/api/about-data', upload.single('icon'), (req, res) => {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Uploaded File Data:", JSON.stringify(req.file, null, 2));

    const { title, introduction, experience, mission, status } = req.body;

    // Validate input data (including the file)
    if (!title || !introduction || !experience || !mission || !status || !req.file) {
        return res.status(400).json({ error: 'All fields are required, including the icon file.' });
    }

    const filePath = req.file ? req.file.path : null;
    if (!filePath) {
        return res.status(400).json({ error: 'File upload failed.' });
    }

    // Check if the title already exists in the database
    const query1 = 'SELECT * FROM about WHERE title = ?';
    db.query(query1, [title], (error, result) => {
        if (error) {
            console.error('Database Error:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: 'Title Already Exists!' }); // 409 Conflict
        }

        // Define createdAt timestamp
        const createdAt = new Date();

        // SQL query to insert the new about data into the database
        const query = `
            INSERT INTO about (id, title, introduction, experience, mission, status, icon, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Generate the correct URL for the image
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${process.env.APP_API_URL}api/uploads/${req.file.filename}`;

        db.query(query, [clientID(),title, introduction, experience, mission, status, filePath, createdAt], (error, result) => {
            if (error) {
                console.error('Database Error:', error);
                return res.status(500).json({ error: 'An error occurred while creating the about info' });
            }

            res.status(201).json({
                message: 'About data created successfully',
                about: {
                    id: result.insertId,
                    title,
                    introduction,
                    experience,
                    mission,
                    status,
                    icon: imageUrl //Returns the correct image URL
                }
            });
        });
    });
});


// Update about by ID
app.put('/api/about-data/:id', (req, res) => {
    const {id, title, introduction, experience, mission, status, icon } = req.body;
    console.log(req.body);

    // Check if required fields are present
    if (!title || !introduction || !experience || !mission || !status) {
        return res.status(400).json({ error: 'All fields except icon are required' });
    }

    // Check if the data exists
    db.query('SELECT * FROM about WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        // Update query
        const query = `
            UPDATE about
            SET title = ?, introduction = ?, experience = ?, mission = ?, status = ?, icon = ?, updated_at = ?
            WHERE id = ?
        `;

        db.query(query, [title, introduction, experience, mission, status, icon || results[0].icon, createdAt(), id], (err, updateResults) => {
            if (err) {
                console.error('Error updating info:', err);
                return res.status(500).json({ error: 'Error updating the about info' });
            }

            if (updateResults.affectedRows === 0) {
                return res.status(400).json({ error: 'No changes detected' });
            }

            // Respond with success message
            res.status(200).json({
                message: 'Data updated successfully',
                about: {
                    id,
                    title,
                    introduction,
                    experience,
                    mission,
                    status,
                    icon: icon || results[0].icon, // Keep old icon if not provided
                    createdAt
                }
            });
        });
    });
});

// Update about by ID
app.put('/api/about-data-update-status/:id', (req, res) => {
    const {id, title, introduction, experience, mission, status, icon } = req.body;
    console.log(req.body);

    // Check if required fields are present
    if (!title || !introduction || !experience || !mission || !status) {
        return res.status(400).json({ error: 'All fields except icon are required' });
    }

    // Check if the data exists
    db.query('SELECT * FROM about WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        //update all status
        const updateQuery = 'UPDATE about SET status = \'INACTIVE\'';
        db.query(updateQuery, (err, results) => {
            if (err) {
                console.error('Error updating database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }
            console.log('Updated all status');

            // Update query
            const query = `
                UPDATE about
                SET title = ?, introduction = ?, experience = ?, mission = ?, status = ?, icon = ?, updated_at = ?
                WHERE id = ?
            `;

            db.query(query, [title, introduction, experience, mission, status, icon || results[0].icon, createdAt(), id], (err, updateResults) => {
                if (err) {
                    console.error('Error updating info:', err);
                    return res.status(500).json({ error: 'Error updating the about info' });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes detected' });
                }

                // Respond with success message
                res.status(200).json({
                    message: 'Data updated successfully',
                    about: {
                        id,
                        title,
                        introduction,
                        experience,
                        mission,
                        status,
                        icon: icon || results[0].icon, // Keep old icon if not provided
                        createdAt
                    }
                });
            });
        });
    });
});

// Delete an About Data by ID
app.delete('/api/about-data/:id', (req, res) => {
    try {
        const id = req.params.id;
        console.log('Deleting user with ID:', id);

        // Check if the info exists
        db.query('SELECT * FROM about WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Info not found' });
            }

            // SQL query to delete the info
            const query = 'DELETE FROM about WHERE id = ?';
            console.log('SQL Query:', query, 'Params:', [id]);

            db.query(query, [id], (err, deleteResults) => {
                if (err) {
                    console.error('Error deleting info:', err);
                    return res.status(500).json({ error: 'Error deleting the About Info' });
                }

                // Respond with a success message
                res.status(200).json({ message: 'Info deleted successfully' });
            });
        });
    } catch (error) {
        // Handle errors
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Create a new marketing strategy application
app.post('/api/marketing-strategy-applications', (req, res) => {
    console.log(req.body);

    // Extract the necessary fields from the request body
    const { applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status } = req.body;

    // SQL query to insert a new application
    const insertQuery = `
        INSERT INTO marketing_strategy (applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the query to insert the new application into the database
    db.query(insertQuery, [clientID(), applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status, createdAt()], (err, result) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(400).json({ error: err.message });
        }

        // Respond with a success message and the inserted application data
        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: result.insertId, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, strategyInvestment, status
            }
        });
    });
});

// Get all marketing strategy applications
app.get('/api/marketing-strategy-applications', (req, res) => {
    console.log('Getting all applications');

    // SQL query to get all applications from the database
    const selectQuery = 'SELECT * FROM marketing_strategy';

    // Execute the query to fetch the applications
    db.query(selectQuery, (err, applications) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: err.message });
        }

        // Respond with a success message and the list of applications
        res.status(200).json({
            message: 'Application(s) retrieved successfully',
            applications
        });
    });
});

// Get a single marketing strategy application by ID
app.get('/api/marketing-strategy-applications/:id', (req, res) => {
    const applicationId = req.params.id;

    // SQL query to fetch the application by ID
    const selectQuery = 'SELECT * FROM marketing_strategy WHERE applicationId = ?';

    // Execute the query to get the application
    db.query(selectQuery, [applicationId], (err, application) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: err.message });
        }

        // If no application found, return a 404 error
        if (application.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Respond with the application data
        res.status(200).json(application[0]);
    });
});



// Update a marketing strategy application by ID
app.put('/api/marketing-strategy-applications/:id', (req, res) => {
    const applicationId = req.params.id;
    const { applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status } = req.body;

    // SQL query to check if the application exists
    const checkQuery = 'SELECT * FROM marketing_strategy WHERE applicationId = ?';
    db.query(checkQuery, [applicationId], (err, existingApplication) => {
        if (err) {
            console.error('Backend Error: ', err);
            return res.status(500).json({ error: err.message });
        }

        // If the application does not exist, return 404
        if (existingApplication.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // SQL query to update the application
        const updateQuery = `
            UPDATE marketing_strategy
            SET applicationDate = ?, applicantFName = ?, applicantLName = ?, email = ?, phone = ?, occupation = ?, marketTriggers = ?, strategyGoal = ?, status = ?
            WHERE applicationId = ?
        `;

        // Execute the query to update the application
        db.query(updateQuery, [
            applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status, applicationId
        ], (err) => {
            if (err) {
                console.error('Backend Error: ', err);
                return res.status(500).json({ error: err.message });
            }

            // Respond with a success message and the updated application data
            res.status(200).json({
                message: 'Application updated successfully',
                application: {
                    applicationId,
                    applicationDate, applicantFName, applicantLName, email, phone, occupation, marketTriggers, strategyGoal, status
                }
            });
        });
    });
});



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
            Welcome to <a href="https://www.adconnect.co.ke" style="color: #4abc4f;
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
            know that your success is our success ❤️.
        </p>
        <p style="line-height: 1.5;">Here's what you can expect:</p>
        <ul>
            <li>
                ✔️ Proven strategies to attract and convert leads through Facebook and
                social media advertising.
            </li>
            <li>
                🔧 Expert support from our experienced developers, content editors, and
                marketing professionals.
            </li>
            <li>
                💡 Ongoing guidance to keep your digital marketing at the cutting edge.
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
        </p>
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
 * Send a Reschedule email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendRescheduleEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Meeting Reschedule: Consultation with Adconnect',
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
            This is to inform you that your consultation meeting has been rescheduled as follows:
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
        console.log('Reschedule email sent successfully!');
    } catch (error) {
        console.error('Error sending reschedule email:', error);
        throw error;
    }
}

/**
 * Send a Reschedule email to the client
 * @param {string} clientName - Name of the client
 * @param {string} clientEmail - Email of the client
 */
async function sendReminderEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    const mailOptions = {
        from: `"Adconnect Team" <${process.env.EMAIL_USER}>`, // Sender email
        to: clientEmail, // Recipient email
        subject: 'Meeting Reminder: Consultation with Adconnect',
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
            This is to remind you of our upcoming consultation meeting as detailed below:
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
        console.log('Reminder email sent successfully!');
    } catch (error) {
        console.error('Error sending reminder email:', error);
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

/// Load your OAuth2 credentials
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
    const rl = readline.createInterface({
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
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        oAuth2Client.setCredentials(token);
    } else {
        console.error('No token file found. Run `getAndStoreToken` to authorize the app.');
    }
}

// Refresh token if expired
async function refreshToken() {
    const token = oAuth2Client.credentials;
    if (token && token.refresh_token) {
        try {
            const { credentials } = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(credentials);
            fs.writeFileSync(tokenPath, JSON.stringify(credentials)); // Save refreshed token
            console.log('Token refreshed');
        } catch (error) {
            console.error('Error refreshing token', error);
        }
    } else {
        console.error('No refresh token available');
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
                dateTime: convertToISO8601(endDateTime), // Replace with your time
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
    try {
        if (!fs.existsSync(tokenPath)) {
            await getAndStoreToken(); // Authorize the app and store the token
        } else {
            setCredentials(); // Load the token and set it in the OAuth2 client

            // Check if the token is expired, and refresh it if necessary
            const token = oAuth2Client.credentials;
            if (token.expiry_date && token.expiry_date < Date.now()) {
                console.log('Token expired, refreshing...');
                await refreshToken(); // Refresh the token if expired
            }

            const meetLink = await createMeetLink('Adconnect Online Consultation', '2025-01-20 10:00:00', '2025-01-20 10:30:00');
            console.log('Generated Google Meet link:', meetLink);
        }
    } catch (error) {
        console.error('Error:', error);
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

/**


 async function sendEmails() {
 try {
 const connection = await pool.getConnection();

 // Get clients who need emails
 const [clients] = await connection.query(`
 SELECT clientEmail, clientName, clientStatus
 FROM clients
 WHERE clientStatus IN ('1ST CONTACT', '2ND CONTACT', '3RD CONTACT')
 `);

 for (let client of clients) {
 let subject, message;

 if (client.clientStatus === '1ST CONTACT') {
 subject = "Welcome!";
 message = "Thank you for reaching out. Let's connect!";
 } else if (client.clientStatus === '2ND CONTACT') {
 subject = "Follow-up";
 message = "Just checking in to see how we can assist you.";
 } else if (client.clientStatus === '3RD CONTACT') {
 subject = "Final Reminder";
 message = "This is your last chance to connect with us!";
 }

 // Send email
 await transporter.sendMail({
 from: '"Your Company" <your_email@gmail.com>',
 to: client.clientEmail,
 subject: subject,
 text: `Hello ${client.clientName},\n\n${message}`
 });

 console.log(`Email sent to ${client.clientEmail}`);
 }

 connection.release();
 } catch (error) {
 console.error("Error sending emails:", error);
 }
 }

 // Run the function
 sendEmails();



 DELIMITER $$

 CREATE EVENT update_client_status
 ON SCHEDULE EVERY 2 DAY
 DO
 BEGIN
 -- Update to '2ND CONTACT' if it's currently '1ST CONTACT'
 UPDATE clients
 SET clientStatus = '2ND CONTACT'
 WHERE clientStatus = '1ST CONTACT';

 -- Update to '3RD CONTACT' if it's currently '2ND CONTACT'
 UPDATE clients
 SET clientStatus = '3RD CONTACT'
 WHERE clientStatus = '2ND CONTACT';

 -- Add more updates as needed
 END $$

 DELIMITER ;

 async function sendEmails() {
 try {
 const connection = await pool.getConnection();

 // Get clients who need emails
 const [clients] = await connection.query(`
 SELECT clientEmail, clientName, clientStatus
 FROM clients
 WHERE clientStatus IN ('1ST CONTACT', '2ND CONTACT', '3RD CONTACT', 'FINAL CONTACT')
 `);

 for (let client of clients) {
 let subject, message;

 switch (client.clientStatus) {
 case '1ST CONTACT':
 subject = "Welcome!";
 message = "Thank you for reaching out. Let's connect!";
 break;
 case '2ND CONTACT':
 subject = "Follow-up";
 message = "Just checking in to see how we can assist you.";
 break;
 case '3RD CONTACT':
 subject = "Reminder";
 message = "We'd love to hear back from you soon!";
 break;
 case 'FINAL CONTACT':
 subject = "Final Notice";
 message = "This is your last chance to connect with us!";
 break;
 }

 // Send email
 await transporter.sendMail({
 from: '"Your Company" <your_email@gmail.com>',
 to: client.clientEmail,
 subject: subject,
 text: `Hello ${client.clientName},\n\n${message}`
 });

 console.log(`Email sent to ${client.clientEmail}`);
 }

 connection.release();
 } catch (error) {
 console.error("Error sending emails:", error);
 }
 }


 DELIMITER $$

 CREATE EVENT update_client_status
 ON SCHEDULE EVERY 2 DAY
 DO
 BEGIN
 UPDATE clients
 SET clientStatus =
 CASE
 WHEN clientStatus = '1ST CONTACT' THEN '2ND CONTACT'
 WHEN clientStatus = '2ND CONTACT' THEN '3RD CONTACT'
 WHEN clientStatus = '3RD CONTACT' THEN 'FINAL CONTACT'
 ELSE clientStatus
 END
 WHERE clientStatus IN ('1ST CONTACT', '2ND CONTACT', '3RD CONTACT');
 END $$

 DELIMITER ;



 SET GLOBAL event_scheduler = ON;
 */