console.log('Admin js Loaded');

//<i class="fa fa-user-md" aria-hidden="true"></i>


//let DOMAIN_NAME = 'https://adconnect.co.ke/';
let DOMAIN_NAME = 'http://127.0.0.1:3000/';
let API_PATH = 'api/';
const DOMAIN = `${DOMAIN_NAME}${API_PATH}`;

const inputUserName = document.getElementById('name');
const inputUserEmail = document.getElementById('email');
const inputUserRole = document.getElementById('role');
const inputUserAccess = document.getElementById('access');
const inputUserPassword = document.getElementById('password');
const inputUserSearch = document.getElementById('searchUserInput');
const inputLeadSearch = document.getElementById('searchLeadsInput');
const inputAppointmentSearch = document.getElementById('searchAppointmentInput');
const inputAppointmentEdit = document.getElementById('appointmentInput');

const textUsernameSession = document.getElementById('usernameSession');
const textUserPopupHeader = document.getElementById('popupHeaderText');
const textUserPopupHeaderAppt = document.getElementById('popupHeaderTextAppt');
const textErrorContainer = document.getElementById('errorMessage');
const textLoaderText = document.getElementById('loadingText');
const textTitle = document.getElementById('titleText');
const textSubTitle = document.getElementById('subtitleText');

const loader = document.getElementById('loader');

const btnClosePopup = document.getElementById('btnClosePopup');
const btnSubmitUserData = document.getElementById('submitButton');
const btnCreateUser = document.getElementById('createUserButton');
const btnReschedule = document.getElementById('btnReschedule');

const sectionUserManagement = document.getElementById('userContentMgt');
const sectionContactManagement = document.getElementById('aboutContentMgt');
const sectionVideoManagement = document.getElementById('videoContentMgt');
const sectionLeadsManagement = document.getElementById('leadsContentMgt');
const sectionReportsManagement = document.getElementById('reportsContentMgt');
const sectionSettingsManagement = document.getElementById('settingsContentMgt');
const sectionWorkflowsManagement = document.getElementById('workflowsContentMgt');
const sectionCommunicationManagement = document.getElementById('communicationContentMgt');
const sectionDocumentManagement = document.getElementById('documentContentMgt');
const sectionAppointmentManagement = document.getElementById('appointmentContentMgt');

const userMgt = document.getElementById('userMgt');
const contentMgt = document.getElementById('contentMgt');
const aboutMgt = document.getElementById('aboutMgt');
const videoMgt = document.getElementById('videoMgt');
const leadMgt = document.getElementById('leadMgt');
const apptMgt = document.getElementById('apptMgt');
const crmMgt = document.getElementById('crmMgt');
const reportMgt = document.getElementById('reportMgt');
const settingMgt = document.getElementById('settingMgt');
const workflowMgt = document.getElementById('workflowMgt');
const commMgt = document.getElementById('commMgt');
const docsMgt = document.getElementById('docsMgt');

const popupUserMgt = document.getElementById('userPopUp');
const popupAppointment = document.getElementById('appointmentPopup');
const popupLoader = document.getElementById('loaderPopup');

const formLogin = document.getElementById('login-form');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const twoWordsPattern = /^\S+\s+\S+/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}, \d{2}\.\d{2} (AM|PM) - \d{2}\.\d{2} (AM|PM)$/;

let isUpdate = false;
let userIndex = null; // To store the index for updating a user
let appointmentIndex = null; // To store the index for updating an appointment

let errorMessages = '';


document.addEventListener("DOMContentLoaded", () => {

    // Fetch when the page loads
    document.getElementById('adminHero').style.display = 'block';
    //userManagement();
    //fetchLeads();
});

function navigateTo(section) {
    document.querySelectorAll('#content').forEach(sec => sec.classList.add('.hidden'));
    section.classList.remove('.hidden');
}
function activeClass(nav) {
    document.querySelectorAll('.admin-sidebar ul').forEach(sec => sec.classList.remove('activ'));
    nav.classList.add('activ');
}

