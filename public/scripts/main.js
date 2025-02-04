// Load the main script
console.log("main.js is loaded");

let DOMAIN_NAME = 'https://adconnect.co.ke/';
//let DOMAIN_NAME = 'http://127.0.0.1:3000/';
let API_PATH = 'api/';
const DOMAIN = `${DOMAIN_NAME}${API_PATH}`;


'use strict';
const showFAQsSection = document.getElementById('showFAQsSection');
const faqsSection = document.getElementById('faqsSection');
const btnCloseFAQs = document.getElementById('btnCloseFAQs');
const showFAQsForm = document.getElementById('showFAQsForm');
const FAQsForm = document.getElementById('FAQsForm');
const submitFAQsFormButton = document.getElementById('submitFAQsFormButton');

const btnCloseLeadapture = document.getElementById('btnCloseLeadCapture');
const sectionLeadCapture = document.getElementById('leadCaptureSection');

const btnNavToVideoSection = document.getElementById('btnNavigateToVidStrategy');
const sectionMainhero = document.getElementById('heroSection');

const sectionValueVideo = document.getElementById('valueVideoSection');

const txtOpenLeadCapture = document.getElementById('txtOpenLeadcapture');
const iconPause = document.getElementById('btnPauseIcon');

const sectionThankYouVideo = document.getElementById('thankYouVideoSection');
const btnCloseThanksPage = document.getElementById('btnCloseThanksPage');

const btnSubmitLeadCapture = document.getElementById('btnSubmitLeadCapture');

const sidepanel = document.getElementById('mySidePanel');

const sectionApplyConsultation = document.getElementById('applicationFormSection');

const sectionAppointmentApplication = document.getElementById('appointmentView');
const sectionTestimonial = document.getElementById('testimonialSection');
const btnCloseAppointmentApplication = document.getElementById('btnCloseApointment');
const navbarTogler = document.getElementById('navbarTogler');
const searchBarContainer = document.getElementById('searchBar');
const searchBarIcon = document.getElementById('searchBarIcon');
const sidePanelCloseBtn = document.getElementById('sidePanelCloseBtn');
const btnCloseSearch = document.getElementById('btnCloseSearch');
const btnOpenApplicationForm = document.getElementById('btnOpenApplicationForm');
const btnCloseApplicationForm = document.getElementById('btnCloseApplicationForm');
const btnLeftApplicationForm = document.getElementById('btnLeftApplication');
const btnRightApplicationForm = document.getElementById('btnRightApplication');
const btnSubmitAppointment = document.getElementById('btnSubmitAppointment');
const btnFooterConsultation = document.getElementById('footerConsultationBtn');
const btnFooterFAQs = document.getElementById('showFAQsSection');
const sectionApptThanks = document.getElementById('appointmentThanksView');
const btnCloseApointmentThanksView = document.getElementById('btnCloseApointmentThanks');
const txtMeetingDate = document.getElementById('meetingDate');
const txtMeetingType = document.getElementById('meetingType');
const inputNameContactUs = document.getElementById('inputNameContactUs');
const inputEmailContactUs = document.getElementById('inputEmailContactUs');
const inputPhoneContactUs = document.getElementById('inputPhoneContactUs');
const textAreaMessageContactUs = document.getElementById('textAreaMessageContactUs');
const btnSubmitContactUsData = document.getElementById('textAreaMessageContactUs');
const errorMessageContainer = document.getElementById('contactUsErrorMessageContainer');
const ourServiceSection = document.getElementById('ourServiceSection');
const socialMediaService = document.getElementById('mediaService');
const courseService = document.getElementById('courses');
const developmentService = document.getElementById('development');
const sectionPrivacyPolicy = document.getElementById('privacyPolicy');
const btnClosePrivacyPolicy = document.getElementById('btnClosePrivacyPolicy');
const btnLeftApplication = document.getElementById("btnLeftApplication");
const btnRightApplication = document.getElementById("btnRightApplication");

const textAboutHeader = document.getElementById("aboutHeader");
const textAboutIntroduction = document.getElementById("introductionInfo");
const textAboutExperience = document.getElementById("experienceInfo");
const textAboutMission = document.getElementById("missionInfo");
const imageAboutIcon = document.getElementById("misginaIcon");
const valueVideoView = document.getElementById("valueVideoView");

const testimonials = [
    {
        image: "../resources/elixir.png",
        clientName: "Irene",
        companyName: "Elixir Salon & Spa",
        text: "The team at Adconnect delivered an exceptional website for my salon and spa. From the initial consultation to the final launch, they ensured every detail was addressed. Their ability to combine functionality with modern design is unmatched, and the site has significantly boosted my online presence.",
        stars: 5
    },
    {
        image:"../resources/pic-back.png",
        clientName: "John Kamau",
        companyName: "Songa",
        text: "Our company required a custom web application to streamline internal operations, and Adconnect delivered beyond expectations. Their developers were thorough, responsive, and ensured the application was intuitive and scalable.",
        stars: 4
    },
    {
        image: "../resources/pic-back.png",
        clientName: "Ladybird",
        companyName: "Nuloft Salon and Spa",
        text: "What I love most about Adconnect is their reliability. They don’t just finish a project and disappear; they continue to provide support and guidance long after the site is live. Their maintenance and updates have kept my site running flawlessly.",
        stars: 5
    },
    {
        image: "../resources/pic-back.png",
        clientName: "Michael Maina",
        companyName: "Oriss Company",
        text: "I was skeptical about SEO at first, but Adconnect changed my perspective. Within four months, my website ranked on the first page of Google for several key search terms, which has directly translated into more inquiries and sales.",
        stars: 5
    },
    {
        image: "../resources/ricosam.PNG",
        clientName: "Eng. James",
        companyName: "Ricosam",
        text: "Our project involved integrating multiple third-party APIs, which was tricky. Adconnect not only handled it flawlessly but also optimized the process to ensure fast load times. Their technical expertise is impressive.",
        stars: 5
    },
    {
        image: "../resources/pic-back.png",
        clientName: "Dr. Sam Smith",
        companyName: "Real Estate",
        text: "Their digital marketing campaigns transformed my business. From Google Ads to social media, their strategies brought measurable results. My online store saw a 200% increase in sales within the first six months of working with them.",
        stars: 4
    }
];

let currentIndex = 0;

// HTML elements for the testimonials
const testimonial1 = document.getElementById('testmonial1');
const testimonial2 = document.getElementById('testmonial2');


function generateStars(container, starCount) {
    // Select the div where the stars will be appended
    const starDiv = container;
    // Clear any existing content
    starDiv.innerHTML = '';

    // Loop to create and append star images
    for (let i = 0; i < starCount; i++) {
        const img = document.createElement('img');
        img.src = '../resources/starr.png';
        img.alt = 'Star';
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.marginRight = '5px';

        starDiv.appendChild(img); // Append the image to the starIcon div
    }
}

