console.log('Admin js Loaded');

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

const textUserPopupHeader = document.getElementById('popupHeaderText');
const textErrorContainer = document.getElementById('errorMessage');

const loader = document.getElementById('loader');

const btnClosePopup = document.getElementById('btnClosePopup');
const btnSubmitUserData = document.getElementById('submitButton');
const btnCreateUser= document.getElementById('createUserButton');

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

const popupUserMgt = document.getElementById('userPopUp');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const twoWordsPattern = /^\S+\s+\S+/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

let isUpdate = false;
let userIndex = null; // To store the index for updating a user

let errorMessages = '';


document.addEventListener("DOMContentLoaded", () => {
    // Fetch when the page loads
    fetchUsers();
    populateUsers();
});

// Function to show the loader
function showLoader() {
    loader.classList.remove('hidden');
  }
  
  // Function to hide the loader
  function hideLoader() {
    loader.classList.add('hidden');
  }

let userList = [];

async function fetchUsers() {
    showLoader();
    try {
        const response = await fetch(`${DOMAIN}users`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        userList = await response.json();
    
        populateUsers();
        clearInput();
    } catch (error) {
        console.error('Error fetching contact messages:', error);
    } finally{
        hideLoader();
    }
}

function populateUsers() {
    const dataList = document.getElementById('userList');
    dataList.innerHTML = ''; // Clear existing content
  
    if (userList.length === 0) {
      dataList.innerHTML = '<p>No contact messages available.</p>';
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
        showLoader();
        const response = await fetch(`${DOMAIN}users/${userList[index].id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

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
 * Opens the user popup
 */
function openUserPopup(){
    popupUserMgt.style.height ='100%';
}
/**
 * Close Popups
 */
function closePopup(){
    popupUserMgt.style.height ='0%';
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