function userManagement(){
    sectionUserManagement.style.display = 'flex';
    sectionContactManagement.style.display = 'none';
    sectionVideoManagement.style.display = 'none';
    sectionLeadsManagement.style.display = 'none';
    sectionReportsManagement.style.display = 'none';
    sectionSettingsManagement.style.display = 'none';
    sectionWorkflowsManagement.style.display = 'none';
    sectionCommunicationManagement.style.display = 'none';
    sectionDocumentManagement.style.display = 'none';
    sectionAppointmentManagement.style.display = 'none';

    userMgt.classList.add('activ');
    contentMgt.classList.remove('activ');
    aboutMgt.classList.remove('activ');
    videoMgt.classList.remove('activ');
    leadMgt.classList.remove('activ');
    apptMgt.classList.remove('activ');
    crmMgt.classList.remove('activ');
    reportMgt.classList.remove('activ');
    settingMgt.classList.remove('activ');
    workflowMgt.classList.remove('activ');
    commMgt.classList.remove('activ');
    docsMgt.classList.remove('activ');
    //Manage Lists
    fetchUsers();
}
function leadsManagement(){
    sectionUserManagement.style.display = 'none';
    sectionContactManagement.style.display = 'none';
    sectionVideoManagement.style.display = 'none';
    sectionLeadsManagement.style.display = 'flex';
    sectionReportsManagement.style.display = 'none';
    sectionSettingsManagement.style.display = 'none';
    sectionWorkflowsManagement.style.display = 'none';
    sectionCommunicationManagement.style.display = 'none';
    sectionDocumentManagement.style.display = 'none';
    sectionAppointmentManagement.style.display = 'none';

    userMgt.classList.remove('activ');
    contentMgt.classList.remove('activ');
    aboutMgt.classList.remove('activ');
    videoMgt.classList.remove('activ');
    leadMgt.classList.add('activ');
    apptMgt.classList.remove('activ');
    crmMgt.classList.remove('activ');
    reportMgt.classList.remove('activ');
    settingMgt.classList.remove('activ');
    workflowMgt.classList.remove('activ');
    commMgt.classList.remove('activ');
    docsMgt.classList.remove('activ');

    fetchLeads();
}
function appointmentManagement(){
    sectionUserManagement.style.display = 'none';
    sectionContactManagement.style.display = 'none';
    sectionVideoManagement.style.display = 'none';
    sectionLeadsManagement.style.display = 'none';
    sectionReportsManagement.style.display = 'none';
    sectionSettingsManagement.style.display = 'none';
    sectionWorkflowsManagement.style.display = 'none';
    sectionCommunicationManagement.style.display = 'none';
    sectionDocumentManagement.style.display = 'none';
    sectionAppointmentManagement.style.display = 'flex';

    userMgt.classList.remove('activ');
    contentMgt.classList.remove('activ');
    aboutMgt.classList.remove('activ');
    videoMgt.classList.remove('activ');
    leadMgt.classList.remove('activ');
    apptMgt.classList.add('activ');
    crmMgt.classList.remove('activ');
    reportMgt.classList.remove('activ');
    settingMgt.classList.remove('activ');
    workflowMgt.classList.remove('activ');
    commMgt.classList.remove('activ');
    docsMgt.classList.remove('activ');

    fetchAppointments();
}

function aboutManageent(){
    sectionUserManagement.style.display = 'none';
    sectionContactManagement.style.display = 'none';
    sectionVideoManagement.style.display = 'none';
    sectionLeadsManagement.style.display = 'none';
    sectionReportsManagement.style.display = 'none';
    sectionSettingsManagement.style.display = 'none';
    sectionWorkflowsManagement.style.display = 'none';
    sectionCommunicationManagement.style.display = 'none';
    sectionDocumentManagement.style.display = 'none';
    sectionAppointmentManagement.style.display = 'none';

    userMgt.classList.remove('activ');
    contentMgt.classList.remove('activ');
    aboutMgt.classList.remove('activ');
    videoMgt.classList.remove('activ');
    leadMgt.classList.remove('activ');
    apptMgt.classList.add('activ');
    crmMgt.classList.remove('activ');
    reportMgt.classList.remove('activ');
    settingMgt.classList.remove('activ');
    workflowMgt.classList.remove('activ');
    commMgt.classList.remove('activ');
    docsMgt.classList.remove('activ');

    fetchAppointments();
}
/**
 * Refreshes the user table
 */