let videoList = [];
async function fetchVideo() {
    try {
        const response = await fetch(`${DOMAIN}video-data-active`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        videoList = await response.json();

    } catch (error) {
        console.error('Error fetching Video:', error);
    }
}

fetchVideo()

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

/**
 * Method for displaying error messages to the user
 * @param {the error text to be displayed} errorMessage
 * @param {the container for displaying the error text} errorMessageElement
 * @returns a view if true
 */
function handleErrorMessage(errorMessage, errorMessageElement) {
    if (errorMessage && errorMessage.trim() !== '') {
        errorMessageElement.style.display = 'block';
        errorMessageElement.innerHTML = errorMessage;

        setTimeout(() => {
            errorMessageElement.style.display = 'none';
        }, 4000);

        return false;
    } else {
        errorMessageElement.style.display = 'none';
        return true;
    }
}

// Fetch Page Source
let clickSource = '';

function getSource() {
    let source = new URLSearchParams(window.location.search).get('utm_source');
    if (!source) {
        source = document.referrer ? new URL(document.referrer).hostname : "Direct";
    }
    clickSource = source;
}

getSource();

/**
 *
 * Handling the form elements
 *
 */
// Select all form elements and buttons
const forms = [
    document.getElementById("fName"),
    document.getElementById("lastName"),
    document.getElementById("eaddresss"),
    document.getElementById("phoneNumber"),
    document.getElementById("occupation"),
    document.getElementById("reason"),
    document.getElementById("goal"),
    document.getElementById("investment")
];

const surveyData = {};
let currentStep = 0;
let userFirstName = '';

// Managing url
const currentUrl = window.location.href;
const baseUrl = currentUrl.split('?')[0];

// Function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Show the popup if the URL parameter `{}=true` is present
window.onload = function () {
    const faqs = getUrlParameter('faqs');
    const faqsForm = getUrlParameter('faqs-form');
    const applicationForm = getUrlParameter('application-form');
    const valueVideo = getUrlParameter('value-video-request');
    const leadCapture = getUrlParameter('lead-capture-form');
    const thankYou = getUrlParameter('value-video-opt-in');
    const bookingForm = getUrlParameter('appointment-booking');
    const appointmentThankyouView = getUrlParameter('thank-you-for-booking');
    const coursesService = getUrlParameter('courses-service');
    const developmentService = getUrlParameter('development-service');
    const advertService = getUrlParameter('adverts-service');
    const privacyPolicy = getUrlParameter('privacy-policy');

    if (faqs === 'true') openFAQs();
    if (faqsForm === 'true') openFAQsForm();
    if (applicationForm === 'true') openApplicationForm();
    if (valueVideo === 'true') openValueVideo();
    if (leadCapture === 'true') openLeadCaptureSection();
    if (thankYou === 'true') openThankYouPage();
    if (bookingForm === 'true') openAppointmentBooking();
    if (appointmentThankyouView === 'true') openAppointmentBookingThankYouPage();
    if (coursesService === 'true') openCoursesService();
    if (developmentService === 'true') openDevelopmentService();
    if (advertService === 'true') openSocialMediaService();
    if (privacyPolicy === 'true') openPrivacyPolicy();

};

let bookedTimeSlots = [];
let timeSlots = [];
let isTimeChanged = false;

// Get appointments for the selected Date
const getAppointmentsForDate = async (date) => {
    const errorMessageContainer = document.getElementById('appointmentErrorMessage');
    let list = [];
    try {
        // Show loader while fetching data
        showLoader();

        try {
            const response = await fetch(`${DOMAIN}appointments-by-date/${date}`);
            list = await response.json(); // Parse the response as JSON
            console.log("Fetched Appointments:", list); // Debugging
            return list.appointmentTime || [];
        } catch (error) {
            console.error("Error fetching Appointments:", error);
            handleErrorMessage("Failed to fetch ratings", errorMessageContainer);
        }
    } catch (error) {
        // Handle fetch/network errors
        console.error('Fetch Error:', error);
        handleErrorMessage('Failed to retrieve appointment times', errorMessageContainer);
    } finally {
        // Hide the loader
        hideLoader();
    }
};


// Select the loader element
const loader = document.getElementById('loader');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+254|0)(7|1)\d{8}$/;
const twoWordsPattern = /^\S+\s+\S+/;

let isSubmitting = false;

// Define the UserApplication object
const UserApplicationObject = {
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    occupation: "",
    reason: "",
    goal: "",
    investment: ""
};

const AppointmentBooking = {
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    meetingType: "",
    meetingDate: "",
    meetingTime: "",
    meetingLocation: "",
    meetingStatus: "",
    meetingNotes: "",
    meetingLink: "",
    created_at: "",
    updated_at: ""
};


// Attach event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    const pageId = document.body.id;
    if (pageId === 'indexPage') {
        btnNavToVideoSection.addEventListener('click', openValueVideo);
        navbarTogler.addEventListener('click', openNav);
        searchBarIcon.addEventListener('click', openSearch);
        searchBarContainer.addEventListener('click', openSearch);
        sidePanelCloseBtn.addEventListener('click', closeNav);
        btnCloseSearch.addEventListener('click', closeSearch);
        txtOpenLeadCapture.addEventListener('click', openLeadCaptureSection);
        iconPause.addEventListener('click', openLeadCaptureSection);
        btnCloseLeadapture.addEventListener('click', closeLeadCapture);
        btnSubmitLeadCapture.addEventListener('click', submitLeads);
        btnCloseThanksPage.addEventListener('click', closeThankYouPage);
        btnOpenApplicationForm.addEventListener('click', openApplicationForm);
        btnCloseApplicationForm.addEventListener('click', closeApplicationForm);
        btnLeftApplicationForm.addEventListener('click', goToPreviousStep);
        btnRightApplicationForm.addEventListener('click', goToNextStep);
        btnCloseAppointmentApplication.addEventListener('click', closeAppointmentView);
        btnSubmitAppointment.addEventListener('click', submitAppointMent);
        btnCloseFAQs.addEventListener('click', closeFAQs);
        showFAQsForm.addEventListener('click', openFAQsForm);
        submitFAQsFormButton.addEventListener('click', submitFAQsForm);
        btnFooterConsultation.addEventListener('click', () => openUrl('?lead-capture-form=true'));
        btnFooterFAQs.addEventListener('click', openFAQs);
        btnCloseApointmentThanksView.addEventListener('click', closeAppointmentThanksView);
        btnClosePrivacyPolicy.addEventListener('click', closePrivacyPolicy);
        //btnLeftApplication.addEventListener('click', openAppointmentBooking);

        // Start the spinner
        setInterval(updateTestimonials, 10000);

        // Load the first testimonials
        updateTestimonials();

        // Set Value Video
        fetchVideo();
        getSource();
        console.log('Source: ', clickSource);
    }
    if (pageId === 'contactUsPage') {
        navbarTogler.addEventListener('click', openNav);
        searchBarContainer.addEventListener('click', openSearch);
        sidePanelCloseBtn.addEventListener('click', closeNav);
        btnCloseSearch.addEventListener('click', closeSearch);
        btnSubmitContactUsData.addEventListener('click', () => actionSubmitContactUsData);

        textAboutExperience.value = aboutList[0].experience;
        textAboutMission.value = aboutList[0].mission;
        textAboutIntroduction.value = aboutList[0].introduction;
        textAboutHeader.value = aboutList[0].title;
        imageAboutIcon.src = aboutList[0].icon;

    }
    if (pageId === 'aboutUsPage') {
        navbarTogler.addEventListener('click', openNav);
        sidePanelCloseBtn.addEventListener('click', closeNav);
    }
    if (pageId === 'ourServicePage') {
        navbarTogler.addEventListener('click', openNav);
        sidePanelCloseBtn.addEventListener('click', closeNav);
    }
});

