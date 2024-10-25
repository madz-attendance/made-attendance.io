async function checkAuth() {
  // Call to get the current session
  const { data: { session }, error } = await supabasePublicClient.auth.getSession();

  // Check if there's an error getting the session (optional)
  if (error) {
    console.error('Error getting session:', error.message);
    return;
  }

  // If no session exists, redirect to the login page
  if (!session) {
    window.location.href = 'index.html'; // Redirect to login
  } else {
    // User is authenticated, log the user info and proceed
    // console.log('User is authenticated:', session.user);
  }
}
// Call checkAuth on page load
window.addEventListener('DOMContentLoaded', checkAuth);

// Clicking on MADZ logo will go to home page
var madzLogoButton = document.getElementById("madz_logo");
madzLogoButton.addEventListener("click", function() {
	window.location.href = "inProfessorAccount.html";
});

// Function to show the home tab content on page load
function showWelcomeTab() {
    // Hide all tab contents
    var tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function(tabContent) {
      tabContent.style.display = 'none';
    });
  
    // Always default to the home tab
    document.getElementById('welcomeTab').style.display = 'block';
  
    window.history.pushState({}, '', '?tab=home');
}
  
  // Call the function to show the home tab content on page load
  window.onload = showWelcomeTab;
 


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


// Fetch the user data after signing in
async function fetchProfessorData() {
	const { data: user, error: authError } = await supabasePublicClient.auth.getUser();

	if (authError) {
		document.getElementById('welcomeMessage').innerText = 'Error fetching user details';
		return;
	}

	const email = user?.user?.email;
	// console.log("Email found: " + email)

	if (!email) {
		document.getElementById('welcomeMessage').innerText = 'No user email found';
		return;
	}

	try {
		const { data, error: dbError } = await supabasePublicClient
			.from('users')
			.select('facrank, faclastname')
			.eq('facemail', email);

		if (dbError) 
		    {throw dbError;}

		if (data && data.length > 0) {
			const userInfo = data[0];
			document.getElementById('facRank').textContent = userInfo.facrank || 'N/A';
			document.getElementById('facLastName').textContent = userInfo.faclastname || 'N/A';
			document.getElementById('welcomeMessage').innerText = `Welcome, ${userInfo.facrank} ${userInfo.faclastname}`;
		}
		else {
			document.getElementById('welcomeMessage').innerText = 'User data not found';
		}

	} 
	catch (err) {
		document.getElementById('welcomeMessage').innerText = `Error: ${err.message}`;
	}
	
	// console.log("Returning Email from fetchProfessorData(): " + email);
	return email // Zaynin 9/26/2024 - Returns professor email to then be used in fetchAllClasses()
}

async function logOut() { // Log out and go back to sign in page
	const { error } = await supabasePublicClient.auth.signOut();
	if (!error) {window.location.href = "index.html";}
}

async function fetchRoster(courseId) {
    try {
        const { data, error } = await supabasePublicClient
            .from('roster')
            .select('*')
            .eq('courseid', courseId); // Corrected to use courseId

        if (error) {
            console.error('Error fetching roster data:', error);
            alert("Error fetching roster data. Please check the console.");
            return [];
        }

        return data || []; // Ensure you return an empty array if data is undefined
    } catch (err) {
        console.error('Error:', err);
        return [];
    }
}

async function fetchAttendanceData(courseId, startDate, endDate) {
    try {
        const { data, error } = await supabasePublicClient
            .from('attendance')
            .select('*')
            .eq('courseid', courseId) // Corrected to use courseId
            .gte('attendancetime::date', startDate)
            .lte('attendancetime::date', endDate)
            .csv(); // Add .csv() here to request CSV format data

        if (error) {
            console.error('Error fetching attendance data in CSV format:', error);
            alert("Error fetching attendance data in CSV format. Please check the console.");
            return '';
        }

        return data || ''; // Return CSV string if data is undefined
    } catch (err) {
        console.error('Error:', err);
        return '';
    }
}