function refreshUserTable(){
    userList = [];
    fetchUsers();
}

function refreshLeadsTable(){
    leadList = [];
    fetchLeads();
}

function refreshAppointmentTable(){
    appointmentList = [];
    fetchAppointments();
}

async function handleLogin() {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageContainer = document.getElementById('errorMessage');

    if(email === ''){
        handleErrorMessage('Please Input Email', errorMessageContainer);
        document.getElementById('email').focus();
        return;
    }
    if(!emailPattern.test(email)){
        handleErrorMessage('Enter a valid email!', errorMessageContainer);
        document.getElementById('email').focus();
        return;
    }
    if(password === ''){
        handleErrorMessage('Please Input password', errorMessageContainer);
        document.getElementById('email').focus();
        return;
    }
    if(!passwordPattern.test(password)){
        handleErrorMessage('Enter a valid password!', errorMessageContainer);
        document.getElementById('password').focus();
        return;
    }

    auth = { email, password };

    showLoader();
    try {
        // Perform the fetch call
        const response = await fetch(`${DOMAIN}auth`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });
    
        // Check if the response is OK
        if (!response.ok) {
          // Handle server-side errors (e.g., 401, 400)
          const errorData = await response.json();
          console.error('Error:', errorData);
          alert(errorData.error || 'Invalid email or password.');
          return;
        }
    
        // Parse JSON response
        const data = await response.json();
        console.log('Response Data:', data);
    
        // If login is successful
        alert('Login Successful!');
        document.getElementById('adminHero').style.display = 'block';
        document.getElementById('login-page').style.display = 'none';
    
        // Update Username
        if (textUsernameSession) {
          textUsernameSession.textContent = data.username; // Use the `username` from the server response
        }

        // Open Session with users loaded
        userManagement();
        populateUsers();
      } catch (error) {
        // Handle network errors
        console.error('Network Error:', error);
        alert('An error occurred while logging in. Please try again.');
      }
    hideLoader();
}

// Function to show the loader
function showLoader() {
    loader.classList.remove('hidden');
    popupLoader.style.height ='100%';
  }
  
  // Function to hide the loader
  function hideLoader() {
    loader.classList.add('hidden');
    popupLoader.style.height ='0%';
    textLoaderText.textContent = '';
  }

let userList = [];
let leadList = [];
let appointmentList = [];