/**
 * Listen for history changes
 * This is for google tag manager
 *
 (function() {
 // Function to determine the category based on the URL
 const getCategoryFromURL = () => {
 const urlPath = window.location.pathname;

 // Define categories based on URL patterns
 if (urlPath === '/index.html') {
 return 'Home';
 } else if (urlPath === '/index.html/?value-video=true') {
 return 'Value Video (Closed)';
 } else if (urlPath === '/index.html/?lead-capture-form=true') {
 return 'Lead Capture';
 } else if (urlPath === '/index.html/?thank-you-page=true') {
 return 'Thank You Page';
 } else {
 return 'Other'; // Default category
 }
 };

 // Function to send pageview with category to GTM
 const sendPageView = () => {
 const category = getCategoryFromURL();
 window.dataLayer = window.dataLayer || [];
 window.dataLayer.push({
 event: 'pageview',              // Event name for GTM
 pagePath: window.location.pathname + window.location.search,
 pageTitle: document.title,
 category: category              // Include the category
 });
 console.log('Pageview event sent:', {
 pagePath: window.location.pathname,
 category
 }); // Debugging
 };

 // Track the initial page load
 sendPageView();

 // Hook into the History API to track pushState and replaceState
 const originalPushState = history.pushState;
 const originalReplaceState = history.replaceState;

 // Override pushState
 history.pushState = function(...args) {
 originalPushState.apply(this, args);
 sendPageView();
 };

 // Override replaceState
 history.replaceState = function(...args) {
 originalReplaceState.apply(this, args);
 sendPageView();
 };

 // Fallback for hash-based navigation
 window.addEventListener('hashchange', () => {
 sendPageView();
 });
 })();*/

(function () {
    // Function to determine the category based on the URL
    const getCategoryFromURL = () => {
        const urlPath = window.location.pathname;

        // Define categories based on URL patterns
        if (urlPath === '/index.html') {
            return 'Home';
        } else if (urlPath === '/index.html/?value-video-request=true') {
            return 'Value Video (Closed)';
        } else if (urlPath === '/index.html/lead-capture-form=true') {
            return 'Lead Capture';
        } else if (urlPath === 'value-video-opt-in=true') {
            return 'Value Video (Open)';
        } else if (urlPath === 'application-form=true') {
            return 'Application Form';
        } else if (urlPath === 'appointment-booking=true') {
            return 'Appointment Booking';
        } else if (urlPath === 'thank-you-for-booking=true') {
            return 'Thank You Page';
        } else {
            return 'Other'; // Default category
        }
    };

    // Function to send pageview with category to Facebook Pixel
    const sendPageView = () => {
        const category = getCategoryFromURL();
        const pagePath = window.location.pathname + window.location.search;
        const pageTitle = document.title;

        // Ensure the fbq function is available
        if (typeof fbq === 'function') {
            fbq('trackCustom', 'PageView', {
                pagePath: pagePath,   // Full URL path
                pageTitle: pageTitle, // Title of the page
                category: category    // Custom category
            });
            console.log('Facebook Pixel event sent:', { pagePath, category }); // Debugging
        } else {
            console.error('Facebook Pixel (fbq) not initialized.');
        }
    };

    let aboutList = [];
    async function fetchAbout() {
        try {
            const response = await fetch(`${DOMAIN}about-data-active`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            aboutList = await response.json();

        } catch (error) {
            console.error('Error fetching About Info:', error);
        }
    }
    fetchAbout();


    valueVideoView.src = videoList[0].video;
    // Track the initial page load
    sendPageView();

    // Hook into the History API to track pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState
    history.pushState = function (...args) {
        originalPushState.apply(this, args);
        sendPageView();
    };

    // Override replaceState
    history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        sendPageView();
    };

    // Fallback for hash-based navigation
    window.addEventListener('hashchange', () => {
        sendPageView();
    });
})();


// Attach to the global scope
window.openNav = openNav;
window.closeNav = closeNav;
window.actionSubmitContactUsData = actionSubmitContactUsData;

function openUrl(param) {
    if (!param) {
        console.error('Parameter is required.');
        return;
    }
    console.log(`Opening overlay with parameter: ${param}`);
    // Use history API or URL query parsing logic
    const overlayElement = document.getElementById('leadCaptureSection'); // Replace with your actual overlay element
    if (overlayElement) {
        sectionLeadCapture.style.height = '100%'; // Show the overlay
    }
    // Optional: Add the parameter to the URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('lead-capture-form', 'true');
    window.history.pushState({}, '', url);
}


// Handle popstate for clean behavior
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section === 'faqs') {
        // When back to FAQs state, ensure title is updated
        document.title = "FAQs - AdConnect";
    } else {
        // Revert title for other states
        document.title = "Home - AdConnect";
    }
});


function openCoursesService() {
    if (courseService) {
        courseService.scrollIntoView({ behavior: 'smooth' });
        const newUrl = `${baseUrl.slice(0, 0)}?courses-service=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Service Section Not Found');
    }
}
function openDevelopmentService() {
    if (developmentService) {
        developmentService.scrollIntoView({ behavior: 'smooth' });
        const newUrl = `${baseUrl.slice(0, 0)}?development-service=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Service Section Not Found');
    }
}
function openSocialMediaService() {
    if (socialMediaService) {
        socialMediaService.scrollIntoView({ behavior: 'smooth' });
        const newUrl = `${baseUrl.slice(0, 0)}?adverts-service=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Service Section Not Found');
    }
}

function openPrivacyPolicy() {
    if (sectionPrivacyPolicy) {
        sectionPrivacyPolicy.style.height = '100%';
        const newUrl = `${baseUrl.slice(0, 0)}?privacy-policy=true`;
        window.history.pushState({}, '', newUrl);
    }
}
function closePrivacyPolicy() {
    if (sectionPrivacyPolicy) {
        sectionPrivacyPolicy.style.height = '0%';
        window.history.pushState({}, '', baseUrl);
    }
}
/**
 * Handle the form for Contact in Contact Page
 * @returns  input focus / Succes message
 */
function actionSubmitContactUsData() {
    if (inputNameContactUs.value.trim() === '') {
        handleErrorMessage('Name Field is Required!', errorMessageContainer);
        inputNameContactUs.focus();
        return;
    }
    if (inputNameContactUs.value.trim().length < 6) {
        handleErrorMessage('Name is Too Short!', errorMessageContainer);
        inputNameContactUs.focus();
        return;
    }
    if (!twoWordsPattern.test(inputNameContactUs.value.trim())) {
        handleErrorMessage('Name is NOT Full!', errorMessageContainer);
        inputNameContactUs.focus();
        return;
    }
    if (inputEmailContactUs.value.trim() === '') {
        handleErrorMessage('Email Field is Required!', errorMessageContainer);
        inputEmailContactUs.focus();
        return;
    }
    if (!emailPattern.test(inputEmailContactUs.value.trim())) {
        handleErrorMessage('Email is NOT Valid!', errorMessageContainer);
        inputEmailContactUs.focus();
        return;
    }
    if (inputPhoneContactUs.value.trim() === '') {
        handleErrorMessage('Phone Number Field is Required!', errorMessageContainer);
        inputPhoneContactUs.focus();
        return;
    }
    if (!phonePattern.test(inputPhoneContactUs.value.trim())) {
        handleErrorMessage('Phone Number is NOT Valid!', errorMessageContainer);
        inputPhoneContactUs.focus();
        return;
    }
    if (textAreaMessageContactUs.value.trim() === '') {
        handleErrorMessage('Tell Us Something!', errorMessageContainer);
        textAreaMessageContactUs.focus();
        return;
    }


    // SUbmit data, clear inputs and show success notification

    // Display success Message
    errorMessageContainer.style.color = 'white';
    errorMessageContainer.style.backgroundColor = '#4abc5061';
    errorMessageContainer.style.display = 'block';
    handleErrorMessage('Thank You. Data Successfully Submitted!', errorMessageContainer);
}

function openThankYouPage() {
    if (sectionThankYouVideo) {
        sectionLeadCapture.style.height = '0%';

        sectionThankYouVideo.style.display = 'flex';
        sectionThankYouVideo.style.transform = "translateY(0%)";
        const newUrl = `${baseUrl.slice(0, 0)}?value-video-opt-in=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Thank You Video Section Not Found');
    }
}