async function checkAttendanceAgainstRosterAndDownloadCSV(courseId, startDate, endDate) {
    const roster = await fetchRoster(courseId);
    const csvData = await fetchAttendanceData(courseId, startDate, endDate);

    if (!csvData) {
        console.error("No CSV data available for download.");
        return;
    }

    // Parse the CSV back into JSON if needed for comparison
    const attendance = parseCSV(csvData); 
    const rosterStudentIds = roster.map(student => student.stuId); 
    const attendanceStudentIds = attendance.map(record => record.stuId);

    const absentStudents = rosterStudentIds.filter(id => !attendanceStudentIds.includes(id));

    if (absentStudents.length > 0) {
        console.log("Students in roster but not in attendance:", absentStudents);
        alert("The following students are in the roster but did not attend: " + absentStudents.join(', '));
    } else {
        console.log("All students in the roster attended.");
    }

    // Trigger the CSV file download
    downloadCSV(csvData, `attendance_${startDate}_to_${endDate}.csv`);
}

function parseCSV(csvString) {
    const [headerLine, ...rows] = csvString.split('\n');
    const headers = headerLine.split(',');

    return rows.map(row => {
        const values = row.split(',');
        const record = {};
        headers.forEach((header, index) => {
            record[header] = values[index];
        });
        return record;
    });
}

function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function fetchNotificationsForCurrentUser() {
    // Get the current session and user details
    const {
        data: { session },
        error: authError,
    } = await supabasePublicClient.auth.getSession();

    if (authError || !session) {
        console.error('Error fetching user session:', authError || 'No active session');
        return;
    }

    const loggedInFacemail = session.user.email; // Get the authenticated user's email

    // Fetch notifications where the facemail matches the logged-in user's email
    const { data, error } = await supabasePublicClient
        .from('temptable') // Replace with your actual table name
        .select('*') // Select all columns or specify the columns you need
        .eq('facemail', loggedInFacemail); // Filter by logged-in user's facemail

    if (error) {
        console.error('Error fetching notifications:', error);
        return;
    }

    // Display notifications
    const notificationsContainer = document.getElementById('notifications-container');

    if (data.length > 0) {
        notificationsContainer.innerHTML = ''; // Clear previous notifications
        data.forEach((notification) => {
            const uniqueKey = `${notification.studentfirstname}-${notification.studentlastname}-${notification.insertdate}`; // Create a unique key

            // Extract course code components
            const courseParts = notification.coursecode.split(' '); // Split the course code into parts
            const deptCode = courseParts[0]; // e.g., "CPSC"
            const courseNum = courseParts[1]; // e.g., "135"
            const courseSec = courseParts[2]; // e.g., "010"

            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification';
            notificationElement.setAttribute('data-unique-key', uniqueKey); // Store the unique key as a data attribute
            notificationElement.innerHTML = `
                <div class="notification-header">
                    <h3>${notification.studentfirstname} ${notification.studentlastname}'s Attendance Verification Request</h3>
                </div>
                <div class="notification-body">
                    <p><strong>Course:</strong> ${notification.coursecode}</p>
                    <p><strong>Note:</strong> ${notification.note}</p>
                    <p><strong>Date of Submission:</strong> ${notification.insertdate}</p>
                    <p><strong>Time of Submission:</strong> ${notification.inserttime}</p>
                </div>
                <div class="notification-actions">
                    <button class="approve-button" 
                            data-course="${notification.coursecode}" 
                            data-dept="${deptCode}" // Store dept code
                            data-course-num="${courseNum}" // Store course number
                            data-course-sec="${courseSec}" // Store course section
                            data-student-firstname="${notification.studentfirstname}" 
                            data-student-lastname="${notification.studentlastname}" 
                            data-student-id="${notification.stuid}" 
                            data-date="${notification.insertdate}" 
                            data-time="${notification.inserttime}">Approve</button>
                    <button class="deny-button" data-unique-key="${uniqueKey}">Deny</button>
                </div>
            `;
            notificationsContainer.appendChild(notificationElement);
        });

        // Attach event listeners to buttons
        attachButtonListeners();
    } else {
        notificationsContainer.innerHTML = '<p>No notifications found.</p>';
    }
}

