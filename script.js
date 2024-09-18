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
    var currentTab = "home";

    function resetButtonColors() {
        home_button.style.filter = "brightness(100%)";
        faq_button.style.filter = "brightness(100%)";
        about_button.style.filter = "brightness(100%)";
        request_button.style.filter = "brightness(100%)";
        sign_in_button.style.filter = "brightness(100%)";
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
});