function closeThankYouPage() {
    if (sectionThankYouVideo) {
        sectionThankYouVideo.style.display = 'none';
        window.history.pushState({}, '', baseUrl);
    } else {
        console.error('Error: ThankY You Video Section Not Found');
    }
}

// Open Application Filling Form
function openApplicationForm() {
    if (sectionApplyConsultation) {
        sectionThankYouVideo.style.transform = "translateY(-100%)";

        sectionApplyConsultation.style.display = 'flex';
        sectionApplyConsultation.style.transform = 'translateY(0%)';
        const newUrl = `${baseUrl.slice(0, 0)}?application-form=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Thank Application Section Not Found');
    }
}

// Close Application Form
function closeApplicationForm() {
    if (sectionApplyConsultation) {
        sectionThankYouVideo.style.transform = "translateY(0%)";

        sectionApplyConsultation.style.transform = 'translateY(-100%)';
        window.history.pushState({}, '', baseUrl);
    } else {
        console.error('Error: Thank Application Section Not Found');
    }
}

// Add event listeners for responsiveness testing
window.addEventListener('resize', () => {
    const thankYouSection = document.getElementById('thankYouVideoSection');
    if (thankYouSection.style.display === 'flex') {
        thankYouSection.scrollIntoView({ behavior: 'smooth' });
    }
});


function openFAQs() {
    'use strict';
    console.log('Faqs Open')
    if (showFAQsSection) {
        const newUrl = `${baseUrl.slice(0, 0)}?faqs=true`;
        window.history.pushState({}, '', newUrl);
        faqsSection.style.height = '100%';
    } else {
        console.error('Error: button not found');
    }
}

function openFAQsForm() {
    'use strict';
    const btnText = document.getElementById('showFAQsForm');
    btnText.innerHTML;
    if (showFAQsForm) {
        FAQsForm.style.height = 'fit-content'
        showFAQsForm.style.height = '0px'
        showFAQsForm.style.overflow = 'hidden'
        submitFAQsFormButton.style.height = 'fit-content'

        const newUrl = `${baseUrl.slice(0, 0)}?faqs-form=true`;
        window.history.pushState({}, '', newUrl);

    } else {
        console.error('Error: button not found');
    }
}

function openValueVideo() {
    if (sectionValueVideo) {
        sectionValueVideo.style.display = 'flex'
        //sectionValueVideo.scrollIntoView({ behavior: 'smooth' });

        const newUrl = `${window.location.origin}${window.location.pathname}?value-video-request=true`;
        window.history.pushState({}, '', newUrl);

        sectionMainhero.style.display = "none"
        sectionTestimonial.style.display = "none"
    } else {
        console.error('Error: Section Value Video not found')
    }
}
window.openValueVideo = openValueVideo;

function openLeadCaptureSection() {
    if (sectionLeadCapture) {
        sectionLeadCapture.style.height = '100%';

        const newUrl = `${baseUrl.slice(0, 0)}?lead-capture-form=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Lead Section Not Found!');
    }
}

function submitFAQsForm() {
    'use strict';
    if (submitFAQsForm) {
        FAQsForm.style.height = '0'
        showFAQsForm.style.height = 'fit-content'
        submitFAQsFormButton.style.height = '0px'

    } else {
        console.error('Error: button not found');
    }
}

function closeFAQs() {
    'use strict';
    if (btnCloseFAQs) {
        faqsSection.style.height = '0';
        window.history.pushState({}, '', baseUrl);
    } else {
        console.error('Error: button not found');
    }
}

function closeNav() {
    'use strict';
    const navHeader = document.querySelector(".navbar");
    const sidepanel = document.getElementById('mySidePanel');

    if (sidepanel) {
        sidepanel.style.left = '-320px';
        navHeader.style.transform = "translateY(0)";
    } else {
        console.error('Error: sidepanel not found');
    }
}

/* Sidebar start */

function openNav() {
    'use strict';
    const navHeader = document.querySelector(".navbar");
    if (sidepanel) {
        navHeader.style.transform = "translateY(-100%)";
        sidepanel.style.left = '0';
    } else {
        console.error('Error: sidepanel not found');
    }
}

/* Search bar */
function openSearch() {
    'use strict';
    const searchPanel = document.getElementById('searchbar');
    if (searchPanel) {
        searchPanel.style.height = '100vh';
        searchPanel.style.borderRadius = '0';
    } else {
        console.error('Error: search panel not found');
    }
}

function closeSearch() {
    'use strict';
    const searchPanel = document.getElementById('searchbar');
    if (searchPanel) {
        searchPanel.style.height = '0';
        searchPanel.style.borderTopRightRadius = '100%';
        searchPanel.style.borderTopLeftRadius = '100%';
    } else {
        console.error('Error: search panel not found');
    }
}

function closeAppointmentView() {
    'use strict'
    const appointmentView = document.getElementById('appointmentView');
    window.history.pushState({}, '', baseUrl);
    if (appointmentView) {
        appointmentView.style.height = '0';
    } else {
        console.error('Error: appointmentview not found');
    }
}

function closeLeadCapture() {
    if (sectionLeadCapture) {
        sectionLeadCapture.style.height = '0';
        window.history.pushState({}, '', baseUrl);
    } else {
        console.error('Error: Lead Capture Section not found');
    }
}

async function openAppointmentBooking() {
    console.log('Book Appointment');
    if (sectionAppointmentApplication) {
        sectionAppointmentApplication.style.height = '100%';
        const newUrl = `${baseUrl.slice(0, 0)}?appointment-booking=true`;
        window.history.pushState({}, '', newUrl);

        await appointmentAction();
    }
}

/* toggle dropdown in mobile view */
document.querySelectorAll('.collapse-btn').forEach(item => {
    const trigger = item.querySelector('.dropdown-trigger');
    const dropdown = item.querySelector('.collapse');

    trigger.addEventListener('click', function (e) {
        e.preventDefault();
        dropdown.classList.toggle('show');
    });
});

/* Control Navigation Bar Visibility *
let lastScrollTop = 0;
const navHeader = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        // Scroll Down
        navHeader.style.transform = "translateY(-100%)";
    } else {
        // Scroll Up
        navHeader.style.transform = "translateY(0)";
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For mobile or negative scrolling
});*/


$('.video').parent().click(function () {
    const video = $(this).children(".video").get(0);
    const playPauseIcon = $(this).children(".playpause");

    if (video.paused) {
        video.play();
        playPauseIcon.fadeOut();
    } else {
        video.pause();
        playPauseIcon.fadeIn();
    }
});

// Disable video download option
$('.video').each(function () {
    this.removeAttribute('controlsList'); // Ensure there's no pre-existing attribute
    this.setAttribute('controlsList', 'nodownload'); // Disable download option
});

// Function to show the loader
function showLoader() {
    loader.classList.remove('hidden');
}

// Function to hide the loader
function hideLoader() {
    loader.classList.add('hidden');
}


/**
 * Input validation for Lead Capture
 * Outputs the error message for each input for 4 seconds only
 * @returns focus for the input field, end of function
 */