function attachButtonListeners() {
    const approveButtons = document.querySelectorAll('.approve-button');
    const denyButtons = document.querySelectorAll('.deny-button');

    approveButtons.forEach((button) => {
        button.addEventListener('click', handleApprove);
    });

    denyButtons.forEach((button) => {
        button.addEventListener('click', handleDeny);
    });
}

async function handleApprove(event) {
    const courseFullCode = event.target.getAttribute('data-course');
    const deptCode = event.target.getAttribute('data-dept');
    const courseNum = event.target.getAttribute('data-course-num');
    const courseSec = event.target.getAttribute('data-course-sec');
    const stufirstname = event.target.getAttribute('data-student-firstname');
    const stulastname = event.target.getAttribute('data-student-lastname');
    const stuid = event.target.getAttribute('data-student-id');
    const submissionDate = event.target.getAttribute('data-date');
    const submissionTime = event.target.getAttribute('data-time');

    // Combine date and time into a timestamp
    const attendanceTime = new Date(`${submissionDate}T${submissionTime}`);

    // Fetch the course ID based on the department code, course number, and course section
    const { data: courseData, error: courseError } = await supabasePublicClient
        .from('courses')
        .select('courseid')
        .eq('coursecode', deptCode) // Match by department code
        .eq('coursenum', courseNum)   // Assuming you have this column in your courses table
        .eq('coursesec', courseSec)    // Assuming you have this column in your courses table
        .single();
    if (courseError) {console.error('Error fetching course ID:', courseError); return;}
    if (!courseData) {console.error('No course found for code:', courseFullCode); return;}

    // Update the attendance table
    const { error: attendanceError } = await supabasePublicClient
        .from('attendance') // Replace with your actual attendance table name
        .insert([
            {
                courseid: courseData.courseid,
                stufirstname: stufirstname,
                stulastname: stulastname,
                stuid: stuid,
                attendancetime: attendanceTime,
            }
        ]);

    if (attendanceError) {console.error('Error updating attendance table:', attendanceError);} 
    else {
        console.log('Attendance approved successfully!');
        // Display success message on the screen
        displaySuccessMessage(stufirstname, stulastname, submissionDate, submissionTime);
        // Optionally, remove the notification or mark it as handled
        removeNotification(courseFullCode, stufirstname, submissionDate);
    }
}

function displaySuccessMessage(firstName, lastName, date, time) {
    const messageContainer = document.getElementById('message-container'); // Ensure you have a container for messages
    const message = `Added ${firstName} ${lastName}'s attendance for ${date} at ${time}.`;
    
    // Create a new message element
    const messageElement = document.createElement('div');
    document.getElementById('message-container').style.backgroundColor = 'green';
    messageElement.className = 'success-message'; // Add a class for styling (optional)
    messageElement.textContent = message;
	
    // Append the message to the message container
    messageContainer.appendChild(messageElement);

    // Optional: Auto-remove the message after a few seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000); // Remove after 5 seconds
}

async function handleDeny(event) {
    const uniqueKey = event.target.getAttribute('data-unique-key');
    // Optionally, you can remove the notification or mark it as denied
    removeNotificationFromUI(uniqueKey);
}

function removeNotification(courseCode, stufirstname, submissionDate) {
    const uniqueKey = `${stufirstname}-${submissionDate}`; // Create the unique key again to identify the notification in the UI
    const notificationElement = document.querySelector(`.notification[data-unique-key="${uniqueKey}"]`);
    if (notificationElement) {
        notificationElement.remove();
    }
}

fetchNotificationsForCurrentUser();

async function getProfessorCourses() {
    const email = await fetchProfessorData();
    const { data, error } = await supabasePublicClient
        .from('courses')
        .select('coursecode, coursenum, coursesem, coursesec')
        .eq('facemail', email);
    if (error) {console.error('Error fetching professor courses:', error); return [];}
    return data;
}

