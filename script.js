const supabasePublicClient = supabase.createClient('https://agldqgjpcqqmqynizbcs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbGRxZ2pwY3FxbXF5bml6YmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDA5OTgsImV4cCI6MjA0MDUxNjk5OH0.qIUhU-16YQzrIY_SnRxWDG3l5RzKj9s8ns3XaoQAEFo')

//const supabasePublicClient = supabase.createClient('https://agldqgjpcqqmqynizbcs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbGRxZ2pwY3FxbXF5bml6YmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDA5OTgsImV4cCI6MjA0MDUxNjk5OH0.qIUhU-16YQzrIY_SnRxWDG3l5RzKj9s8ns3XaoQAEFo')
/*
// When the button is clicked
document.getElementById('myButton').addEventListener('click', async function() {
// Set message to "Button clicked"
    document.getElementById('message').textContent = 'Button clicked!';
    
// Query the "test" table from the database
    const { data, error } = await supabasePublicClient
        .from('test')
        .select()

// Output the data that you queried so long as there was not an error
// (This will actually set the message to the query data)
    if (error) {
        document.getElementById('message').textContent = `Error: ${error.message}`;
    } else {
        document.getElementById('message').textContent = JSON.stringify(data);
    }

// ===================
// Insert data into the database's "test" table
const { error2 } = await supabasePublicClient
.from('test')
.insert({id: 9, name: "Rupert", age: 51})
// If you are copy-pasting this to test, keep in mind that inserting data w/ an id that already exists in the table
// will be a "conflict" and not work. This is intended to make sure that the primary key, id, stays unique

});
*/