async function submitLeads() {
    event.preventDefault(); // Prevents default form submission
    if (isSubmitting) return; // Prevent duplicate submissions
    isSubmitting = true;

    const name = document.getElementById('name').value.toUpperCase();
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value.toUpperCase();
    const company = document.getElementById('company').value.toUpperCase();
    const street = document.getElementById('address').value.toUpperCase();
    const city = document.getElementById('city').value.toUpperCase();
    const province = document.getElementById('state').value.toUpperCase();
    const zip = document.getElementById('zipCode').value.toUpperCase();
    const errorMessage = document.getElementById('errorMessage');

    let errorMessages = '';
    if (name.trim() === '') {
        document.getElementById('name').focus();
        errorMessages = 'Full Name is required!';
        handleErrorMessage(errorMessages, errorMessage);
        return true;
    }
    if (!twoWordsPattern.test(name.trim())) {
        document.getElementById('name').focus();
        errorMessages = 'A full Name has two or more words!';
        handleErrorMessage(errorMessages, errorMessage);
        return true;
    }
    if (email.trim() === '') {
        document.getElementById('email').focus();
        errorMessages = 'Email is required!';
        handleErrorMessage(errorMessages, errorMessage);
        return true;
    }
    if (!emailPattern.test(email)) {
        document.getElementById('email').focus();
        errorMessages = 'Please enter a valid email address!';
        handleErrorMessage(errorMessages, errorMessage);
        return true;
    }
    if (phone.trim() === '') {
        document.getElementById('phone').focus();
        errorMessages = 'Phone Number is required!';
        handleErrorMessage(errorMessages, errorMessage);
        return true;
    }
    if (!phonePattern.test(phone)) {
        document.getElementById('phone').focus();
        errorMessages = 'Please enter a valid phone number.';
        handleErrorMessage(errorMessages, errorMessage);
        return true;
    }

    try {
        showLoader();

        // Check if the client exists
        const exist_response = await fetch(`${DOMAIN}lead-exists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientEmail: email, clientPhone: phone }),
        });

        const check_response = await exist_response.json(); // Parse response JSON

        if (check_response.exists) {
            console.log('Client already exists:', check_response.message);
            errorMessage.style.color = 'white';
            errorMessage.style.backgroundColor = '#4abc5061';
            errorMessage.style.display = 'block';
            handleErrorMessage('Welcome Back', errorMessage);
            setTimeout(async () => {
                openThankYouPage();
            }, 2000);
        } else {
            console.log('Email or Phone does not exist, creating new client.');

            // Submit new lead since it does not exist
            const response = await fetch(`${DOMAIN}clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientID: getCurrentDatetime,
                    clientName: name,
                    clientEmail: email,
                    clientPhone: phone,
                    clientCompany: company || 'N/A',
                    clientStreet: street || 'N/A',
                    clientLocation: city || 'N/A',
                    clientProvince: province || 'N/A',
                    clientZipCode: zip || 'N/A',
                    clientSource: clickSource,
                    clientStatus: '1ST CONTACT',
                    clientSubScription: 'SUBSCRIBED',
                }),
            });

            const result = await response.json(); // Parse response JSON

            if (response.ok) {
                console.log('Response:', result);
                errorMessage.style.color = 'white';
                errorMessage.style.backgroundColor = '#4abc5061';
                errorMessage.style.display = 'block';
                handleErrorMessage(result.message, errorMessage);

                setTimeout(async () => {
                    try {
                        await sendWelcomeEmail(name, email);
                        console.log('Welcome email sent successfully!');

                        // Populate application form fields
                        document.getElementById('firstNameInput').value = name.split(' ')[0];
                        document.getElementById('lastNameInput').value = name.split(' ').slice(1).join(' ');
                        document.getElementById('emailAddressInput').value = email;
                        document.getElementById('phoneInput').value = phone;
                    } catch (emailError) {
                        console.error('Error sending welcome email:', emailError);
                        handleErrorMessage('Failed to send welcome email', errorMessage);
                    }
                    openThankYouPage();
                }, 2000);
            } else {
                // Use the already parsed result for error handling
                console.error('Error Response:', result.error || 'Unknown error occurred');
                handleErrorMessage(`Error: ${result.error || 'An error occurred'}`, errorMessage);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        handleErrorMessage('Failed to process request', errorMessage);
    } finally {
        hideLoader();
        isSubmitting = false; // Reset state
    }
}


