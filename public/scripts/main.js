console.log("main.js is loaded");

const APP_API_URL= 'https://adconnect.co.ke/';


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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+254|0)(7|1)\d{8}$/;
const twoWordsPattern = /^\S+\s+\S+/;

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
    }
    if (pageId === 'contactUsPage') {
        navbarTogler.addEventListener('click', openNav);
        searchBarContainer.addEventListener('click', openSearch);
        sidePanelCloseBtn.addEventListener('click', closeNav);
        btnCloseSearch.addEventListener('click', closeSearch);
        btnSubmitContactUsData.addEventListener('click', () => actionSubmitContactUsData);
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

// Managing url
const currentUrl = window.location.href;
const baseUrl = currentUrl.split('?')[0];


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

function openAppointmentBooking() {
    if (sectionAppointmentApplication) {
        sectionAppointmentApplication.style.height = '100%';
        const newUrl = `${baseUrl.slice(0, 0)}?appointment-booking=true`;
        window.history.pushState({}, '', newUrl);

        appointmentAction()
    }
}

function navigateToNextPage() {
    alert('Redirecting to the Contact Us page...');
    // Redirect to next page
    window.location.href = '.html';
}

/*function scrollToAboutPage() {
    document.getElementById('contactDiv').scrollIntoView();
}*/

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


/**
 * Input validation for Lead Capture
 * Outputs the error message for each input for 4 seconds only
 * @returns focus for the input field, end of function
 */
async function submitLeads() {
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

    // Submit data to Database and send an Email to the client
    try {
        const response = await fetch(`${APP_API_URL}api/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            //body: JSON.stringify(new Client(getCurrentDatetime(), name, email, phone, company || 'N/A', city || 'N/A', street || 'N/A', province || 'N/A', zip || 'N/A')),
            body: JSON.stringify({
                clientID: getCurrentDatetime(),
                clientName: name,
                clientEmail: email,
                clientPhone: phone,
                clientCompany: company || 'N/A',
                clientStreet: street || 'N/A',
                clientCity: city || 'N/A',
                clientProvince: province || 'N/A',
                clientZip: zip || 'N/A',
            }),
        });
    
        if (response.ok) {
            let result;
            try {
                result = await response.json(); // Try parsing JSON
            } catch (error) {
                console.warn('Empty or non-JSON response, using fallback');
                result = { message: 'Client created successfully' }; // Default fallback message
            }
    
            console.log('Response:', result);
            errorMessage.style.color = 'white';
            errorMessage.style.backgroundColor = '#4abc5061';
            errorMessage.style.display = 'block';
            handleErrorMessage(result.message, errorMessage);
    
            setTimeout(async () => {
                errorMessage.style.color = 'rgb(236, 2, 2)';
                errorMessage.style.backgroundColor = 'rgba(251, 128, 128, 0.533)';
                // Call the sendWelcomeEmail function here
                try {
                    await sendWelcomeEmail(name, email);
                    console.log('Welcome email sent successfully!');
                } catch (emailError) {
                    console.error('Error sending welcome email:', emailError);
                    handleErrorMessage('Failed to send welcome email', errorMessage);
                }
                openThankYouPage();
            }, 2000);
        } else {
            const errorText = await response.text(); // Capture text response if any
            console.error('Error Response:', errorText || 'Unknown error occurred');
            handleErrorMessage(`Error: ${errorText || 'An error occurred'}`,errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        handleErrorMessage('Failed to create Lead', errorMessage);
    }
    return true;
}

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

// Function to send a welcome email
async function sendWelcomeEmail(clientName, clientEmail) {
    try {
        const response = await fetch(`${APP_API_URL}api/send-welcome-email`, {
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

/**
 *  
 * Handling the form elements
 * 
 */
// Select all form elements and buttons
const forms = [
    document.getElementById("fname"),
    document.getElementById("lastname"),
    document.getElementById("eaddresss"),
    document.getElementById("phoneNumber"),
    document.getElementById("occupation"),
    document.getElementById("reason"),
    document.getElementById("goal"),
    document.getElementById("investment"),
];

const btnLeftApplication = document.getElementById("btnLeftApplication");
const btnRightApplication = document.getElementById("btnRightApplication");

const surveyData = {};
let currentStep = 0;
let userFirstName = '';

// Initialize the form
function initializeForm() {
    forms.forEach((form, index) => {
        form.style.display = index === 0 ? "flex" : "none";
    });
    btnLeftApplication.style.filter = "blur(5px)";
    btnRightApplication.textContent = "NEXT";
}

function goToNextStep() {
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
            if (input.value.trim().length <= 4) {
                errorMessages = 'Your Name is too short! Enter a valid Name.';
                handleErrorMessage(errorMessages, errorMessageContainer);
                input.focus();
                return;
            }
            userFirstName = input.value.trim();
            UserApplicationObject.firstName = inputValue;
            break;

        case 'lastNameInput':
            if (input.value.trim().length < 4) {
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
        lnameLabel.textContent = `What's Your Last Name, ${userFirstName}?`;
    }
    if (currentStep === 1) {
        const lnameLabel = document.querySelector("label[for='eaddress']");
        lnameLabel.textContent = `What's Your Email Address, ${userFirstName}?`;
    }
    if (currentStep === 2) {
        const eAdressLabel = document.querySelector("label[for='phonelabel']");
        eAdressLabel.textContent = `What's Your Phone Number, ${userFirstName}?`;
    }

    // Hide current form and show the next
    currentForm.style.display = "none";
    currentStep++;

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
        console.log("Survey completed. Data submitted:", surveyData);
        //API call
        /**
         * submit Data to DB
         *
        fetch('/submitApplication', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(UserApplicationObject),
        })
            .then(response => response.json())
            .then(data => console.log('Success:', data))
            .catch(error => console.error('Error:', error));*/


        // Close the application window
        sectionApplyConsultation.style.transform = 'translateY(-100%)';
        openAppointmentBooking();
    }

}

function goToPreviousStep() {
    if (currentStep === 0) return;

    forms[currentStep].style.display = "none";
    currentStep--;
    forms[currentStep].style.display = "flex";

    if (currentStep === 0) btnLeftApplication.style.filter = "blur(5px)";
    btnRightApplication.textContent = "NEXT";
}

// Initialize the survey form
initializeForm();

const dateSelected = false;
const dateChanged = false;

/**
 * Process all pre-actions in the booking of an Appointment
 * Prepopulates the data
 * Sets a default date and disables Sundays
 * Calls the Action for booking
 */
function appointmentAction() {
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
    dateInput.addEventListener('change', function () {
        const selectedDate = new Date(this.value);
        const day = selectedDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        const formattedDate = this.value;

        // Check for Sundays
        if (day === 0) {
            errorMessage = 'Sundays are not available for appointments. Please select another date.';
            handleErrorMessage(errorMessage, errorMessageContainer);
            this.value = ''; // Clear the invalid date
            dateChanged = false;
            return;
        }

        // Check for Kenyan holidays
        if (kenyanHolidays.includes(formattedDate)) {
            errorMessage = 'The selected date falls on a holiday. Please choose another date.';
            handleErrorMessage(errorMessage, errorMessageContainer)
            this.value = ''; // Clear the invalid date
            dateChanged = false;
            return;
        }
        // Date changed to an acceptable value
        dateChanged = true;
    });

    switch (dateChanged) {
        case true:
            checkAvailableDates();
            break;
        default:
            handleErrorMessage('Select an Active Date', errorMessageContainer)
    }

}

function checkAvailableDates() {
    const timeSlots = [
        { id: 'eit', time: '08.30 AM - 09.00 AM' },
        { id: 'nine', time: '09.15 AM - 09.45 AM' },
        { id: 'ten', time: '10.15 AM - 10.45 AM' },
        { id: 'eleven', time: '11.00 AM - 11.30 AM' },
        { id: 'telve', time: '11.45 AM - 12.15 PM' },
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
    const bookedTimes = ['eit', 'two', 'six'];

    timeSlots.forEach(slot => {
        const element = document.getElementById(slot.id);
        const child = element.querySelector('p');
        if (bookedTimes.includes(slot.id)) {
            element.style.boxShadow = '0 4px 8px rgba(246, 87, 48, 0.9)';
            element.style.borderColor = 'rgb(251, 150, 125)';
            child.style.color = 'rgb(251, 150, 125)';
        } else {
            //element.classList.add('available'); 
            element.addEventListener('click', () => selectTime(slot.time));
        }
    });
}

function selectTime(time) {
    dateSelected = true;
    // Display Date Selected
    errorMessage.style.color = 'white';
    errorMessage.style.backgroundColor = '#4abc5061';
    errorMessage.style.display = 'block';
    errorMessages = `You selected: ${time}`;
    handleErrorMessage(errorMessages, errorMessage);
    AppointmentBooking.time = time;
    // Send email or make an API call to confirm the booking 
}

/**
 * Method for submitting appointment data and launch the thank you page
 */
function submitAppointMent() {
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
    if (!dateSelected) {
        handleErrorMessage('Select your appointment time!', errorMessageContainer);
        return;
    }
    if (messageInput.value.trim() === '') {
        handleErrorMessage('Please Tell Us Something', errorMessageContainer);
        messageInput.focus();
        return;
    }
    const date = new Date(dateInput.value); // Ensure the date is valid 
    if (!isNaN(date.getTime())) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
        //Store Values
        AppointmentBooking.date = formattedDate;
        console.log(`Formatted Date: ${formattedDate}`);
    } else {
        handleErrorMessage('Invalid date value', errorMessageContainer);
    }

    openAppointmentBookingThankYouPage();
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
    if (txtMeetingDate) txtMeetingDate.textContent = `${AppointmentBooking.date}`;
    txtMeetingDate.appendChild(br);
    const timeText = document.createTextNode(`${AppointmentBooking.time}`);
    txtMeetingDate.appendChild(timeText);
    console.log(`Success ${AppointmentBooking.date} \n${AppointmentBooking.time}`);
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

document.querySelectorAll('.time-layout .grey-bordered').forEach((slot) => {
    slot.addEventListener('click', function () {
        if (!this.classList.contains('booked')) {
            alert(`You selected: ${this.querySelector('p').innerText}`);
        }
    });
});