async function fetchUsers() {
    showLoader();
    textLoaderText.textContent = 'Fetching Users. Please Wait!';
    try {
        const response = await fetch(`${DOMAIN}users`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        userList = await response.json();
    
        populateUsers();
        clearInput();
    } catch (error) {
        console.error('Error fetching users messages:', error);
    } finally{
        hideLoader();
    }
}

async function fetchAppointments() {
    showLoader();
    textLoaderText.textContent = 'Fetching Appointments. Please Wait!';
    try {
        const response = await fetch(`${DOMAIN}appointments`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        appointmentList = await response.json();
    
        populateAppointments();
    } catch (error) {
        console.error('Error fetching Appointments messages:', error);
    } finally{
        hideLoader();
    }
}

async function fetchLeads() {
    showLoader();
    textLoaderText.textContent = 'Fetching Leads. Please Wait!';
    try {
        const response = await fetch(`${DOMAIN}clients`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        leadList = await response.json();
    
        populateLeads();
    } catch (error) {
        console.error('Error fetching Leads messages:', error);
    } finally{
        hideLoader();
        textLoaderText.textContent = '';
    }
}

function populateUsers() {
    const dataList = document.getElementById('userList');
    dataList.innerHTML = ''; // Clear existing content
  
    if (userList.length === 0) {
      dataList.innerHTML = '<p style="margin: 200px; color: white; font-size: 30px; font-weight: 700; cursor: pointer; transition: all 0.5s ease;">No Registered Users Available!</p>';
      return;
    }
  
    userList.forEach((item, index) => {
      const listItem = document.createElement('div');
      listItem.classList.add('h-layout', 'item-content');
      listItem.innerHTML = `
        <p class="item-user-id">${item.id}</p>
        <p class="item-user-name">${item.name}</p>
        <p class="item-user-email">${item.email}</p>
        <p class="item-user-roles">${item.role}</p>
        <p class="item-user-access">${item.access_level}</p>
        <button id="userUpdateBtn" onclick="openUpdateUser(${index})">UPDATE</button>
        <button id="userDeleteBtn" onclick="deleteUser(${index})">DELETE</button>
      `;
      dataList.appendChild(listItem);
    });
  }
  
  function populateLeads() {
    const dataList = document.getElementById('leadList');
    dataList.innerHTML = ''; // Clear existing content
  
    if (leadList.length === 0) {
      dataList.innerHTML = '<p style="margin: 200px; color: white; font-size: 30px; font-weight: 700; cursor: pointer; transition: all 0.5s ease;">No Captured Leads Available!</p>';
      return;
    }
  
    leadList.forEach((item, index) => {
      const listItem = document.createElement('div');
      listItem.classList.add('h-layout', 'item-content');
      listItem.innerHTML = `
      <div class="h-layout item-content" onclick="clicked(${index})">
        <p class="item-lead-id">${item.clientID}</p>
        <p class="item-lead-name">${item.clientName}</p>
        <p class="item-lead-email">${item.clientEmail}</p>
        <p class="item-lead-phone">${item.clientPhone}</p>
        <p class="item-lead-source">${item.clientSource}</p>
        <p class="item-lead-status">${item.clientStatus}</p>
        <p class="item-lead-subscription">${item.clientSubScription}</p>
        <p class="item-lead-date">${item.created_at}</p>
        <i id="leadPreviewMailBtn" onclick="previewEmailTemplate(${index})" class="fa fa-envelope-open" aria-hidden="true"></i>
        <i id="leadSendMailBtn" onclick="sendSubsequentEmail(${index})" class="fa fa-envelope" aria-hidden="true"></i>
        <i id="leadUnsubscribeBtn" onclick="unsubscribeFromLead(${index})" class="fa fa-sign-out" aria-hidden="true"></i>
        <i id="leadDeleteBtn" onclick="deleteLead(${index})" class="fa fa-trash" aria-hidden="true"></i>
        </div>
      `;
      dataList.appendChild(listItem);
    });
  }
  
  function populateAppointments() {
    const dataList = document.getElementById('appointmentList');
    dataList.innerHTML = ''; // Clear existing content
  
    if (appointmentList.length === 0) {
      dataList.innerHTML = '<p style="margin: 200px; color: white; font-size: 30px; font-weight: 700; cursor: pointer; transition: all 0.5s ease;">No Captured Appointments Available!</p>';
      return;
    }
  
    console.log(appointmentList);
    appointmentList.forEach((item, index) => {
      const listItem = document.createElement('div');
      listItem.classList.add('h-layout', 'item-content');
      listItem.innerHTML = `
      <div class="h-layout item-content" onclick="clicked(${index})">
        <p class="item-appointment-id">${item.clientId}</p>
        <p class="item-appointment-name">${item.name}</p>
        <p class="item-appointment-email">${item.email}</p>
        <p class="item-appointment-phone">${item.phone}</p>
        <p class="item-appointment-location">${item.location}</p>
        <p class="item-appointment-date">${item.appointmentDate}</p>
        <p class="item-appointment-time">${item.appointmentTime}</p>
        <p class="item-appointment-type">${item.appointmentType}</p>
        <p class="item-appointment-status">${item.appointmentStatus}</p>
        <p class="item-appointment-notes" style="cursor: pointer" onclick="previewNotes(${index})">${item.appointmentNotes}</p>
        <i id="apptReschedule" onclick="appointmentReschedule(${index})" class="fa fa-calendar" aria-hidden="true"></i>
        <i id="apptReschedule" onclick="appointmentReminder(${index})" class="fa fa-clock" aria-hidden="true"></i>
        <i id="leadSendMailBtn" onclick="appointmentStartMeeting(${index})" class="fa fa-video-camera" aria-hidden="true"></i>
        <i id="leadUnsubscribeBtn" onclick="appointmentUpdateStatus(${index})" class="fa fa-check-circle" aria-hidden="true"></i>
        <i id="leadDeleteBtn" onclick="deleteAppointment(${index})" class="fa fa-trash" aria-hidden="true"></i>
        </div>
      `;
      dataList.appendChild(listItem);
    });
  }

  function clicked(index){
    console.log(`Item at position ${index} clicked.`);
  }

  function previewNotes(index){
    textSubTitle.style.visibility = 'collapse';
    inputAppointmentEdit.style.visibility = 'collapse';
    btnReschedule.style.visibility = 'collapse';
    textUserPopupHeaderAppt.style.visibility = 'visible';
    textTitle.style.visibility = 'visible';

    let name = (appointmentList[index].name).split(' ');
    textUserPopupHeaderAppt.textContent = `Message From ${name[0]}`;
    textTitle.textContent = appointmentList[index].appointmentNotes;

    openAppointmentPopup();
  }

  function appointmentReschedule(index){
    textSubTitle.style.visibility = 'visible';
    inputAppointmentEdit.style.visibility = 'visible';
    btnReschedule.style.visibility = 'visible';
    textUserPopupHeaderAppt.style.visibility = 'visible';
    textTitle.style.visibility = 'collapse';

    textUserPopupHeaderAppt.textContent = `Reschedule Meeting for ${appointmentList[index].name.split(' ')[0]}`;
    inputAppointmentEdit.value = appointmentList[index].appointmentTime;

    appointmentIndex = index;
    openAppointmentPopup();
  }

  async function rescheduleMeeting(){
    const errorContainer = document.getElementById('errorMessage');
    if (inputAppointmentEdit.value === ''){
        handleErrorMessage('Input Date and Time', errorContainer);
        inputAppointmentEdit.focus();
        return;
    }
    if(!dateTimePattern.test(inputAppointmentEdit.value.trim)){
        handleErrorMessage('Format Date to \'2025-01-20, 01.30 PM - 02.00 PM\'', errorContainer);
        inputAppointmentEdit.focus();
        return;
    }

    try {
        textLoaderText.textContent = 'Rescheduling Meeting. Please Wait!';
        showLoader();
        const response = await fetch(`${DOMAIN}rescheduleMeeting`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentList[appointmentIndex]),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            appointmentList[index].appointmentDate = result.appointment.appointmentDate;
            appointmentList[index].appointmentTime = result.appointment.appointmentTime;
            populateAppointments();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to Reschedule Meeting. Please try again.');
    } finally{
        hideLoader();
    }
  }

  async function appointmentReminder(index){
    try {
        textLoaderText.textContent = 'Sending Reminder. Please Wait!';
        showLoader();
        const response = await fetch(`${DOMAIN}reminder-email`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentList[index]),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            populateAppointments();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send reminder. Please try again.');
    } finally{
        hideLoader();
    }
  }

  function appointmentStartMeeting(index){
    window.open(appointmentList[index].meetingLink);
  }

  async function appointmentUpdateStatus(index){
    try {
        textLoaderText.textContent = 'Updating Meeting Status. Please Wait!';
        showLoader();
        const response = await fetch(`${DOMAIN}appointments/${appointmentList[index].clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({status:'DONE'}),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            appointmentList[index].appointmentStatus = 'DONE';
            populateAppointments();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to Update Status. Please try again.');
    } finally{
        hideLoader();
    }
  }

  async function deleteAppointment(index){
    if (confirm('Are you sure you want to delete this Appointment?')) {
        try {
            textLoaderText.textContent = 'Deleting Appointment. Please Wait...';
            showLoader();
            const response = await fetch(`${DOMAIN}appointments/${appointmentList[index].clientIs}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete Appointment');
            errorMessages = 'Appointment deleted successfully';

            textErrorContainer.style.color = 'white';
            textErrorContainer.style.backgroundColor = '#4abc5061';
            handleErrorMessage(errorMessages, textErrorContainer);
            textErrorContainer.style.color = 'rgb(236, 2, 2)';
            textErrorContainer.style.backgroundColor = 'rgba(251, 128, 128, 0.533)';
            appointmentList.splice(index, 1);
            populateAppointments();
        } catch (error) {
            console.error('Error deleting Appointment:', error);
            errorMessages = 'Failed to delete the Appointment. Please try again.';
            handleErrorMessage(errorMessages, textErrorContainer);
        } finally{
            hideLoader();
        }
      }
  }

  async function previewEmailTemplate(index) {
    textLoaderText.textContent = 'Preparing Email for Preview. Please Wait!';
    showLoader();
    const response = await fetch(`${DOMAIN}emailTemplate?status=${leadList[index].clientStatus}`);
    const template = await response.json();

    if (template) {
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(template.body);
    } else {
        alert('Template not found for the specified status.');
    }
    textLoaderText.textContent = '';
    hideLoader();
}

async function unsubscribeFromLead(index) {
    let clientID = leadList[index].clientID;
    try {
        textLoaderText.textContent = 'Unsubscribing. Please Wait!';
        showLoader();
        const response = await fetch(`${DOMAIN}unsubscribeLead`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientID }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            leadList[index].clientSubScription = 'UNSUBSCRIBED';
            populateLeads();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed unsubscribe. Please try again.');
    } finally{
        textLoaderText.textContent = '';
        hideLoader();
    }
}

// Send subsequent emails
async function sendSubsequentEmail(index) {
    let clientID = leadList[index].clientID;
    try {
        textLoaderText.textContent = 'Sending Follow-up Email. Please Wait!';
        showLoader();
        const response = await fetch(`${DOMAIN}sendSubsequentEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientID }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fetchLeads();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send email. Please try again.');
    } finally{
        textLoaderText.textContent = '';
        hideLoader();
    }
}

/**
 * Delete lead
 * @param {*} index postion of the lead to be deleted
 */
async function deleteLead(index){
    if (confirm('Are you sure you want to delete this Lead?')) {
        try {
            textLoaderText.textContent = 'Deleting Lead. Please Wait...';
            showLoader();
            const response = await fetch(`${DOMAIN}clients/${leadList[index].clientID}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete lead');
            errorMessages = 'Lead deleted successfully';

            textErrorContainer.style.color = 'white';
            textErrorContainer.style.backgroundColor = '#4abc5061';
            handleErrorMessage(errorMessages, textErrorContainer);
            textErrorContainer.style.color = 'rgb(236, 2, 2)';
            textErrorContainer.style.backgroundColor = 'rgba(251, 128, 128, 0.533)';
            leadList.splice(index, 1);
            populateLeads();
        } catch (error) {
            console.error('Error deleting user:', error);
            errorMessages = 'Failed to delete the Lead. Please try again.';
            handleErrorMessage(errorMessages, textErrorContainer);
        } finally{
            hideLoader();
        }
      }
}

  function openUpdateUser(index){
    textUserPopupHeader.textContent = 'Update User';
    isUpdate = true;
    userIndex = index; // Save the index for use during submission

    // Retrieve the user object from the list
    const user = userList[index];

    inputUserName.value = user.name;
    inputUserEmail.value = user.email;
    inputUserRole.value = user.role;
    inputUserPassword.value = user.password;
    inputUserAccess.value = user.access_level;

    openUserPopup(); // Open the user form popup
  }

  btnCreateUser.addEventListener('click', function (event) {
    textUserPopupHeader.textContent = 'Create New User';
    isUpdate = false;
    userIndex = null; //not an update
    openUserPopup();
  });

  /**
   * Submit action
   */
  btnSubmitUserData.addEventListener('click', async function (event) {

    event.preventDefault();

    if (isUpdate) {
        // Use the stored `userIndex` for the update
        updateUser(userIndex);
    } else {
        await registerUser(); // Handle creating a new user
    }
  });

  // Update user function
async function updateUser(index) {
    validateUserInput();

    const user = {
        id:userList[index].id,
        name: inputUserName.value.toUpperCase(),
        email: inputUserEmail.value,
        password: inputUserPassword.value,
        role: inputUserRole.value,
        access_level: inputUserAccess.value,
    };

    try {
        textLoaderText.textContent = 'Fetching Users. Please Wait!';
        showLoader();
        const response = await fetch(`${DOMAIN}users/${userList[index].id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        textLoaderText.textContent = '';
        textLoaderText.textContent = 'Users Fetched. Loading';
        if (response.ok) {
            const result = await response.json();
            errorMessages = 'User updated successfully!';
            setSuccessColor(textErrorContainer);
            handleErrorMessage(errorMessages, textErrorContainer);
            setErrorColor(textErrorContainer); // Revert to default
            userList[index] = user;
            populateUsers();
            clearInput();
            closePopup();
            console.log('Updated user:', result.user);
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error updating user:', error);
        errorMessages = 'An error occurred while updating the user.';
        handleErrorMessage(errorMessages, textErrorContainer);
    } finally{
        hideLoader();
        textLoaderText.textContent = '';
        isUpdate = false;
    }
}


  /**
   * 
   * @returns 
   */
  async function registerUser() {
    // Validate user input fields
    if (inputUserName.value.trim() === '') {
        inputUserName.focus();
        handleErrorMessage('Full Name is required!', textErrorContainer);
        return;
    }
    if (!twoWordsPattern.test(inputUserName.value.trim())) {
        inputUserName.focus();
        handleErrorMessage('A full name must contain two or more words!', textErrorContainer);
        return;
    }
    if (inputUserEmail.value.trim() === '') {
        inputUserEmail.focus();
        handleErrorMessage('Email is required!', textErrorContainer);
        return;
    }
    if (!emailPattern.test(inputUserEmail.value)) {
        inputUserEmail.focus();
        handleErrorMessage('Please enter a valid email address!', textErrorContainer);
        return;
    }
    if (inputUserPassword.value.trim() === '') {
        inputUserPassword.focus();
        handleErrorMessage('Password is required!', textErrorContainer);
        return;
    }
    if (!passwordPattern.test(inputUserPassword.value)) {
        inputUserPassword.focus();
        handleErrorMessage('Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, and one number!', textErrorContainer);
        return;
    }
    if (!inputUserRole.value.trim() || inputUserRole.value === 'Select User Role') {
        inputUserRole.focus();
        handleErrorMessage('User Role is required!', textErrorContainer);
        return;
    }
    if (!inputUserAccess.value.trim() || inputUserAccess.value === 'Select User Access') {
        inputUserAccess.focus();
        handleErrorMessage('User Access is required!', textErrorContainer);
        return;
    }

    // Prepare the user object for submission
    const user = {
        name: inputUserName.value.trim().toUpperCase(),
        email: inputUserEmail.value.trim(),
        password: inputUserPassword.value.trim(),
        role: inputUserRole.value.trim().toUpperCase(),
        access_level: inputUserAccess.value.trim().toUpperCase(),
    };

    try {
        textLoaderText.textContent = 'Registering User. Please Wait!';
        // Show loader before the request
        showLoader();

        // Make API call
        const response = await fetch(`${DOMAIN}users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        // Handle response
        if (response.ok) {
            let result;
            try {
                result = await response.json(); // Attempt to parse JSON
            } catch {
                result = { message: 'User created successfully!' }; // Fallback if response isn't JSON
            }
            console.log('Response:', result);
            setSuccessColor(textErrorContainer);
            handleErrorMessage(result.message || 'User created successfully!', textErrorContainer);
            setErrorColor(textErrorContainer);
            fetchUsers(); // refresh list
            clearInput();
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.error || 'An unknown error occurred';
            handleErrorMessage(`Error: ${errorMessage}`, textErrorContainer);
        }
    } catch (error) {
        console.error('Error:', error);
        handleErrorMessage('Failed to create user. Please try again later.', textErrorContainer);
    } finally {
        // Hide loader after the request
        hideLoader();
        isUpdate = false;
        textLoaderText.textContent = '';
    }
}


function validateUserInput(){
    if (inputUserName.value.trim() === '') {
        inputUserName.focus();
        errorMessages = 'Full Name is required!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (!twoWordsPattern.test(inputUserName.value.trim())) {
        inputUserName.focus();
        errorMessages = 'A full Name has two or more words!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (inputUserEmail.value.trim() === '') {
        inputUserEmail.focus();
        errorMessages = 'Email is required!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (!emailPattern.test(inputUserEmail.value)) {
        inputUserEmail.focus();
        errorMessages = 'Please enter a valid email address!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (inputUserPassword.value.trim() === '') {
        inputUserPassword.focus();
        errorMessages = 'Password is required!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (!passwordPattern.test(inputUserPassword.value)) {
        inputUserPassword.focus();
        errorMessages = 'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, and one number!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (inputUserRole.value.trim() === 'Select User Role' || '') {
        inputUserRole.focus();
        errorMessages = 'User Role is required!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
    if (inputUserAccess.value.trim() === 'Select User Access' || '') {
        inputUserAccess.focus();
        errorMessages = 'User Access is required!';
        handleErrorMessage(errorMessages, textErrorContainer);
        return true;
    }
}

async function deleteUser(index){
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            showLoader();
            const response = await fetch(`${DOMAIN}users/${userList[index].id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete user');
            errorMessages = 'User deleted successfully';
            setSuccessColor(textErrorContainer);
            handleErrorMessage(errorMessages, textErrorContainer);
            setErrorColor(textErrorContainer);
            userList.splice(index, 1);
            populateUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            errorMessages = 'Failed to delete the User. Please try again.';
            handleErrorMessage(errorMessages, textErrorContainer);
        } finally{
            hideLoader();
        }
      }
}

function clearInput(){
        inputUserName.value = '';
        inputUserEmail.value = '';
        inputUserPassword.value = '';
        inputUserRole.value = '';
        inputUserAccess.value = '';
}

/**
 * Filter search
 */
inputUserSearch.addEventListener('input', function (event) {
    const filter = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#userList .item-content');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

/**
 * Filter leads
 */
inputLeadSearch.addEventListener('input', function (event) {
    const filter = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#leadList .item-content');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

/**
 * Filter leads
 */
inputAppointmentSearch.addEventListener('input', function (event) {
    const filter = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#appointmentList .item-content');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

/**
 * Opens the user popup
 */
function openUserPopup(){
    popupUserMgt.style.height ='100%';
}
function openAppointmentPopup(){
    popupAppointment.style.height ='100%';
}
/**
 * Close Popups
 */
function closePopup(){
    popupUserMgt.style.height ='0%';
    popupAppointment.style.height ='0%';
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
 *  Set the color of the display to green
 * @param {the error display container} container 
 */
function setSuccessColor(container){
    container.style.color = 'white';
    container.style.backgroundColor = '#4abc5061';
}

/**
 * Set the color of the display to red
 * @param {the error display container} container 
 */
function setErrorColor(container){
    container.style.color = 'rgb(236, 2, 2)';
    container.style.backgroundColor = 'rgba(251, 128, 128, 0.533)';
}