// Function to send a welcome email
async function sendWelcomeEmail(clientName, clientEmail) {
    try {
        const response = await fetch(`${DOMAIN}send-welcome-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientName: clientName,
                clientEmail: clientEmail,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to send email');
        }

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error while sending welcome email:', error);
        throw error;
    }
}



// Initialize the form
function initializeForm() {
    forms.forEach((form, index) => {
        form.style.display = index === 0 ? "flex" : "none";
    });
    btnLeftApplication.style.filter = "blur(5px)";
    btnRightApplication.textContent = "NEXT";
}
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
    });
});

async function goToNextStep() {
    event.preventDefault();
    const currentForm = forms[currentStep];
    const input = currentForm.querySelector("input, select");

    // Validate input
    if (!input || input.value.trim() === '') {
        let errorMessages = '';
        const errorMessageContainer = document.getElementById('formErrorMessage');

        switch (input.id) {
            case 'firstNameInput':
                errorMessages = 'Your Full Name is required!';
                break;
            case 'lastNameInput':
                errorMessages = 'Your Last Name is required!';
                break;
            case 'emailAddressInput':
                errorMessages = 'Your Email is required!';
                break;
            case 'phoneInput':
                errorMessages = 'Your Phone Number is required!';
                break;
            case 'occupationInput':
                errorMessages = 'Your Occupation is required!';
                break;
            case 'reasonInput':
                errorMessages = 'Your Company Status is required!';
                break;
            case 'goalInput':
                errorMessages = 'Your Goal is required!';
                break;
            case 'investmentInput':
                errorMessages = 'Your Investment choice is required!';
                break;
            default:
                errorMessages = 'An unexpected input error occurred.';
                break;
        }

        // Display error and focus input
        handleErrorMessage(errorMessages, errorMessageContainer);
        input.focus();
        return;
    }

    // Store the input value in the UserApplication object
    const inputValue = input.value.trim();

    //Conforming to Standard Input
    let errorMessages = '';
    const errorMessageContainer = document.getElementById('formErrorMessage');
    // Switch case for structured validation
    switch (input.id) {
        case 'firstNameInput':
            if (input.value.trim().length < 3) {
                errorMessages = 'Your Name is too short! Enter a valid Name.';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            userFirstName = input.value.trim();
            UserApplicationObject.firstName = inputValue;
            break;

        case 'lastNameInput':
            if (input.value.trim().length < 3) {
                errorMessages = 'Your Name is too short! Enter a valid Name.';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.lastName = inputValue;
            break;

        case 'emailAddressInput':
            if (input.value.trim().length <= 4) {
                errorMessages = 'Email is Too Short';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            if (!emailPattern.test(input.value.trim())) {
                errorMessages = 'Enter A valid Email Address!';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.emailAddress = inputValue;
            break;

        case 'phoneInput':
            if (!phonePattern.test(input.value.trim())) {
                errorMessages = 'Please Enter A valid Phone Number!';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.phoneNumber = inputValue;
            break;

        case 'occupationInput':
            if ((input.value.trim().length <= 4)) {
                errorMessages = 'Your Occupation is required!';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.occupation = inputValue;
            break;

        case 'reasonInput':
            if ((input.value.trim().length <= 4)) {
                errorMessages = 'Your Company Status is required!';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.reason = inputValue;
            break;

        case 'goalInput':
            if ((input.value.trim().length <= 4)) {
                errorMessages = 'Your Goal is required!';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.goal = inputValue;
            break;

        case 'investmentInput':
            if ((input.value.trim().length <= 4)) {
                errorMessages = 'Your Investment choice is required!';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            UserApplicationObject.investment = inputValue;
            break;

        default:
            errorMessages = 'An unexpected input error occurred.';
            break;
    }

    // Store input value
    const key = input.id;
    surveyData[key] = input.value;

    // Customize the label for the next form
    // Update labels dynamically
    if (currentStep === 0) {
        userFirstName = input.value.trim(); // Capture the first name
        const lnameLabel = document.querySelector("label[for='lastname']");
        lnameLabel.textContent = `What's Your Last Name, ${userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1).toLowerCase()}?`;
    }
    if (currentStep === 1) {
        const lnameLabel = document.querySelector("label[for='eaddress']");
        lnameLabel.textContent = `What's Your Email Address, ${userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1).toLowerCase()}?`;
    }
    if (currentStep === 2) {
        const eAdressLabel = document.querySelector("label[for='phonelabel']");
        eAdressLabel.textContent = `What's Your Phone Number, ${userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1).toLowerCase()}?`;
    }

    // Hide current form and show the next
    currentForm.style.display = "none";
    if (currentStep < forms.length)  currentStep++;
    else currentStep = forms.length;

    if (currentStep < forms.length) {
        forms[currentStep].style.display = "flex";
    }

    // Update button text
    if (currentStep > 0) btnLeftApplication.style.filter = "none";
    if (currentStep === forms.length - 1) {
        btnRightApplication.textContent = "Send and Book Now";
    }

    // Submit data on the last step
    if (currentStep === forms.length) {
        console.log("Survey completed. Data submitted:", UserApplicationObject);
        //API call
        /// Submit data to Database and send an Email to the client
        try {
            showLoader();
            const response = await fetch(`${DOMAIN}marketing-strategy-applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                //body: JSON.stringify(new Client(getCurrentDatetime(), name, email, phone, company || 'N/A', city || 'N/A', street || 'N/A', province || 'N/A', zip || 'N/A')),
                body: JSON.stringify({
                    applicantFName: UserApplicationObject.firstName,
                    applicantLName: UserApplicationObject.lastName,
                    email: UserApplicationObject.emailAddress,
                    phone: UserApplicationObject.phoneNumber,
                    occupation: UserApplicationObject.occupation,
                    marketTriggers: UserApplicationObject.reason,
                    strategyGoal: UserApplicationObject.goal,
                    strategyInvestment: UserApplicationObject.investment,
                    status: 'N/SOLVED'
                }),
            });

            if (response.ok) {
                let result;
                try {
                    result = await response.json(); // Try parsing JSON
                } catch (error) {
                    console.warn('Empty or non-JSON response, using fallback');
                    result = { message: 'Form submitted successfully' }; // Default fallback message
                }

                console.log('Response:', result);
                errorMessageContainer.style.color = 'white';
                errorMessageContainer.style.backgroundColor = '#4abc5061';
                errorMessageContainer.style.display = 'block';
                handleErrorMessage(result.message, errorMessageContainer);

                setTimeout(async () => {
                    // Close the application window
                    sectionApplyConsultation.style.transform = 'translateY(-100%)';
                    openAppointmentBooking();
                }, 2000);
            } else {
                const { error: errorText } = await response.json(); // Capture error text from response
                console.error('Error Response:', errorText || 'Unknown error occurred');
                handleErrorMessage(`Error: ${errorText || 'An error occurred'}`,errorMessageContainer);
            }
        } catch (error) {
            console.error('Error:', error);
            handleErrorMessage('Failed to create Lead', errorMessageContainer);
        }
        hideLoader();
        isSubmitting = false; // Reset the state
    }

}

function goToPreviousStep() {
    event.preventDefault();
    if (currentStep === 0) return;

    forms[currentStep].style.display = "none";
    currentStep--;
    forms[currentStep].style.display = "flex";

    if (currentStep === 0) {
        btnLeftApplication.style.filter = "blur(5px)";
        btnRightApplication.textContent = "NEXT";
    }
}

// Initialize the survey form
initializeForm();

async function checkAvailableDates(selectedDate) {
    timeSlots = [
        { id: 'eit', time: '08.30 AM - 09.00 AM' },
        { id: 'nine', time: '09.15 AM - 09.45 AM' },
        { id: 'ten', time: '10.15 AM - 10.45 AM' },
        { id: 'eleven', time: '11.00 AM - 11.30 AM' },
        { id: 'twelve', time: '11.45 AM - 12.15 PM' },
        { id: 'noon', time: '12.30 PM - 01.00 PM' },
        { id: 'one', time: '01.30 PM - 02.00 PM' },
        { id: 'two', time: '02.15 PM - 02.45 PM' },
        { id: 'three', time: '03.00 PM - 03.30 PM' },
        { id: 'four', time: '03.45 PM - 04.15 PM' },
        { id: 'four30', time: '04.30 PM - 05.00 PM' },
        { id: 'five', time: '05.15 PM - 05.45 PM' },
        { id: 'six', time: '06.00 PM - 06.30 PM' },
        { id: 'six45', time: '06.45 PM - 07.15 PM' },
        { id: 'seven', time: '07.30 PM - 08.00 PM' },
        { id: 'eightPm', time: '08.15 PM - 08.45 PM' },
        { id: 'ninePm', time: '09.00 PM - 09.30 PM' },
        { id: 'tenPm', time: '09.45 PM - 10.15 PM' },
        { id: 'ten30Pm', time: '10.30 PM - 11.00 PM' },
        { id: 'elevenPm', time: '11.15 PM - 11.45 PM' }
    ];

    // Example of booked time slots, fetched from database
    //const bookedTimes = ['eit', 'two', 'six'];
    const bookedTimes = await getAppointmentsForDate(selectedDate);
    console.log('Booked Times:', bookedTimes);
    // Extract the appointment times into an array
    const bookedTimesArray = bookedTimes.map(item => item.appointmentTime);

    timeSlots.forEach(slot => {
        console.log('Checking element for ID:', slot.id);
        const element = document.getElementById(slot.id);
        console.log('Element:', element);

        // if (bookedTimesArray.length === 0) bookedTimeSlots.push(timeSlot.id);
        if (!element) {
            console.warn(`Element not found for ID: ${slot.id}`);
            return; // Skip this iteration
        }
        //const child = element.querySelector('p');
        if (bookedTimesArray.includes(slot.time)) {
            element.style.boxShadow = '0 4px 8px rgba(246, 87, 48, 0.9)';
            element.style.borderColor = 'rgb(251, 150, 125)';
            //child.style.color = 'rgb(251, 150, 125)';
            element.clickable = false;
            element.style.cursor = 'not-allowed';
            bookedTimeSlots.push(slot.id);
        }
        //element.classList.add('available');
        element.addEventListener('click', () => selectTime(slot.time));
    });
}

function selectTime(time) {
    isTimeChanged = true;
    // Display Date Selected
    console.log(`You selected: ${formatTimeString(time)}`);
    errorMessage.style.color = 'white';
    errorMessage.style.backgroundColor = '#4abc5061';
    errorMessage.style.display = 'block';
    errorMessages = `You selected: ${time}`;
    handleErrorMessage(errorMessages, errorMessage);
    AppointmentBooking.meetingTime = formatTimeString(time);

    let availableTimeSlots = [];
    if (bookedTimeSlots.length === 0){
        availableTimeSlots = timeSlots;
    } else {
        availableTimeSlots = timeSlots.filter(slot => !bookedTimeSlots.includes(slot.id));
    }
    availableTimeSlots.forEach(slot => {
        const element = document.getElementById(slot.id);
        if (!element) {
            console.error(`Element with id ${slot.id} not found.`);
            return; // Skip this iteration
        }

        // Default styles for available slots
        element.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
        element.style.borderColor = 'rgb(125, 132, 137)';

        // Special styles for the selected time slot
        if (slot.time === time) {
            element.style.boxShadow = '0 4px 8px rgba(246, 87, 48, 0.8)';
            element.style.borderColor = 'rgb(251, 150, 125)';
        }
    });
}

// Function to format the time string
function formatTimeString(time) {
    const parts = time.split(' ');
    if (parts.length === 4) {
        // Join the first two parts, insert " - ", and add the last two parts
        return `${parts[0]} ${parts[1]} - ${parts[2]} ${parts[3]}`;
    }
    return time; // Return the original string if it doesn't match the expected format
}

let dateSelected = false;
let dateChanged = false;

/**
 * Process all pre-actions in the booking of an Appointment
 * Prepopulates the data
 * Sets a default date and disables Sundays
 * Calls the Action for booking
 */
async function appointmentAction() {
    const fullNameInput = document.getElementById('appointeeName');
    const emailInput = document.getElementById('appointeeEmail');
    const phoneInput = document.getElementById('appointeePhone');
    const locationInput = document.getElementById('appointeeLocation');
    const dateInput = document.getElementById('appointeeDate');
    const errorMessageContainer = document.getElementById('appointmentErrorMessage');

    // Combine first name and last name for the full name
    const fullName = `${UserApplicationObject.firstName} ${UserApplicationObject.lastName}`;

    // Prepopulate the inputs
    if (fullNameInput) fullNameInput.value = fullName;
    if (emailInput) emailInput.value = `${UserApplicationObject.emailAddress}`;
    if (phoneInput) phoneInput.value = `${UserApplicationObject.phoneNumber}`;

    // Set default date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(today.getDate()).padStart(2, '0');
    const todayDate = `${yyyy}-${mm}-${dd}`;

    // Set the input's default and minimum value
    dateInput.value = todayDate;
    dateInput.min = todayDate;

    // Kenyan holidays (Add more as needed)
    const kenyanHolidays = [
        `${yyyy}-01-01`, // New Year's Day
        `${yyyy}-03-08`, // International Women's Day
        `${yyyy}-05-01`, // Labor Day
        `${yyyy}-06-01`, // Madaraka Day
        `${yyyy}-10-20`, // Mashujaa Day
        `${yyyy}-12-12`, // Jamhuri Day
        `${yyyy}-12-25`, // Christmas Day
        `${yyyy}-12-26`, // Boxing Day
    ];

    let errorMessage = '';

    // Disable Sundays and Kenyan holidays
    dateInput.addEventListener('change', async function () {
        const selectedDate = new Date(this.value);
        const day = selectedDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        const formattedDate = this.value;

        // Check for Sundays
        if (day === 0) {
            errorMessage = 'Sundays are not available for appointments. Please select another date.';
            handleErrorMessage(errorMessage, errorMessageContainer);
            this.value = ''; // Clear the invalid date
            return;
        }

        // Check for Kenyan holidays
        if (kenyanHolidays.includes(formattedDate)) {
            errorMessage = 'The selected date falls on a holiday. Please choose another date.';
            handleErrorMessage(errorMessage, errorMessageContainer)
            this.value = ''; // Clear the invalid date
            return;
        }

        // Select all `.child` elements inside `.time-layout`
        const children = document.querySelectorAll('.grey-bordered .child');

        // Iterate over each element and reset the styles
        children.forEach(child => {
            child.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
            child.style.borderColor = 'rgb(125, 132, 137)';
            child.clickable = true;
            child.style.cursor = 'pointer';
        });

        await checkAvailableDates(dateInput.value);
    });
}

/**
 * Method for submitting appointment data and launch the thank you page
 */
async function submitAppointment() {
    // Perform Checks(Validation) and Open a Thank you page

    const fullNameInput = document.getElementById('appointeeName');
    const emailInput = document.getElementById('appointeeEmail');
    const phoneInput = document.getElementById('appointeePhone');
    const locationInput = document.getElementById('appointeeLocation');
    const dateInput = document.getElementById('appointeeDate');
    const messageInput = document.getElementById('appointeeMessage');
    const errorMessageContainer = document.getElementById('appointmentErrorMessage');

    //Input Validation
    if (fullNameInput.value.trim() === '') {
        handleErrorMessage('Full Name is Required!', errorMessageContainer);
        fullNameInput.focus();
        return;
    }
    if (emailInput.value.trim() === '') {
        handleErrorMessage('Email is Required', errorMessageContainer);
        emailInput.focus();
        return;
    }
    if (!emailPattern.test(emailInput.value)) {
        handleErrorMessage('Enter valid Email!!', errorMessageContainer);
        emailInput.focus();
        return;
    }
    if (phoneInput.value.trim() === '') {
        handleErrorMessage('Phone Number is Required', errorMessageContainer);
        phoneInput.focus();
        return;
    }
    if (!phonePattern.test(phoneInput.value.trim())) {
        handleErrorMessage('Enter valid Phone Number!!', errorMessageContainer);
        phoneInput.focus();
        return;
    }
    if (dateInput.value.trim() === '') {
        handleErrorMessage('Date is Required', errorMessageContainer);
        dateInput.focus();
        return;
    }
    if (AppointmentBooking.meetingTime === '') {
        handleErrorMessage('Select your appointment time!', errorMessageContainer);
        return;
    }
    if (messageInput.value.trim() === '') {
        handleErrorMessage('Please Tell Us Something', errorMessageContainer);
        messageInput.focus();
        return;
    }

    const date = new Date(dateInput.value);
    if (!isNaN(date.getTime())) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
        //Store Values
        AppointmentBooking.meetingDate = formattedDate;
        console.log(`Formatted Date: ${formattedDate}`);
    } else {
        handleErrorMessage('Invalid date value', errorMessageContainer);
    }

    AppointmentBooking.clientName = fullNameInput.value;
    AppointmentBooking.clientEmail = emailInput.value;
    AppointmentBooking.clientPhone = phoneInput.value;
    AppointmentBooking.clientMessage = messageInput.value;
    AppointmentBooking.meetingDate = dateInput.value;
    //AppointmentBooking.meetingTime = AppointmentBooking.meetingTime;
    AppointmentBooking.meetingLocation = locationInput.value;

    // Get the time range in 24-hour format
    const { startTime24, endTime24 } = convertToTimeRange(AppointmentBooking.meetingTime);

    const startDateTime = `${AppointmentBooking.meetingDate} ${startTime24}`;
    const endDateTime = `${AppointmentBooking.meetingDate} ${endTime24}`;

    // Get the Google Meet link for the appointment
    AppointmentBooking.meetingLink = await getGoogleMeetLink('Adconnect Online Consultation', `${startDateTime}`, `${endDateTime}`);

    // Send the data to the backend API
    try {
        showLoader()
        const response = await fetch(`${DOMAIN}appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Make sure you're sending JSON data
            },
            body: JSON.stringify({
                clientName: AppointmentBooking.clientName,
                clientEmail: AppointmentBooking.clientEmail,
                clientPhone: AppointmentBooking.clientPhone,
                appointmentNotes: AppointmentBooking.clientMessage,
                appointmentDate: AppointmentBooking.meetingDate,
                appointmentTime: AppointmentBooking.meetingTime,
                clientLocation: AppointmentBooking.meetingLocation,
                meetingLink: AppointmentBooking.meetingLink,
                appointmentType: 'Online Consultation',
                appointmentStatus: 'PENDING'
            }),
        });

        const result = await response.json();

        if (response.ok) {
            // Display success message
            errorMessageContainer.style.color = 'white';
            errorMessageContainer.style.backgroundColor = '#4abc5061';
            errorMessageContainer.style.display = 'block';
            errorMessages = `Booking Successful!`;
            handleErrorMessage(errorMessages, errorMessageContainer);

            // Send Booking Email
            await sendBookingEmail(AppointmentBooking.clientName, AppointmentBooking.clientEmail, formatDate(AppointmentBooking.meetingDate), AppointmentBooking.meetingTime, AppointmentBooking.meetingLocation, AppointmentBooking.clientMessage, AppointmentBooking.meetingLink);
            await sendBookingReactionEmail(AppointmentBooking.clientName, formatDate(AppointmentBooking.meetingDate), AppointmentBooking.meetingTime, AppointmentBooking.meetingLocation, AppointmentBooking.clientMessage, AppointmentBooking.meetingLink);

            // Open the thank you page
            openAppointmentBookingThankYouPage();
        } else {
            // Display error message
            handleErrorMessage(result.error, errorMessageContainer);
        }
    } catch (error) {
        // Handle any network or server errors
        handleErrorMessage('An error occurred while booking the appointment.', errorMessageContainer);
        console.error('Error:', error);
    } finally{
        hideLoader();
    }
}

