const supabasePublicClient = supabase.createClient('https://agldqgjpcqqmqynizbcs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbGRxZ2pwY3FxbXF5bml6YmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDA5OTgsImV4cCI6MjA0MDUxNjk5OH0.qIUhU-16YQzrIY_SnRxWDG3l5RzKj9s8ns3XaoQAEFo')

document.getElementById('sign_in').addEventListener('keydown', function(event) { //Can press enter to sign in
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if inside a form
        signIn(); // Call the signIn function
    }
});

// Handle DOM content and tab functionality
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.question button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const faq = button.nextElementSibling;
            const icon = button.querySelector('.d-arrow');

            faq.classList.toggle('show');
            icon.classList.toggle('rotate');
        });
    });

    // Function to show the home tab content on page load
    function showHomeTab() {
        var tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(function(tabContent) {
            tabContent.style.display = 'none';
        });

        document.getElementById('home').style.display = 'block';
    }

    window.onload = showHomeTab;

    // Define the openTab function
    function openTab(tabName) {
        var tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(function(tabContent) {
            tabContent.style.display = 'none';
        });

        document.getElementById(tabName).style.display = 'block';

        var tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(function(tabButton) {
            tabButton.classList.remove('active');
        });

        var clickedButton = document.querySelector('[onclick="openTab(\'' + tabName + '\')"]');
        if (clickedButton) {
            clickedButton.classList.add('active');
        }
    }

    // Clicking on MADZ logo will go to home page
    var madzLogoButton = document.getElementById("madz_logo");
    madzLogoButton.addEventListener("click", function() {
        window.location.href = "index.html";
    });

    // Buttons highlighting logic
    var pageButtons = {
        "home_button": "home",
        "faq_button": "faq",
        "about_button": "about",
        "request_button": "request",
        "sign_in_button": "sign_in"
    };
    var currentTab = "home";
    document.getElementById("home_button").style.filter = "brightness(150%)";

    function resetButtonColors() {
        Object.keys(pageButtons).forEach(function(buttonId) {
            document.getElementById(buttonId).style.filter = "brightness(100%)";
        });
    }

    // Function to add event listeners to a button
    function handleButton(buttonId, tabName) {
        var button = document.getElementById(buttonId);

        // Click event
        button.addEventListener("click", function() {
            resetButtonColors();
            if (currentTab != tabName) {
                currentTab = tabName;
                button.style.filter = "brightness(150%)";
            }
        });

        // Mouseover event
        button.addEventListener("mouseover", function() {
            if (currentTab != tabName) {
                button.style.filter = "brightness(150%)";
            }
        });

        // Mouseout event
        button.addEventListener("mouseout", function() {
            if (currentTab != tabName) {
                button.style.filter = "brightness(100%)";
            }
        });
    }

    // Initialize buttons with event listeners
    Object.keys(pageButtons).forEach(function(buttonId) {
        handleButton(buttonId, pageButtons[buttonId]);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Get references to the department code and class section elements
    const deptCodeInput = document.getElementById("dept_code");
    const classSectionInput = document.getElementById("class_section");
    const classSectionDatalist = document.getElementById("class_sections");
    const clearDeptButton = document.getElementById("clear_dept_button");
    const clearClassButton = document.getElementById("clear_class_button");

    // Function to clear the selected department code
    clearDeptButton.addEventListener("click", function () {
        deptCodeInput.value = "";
        classSectionInput.value = "";
        classSectionDatalist.innerHTML = '';
    });

    // Function to clear the selected class section
    clearClassButton.addEventListener("click", function () {
        classSectionInput.value = "";
    });

    // Function to update the class section options based on the selected department
    async function updateClassSections() {
        const selectedDept = deptCodeInput.value.toUpperCase(); // Convert input to uppercase
        console.log("Selected department:", selectedDept);

        // Clear existing options
        classSectionDatalist.innerHTML = '';

        if (deptCodeInput.value === '') {
            return;
        }

        // Fetch class sections from the database based on selected department
        const { data, error } = await supabasePublicClient
            .from('courses') // Fetch from courses table
            .select('coursecode, coursenum, coursesec') // Select relevant columns
            .eq('dept', selectedDept); // Filter by department

        if (error) {
            console.error('Error fetching courses:', error);
            return;
        }

        // Add options for the selected department
        data.forEach(course => {
            const option = document.createElement("option");
            // Combine course code, course number, and course section into a single string
            option.value = `${course.coursecode} ${course.coursenum} ${course.coursesec}`;
            classSectionDatalist.appendChild(option);
        });
    }

    // Event listener to update class sections when department code changes
    deptCodeInput.addEventListener("input", updateClassSections);

    // Trigger initial update of class sections
    updateClassSections();
});

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('attendanceform').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission
        console.log('Form submission triggered!'); // Debug message

        const email = document.getElementById('professor_email').value;

        // Email validation using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById('submissionInfo').innerHTML = `
                <p>Status: Error - Invalid email format</p>
                <p>Email: ${email}</p>
            `;
            document.getElementById('submissionInfo').style.backgroundColor = 'red';
            return; // Stop the submission if email is invalid
        }

        // Check if the email exists in the users database table
        const { data: usersData, error: usersError } = await supabasePublicClient
            .from('users') // The users table where you are storing faculty emails
            .select('facemail')
            .eq('facemail', email); // Check if the submitted email matches any email in the users table

        if (usersError) {
            console.log('Supabase Error:', usersError); // Debug message
            document.getElementById('submissionInfo').innerHTML = `
                <p>Status: Error - ${usersError.message}</p>
            `;
            document.getElementById('submissionInfo').style.backgroundColor = 'red';
            return;
        }

        // If no matching email is found in the users table
        if (usersData.length === 0) {
            document.getElementById('submissionInfo').innerHTML = `
                <p>Submission Time: ${new Date().toLocaleString()}</p>
                <p>Status: Fail - No matching email found in the users database</p>
                <p>Email: ${email}</p>
            `;
            document.getElementById('submissionInfo').style.backgroundColor = 'red';
            return; // Stop the submission process
        }

        // Collect form data
        const formData = {
            studentfirstname: document.getElementById('student_firstname').value,
            studentlastname: document.getElementById('student_lastname').value,
            deptcode: document.getElementById('dept_code').value,
            coursecode: document.getElementById('class_section').value,
            facemail: document.getElementById('professor_email').value,
            note: document.getElementById('professor_note').value,
            insertdate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            inserttime: new Date().toLocaleTimeString() // HH:MM:SS
        };

        console.log('Form Data:', formData); // Debug message

        // Insert data into Supabase
        const { data, error } = await supabasePublicClient
            .from('temptable') // Your table name in Supabase
            .insert([formData]);

        const submissionTime = new Date().toLocaleString(); // Capture the submission time

        if (error) {
            console.log('Supabase Error:', error); // Debug message
            document.getElementById('submissionInfo').innerHTML = `
                <p>Submission Time: ${submissionTime}</p>
                <p>Status: Error - ${error.message}</p>
                <p>Email: ${formData.facemail}</p>
            `;
            document.getElementById('submissionInfo').style.backgroundColor = 'red'; // <-- Moved this outside the template string
        } else {
            console.log('Data successfully inserted:', data); // Debug message
            document.getElementById('attendanceform').reset(); // Clear the form
            document.getElementById('submissionInfo').innerHTML = `
                <p>Submission Time: ${submissionTime}</p>
                <p>Status: Success</p>
                <p>Email: ${formData.facemail}</p>
            `;
            document.getElementById('submissionInfo').style.backgroundColor = 'green';
        }
    }); // <-- Correctly closed the callback here
});

async function signIn() {
  const email = document.getElementById('entered_email').value;
  const password = document.getElementById('entered_pass').value;

  // Sign in the user with email and password
  const { data: authData, error: authError } = await supabasePublicClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  // Handle authentication errors
  if (authError) {
    document.getElementById('signinMessage').innerHTML = `<p style="color: red;">Error: ${authError.message}</p>`;
      document.getElementById('entered_pass').value = '';
    return;
  }

  // Fetch user data from your 'users' table using the signed-in email and facemail column
  const { data: userData, error: userError } = await supabasePublicClient
    .from('users')
    .select('facrank')
    .eq('facemail', email)
    .single();

  // Handle user fetch errors
  if (userError || !userData) {
    document.getElementById('signinMessage').innerHTML = `<p style="color: red;">Error fetching user data: ${userError ? userError.message : 'User not found.'}</p>`;
    return;
  }

  // Check the facrank of the user and redirect accordingly
  const facrank = userData.facrank;
  if (facrank === 'Admin') {
    window.location.href = "inAdminAccount.html";
  } else if (facrank === 'Professor') {
    window.location.href = "inProfessorAccount.html";
  } else if (facrank === 'Chair') {
    window.location.href = "inChairAccount.html";
  } else {
    document.getElementById('signinMessage').innerHTML = `<p style="color: red;">Error: Unrecognized facrank.</p>`;
  }
}


async function forgotPassword() {
  // Get the email entered by the user in the email input field
  const email = document.getElementById('entered_email').value;

  // Check if the email field is not empty
  if (!email) {
    document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Please enter your email to reset your password.</p>`;
    return;
  }

  try {
    // Attempt to send a password reset email
    const { error } = await supabasePublicClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset_password.html' // Customize the redirect URL as needed
    });

    // If there's an error, check if it's related to no user found
    if (error) {
      if (error.message.includes("no user") || error.message.includes("not found")) {
        document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">This email is not associated with any account.</p>`;
      } else {
        document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Error: ${error.message}</p>`;
      }
    } else {
      // If no error, inform the user
      document.getElementById('forgotMessage').innerHTML = `<p class="modal-message success">If an account with that email exists, a password reset email has been sent.</p>`;
    }
  } catch (err) {
    // Catch any unexpected errors
    document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Error: ${err.message}</p>`;
  }
}



