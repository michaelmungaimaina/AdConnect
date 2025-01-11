
---

# AdConnect

**AdConnect** is a powerful digital marketing platform tailored to help real estate companies enhance their social media advertising efforts. With seamless integration and a strong focus on automation, AdConnect empowers businesses to increase their online presence and drive leads efficiently.

### Website:
[www.adconnect.co.ke](http://www.adconnect.co.ke)

### Figma UI/UX Designs:
[View Designs on Figma](https://www.figma.com/design/BgGZnePw9nDgORufkJarOn/MY-PROJECTS?node-id=1465-6&t=AagF4VKp5gml27n5-0)

---

## Project Overview

AdConnect is designed to provide real estate companies with an all-in-one solution for managing social media advertising. With advanced features and automation tools, it simplifies complex marketing tasks such as email notifications, booking management, and performance tracking.

### Key Features:

- **Nodemailer Integration**: Automatically sends tailored emails to clients, allowing for seamless communication and updates with predefined templates.
- **Booking Management System**: Easily stores bookings, tracks appointment statuses, and notifies clients automatically about their booking status.
- **Social Media Integration**: Integration with various social media platforms to run targeted ad campaigns, track ad performance, and generate leads.
- **Real-Time Analytics**: Track campaign performance, reach, and engagement to optimize marketing strategies.

---

## Technologies Used

AdConnect leverages modern technologies to build a scalable, user-friendly platform:

- **Frontend:**
  - HTML, CSS, JavaScript
  - React (for dynamic UI components)
- **Backend:**
  - Node.js with Express.js (for API and server-side logic)
  - MySQL (for storing data such as client info, bookings, and campaigns)
  - Nodemailer (for email automation)
- **Third-Party Integrations:**
  - Social Media API Integrations (for ad management) Google & Facebook

---

## Project Structure

The AdConnect project is structured for clarity and ease of maintenance. Here's an overview:

```
/AdConnect
|-- /src                    # Source code for the app (backend and frontend)
    |-- /components          # React components for UI
    |-- /controllers         # Controllers to handle API logic
    |-- /models              # MongoDB models for storing data
    |-- /routes              # Express routes for API endpoints
    |-- /services            # Business logic (e.g., email services, social media integrations)
|-- /public                  # Static assets like images, fonts, and global styles
|-- /config                  # Configuration files (e.g., database setup, Nodemailer, etc.)
|-- /scripts                 # Utility scripts (e.g., deployment, data migrations)
|-- /tests                   # Unit and integration tests for ensuring app functionality
|-- .env                     # Environment variables (API keys, database URIs, etc.)
|-- package.json             # Project dependencies and scripts
|-- server.js                # Main server entry point
```

---

## Getting Started

To set up AdConnect locally, follow the instructions below:

### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: [Install Node.js](https://nodejs.org/)
- **MongoDB**: [Install MongoDB](https://www.mongodb.com/try/download/community) or set up [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a cloud-based database.
- **Git**: [Install Git](https://git-scm.com/)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/michaelmungaimaina/AdConnect
   ```

2. **Navigate to the project folder:**
   ```bash
   cd AdConnect
   ```

3. **Install dependencies:**
   Install the required dependencies using npm:
   ```bash
   npm install
   ```

4. **Setup MongoDB:**
   If using a local MongoDB instance, ensure it's running. Otherwise, configure MongoDB Atlas and add your connection string to the `.env` file.

5. **Configure Email Notifications (Nodemailer):**
   Set up your email provider (e.g., Gmail, SendGrid) and configure your email service in the `.env` file.

6. **Start the server:**
   Run the server locally:
   ```bash
   npm start
   ```

7. **Access the Application:**
   Once the server is running, you can access the application at `http://localhost:3000` in your browser.

---

## Collaboration

We welcome contributions to AdConnect! If you'd like to contribute, follow these steps:

1. **Fork the repository** on GitHub.
2. **Create a new branch** for your feature or bug fix (`git checkout -b feature/your-feature`).
3. **Make changes** and commit them with clear, descriptive messages.
4. **Push your changes** to your fork (`git push origin feature/your-feature`).
5. **Create a pull request** to the main repository.

Please ensure your code adheres to the project's coding standards and includes appropriate tests where necessary.

---

## Author

- **Michael Maina**
- GitHub: [michaelmungaimaina](https://github.com/michaelmungaimaina)

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

---
