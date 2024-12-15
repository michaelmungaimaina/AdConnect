
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

const btnApplyFreeConsultation = document.getElementById('btnApplyFreeConsultation');
const sectionApplyConsultation = document.getElementById('applicationFormSection');

const sectionAppointmentApplication = document.getElementById('appointmentView');
const btnCloseAppointmentApplication = document.getElementById('btnCloseApointment');

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
    const valueVideo = getUrlParameter('value-video');
    const leadCapture = getUrlParameter('lead-capture-form');
    const thankYou = getUrlParameter('thank-you-page');
    const bookingForm = getUrlParameter('appointment-booking');

    if (faqs === 'true') openFAQs();
    if (faqsForm === 'true') openFAQsForm();
    if (applicationForm === 'true') openApplicationForm();
    if (valueVideo === 'true') openValueVideo();
    if (leadCapture === 'true') openLeadCaptureSection();
    if (thankYou === 'true') openThankYouPage();
    if (bookingForm === 'true') openAppointmentBooking();
};

function openThankYouPage() {
    if (sectionThankYouVideo) {
        sectionLeadCapture.style.height = '0%';

        sectionThankYouVideo.style.display = 'flex';
        sectionThankYouVideo.style.transform = "translateY(0%)";
        const newUrl = `${baseUrl.slice(0, -1)}?thank-you-page=true`;
        window.history.pushState({}, '', newUrl);
    } else {
        console.error('Error: Thank You Video Section Not Found');
    }
}

// Open Application Filling Form
function openApplicationForm() {
    if (sectionApplyConsultation) {
        sectionThankYouVideo.style.transform = "translateY(-100%)";

        sectionApplyConsultation.style.display = 'flex';
        sectionApplyConsultation.style.transform = 'translateY(0%)';
        const newUrl = `${baseUrl.slice(0, -1)}?application-form=true`;
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

function closeThankYouPage() {
    if (sectionThankYouVideo) {
        sectionThankYouVideo.style.display = 'none';
        window.history.pushState({}, '', baseUrl);
    } else {
        console.error('Error: ThankY You Video Section Not Found');
    }
}

function openFAQs() {
    'use strict';
    if (showFAQsSection) {
        const newUrl = `${baseUrl.slice(0, -1)}?faqs=true`;
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

        const newUrl = `${baseUrl.slice(0, -1)}?faqs-form=true`;
        window.history.pushState({}, '', newUrl);

    } else {
        console.error('Error: button not found');
    }
}

function openValueVideo() {
    if (sectionValueVideo) {
        sectionValueVideo.style.display = 'flex'
        sectionValueVideo.scrollIntoView({ behavior: 'smooth' });

        const newUrl = `${baseUrl.slice(0, -1)}?value-video=true`;
        window.history.pushState({}, '', newUrl);

        sectionMainhero.style.display = "none"
    } else {
        console.error('Error: Section Value Video not found')
    }
}

function openLeadCaptureSection() {
    if (sectionLeadCapture) {
        sectionLeadCapture.style.height = '100%';

        const newUrl = `${baseUrl.slice(0, -1)}?lead-capture-form=true`;
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
    const btnCloseAppointmentView = document.getElementById('btnCloseApointment');
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
        const newUrl = `${baseUrl.slice(0, -1)}?appointment-booking=true`;
        window.history.pushState({}, '', newUrl);
    }
}

function navigateToNextPage() {
    alert('Redirecting to the Contact Us page...');
    // Redirect to next page
    window.location.href = '.html';
}

function scrollToAboutPage() {
    document.getElementById('contactDiv').scrollIntoView();
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

/* Control Navigation Bar Visibility */
let lastScrollTop = 0;
const navHeader = document.querySelector(".navbar"); // Replace with your nav header's class or ID

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
})

$('.video').parent().click(function () {
    if ($(this).children(".video").get(0).paused) {
        $(this).children(".video").get(0).play(); $(this).children(".playpause").fadeOut();
    } else {
        $(this).children(".video").get(0).pause();
        $(this).children(".playpause").fadeIn();
    }
});


/**
 * Input validation for Lead Capture
 * Outputs the error message for each input for 4 seconds only
 * @returns focus for the input field, end of function
 */
function submitLeads() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const errorMessage = document.getElementById('errorMessage');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d+$/;

    let errorMessages = [];
    if (name.trim() === '') {
        document.getElementById('name').focus();
        errorMessages.push('Full Name is required!');
        handleErrorMessages(errorMessages, errorMessage);
        return true;
    }
    if (email.trim() === '') {
        document.getElementById('email').focus();
        errorMessages.push('Email is required!');
        handleErrorMessages(errorMessages, errorMessage);
        return true;
    }
    if (!emailPattern.test(email)) {
        document.getElementById('email').focus();
        errorMessages.push('Please enter a valid email address!');
        handleErrorMessages(errorMessages, errorMessage);
        return true;
    }
    if (phone.trim() === '') {
        document.getElementById('phone').focus();
        errorMessages.push('Phone Number is required!');
        handleErrorMessages(errorMessages, errorMessage);
        return true;
    }
    if (!phonePattern.test(phone)) {
        errorMessages.push('Please enter a valid phone number.');
        handleErrorMessages(errorMessages, errorMessage);
        return true;
    }
    // Submit data to Database and send an Email to the client

    // Display success Message
    errorMessage.style.color = 'white';
    errorMessage.style.backgroundColor = '#4abc5061';
    errorMessage.style.display = 'block';
    errorMessages.push('Thank You. Data Successfully Submitted!');
    handleErrorMessages(errorMessages, errorMessage);
    // Delay for openning of thank you page for 4 seconds to display success message
    setTimeout(() => {
        errorMessage.style.color = 'rgb(236, 2, 2)';
        errorMessage.style.backgroundColor = 'rgba(251, 128, 128, 0.533)';
        openThankYouPage();
    }, 3000);

    return true;
}