// Populate the semester dropdown with only semesters the professor has courses in
async function populateSemesterDropdown() {
    const courses = await getProfessorCourses();
    const semesterDropdown = document.getElementById('semesterDropdown');

    // Get unique semesters from courses
    const semesters = [...new Set(courses.map(course => course.coursesem))];

    semesters.sort((a,b) => {
        return parseInt(b.split(" ")[1]) - parseInt(a.split(" ")[1]);
    }); //Sort the semesters from most recent -> oldest so the most recent is the default semester

    // Populate semester dropdown
    semesterDropdown.innerHTML = '';
    semesters.forEach(coursesem => {
        const option = document.createElement('option');
        option.value = coursesem;
        option.textContent = coursesem;
        semesterDropdown.appendChild(option);
    });

    // Enable semester dropdown if semesters are available
    if (semesters.length > 0) {
        semesterDropdown.disabled = false;
    }
    populateCourseDropdown(semesters[0]);
}

// When a semester is selected, populate the course dropdown
document.getElementById('semesterDropdown').addEventListener('change', function() {
    const selectedSemester = this.value;
    populateCourseDropdown(selectedSemester);
});

async function populateCourseDropdown(semester) {
    const courses = await getProfessorCourses();
    const courseDropdown = document.getElementById('courseDropdown');

    // Filter courses based on selected semester
    const semesterCourses = courses.filter(course => course.coursesem === semester);

    // Populate course dropdown
    courseDropdown.innerHTML = '';  // Clear previous options
    semesterCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = `${course.coursecode}${course.coursenum}`;
        option.textContent = `${course.coursecode} ${course.coursenum}-${course.coursesec}`;
        courseDropdown.appendChild(option);
    });

    // Enable course dropdown and submit button if courses are available
    if (semesterCourses.length > 0) {
        courseDropdown.disabled = false;
        document.getElementById('semesterSubmit').disabled = false;
    } else {
        courseDropdown.disabled = true;
        document.getElementById('semesterSubmit').disabled = true;
    }
}

//added for faq functionality 
document.addEventListener('DOMContentLoaded', function() {
        const buttons = document.querySelectorAll('#helpTab .question button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const faq = button.nextElementSibling; // The <p> tag
                const icon = button.querySelector('.d-arrow'); // The arrow icon
                faq.classList.toggle('show'); // Toggle visibility
                icon.classList.toggle('rotate'); // Toggle arrow rotation
            });
        });
    });

// Initially, populate the semester dropdown when the page loads
document.addEventListener('DOMContentLoaded', function() {
    this.getElementById('courseDropdown').disabled = true;
    this.getElementById('semesterSubmit').disabled = true;
    populateSemesterDropdown();
});

document.getElementById('semesterButtonContainer').addEventListener('click', function(event) {
    event.preventDefault();

    const givenSemester = document.getElementById('semesterDropdown').value;
    const givenCourse = document.getElementById('courseDropdown').value;

    document.getElementById("form-section").style.display='none';
    document.getElementById("calendar-section").style.display='block';

    updateCalendar(givenSemester, givenCourse);
    //updateAttendanceTable(givenSemester, givenCourse);
});

document.getElementById('calendarBackButton').addEventListener('click', function() {
    document.getElementById('calendar-section').style.display = 'none';
    document.getElementById('form-section').style.display = 'block';
});

document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('table-section').style.display = 'none';
    document.getElementById('calendar-section').style.display = 'block';
});

