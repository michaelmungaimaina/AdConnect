
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

const sectionValueVideo  = document.getElementById('valueVideoSection');

const txtOpenLeadCapture = document.getElementById('txtOpenLeadcapture');
const iconPause = document.getElementById('btnPauseIcon');

const sectionThankYouVideo = document.getElementById('thankYouVideoSection');
const btnCloseThanksPage = document.getElementById('btnCloseThanksPage');

const btnSubmitLeadCapture  = document.getElementById('btnSubmitLeadCapture');

const sidepanel = document.getElementById('mySidePanel');


function openThankYouPage(){
    if (sectionThankYouVideo){
        sectionLeadCapture.style.height = '0%';
        
        sectionThankYouVideo.style.display = 'flex';
    } else {
        console.error('Error: Thank You Video Section Not Found');
    }
}

// Add event listeners for responsiveness testing
window.addEventListener('resize', () => {
    const thankYouSection = document.getElementById('thankYouVideoSection');
    if (thankYouSection.style.display === 'flex') {
        thankYouSection.scrollIntoView({ behavior: 'smooth' });
    }
});

function closeThankYouPage(){
    if (sectionThankYouVideo){
        sectionThankYouVideo.style.display = 'none';
    } else {
        console.error('Error: ThankY You Video Section Not Found');
    }
}

function openFAQs(){
    'use strict';
    if (showFAQsSection){
        faqsSection.style.height = '100%'

    } else{
        console.error('Error: button not found');
    }
}

function openFAQsForm(){
    'use strict';
    const btnText = document.getElementById('showFAQsForm');
    btnText.innerHTML;
    if (showFAQsForm){
        FAQsForm.style.height = 'fit-content'
        showFAQsForm.style.height = '0px'
        showFAQsForm.style.overflow = 'hidden'
        submitFAQsFormButton.style.height = 'fit-content'

    } else{
        console.error('Error: button not found');
    }
}

function openValueVideo(){
    if (sectionValueVideo){
        sectionValueVideo.style.display = 'flex'
        sectionValueVideo.scrollIntoView( {behavior: 'smooth' });

        
        sectionMainhero.style.display = "none"
    } else {
        console.error('Error: Section Value Video not found')
    }
}

function openLeadCaptureSection(){
    if (sectionLeadCapture){
        sectionLeadCapture.style.height = '100%';
    } else {
        console.error('Error: Lead Section Not Found!');
    }
}

function submitFAQsForm(){
    'use strict';
    if (submitFAQsForm){
        FAQsForm.style.height = '0'
        showFAQsForm.style.height = 'fit-content'
        submitFAQsFormButton.style.height = '0px'

    } else{
        console.error('Error: button not found');
    }
}

function closeFAQs(){
    'use strict';
    if (btnCloseFAQs){
        faqsSection.style.height = '0'

    } else{
        console.error('Error: button not found');
    }
}

function closeNav(){
    'use strict';
    const navHeader = document.querySelector(".navbar");
    const sidepanel = document.getElementById('mySidePanel');

    if (sidepanel){
        sidepanel.style.left = '-320px';
        navHeader.style.transform = "translateY(0)";
    } else{
        console.error('Error: sidepanel not found');
    }
}

/* Sidebar start */

function openNav(){
    'use strict';
    const navHeader = document.querySelector(".navbar");
    if (sidepanel){
        navHeader.style.transform = "translateY(-100%)";
        sidepanel.style.left = '0';
    } else{
        console.error('Error: sidepanel not found');
    }
}

/* Search bar */
function openSearch(){
    'use strict';
    const searchPanel = document.getElementById('searchbar');
    if (searchPanel){
        searchPanel.style.height = '100vh';
        searchPanel.style.borderRadius = '0';
    } else {
        console.error('Error: search panel not found');
    }
}

function closeSearch(){
    'use strict';
    const searchPanel = document.getElementById('searchbar');
    if (searchPanel){
        searchPanel.style.height = '0';
        searchPanel.style.borderTopRightRadius = '100%';
        searchPanel.style.borderTopLeftRadius = '100%';
    } else {
        console.error('Error: search panel not found');
    }
}

function closeAppointmentView(){
    'use strict'
    const btnCloseAppointmentView = document.getElementById('btnCloseApointment');
    const appointmentView = document.getElementById('appointmentView');

    if(appointmentView){
        appointmentView.style.height = '0';
    } else {
        console.error('Error: appointmentview not found');
    }
}

function closeLeadCapture(){
    if (sectionLeadCapture){
        sectionLeadCapture.style.height = '0';
    } else {
        console.error('Error: Lead Capture Section not found');
    }
}

function navigateToNextPage() {
    alert('Redirecting to the Contact Us page...');
    // Redirect to next page
    window.location.href = '.html';
  }

  function scrollToAboutPage(){
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
    if($(this).children(".video").get(0).paused){        $(this).children(".video").get(0).play();   $(this).children(".playpause").fadeOut();
      }else{       $(this).children(".video").get(0).pause();
    $(this).children(".playpause").fadeIn();
      }
  });

  