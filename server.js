require('dotenv').config();
const express = require('express');
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
    origin: ['http://127.0.0.1:5500', 'https://adconnect.co.ke'], // Replace with your frontend domains
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve API routes under `/api`
app.use('/api', express.json()); // Ensure requests to `/api` parse JSON bodies

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Handle frontend routing by redirecting all non-API requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on ${process.env.APP_API_URL}:${PORT}`));
    })
    .catch((err) => console.error('Error connecting to MongoDB:', err));


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

// Get all Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single User by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a User by ID
app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a User by ID
app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Client/ Lead
app.post('/api/clients', async (req, res) => {
    try {
        console.log(req.body); // Log the request body for debugging

        const { clientEmail, clientPhone } = req.body; // Destructure relevant fields

        // Check if client already exists
        const existingClient = await Client.findOne({
            $or: [{ clientEmail }, { clientPhone }]
        });

        if (existingClient) {
            const errorMessage = existingClient.clientEmail === clientEmail
                ? 'Email already exists'
                : 'Phone number already exists';
            return res.status(400).json({ error: `${CurrentTime} ${errorMessage}` });
        }

        const client = new Client(req.body); // Create a new client using the request body
        await client.save(); // Save the client to the database

        // Respond with a success message and the saved client data
        res.status(201).json({ message: 'Lead created successfully', lead: client });
    } catch (error) {
        console.error(`Backend Error: ${CurrentTime}`, error); // Log the error for debugging
        res.status(500).json({ error: `${CurrentTime} ${error.message}` }); // Send the error message in the response
    }
});

// Get all Leads
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single Lead by ID
app.get('/api/clients/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a Lead by ID
app.put('/api/clients/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!client) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.status(200).json({ message: 'Lead updated successfully', client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a Lead by ID
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new appointment booking
app.post('/api/appointments', async (req, res) => {
    try {
        console.log(req.body);
        const newAppointment = new AppointmentBooking(req.body);
        await newAppointment.save();
        res.status(201).json({ message: 'Appointment Booked successfully', appointment: newAppointment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
    try {
        console.log('Getting all appointments');
        const appointments = await AppointmentBooking.find();
        res.status(200).json({ message: 'Appointment(s) retrieved successfully', appointments });
    } catch (error) {
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a single appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await AppointmentBooking.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.status(200).json(appointment);
    } catch (error) {
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});

// Update an appointment by ID
app.put('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await AppointmentBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!appointment) {
            console.log('Appointment not found');
            return res.status(404).json({ error: 'Appointment not found' });
        }
        console.log('Appointment updated successfully');
        res.status(200).json({ message: 'Appointment updated successfully', appointment });
    } catch (error) {
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete an appointment by ID
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await AppointmentBooking.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new marketing strategy application
app.post('/api/marketing-strategy-applications', async (req, res) => {
    try {
        console.log(req.body);
        const newApplication = new MarketingStrategyApplication(req.body);
        await newApplication.save();
        res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all marketing strategy applications
app.get('/api/marketing-strategy-applications', async (req, res) => {
    try {
        console.log('Getting all applications');
        const applications = await MarketingStrategyApplication.find();
        res.status(200).json({ message: 'Application(s) retrieved successfully', applications });
    } catch (error) {
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a single marketing strategy application by ID
app.get('/api/marketing-strategy-applications/:id', async (req, res) => {
    try {
        const application = await MarketingStrategyApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.status(200).json(application);
    } catch (error) {
        console.error('Backend Error: ', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a marketing strategy application by ID
app.put('/api/marketing-strategy-applications/:id', async (req, res) => {
    try {
        const application = await MarketingStrategyApplication.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!application) {
            console.log('Application not found');
            return res.status(404).json({ error: 'Application not found' });
        }
        console.log('Application updated successfully');
        res.status(200).json({ message: 'Application updated successfully', application });
    } catch (error) {
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