async function updateCalendar(semester, course) {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth();
    
    const day = document.querySelector(".calendar-dates");
    const currdate = document.querySelector(".calendar-current-date");
    const prenexIcons = document.querySelectorAll(".calendar-navigation span");
    const months = [
        "January","February","March","April","May","June","July",
        "August","September","October","November","December"
    ];
    
    const manipulate = () => { //Generate the calendar
        let dayone = new Date(year, month, 1).getDay(); //First date of the month
        let lastdate = new Date(year, month + 1, 0).getDate(); //Last date of the month
        let dayend = new Date(year, month, lastdate).getDay(); //Get the day of the last date of the month
        let monthlastdate = new Date(year, month, 0).getDate(); //Get the last date of the previous month
        let lit = "";
    
        for (let i = dayone; i > 0; i--) { //Add the previous month's days
            lit +=
                `<li class="inactive">${monthlastdate - i + 1}</li>`;
        }
    
        for (let i = 1; i <= lastdate; i++) { //Add the current month's days
            let isToday = i === date.getDate()
                && month === new Date().getMonth()
                && year === new Date().getFullYear()
                ? "active"
                : "";
            lit += `<li class="date ${isToday}" data-date="${year}-${month + 1}-${i}">${i}</li>`;
        }

        for (let i = dayend; i < 6; i++) { //Dates for following month's days
            lit += `<li class="inactive">${i - dayend + 1}</li>`
        }
        currdate.innerText = `${months[month]} ${year}`;
        day.innerHTML = lit;
        document.querySelectorAll('.date').forEach(dateElement => {
            dateElement.addEventListener('click', (e) => {
                let selectedDate = e.target.getAttribute('data-date');
                document.getElementById("calendar-section").style.display='none';
                document.getElementById("table-section").style.display='block';
                updateAttendanceTable(semester, course, selectedDate); // Call the table update with the selected date
            });
        });
    }
    manipulate();
    
    prenexIcons.forEach(icon => { //Click listener for chevrons
        icon.addEventListener("click", () => { //When an icon is clicked
            month = icon.id === "calendar-prev" ? month - 1 : month + 1;
            if (month < 0 || month > 11) { //Check if month is out of range
                date = new Date(year, month, new Date().getDate());
                year = date.getFullYear();
                month = date.getMonth();
            }
            else {date = new Date();} //In range, grab the date
            manipulate();
        });
    });
}

async function updateAttendanceTable(semester, course, selectedDate) {
    console.log(selectedDate);
    const { data, error } = await supabasePublicClient
    .from('courses')
    .select('*')
    .eq('coursesem', semester)
    .eq('coursecode', course.slice(0,4))
    .eq('coursenum', course.slice(4));
    if (error) {console.error('Error fetching data:', error); return;}

    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';

    data.forEach(row => {
        const tableRow = document.createElement('tr');

        const nameCell = document.createElement('th');
        nameCell.textContent = row.name;

        const idCell = document.createElement('td');
        idCell.textContent = row.student_id;

        const attendanceCell = document.createElement('td');
        attendanceCell.textContent = row.attended ? 'Yes' : 'No';

        tableRow.appendChild(nameCell);
        tableRow.appendChild(idCell);
        tableRow.appendChild(attendanceCell);

        tableBody.appendChild(tableRow);
    });
};

// Buttons highlighting logic
var pageButtons = {
	"welcome_button_PROFESSOR"      : "welcome",
	"classes_button_PROFESSOR"	    : "classes",
	"account_button_PROFESSOR"	    : "account",
    "help_button_PROFESSOR"         : "help",
	"notification_button_PROFESSOR" : "notification",
	"log_out_button_PROFESSOR"		: "log_out"
};
var currentTab = "welcome";
document.getElementById("welcome_button_PROFESSOR").style.filter = "brightness(150%)";

function resetButtonColors() {
	Object.keys(pageButtons).forEach(function(buttonId) {
		document.getElementById(buttonId).style.filter = "brightness(100%)";
	});
}

// Function to add event listeners to a button
function handleButton(buttonId, tabName) {
	var button = document.getElementById(buttonId);

	button.addEventListener("click", function() {
		if (currentTab != tabName) {
		    resetButtonColors();
			currentTab = tabName;
			button.style.filter = "brightness(150%)";
		}
	});
	button.addEventListener("mouseover", function() {
		if (currentTab != tabName) {
			button.style.filter = "brightness(150%)";
		}
	});
	button.addEventListener("mouseout", function() {
		if (currentTab != tabName) {
			button.style.filter = "brightness(100%)";
		}
	});
}

Object.keys(pageButtons).forEach(function(buttonId) {
	handleButton(buttonId, pageButtons[buttonId]);
});