async function createUser() {
    try {
        const facemail = document.getElementById('facemail').value;
        const password = document.getElementById('password').value;
        const faclastname = document.getElementById('faclastname').value;  // Get the last name input
        const facrank = document.getElementById('facrank').value; 
        
        // Sign up the user
        const { data, error } = await supabasePublicClient.auth.signUp({
            email: facemail,
            password: password,
        });

        if (error) {
            document.getElementById('signupMessage').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        } else {
            document.getElementById('signupMessage').innerHTML = `<p style="color: green;">User created successfully! Verification email sent.</p>`;

        const { data, error } = await supabasePublicClient
            .from('users')
            .insert([
                { 
                    facemail: facemail, 
                    facrank: facrank,  // Set the default rank here
                    faclastname: faclastname 
                }
            ]);

            if (userInsertError) {
                console.error('Error inserting user data:', userInsertError);
            } else {
                console.log('User added to local database:', userInsertData);
            }
        }
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}


// Function to show the home tab content on page load
function showHomeTab() {
    // Hide all tab contents
    var tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function(tabContent) {
      tabContent.style.display = 'none';
    });
  
    // Always default to the home tab
    document.getElementById('home').style.display = 'block';
  
    window.history.pushState({}, '', '?tab=home');
}
  
  // Call the function to show the home tab content on page load
  window.onload = showHomeTab;
  
  // Define the openTab function
  function openTab(tabName) {
    var tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function(tabContent) {
      tabContent.style.display = 'none';
    });
  
    document.getElementById(tabName).style.display = 'block';
  
    // Update URL based on tabName
    window.history.pushState({}, '', '?tab=' + tabName);
}