/*
// Function to initialize Supabase and update page data
function initializeSupabase() {
    // Create a single supabase client for interacting with your database
    const supabase = window.supabase.createClient('https://agldqgjpcqqmqynizbcs.supabase.co/', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbGRxZ2pwY3FxbXF5bml6YmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDA5OTgsImV4cCI6MjA0MDUxNjk5OH0.qIUhU-16YQzrIY_SnRxWDG3l5RzKj9s8ns3XaoQAEFo');

    async function updateData() {
        const { data, error } = await supabase
            .from('test')
            .update({ column1: 'Yoo' })
            .eq('id', 1); // Update row where id = 1

        if (error) {
            console.error(error);
        } else {
            console.log('Data Updated:', data);
        }
    }

    updateData();
}

// Ensure Supabase script is loaded before running Supabase related code
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/dist/supabase.min.js';
supabaseScript.onload = initializeSupabase;
document.head.appendChild(supabaseScript);
*/
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
    var home_button = document.getElementById("home_button");
    var faq_button = document.getElementById("faq_button");
    var about_button = document.getElementById("about_button");
    var request_button = document.getElementById("request_button");
    var sign_in_button = document.getElementById("sign_in_button");
    var create_account_button = document.getElementById("create_account_button");
    var currentTab = "home";

    function resetButtonColors() {
        home_button.style.filter = "brightness(100%)";
        faq_button.style.filter = "brightness(100%)";
        about_button.style.filter = "brightness(100%)";
        request_button.style.filter = "brightness(100%)";
        sign_in_button.style.filter = "brightness(100%)";
        create_account_button.style.filter = "brightness(100%)";
    }

    home_button.style.filter = "brightness(150%)";

    home_button.addEventListener("click", function() {
        resetButtonColors();
        if (currentTab != "home") {
            currentTab = "home";
            home_button.style.filter = "brightness(150%)";
        }
    });
    home_button.addEventListener("mouseover", function() {
        if (currentTab != "home") {
            home_button.style.filter = "brightness(150%)";
        }
    });
    home_button.addEventListener("mouseout", function() {
        if (currentTab != "home") {
            home_button.style.filter = "brightness(100%)";
        }
    });

    faq_button.addEventListener("click", function() {
        resetButtonColors();
        if (currentTab != "faq") {
            currentTab = "faq";
            faq_button.style.filter = "brightness(150%)";
        }
    });
    faq_button.addEventListener("mouseover", function() {
        if (currentTab != "faq") {
            faq_button.style.filter = "brightness(150%)";
        }
    });
    faq_button.addEventListener("mouseout", function() {
        if (currentTab != "faq") {
            faq_button.style.filter = "brightness(100%)";
        }
    });

    about_button.addEventListener("click", function() {
        resetButtonColors();
        if (currentTab != "about") {
            currentTab = "about";
            about_button.style.filter = "brightness(150%)";
        }
    });
    about_button.addEventListener("mouseover", function() {
        if (currentTab != "about") {
            about_button.style.filter = "brightness(150%)";
        }
    });
    about_button.addEventListener("mouseout", function() {
        if (currentTab != "about") {
            about_button.style.filter = "brightness(100%)";
        }
    });

    request_button.addEventListener("click", function() {
        resetButtonColors();
        if (currentTab != "request") {
            currentTab = "request";
            request_button.style.filter = "brightness(150%)";
        }
    });
    request_button.addEventListener("mouseover", function() {
        if (currentTab != "request") {
            request_button.style.filter = "brightness(150%)";
        }
    });
    request_button.addEventListener("mouseout", function() {
        if (currentTab != "request") {
            request_button.style.filter = "brightness(100%)";
        }
    });
    
    sign_in_button.addEventListener("click", function() {
        resetButtonColors();
        if (currentTab != "sign_in") {
            currentTab = "sign_in";
            sign_in_button.style.filter = "brightness(150%)";
        }
    });
    sign_in_button.addEventListener("mouseover", function(){
        if (currentTab != "sign_in") {
            sign_in_button.style.filter = "brightness(150%)";
        }
    });
    sign_in_button.addEventListener("mouseout", function(){
        if (currentTab != "sign_in") {
            sign_in_button.style.filter = "brightness(100%)";
        }
    });

    create_account_button.addEventListener("click", function(){
        resetButtonColors();
        if (currentTab != "create_account") {
            currentTab = "create_account";
            create_account_button.style.filter = "brightness(150%)";
        }
    });
    create_account_button.addEventListener("mouseover", function(){
        if (currentTab != "create_account") {
            create_account_button.style.filter = "brightness(150%)";
        }
    });
    create_account_button.addEventListener("mouseout", function(){
        if (currentTab != "create_account") {
            create_account_button.style.filter = "brightness(100%)";
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // Get references to the department code and class section elements
    const deptCodeInput = document.getElementById("dept_code");
    const classSectionInput = document.getElementById("class_section");
    const classSectionDatalist = document.getElementById("class_sections");
    const clearDeptButton = document.getElementById("clear_dept_button");
    const clearClassButton = document.getElementById("clear_class_button");

    // Function to clear the selected department code
    clearDeptButton.addEventListener("click", function() {
        deptCodeInput.value = "";
        classSectionInput.value = "";
        classSectionDatalist.innerHTML = ''; 
    });

    // Function to clear the selected class section
    clearClassButton.addEventListener("click", function() {
        classSectionInput.value = "";
    });
    const classSections = {
        "CPSC": ["CPSC 135 010", "CPSC 135 020", "CPSC 136 010"],
        "ARTH": ["ARTH 124 010", "ARTH 25 19H", "ARTH 309 010"],
        "POLI": ["POLI 10 010", "POLI 140 020", "POLI 181 010"],
        "CHEM": ["CHEM 100 015", "CHEM 204 012", "CHEM 230 011"],
        "BIOL": ["BIOL 10 012", "BIOL 104 013", "BIOL 104 012"],
        "ANTH": ["ANTH 10 030", "ANTH 105 020", "ANTH 213 010"],
        "CRJU": ["CRJU 10 010", "CRJU 101 020", "CRJU 182 010"],
        "GEOL": ["GEOL 1 810", "GEOL 100 011", "GEOL 110 012"],
        "ACCT": ["ACCT 121 020", "ACCT 122 010", "ACCT 305 010"],
        "ANIA": ["ANIA 141 030", "ANIA 171 020", "ANIA 231 610"],
        "ART": ["ART 141 011", "ART 161 610", "ART 31 010"],
        "BUSN": ["BUSN 131 030", "BUSN 275 810", "BUSN 130 010"]
        
    };
    // Function to update the department code based on the selected class section


    // Function to update the class section options based on the selected department
    function updateClassSections() {
        const selectedDept = deptCodeInput.value.toUpperCase(); // Convert input to uppercase
        console.log("Selected department:", selectedDept);
        
        // Clear existing options
        classSectionDatalist.innerHTML = '';

        if (deptCodeInput.value === '') {
        return;
        }
        // Add options for the selected department
        if (classSections[selectedDept]) {
            classSections[selectedDept].forEach(section => {
                const option = document.createElement("option");
                option.value = section;
                classSectionDatalist.appendChild(option);
            });
        }
    }

    // Event listener to update class sections when department code changes
    deptCodeInput.addEventListener("input", updateClassSections);

    // Trigger initial update of class sections
    updateClassSections();
});

document.getElementById('attendanceform').addEventListener('submit', async function(event) {
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
        document.getElementById('submissionInfo').style.backgroundColor = 'red';
      `;
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
  });


async function resetPasswordSignInScreen() {
    // Gather the user's email
    // Ensure email is in database
    // Either:
        // Go into database and reset password for user, email a temp password
        // Send a request to professor's admin account, admin make temp password, admin email new password
    // Have user enter new password when logged in
}

async function signIn() {
    const email = document.getElementById('entered_email').value;
    const password = document.getElementById('entered_pass').value;
  
    const { data, error } = await supabasePublicClient.auth.signInWithPassword({
      email: email,
      password: password
    });
  
    if (error) {
      document.getElementById('signinMessage').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    } else {
      document.getElementById('signinMessage').innerHTML = `<p style="color: green;">Success! Redirecting...</p>`;
      window.location.href = "inAccount.html";
    }
  }

// Forgot Password Function
async function forgotPassword() {
  const email = document.getElementById('entered_email').value;

  // Check if the email field is not empty
  if (!email) {
    document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Please enter your email to reset your password.</p>`;
    return;
  }

  try {
    // Check if the user exists in the database
    const { data, error: userError } = await supabasePublicClient
      .from('users') // Replace with your actual table name
      .select('id') // or any field you want to check
      .eq('email', email)
      .single();

    // Handle error in getting user data
    if (userError) {
      document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Error: ${userError.message}</p>`;
      return;
    }

    // If user does not exist, inform the user
    if (!data) {
      document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">No user found with this email address.</p>`;
      return;
    }

    // Send the password reset email
    const { error } = await supabasePublicClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset_password.html' // Customize the redirect URL as needed
    });

    // Display success or error message based on the response
    if (error) {
      document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Error: ${error.message}</p>`;
    } else {
      document.getElementById('forgotMessage').innerHTML = `<p class="modal-message success">Password reset email sent successfully! Please check your inbox.</p>`;
    }
  } catch (err) {
    // Catch any unexpected errors
    document.getElementById('forgotMessage').innerHTML = `<p class="modal-message error">Error: ${err.message}</p>`;
  }
}




// Create Account function
async function createUser() {
try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Sign up the user
    const { data, error } = await supabasePublicClient.auth.signUp({
    email: email,
    password: password,
    });

    if (error) {
    document.getElementById('signupMessage').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    } else {
    document.getElementById('signupMessage').innerHTML = `<p style="color: green;">User created successfully!</p>`;
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