function convertToTimeRange(timeRange) {
    // Split the input time range into start and end times
    const [startTime, endTime] = timeRange.split(' - ');

    // Function to convert time in "hh.mm AM/PM" format to "HH:mm:ss"
    function convertTimeTo24HourFormat(time) {
        const [timeString, period] = time.split(' ');
        let [hours, minutes] = timeString.split('.').map(Number);

        // Convert hours and minutes into a 24-hour format
        if (period === 'PM' && hours !== 12) {
            hours += 12;  // Convert PM to 24-hour format (12 PM is 12)
        } else if (period === 'AM' && hours === 12) {
            hours = 0;  // Convert 12 AM to 00:xx
        }

        // Format the time as HH:mm:ss
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }

    // Convert both start and end times
    const startTime24 = convertTimeTo24HourFormat(startTime);
    const endTime24 = convertTimeTo24HourFormat(endTime);

    return { startTime24, endTime24 };
}

async function getGoogleMeetLink(eventTitle, startDateTime, endDateTime) {
    try {
        const response = await fetch(`${DOMAIN}create-meet-link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventTitle: eventTitle,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Google Meet Link:', data.meetLink);
            return data.meetLink;  // Use the meet link as needed
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.error);
            return null;
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        return null;
    }
}


/**
 * Method for Opening the appointment booking page
 */
function openAppointmentBookingThankYouPage() {
    if (sectionApptThanks) {
        sectionAppointmentApplication.style.transform = 'translateY(-100%)';
        sectionApptThanks.style.height = '100%';

        const newUrl = `${baseUrl.slice(0, 0)}?thank-you-for-booking=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.log('Error: Thanks Section Not Available');
    }

    actionOnApptThankYouPage();
}

function actionOnApptThankYouPage() {
    const br = document.createElement('br');
    if (txtMeetingDate) txtMeetingDate.textContent = `${formatDate(AppointmentBooking.meetingDate)}`;
    txtMeetingDate.appendChild(br);
    const timeText = document.createTextNode(`${AppointmentBooking.meetingTime}`);
    txtMeetingDate.appendChild(timeText);
    console.log(`Success ${AppointmentBooking.meetingDate} \n${AppointmentBooking.meetingTime}`);
}

/**
 * Method for closing the thank you page after a successfull appointment booking
 * It launches the booking form after closure.
 */
function closeAppointmentThanksView() {
    if (sectionAppointmentApplication) {
        sectionApptThanks.style.height = '0%';
        sectionAppointmentApplication.style.height = '100%';

        const newUrl = `${baseUrl.slice(0, 0)}?appointment-booking=true`;
        window.history.pushState({}, '', newUrl);
        console.log('Execution Success!');
    } else {
        console.log('Error: Thanks Section Not Available');
    }
}


function formatDate(inputDate) {
    // Parse the input date string
    const date = new Date(inputDate);

    // Array for day names and month names
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get the day, date, month, and year
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    // Return the formatted date
    return `${dayName}, ${day} ${monthName}, ${year}`;
}

// Function to send a booking email
async function sendBookingEmail(clientName, clientEmail, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    try {
        const response = await fetch(`${DOMAIN}send-booking-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientName: clientName,
                clientEmail: clientEmail,
                meetingDate: meetingDate,
                meetingTime: meetingTime,
                meetingLocation: meetingLocation,
                meetingAgenda: meetingAgenda,
                meetingLink: meetingLink,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to send email');
        }

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error while sending booking email:', error);
        throw error;
    }
}

// Function to send a booking reaction email
async function sendBookingReactionEmail(clientName, meetingDate, meetingTime, meetingLocation, meetingAgenda, meetingLink) {
    try {
        const response = await fetch(`${DOMAIN}send-booking-reaction-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientName: clientName,
                meetingDate: meetingDate,
                meetingTime: meetingTime,
                meetingLocation: meetingLocation,
                meetingAgenda: meetingAgenda,
                meetingLink: meetingLink,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to send email');
        }

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error while sending booking email:', error);
        throw error;
    }
}


// Function to update the testimonials
function updateTestimonials() {
    const testimonial1Data = testimonials[currentIndex];
    const testimonial2Data = testimonials[(currentIndex + 1) % testimonials.length];


    // Update the first testimonial
    testimonial1.classList.remove('active');
    setTimeout(() => {
        testimonial1.querySelector('#clientIcon').style.backgroundImage = `linear-gradient(90deg, rgba(46, 35, 1, 0.0) 100%, rgba(235, 206, 39, 0.4) 70%), url(${testimonial1Data.image})`;
        testimonial1.querySelector('.testmonial-body').textContent = testimonial1Data.text;
        generateStars(testimonial1.querySelector('.starIcon'), testimonial1Data.stars);
        testimonial1.querySelector('#client-name').textContent = `${testimonial1Data.clientName}`;
        testimonial1.querySelector('#client-company').textContent = `${testimonial1Data.companyName}`;
        testimonial1.classList.add('active');
    }, 1000);

    // Update the second testimonial
    testimonial2.classList.remove('active');
    setTimeout(() => {
        testimonial2.querySelector('#clientIcon').style.backgroundImage = `linear-gradient(90deg, rgba(46, 35, 1, 0.0) 100%, rgba(235, 206, 39, 0.4) 70%), url(${testimonial2Data.image})`;
        testimonial2.querySelector('.testmonial-body').textContent = testimonial2Data.text;
        generateStars(testimonial2.querySelector('.starIcon'),testimonial2Data.stars);
        testimonial2.querySelector('.client').textContent = `${testimonial2Data.clientName}`;
        testimonial2.querySelector('#client-company').textContent = `${testimonial2Data.companyName}`;
        testimonial2.classList.add('active');
    }, 1000);

    // Increment the index and wrap around the array
    currentIndex = (currentIndex + 2) % testimonials.length;
}