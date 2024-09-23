            // Clicking on MADZ logo will go to home page
    var madzLogoButton = document.getElementById("madz_logo");
    madzLogoButton.addEventListener("click", function() {
        window.location.href = "inAdminAccount.html";
    });
        // Tab functionality to toggle between Welcome and Classes sections
        function openTab(tabName) {
            // Hide all tab content
            const tabContents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }

            // Remove active class from all buttons
            const tabButtons = document.getElementsByClassName('tab-button');
            for (let i = 0; i < tabButtons.length; i++) {
                tabButtons[i].classList.remove('active');
            }

            // Show the clicked tab's content
            document.getElementById(tabName).classList.add('active');

            // Add active class to the clicked tab button
            event.target.classList.add('active');
        }

var create_account_button = document.getElementById("create_account_button");

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



      
        // Fetch the user data after signing in
        async function fetchProfessorData() {
            const { data: user, error: authError } = await supabasePublicClient.auth.getUser();

            if (authError) {
                document.getElementById('welcomeMessage').innerText = 'Error fetching user details';
                return;
            }

            const email = user?.user?.email;

            if (!email) {
                document.getElementById('welcomeMessage').innerText = 'No user email found';
                return;
            }

            try {
                const { data, error: dbError } = await supabasePublicClient
                    .from('users')
                    .select('facrank, faclastname')
                    .eq('facemail', email);

                if (dbError) {
                    throw dbError;
                }

                if (data && data.length > 0) {
                    const userInfo = data[0];
                    document.getElementById('facRank').textContent = userInfo.facrank || 'N/A';
                    document.getElementById('facLastName').textContent = userInfo.faclastname || 'N/A';
                    document.getElementById('welcomeMessage').innerText = `Welcome, ${userInfo.facrank} ${userInfo.faclastname}`;
                } else {
                    document.getElementById('welcomeMessage').innerText = 'User data not found';
                }

            } catch (err) {
                document.getElementById('welcomeMessage').innerText = `Error: ${err.message}`;
            }
        }

        // Log out functionality
        async function logOut() {
            const { error } = await supabasePublicClient.auth.signOut();
            if (!error) {
                window.location.href = "index.html"; // Redirect to login page
            }
        }

        // Fetch user data when page loads
        fetchProfessorData();