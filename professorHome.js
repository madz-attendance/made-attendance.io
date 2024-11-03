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
    const {
        data: { session },
        error: authError,
    } = await supabasePublicClient.auth.getSession();

    if (authError || !session) {
        console.error('Error fetching user session:', authError || 'No active session');
        return;
    }

    const loggedInFacemail = session.user.email;
    const { data, error } = await supabasePublicClient
        .from('temptable')
        .select('*')
        .eq('facemail', loggedInFacemail);

    if (error) {
        console.error('Error fetching notifications:', error);
        return;
    }

    const notificationsContainer = document.getElementById('notifications-container');
    if (data.length > 0) {
        notificationsContainer.innerHTML = ''; 
        data.forEach((notification) => {
            const uniqueKey = `${notification.studentfirstname}-${notification.studentlastname}-${notification.insertdate}`;

            const courseParts = notification.coursecode.split(' ');
            const deptCode = courseParts[0];
            const courseNum = courseParts[1];
            const courseSec = courseParts[2];

            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification';
            notificationElement.setAttribute('data-unique-key', uniqueKey);
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
                            data-dept="${deptCode}" 
                            data-course-num="${courseNum}" 
                            data-course-sec="${courseSec}" 
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

        attachButtonListeners(session);
    } else {
        notificationsContainer.innerHTML = '<p>No notifications found.</p>';
    }
}

function attachButtonListeners(session) {
    const approveButtons = document.querySelectorAll('.approve-button');
    const denyButtons = document.querySelectorAll('.deny-button');

    approveButtons.forEach((button) => {
        button.addEventListener('click', (event) => handleApprove(event, session));
    });

    denyButtons.forEach((button) => {
        button.addEventListener('click', (event) => handleDeny(event, session));
    });
}

async function handleApprove(event, session) {
    const courseFullCode = event.target.getAttribute('data-course');
    const deptCode = event.target.getAttribute('data-dept');
    const courseNum = event.target.getAttribute('data-course-num');
    const courseSec = event.target.getAttribute('data-course-sec');
    const stufirstname = event.target.getAttribute('data-student-firstname');
    const stulastname = event.target.getAttribute('data-student-lastname');
    const stuid = event.target.getAttribute('data-student-id');
    const submissionDate = event.target.getAttribute('data-date');
    const submissionTime = event.target.getAttribute('data-time');
    const uniqueKey = `${stufirstname}-${stulastname}-${submissionDate}`;

    const attendanceTime = new Date(`${submissionDate}T${submissionTime}`);
    const { data: courseData, error: courseError } = await supabasePublicClient
        .from('courses')
        .select('courseid')
        .eq('coursecode', deptCode)
        .eq('coursenum', courseNum)
        .eq('coursesec', courseSec)
        .single();
    
    if (courseError || !courseData) {
        console.error('Error fetching course ID:', courseError || 'Course not found');
        return;
    }

    const { error: attendanceError } = await supabasePublicClient
        .from('attendance')
        .insert([
            {
                courseid: courseData.courseid,
                stufirstname: stufirstname,
                stulastname: stulastname,
                stuid: stuid,
                attendancetime: attendanceTime,
            }
        ]);

    if (attendanceError) {
        console.error('Error updating attendance table:', attendanceError);
    } else {
        console.log('Attendance approved successfully!');
        displaySuccessMessage(stufirstname, stulastname, submissionDate, submissionTime);
        removeNotificationFromUI(uniqueKey);
    }
}

async function handleDeny(event, session) {
    if (!session || !session.user) {
        console.error('Session data is missing or invalid');
        return;
    }

    const uniqueKey = event.target.getAttribute('data-unique-key');
    const [stufirstname, stulastname, submissionDate] = uniqueKey.split('-');
    console.log("Attempting to deny notification with key:", uniqueKey);

    const { error } = await supabasePublicClient
        .from('temptable')
        .update({ status: 'denied' })
        .eq('facemail', session.user.email)
        .eq('insertdate', submissionDate)
        .eq('studentfirstname', stufirstname)
        .eq('studentlastname', stulastname);

    if (error) {
        console.error('Error updating notification status:', error);
    } else {
        console.log("Notification status updated to 'denied'. Removing from UI:", uniqueKey);
	displayDenyMessage(stufirstname, stulastname, submissionDate, submissionTime);
        removeNotificationFromUI(uniqueKey);
    }
}

function removeNotificationFromUI(uniqueKey) {
    const notificationElement = document.querySelector(`.notification[data-unique-key="${uniqueKey}"]`);
    if (notificationElement) {
        notificationElement.remove();
        console.log("Notification removed from UI for key:", uniqueKey);
    } else {
        console.log("Notification element not found for key:", uniqueKey);
    }
}

function displaySuccessMessage(firstName, lastName, date, time) {
    const messageContainer = document.getElementById('message-container');
    const message = `Added ${firstName} ${lastName}'s attendance for ${date} at ${time}.`;

    const messageElement = document.createElement('div');
    document.getElementById('message-container').style.backgroundColor = 'green';
    messageElement.className = 'success-message';
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

function displayDeniedMessage(firstName, lastName, date, time) {
    const messageContainer = document.getElementById('message-container');
    const message = `Denied ${firstName} ${lastName}'s attendance request for ${date}.`;

    const messageElement = document.createElement('div');
    messageContainer.style.backgroundColor = 'red'; // Set background color to red
    messageElement.className = 'denied-message'; // Class for custom styling if needed
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    // Auto-remove the message after a few seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
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
        option.value = `${course.coursecode} ${course.coursenum}-${course.coursesec}`;
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


// Added today
document.addEventListener('DOMContentLoaded', function() {
    // Disable elements initially
    document.getElementById('courseDropdown').disabled = true;
    document.getElementById('semesterSubmit').disabled = true;

    // Populate semester dropdown on load
    populateSemesterDropdown();

    // Add event listener for Fetch Roster button
    const fetchRosterButton = document.getElementById('fetchRosterButton');
    if (fetchRosterButton) {
        fetchRosterButton.addEventListener('click', async function () {
            const selectedSemester = document.getElementById('semesterDropdown').value;
            const selectedCourse = document.getElementById('courseDropdown').value;

            // Split the selected course code into course code and section
            const [courseCode, section] = selectedCourse.split('-');

            // Fetch and display roster data
            await fetchAndDisplayRoster(selectedSemester, courseCode, section);
        });
    }

    // Semester selection handling
    document.getElementById('semesterDropdown').addEventListener('change', function() {
        const selectedSemester = this.value;
        populateCourseDropdown(selectedSemester);
    });

    // Other existing event listeners
    document.getElementById('semesterSubmit').addEventListener('click', function(event) {
        event.preventDefault();

        const givenSemester = document.getElementById('semesterDropdown').value;
        const givenCourse = document.getElementById('courseDropdown').value;

        document.getElementById("form-section").style.display = 'none';
        document.getElementById("calendar-section").style.display = 'block';

        updateCalendar(givenSemester, givenCourse);
    });

	// Function to handle going back to the form section
function goToFormSection() {
    // Hide all sections
    const sections = ['calendar-section', 'rosterTableSection', 'form-section'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none'; // Hide each section
        }
    });

    // Show the form section
    document.getElementById('form-section').style.display = 'block'; // Display the form section
}

// Add event listeners to both Back buttons
document.getElementById('calendarBackButton').addEventListener('click', goToFormSection);
document.getElementById('rosterBackButton').addEventListener('click', goToFormSection);

    document.getElementById('backButton').addEventListener('click', function() {
        document.getElementById('table-section').style.display = 'none';
        document.getElementById('calendar-section').style.display = 'block';
    });

    document.getElementById('semBackButton').addEventListener('click', function() {
        document.getElementById('table-section').style.display = 'none';
        document.getElementById('form-section').style.display = 'block';
    });
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
                // const { data, error } = await supabasePublicClient
                // .from('courses')
                // .select('*')
                // .eq('coursesem', semester)
                // .eq('coursecode', course.slice(0,4));
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
    const courseCode = course.slice(0,4);
    const hyphenIndex = course.indexOf('-');
    const courseNum = course.slice(4,hyphenIndex);
    const courseSection = course.slice(hyphenIndex+1);

    //Grab the courseid from courses table
    const { data:courseData, error:courseError } = await supabasePublicClient
    .from('courses')
    .select('courseid')
    .eq('coursesem', semester)
    .eq('coursecode', courseCode)
    .eq('coursenum', courseNum)
    .eq('coursesec', courseSection);
    if (courseError) {console.error('Error fetching data:', courseError); return;}

    //Use courseid to grab class roster from roster table
    const { data:rosterData, error:rosterError } = await supabasePublicClient
    .from('roster')
    .select('stufirstname, stulastname, stuid')
    .eq('courseid', courseData[0].courseid);
    if (rosterError) {console.error('Error fetching rosterData:', rosterError); return;}

    //Use courseid and roster table to grab valid attendees
    const { data:attendanceData, error:attendanceError } = await supabasePublicClient
    .from('attendance')
    .select('stuid, attendancetime')
    .eq('courseid', courseData[0].courseid)
    .in('stuid', rosterData.map(student => student.stuid));
    if (attendanceError) {console.error('Error fetching attendanceData:', attendanceError); return;}
    console.log('Roster:', attendanceData);

    //Only grab the YYYY-MM-DD part of attendancetime since we want to see attendance for the whole day
    const filteredAttendance = attendanceData.filter(record => {
        const recordDate = record.attendancetime.split('T')[0]; 
        return recordDate === selectedDate;
    });
    console.log('Attendees today:', filteredAttendance);

    //Remove duplicates from the list of attendees and grab the earliest timestamp
    const sortedAttendance = filteredAttendance.sort((a, b) => new Date(a.attendancetime) - new Date(b.attendancetime));
    const uniqueIds = new Set();
    const uniqueAttendance = sortedAttendance.filter(record => {
        const isDuplicate = uniqueIds.has(record.stuid);
        uniqueIds.add(record.stuid);
        return !isDuplicate; // Only keep if it's the first occurrence (earliest time)
    });
    console.log('Duplicates removed:', uniqueAttendance);
    generateAttendanceTable(rosterData, uniqueAttendance)
};

function generateAttendanceTable(rosterData, uniqueAttendance) {
    const tableSection = document.getElementById('table-section');
    const tableBody = document.querySelector('#attendance-table tbody');
    
    tableBody.innerHTML = '';
    tableSection.style.display = 'block';

    rosterData.forEach(student => {
        const row = document.createElement('tr');

        // Find if the student has an attendance record
        const studentAttendance = uniqueAttendance.find(attendance => attendance.stuid === student.stuid);

        // Last Name
        const lastNameCell = document.createElement('td');
        lastNameCell.textContent = student.stulastname;
        row.appendChild(lastNameCell);

        // First Name
        const firstNameCell = document.createElement('td');
        firstNameCell.textContent = student.stufirstname;
        row.appendChild(firstNameCell);

        // Student ID
        const idCell = document.createElement('td');
        idCell.textContent = student.stuid;
        row.appendChild(idCell);

        // Attendance Status (display "Absent" if no attendance, else show time)
        const attendanceCell = document.createElement('td');
        if (studentAttendance) {
            const timeOnly = studentAttendance.attendancetime.split('T')[1].split('.')[0];
            attendanceCell.textContent = timeOnly;
        } 
        else {attendanceCell.textContent = 'Absent';}
        row.appendChild(attendanceCell);
        tableBody.appendChild(row);
    });
}

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

async function loadAccountInfo() {
    try {
        // Get session data
        const { data: sessionData, error: sessionError } = await supabasePublicClient.auth.getSession();

        if (sessionError) {
            console.error("Error getting session:", sessionError.message);
            return;
        }

        const user = sessionData?.session?.user;

        // Check if user is authenticated
        if (!user) {
            console.error("User is not authenticated.");
            return;
        }

        // Display email inline
        document.querySelector("#accountTab .account-container h4:nth-of-type(1)").insertAdjacentHTML('afterend', `<span> ${user.email}</span>`);

        // Fetch user's department
        const { data: deptData, error: deptError } = await supabasePublicClient
            .from('courses')
            .select('dept')
            .eq('facemail', user.email)
            .limit(1);

        if (deptError) {
            console.error("Error fetching department:", deptError.message);
        } else if (deptData.length) {
            document.querySelector("#accountTab .account-container h4:nth-of-type(2)").insertAdjacentHTML('afterend', `<span> ${deptData[0].dept}</span>`);
        }

        // Fetch user's class history
        const { data: classesData, error: classesError } = await supabasePublicClient
            .from('courses')
            .select('coursesem, coursecode, coursenum, coursesec, coursename')
            .eq('facemail', user.email);

        if (classesError) {
            console.error("Error fetching class history:", classesError.message);
        } else if (classesData.length) {
            // Create table structure with bold headers and black borders
            let classesTable = `
                <table style="width:100%; border-collapse: collapse; border: 2px solid black;">
                    <thead>
                        <tr>
                            <th style="border: 2px solid black; padding: 8px; font-weight: bold;">Semester</th>
                            <th style="border: 2px solid black; padding: 8px; font-weight: bold;">Course Taught</th>
                            <th style="border: 2px solid black; padding: 8px; font-weight: bold;">Course Name</th>
                        </tr>
                    </thead>
                    <tbody>`;

            // Populate table rows with class data
            classesData.forEach(course => {
                const courseTaught = `${course.coursecode} ${course.coursenum} ${course.coursesec}`;
                classesTable += `
                    <tr>
                        <td style="border: 2px solid black; padding: 8px;">${course.coursesem}</td>
                        <td style="border: 2px solid black; padding: 8px;">${courseTaught}</td>
                        <td style="border: 2px solid black; padding: 8px;">${course.coursename}</td>
                    </tr>`;
            });

            classesTable += `
                    </tbody>
                </table>`;

            // Insert the table after the third h4 in the account container
            document.querySelector("#accountTab .account-container h4:nth-of-type(3)").insertAdjacentHTML('afterend', classesTable);
        }
    } catch (error) {
        console.error("Error loading account info:", error.message);
    }
}

// Call the function to load account info on page load
document.addEventListener("DOMContentLoaded", loadAccountInfo);

// References to dropdowns, button, and roster table section
const fetchRosterButton = document.getElementById('fetchRosterButton');
const rosterTableSection = document.getElementById('rosterTableSection');
const rosterTableBody = document.getElementById('roster-table').getElementsByTagName('tbody')[0];
const calendarSection = document.getElementById('calendar-section');

// Dropdowns for selecting course and semester
const semesterDropdown = document.getElementById('semesterDropdown');
const courseDropdown = document.getElementById('courseDropdown'); // This holds code, number, and section

// Function to parse course details from dropdown selection
function parseCourseDetails(courseString) {
    // Assuming format: "CPSC 135-010"
    const [codeNum, section] = courseString.split("-");
    
    if (!codeNum || !section) {
        throw new Error("Invalid course string format");
    }
    
    const [courseCode, courseNum] = codeNum.trim().split(" ");
    
    // Check if courseNum is a valid number
    const parsedCourseNum = parseInt(courseNum);
    
    if (isNaN(parsedCourseNum)) {
        throw new Error(`Invalid course number: ${courseNum}`);
    }

    return { 
        courseCode, 
        courseNum: parsedCourseNum, 
        courseSec: section.trim() // Ensure to trim any whitespace
    };
}


// Function to fetch courseId and then roster data
async function fetchAndDisplayRoster() {
    try {
        const selectedSemester = semesterDropdown.value;
        const selectedCourse = courseDropdown.value;
        
        if (!selectedSemester || !selectedCourse) {
            console.warn('Please select both a semester and a course.');
            return;
        }

        const { courseCode, courseNum, courseSec } = parseCourseDetails(selectedCourse);

        // Step 1: Find the matching courseId in the courses table
        const { data: courseData, error: courseError } = await supabasePublicClient
            .from('courses')
            .select('courseid, coursename')
            .eq('coursesem', selectedSemester)
            .eq('coursecode', courseCode)
            .eq('coursenum', courseNum)
            .eq('coursesec', courseSec)
            .single();

        if (courseError || !courseData) {
            console.error('Error finding course:', courseError || 'Course not found');
            return;
        }

        const courseId = courseData.courseid;
        const courseName = courseData.coursename; // Get course name for display

        // Step 2: Fetch roster data by matching courseid in the roster table
        const { data: rosterData, error: rosterError } = await supabasePublicClient
            .from('roster')
            .select('stufirstname, stulastname, stuid')
            .eq('courseid', courseId);

        if (rosterError) {
            console.error('Error fetching roster data:', rosterError);
            return;
        }

        // Use populateRosterTable to display the fetched roster data
        populateRosterTable(rosterData, courseName);

    } catch (error) {
        console.error('Error displaying roster data:', error);
    }
}

// Function to populate the roster table with provided data and course name
function populateRosterTable(rosterData, courseName) {
    const rosterTableBody = document.querySelector('#roster-table tbody');
    document.getElementById('form-section').style.display = 'none';
    rosterTableBody.innerHTML = ''; // Clear previous data

    // Update the header with course name
    document.getElementById('rosterHeader').textContent = `Class Roster for ${courseName}`;

    // Hide the calendar section


    // Create table structure with bold headers and black borders
    let rosterTable = `
        <table style="width:100%; border-collapse: collapse; border: 2px solid black;">
            <thead>
                <tr>
                    <th style="border: 2px solid black; padding: 8px; font-weight: bold;">First Name</th>
                    <th style="border: 2px solid black; padding: 8px; font-weight: bold;">Last Name</th>
                    <th style="border: 2px solid black; padding: 8px; font-weight: bold;">Student ID</th>
                </tr>
            </thead>
            <tbody>`;

    // Add rows to the roster table
    rosterData.forEach(student => {
        rosterTable += `
            <tr>
                <td style="border: 2px solid black; padding: 8px;">${student.stufirstname}</td>
                <td style="border: 2px solid black; padding: 8px;">${student.stulastname}</td>
                <td style="border: 2px solid black; padding: 8px;">${student.stuid}</td>
            </tr>`;
    });

    rosterTable += '</tbody></table>'; // Close the tbody and table tags

    // Insert the populated table HTML into the rosterTableBody
    rosterTableBody.innerHTML = rosterTable;

    // Show the roster table section
    document.getElementById('rosterTableSection').style.display = 'block';
}