function handleErrorMessages(errorMessages, errorMessage) {
    //const errorMessage = document.getElementById('errorMessage'); // Assuming the error message element has this ID

    if (errorMessages.length > 0) {
        errorMessage.style.display = 'block';
        errorMessage.innerHTML = errorMessages.join('<br>');

        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 4000);

        return false;
    } else {
        errorMessage.style.display = 'none';
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
    document.getElementById("lname"),
    document.getElementById("eaddresss"),
    document.getElementById("phoneNumber"),
    document.getElementById("occupation"),
    document.getElementById("reason"),
    document.getElementById("goal"),
    document.getElementById("investment"),
];

const btnLeftApplication = document.getElementById("btnLeftApplication");
const btnRightApplication = document.getElementById("btnRightApplication");

// Store responses in an object
const surveyData = {};
let currentStep = 0;

// Dropdown options for investment
const investmentDropdown = document.getElementById("investmentInput");
const investmentOptions = [
    "Select Your Capability",
    "KES 35,000 or less",
    "KES 36,000 – 60,000",
    "KES 61,000 – 120,000",
    "More than KES 120,000",
];
investmentOptions.forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    investmentDropdown.appendChild(opt);
});

// Initialize the form
function initializeForm() {
    forms.forEach((form, index) => {
        form.style.display = index === 0 ? "flex" : "none";
    });
    btnLeftApplication.style.filter = "blur(5px)";
    btnRightApplication.textContent = "NEXT";
}

const userFirstName = '';
// Move to the next step
function goToNextStep() {
    const currentForm = forms[currentStep];
    const input = currentForm.querySelector("input");

    // Validate input
    if (!input || !input.value.trim()) {
        const errorMessages = [];
        const errorMessageContainer = document.getElementById('formErrorMessage');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^\d+$/;

        // Switch case for structured validation
        switch (input.id) {
            case 'firstNameInput':
                errorMessages.push('Your Full Name is required!');
                break;

            case 'lastNameInput':
                errorMessages.push('Your Last Name is required!');
                break;

            case 'emailAddressInput':
                if (!input.value.trim()) {
                    errorMessages.push('Your Email is required!');
                } else if (!emailPattern.test(input.value.trim())) {
                    errorMessages.push('A valid Email is required!');
                }
                break;

            case 'phoneInput':
                if (!input.value.trim()) {
                    errorMessages.push('Your Phone Number is required!');
                } else if (!phonePattern.test(input.value.trim())) {
                    errorMessages.push('A valid Phone Number is required!');
                }
                break;

            case 'occupationInput':
                errorMessages.push('Your Occupation is required!');
                break;

            case 'reasonInput':
                errorMessages.push('Your Company Status is required!');
                break;

            case 'goalInput':
                errorMessages.push('Your Goal is required!');
                break;

            case 'investmentInput':
                errorMessages.push('Your Investment choice is required!');
                break;

            default:
                errorMessages.push('An unexpected input error occurred.');
                break;
        }
        // Handle error messages display
        handleErrorMessages(errorMessages, errorMessageContainer);
        input.focus();

    }


    // Store the input value
    const key = input.id;
    surveyData[key] = input.value;

    // Customize the next form label if applicable
    if (currentStep === 0) {
        //userFirstName = document.getElementById('firstNameInput');
        const lnameLabel = document.querySelector("label[for='lname']");
        lnameLabel.textContent = `What's Your Last Name, ${userFirstName}?`;
    }
    if (currentStep === 1) {
        const eAdressLabel = document.querySelector("label[for='eaddress']");
        eAdressLabel.textContent = `What's Your Email Address, ${userFirstName}?`;
    }
    if (currentStep === 2) {
        const phoneLabel = document.querySelector("label[for='phone']");
        phoneLabel.textContent = `What's Your Phone Number, ${input.value}?`;
    }

    // Hide current form and show the next
    currentForm.style.display = "none";
    currentStep++;

    if (currentStep < forms.length) {
        forms[currentStep].style.display = "block";
    }

    // Update button states
    if (currentStep > 0) {
        btnLeftApplication.style.filter = "none";
    }
    if (currentStep === forms.length - 1) {
        btnRightApplication.textContent = "Send and Book Now";
    }

    // Submit data if it's the last step
    if (currentStep === forms.length) {
        console.log("Survey completed. Data submitted:", surveyData);
        //alert("Thank you for completing the survey! Your responses have been submitted.");
        openAppointmentBooking();
    }
}

// Move to the previous step
function goToPreviousStep() {
    if (currentStep === 0) return;

    // Hide current form and show the previous
    forms[currentStep].style.display = "none";
    currentStep--;
    forms[currentStep].style.display = "block";

    // Update button states
    if (currentStep === 0) {
        btnLeftApplication.style.filter = "blur(5px)";
    }
    btnRightApplication.textContent = "NEXT";
}

// Event listeners
btnRightApplication.addEventListener("click", goToNextStep);
btnLeftApplication.addEventListener("click", goToPreviousStep);

// Initialize the survey form
initializeForm();
