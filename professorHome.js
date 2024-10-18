// Function to check if the user is logged in
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
    console.log('User is authenticated:', session.user);
  }
}

// Call checkAuth on page load
window.addEventListener('DOMContentLoaded', checkAuth);


// "MAIN()"
// Zaynin 09/26/2024
// Call initializePage when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get the dropdown menus (for semester, courses, and department)
    const semester_dropdown = document.getElementById('semesterDropdown');
    const courses_dropdown = document.getElementById('courseDropdown');
    const department_dropdown = document.getElementById('department_dropdown');
    var semesterSubmitButton = document.getElementById('semesterSubmit');
    
    // Get the date fields container (initially hidden)
    const dateFields = document.getElementById('date-fields');
    //dateFields.style.display = 'none'; // Hide the date fields initially

    // Initialize the page (get professor info, get prof courses, fill in dropdown menus, etc)
    initializePage();

    // Listen for changes in the courses dropdown to show/hide date fields
    courses_dropdown.addEventListener('change', function() {
        const selectedCourse = courses_dropdown.value;
        
        // Check if a course is selected (value isn't "none")
        //if (selectedCourse && selectedCourse !== 'none') {
         //   dateFields.style.display = 'block';  // Show date fields
       // } else {
       //     dateFields.style.display = 'none';  // Hide date fields if no course is selected
       // }
    });
});


// =====================================================
// Zaynin Sept 26 2024 (START)
// Fetch user data when page loads
//email = fetchProfessorData();
//renderCourses(email); // Render courses

// Function that initializes the page - fetches user data (and waits for it to finish),
// and then fetches/renders courses.
async function initializePage() {
    email = await fetchProfessorData(); // Get professor information and store email
    
    await fetchDepartments(email); // Populate the departments dropdown menu with valid departments
    await fetchSemesters(email);   // Populate the semesters drop-down menu with valid semesters
    professor_courses = await fetchCourses(email); // Fetch and store the professor's courses
    
    // Attach event listeners to dropdowns
    attachDepartmentDropdownListener(professor_courses); // Pass the professor's courses
    attachSemesterDropdownListener(professor_courses);   // Pass the professor's courses
    attachCoursesDropdownListener(professor_courses);    // Pass the professor's courses
}


// ===================================================
// ===================================================
// ===================================================
// ===================================================

// Clicking on MADZ logo will go to home page
var madzLogoButton = document.getElementById("madz_logo");
madzLogoButton.addEventListener("click", function() 
{
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
async function fetchProfessorData() 
{
	const { data: user, error: authError } = await supabasePublicClient.auth.getUser();

	if (authError) 
	{
		document.getElementById('welcomeMessage').innerText = 'Error fetching user details';
		return;
	}

	const email = user?.user?.email;
	console.log("Email found: " + email)

	if (!email) 
	{
		document.getElementById('welcomeMessage').innerText = 'No user email found';
		return;
	}

	try 
	{
		const { data, error: dbError } = await supabasePublicClient
			.from('users')
			.select('facrank, faclastname')
			.eq('facemail', email);

		if (dbError) 
		{
			throw dbError;
		}

		if (data && data.length > 0) 
		{
			const userInfo = data[0];
			document.getElementById('facRank').textContent = userInfo.facrank || 'N/A';
			document.getElementById('facLastName').textContent = userInfo.faclastname || 'N/A';
			document.getElementById('welcomeMessage').innerText = `Welcome, ${userInfo.facrank} ${userInfo.faclastname}`;
		}
		else 
		{
			document.getElementById('welcomeMessage').innerText = 'User data not found';
		}

	} 
	catch (err) 
	{
		document.getElementById('welcomeMessage').innerText = `Error: ${err.message}`;
	}
	
	console.log("Returning Email from fetchProfessorData(): " + email);
	return email // Zaynin 9/26/2024 - Returns professor email to then be used in fetchAllClasses()
}

// Log out functionality
async function logOut() 
{
	const { error } = await supabasePublicClient.auth.signOut();
	if (!error) 
	{
		window.location.href = "index.html"; // Redirect to login page
	}
}



// Zaynin 09/26/2024
// Returns the courses relevant to the specific faculty member.
// If the faculty logged in is a professor/chair, it will query all courses that they have.
// If the faculty logged in is a admin, it will query all courses.
// Course options will later be filtered based on dept/semester, but this function obtains
// all possible courses that would need to be seen by this faculty
async function fetchCourses(email) {
    // Determine whether this faculty is an Admin or a Prof/Chair
    // Get faculty role and dept by querying "users" table
    const { data: userData, error: userError } = await supabasePublicClient
        .from('users')
        .select("facrank, deptcode")
        .eq('facemail', email);

    if (userError) {
        console.error("Error fetching facrank in fetchDepartments()", userError);
        return []; // Return an empty array or handle the error appropriately
    }

    const { facrank, deptcode } = userData[0]; // Store the faculty rank and dept of that faculty.

    let professor_courses = []; // Initialize an empty array to store courses

    // If the faculty is an Admin
    if (facrank === "Admin") {
        const { data: adminCourses, error: adminError } = await supabasePublicClient
            .from("courses")
            .select("coursecode, coursesem, facemail, coursesec, days, start, finish, building, room, coursenum, faclastname")
            .order('coursecode', { ascending: true })
            .order('coursenum', { ascending: true })
            .order('coursesec', { ascending: false })
            .order('coursesem', { ascending: true })
            .order('faclastname', { ascending: true });

        if (adminError) {
            console.error("Error fetching admin courses", adminError);
            return [];
        }

        // For each course that this admin has access to (all the courses), add it to the courses dropdown menu
        adminCourses.forEach(course => {
            // Create an entry into the courses dropdown menu
            const courseEntry = `${course.coursecode} ${course.coursenum} - ${course.coursesec} - ${course.coursesem} - ${course.faclastname}`;

            // Add the course entry into the courses dropdown menu
            const newOption = document.createElement("option");
            newOption.value = courseEntry;
            newOption.text = courseEntry;
            courses_dropdown.appendChild(newOption);

            // Add the course to professor_courses array
            professor_courses.push(course);
        });
    } else {
        // Chairs/Professors can see only their own courses
        const { data: profCourses, error: profError } = await supabasePublicClient
            .from("courses")
            .select("courseid, coursecode, coursesem, facemail, coursesec, days, start, finish, building, room, coursenum, faclastname")
            .eq('facemail', email);

        if (profError) {
            console.error("Error fetching professor courses", profError);
            return [];
        }

        // For each course that this professor teaches, add it to the courses dropdown menu
        profCourses.forEach(course => {
            // Create an entry into the courses dropdown menu
            const courseEntry = `${course.coursecode} ${course.coursenum} - ${course.coursesec} - ${course.coursesem} - ${course.faclastname}`;

            // Add the course entry into the courses dropdown menu
            const newOption = document.createElement("option");
            newOption.value = courseEntry;
            newOption.text = courseEntry;
            courses_dropdown.appendChild(newOption);

            // Add the course to professor_courses array
            professor_courses.push(course);
        });
    }

    return professor_courses; // Return the courses for the professor
}


// Zaynin 09/26/2024
// Queries the supabase "courses" table and retrieves each unique semester that this professor
// has a course in. It will then populate the semester_dropdown dropdown menu with all of these
// semesters as options. It is expected that the professor will choose a semester and then when
// going to choose a specific course, only courses that they have from that semester will be options.
// INPUT: email - the professor's email, necessary to determine this specific professor's courses/semesters.
async function fetchSemesters(email)
{
	// Get all of this professor's courses' semesters. This will include duplicates,
	// and to my knowledge, there is no way to get unique valuees via supabase API. Must
	// take the list of duplicates and then extract the unique values in JavaScript (below)
	const { data, error } = await supabasePublicClient		
        .from('courses')
        .select('coursesem')
		.eq('facemail', email);
		
    if (error) 
	{
        console.error('Error fetching unique coursesem:', error);
    } 
	else 
	{
        //console.log('Unique coursesem values:', data);
		// Get the unique semesters in an array
		uniqueSemesters = Array.from(new Set(data.map(item => item.coursesem)));
		//console.log(uniqueSemesters);
		
		// Get the semester dropdown menu
		//semester_dropdown = document.getElementById("semester_dropdown");
		
		// Add each unique semester to the dropdown menu
		uniqueSemesters.forEach(unique_semester =>
		{
			newOption = document.createElement("option");
			newOption.value = unique_semester;
			newOption.text = unique_semester;
			semester_dropdown.appendChild(newOption);
			console.log("Added option:", newOption.value);
		});
	}
	console.log("Dropdown options after adding semesters:", semester_dropdown.options);
}



// Zaynin 09/26/2024
// Event Listener for the Semester Dropdown Menu - will handle selections
// Function to attach the event listener to the semester dropdown menu
// This must be done in a function, called in itializePage(). This will continue
// to listen to changes in selection in the semesters dropdown menu. It will call
// updateCoursesDropdown() to display the courses for the selected semester.
function attachSemesterDropdownListener(professor_courses) 
{
	//console.log("Professor Courses in ATTACH: ", professor_courses)
    const semester_dropdown = document.getElementById('semester_dropdown');
    semester_dropdown.addEventListener('change', function() 
	{
        const selectedSemester = semester_dropdown.value;

		console.log("Semester Dropdown Menu Selection Updated");
		updateCoursesDropdown(professor_courses)
		//console.log("professor_courses: ", professor_courses);
		
    });
    console.log("Event listener successfully attached to semester_dropdown.");
}


// Zaynin 09/26/2024
// Called by the semester dropdown event listener to change the courses based on the selected
// semester.
function updateCoursesDropdown(professor_courses) {
    const courses_dropdown = document.getElementById('courses_dropdown');

    // GET THE CURRENT SELECTED DEPT
    const department_dropdown = document.getElementById('department_dropdown');
    const selectedDept = department_dropdown.value;
    console.log("In updateCoursesDropdown, current_selected_dept: ", selectedDept);

    // GET THE CURRENT SELECTED SEMESTER
    const semester_dropdown = document.getElementById('semester_dropdown');
    const selectedSemester = semester_dropdown.value;
    console.log("In updateCoursesDropdown, current_selected_semester: ", selectedSemester);

    // Remove all options from the courses dropdown menu (except for the blank "none" option)
    let valueToKeep = "none"; // The value of the option you want to keep
    for (let i = courses_dropdown.options.length - 1; i >= 0; i--) {
        if (courses_dropdown.options[i].value !== valueToKeep) {
            courses_dropdown.remove(i);
        }
    }

    // Show courses based on selected semester
    professor_courses.forEach(course => {
        const courseid = course.courseid;
        const coursecode = course.coursecode;
        const coursenum = course.coursenum;
        const coursesec = course.coursesec;
        const coursesem = course.coursesem;
        const faclastname = course.faclastname;

        // Create an entry into the courses dropdown menu
        const courseEntry = `${coursecode} ${coursenum} - ${coursesec} - ${coursesem} - ${faclastname}`;

        // Check if the department and semester match
        if (selectedSemester === "any" || (coursesem === selectedSemester && (coursecode === selectedDept || selectedDept === "any"))) {
            const newOption = document.createElement("option");
            newOption.value = courseEntry;
            newOption.text = courseEntry;
            courses_dropdown.appendChild(newOption);
        }
    });
}

function attachCoursesDropdownListener(professor_courses) {
    const courses_dropdown = document.getElementById('courses_dropdown');

    courses_dropdown.addEventListener('change', async function () {
        const selectedCourse = courses_dropdown.value;
        console.log("Selected course: ", selectedCourse);

        const selectedCourseObj = professor_courses.find(course => {
            const courseString = `${course.coursecode} ${course.coursenum} - ${course.coursesec} - ${course.coursesem} - ${course.faclastname}`;
            return courseString === selectedCourse;
        });

        if (selectedCourseObj) {
            const courseId = selectedCourseObj.courseid; // Ensure this is correct
            console.log("Extracted Course ID: ", courseId);

            const startDate = document.getElementById('start_date').value; // Adjust these IDs
            const endDate = document.getElementById('end_date').value; // Adjust these IDs

            await checkAttendanceAgainstRosterAndDownloadCSV(courseId, startDate, endDate);
        } else {
            console.error("Course not found");
        }
    });

    console.log("Event listener successfully attached to courses_dropdown.");
}

function attachDepartmentDropdownListener(professor_courses) {
    const department_dropdown = document.getElementById('department_dropdown');
    department_dropdown.addEventListener('change', function () {
        const selectedDepartment = department_dropdown.value;
        console.log("Department Dropdown Menu Selection Updated. Selected: ", selectedDepartment);
        updateCoursesDropdown(professor_courses);
    });
    console.log("Event listener successfully attached to department_dropdown.");
}

async function fetchDepartments(email) {
    console.log("In fetchDepartments, email: ", email);
    const { data, error } = await supabasePublicClient
        .from('users')
        .select("facrank, deptcode")
        .eq('facemail', email);

    if (error) {
        console.error("Error fetching facrank in fetchDepartments()", error);
        return;
    }

    if (data && data.length > 0) {
        const { facrank, deptcode } = data[0];

        if (facrank === "Admin") {
            const { data: deptData, error: deptError } = await supabasePublicClient
                .from('departments')
                .select("deptcode");

            if (deptError) {
                console.error("Error fetching departments:", deptError);
                return;
            }

            deptData.forEach(dept => {
                const deptOption = document.createElement("option");
                deptOption.value = dept.deptcode;
                deptOption.text = dept.deptcode;
                department_dropdown.appendChild(deptOption);
            });
        } else {
            department_dropdown.remove(0); // Remove the "any" option
            const deptOption = document.createElement("option");
            deptOption.value = deptcode;
            deptOption.text = deptcode;
            department_dropdown.appendChild(deptOption);
        }
    }
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

    if (courseError) {
        console.error('Error fetching course ID:', courseError);
        return;
    }

    if (!courseData) {
        console.error('No course found for code:', courseFullCode);
        return;
    }

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

    if (attendanceError) {
        console.error('Error updating attendance table:', attendanceError);
    } else {
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

document.getElementById('semesterButtonContainer').addEventListener('click', function(event) {
    event.preventDefault();

    const givenSemester = document.getElementById('semesterDropdown').value;
    const givenCourse = document.getElementById('courseDropdown').value;

    document.getElementById("form-section").style.display='none';
    document.getElementById("table-section").style.display='block';

    updateAttendanceTable(givenSemester, givenCourse);
});

document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('table-section').style.display = 'none';
    document.getElementById('form-section').style.display = 'block';
});

async function updateAttendanceTable(semester, course) {
    code = course.slice(0,4);
    nums = course.slice(4);

    console.log('Selected Semester:', semester);
    console.log('Selected Course:', course);
    console.log('Course Code:', code);
    console.log('Course Numbers:', nums);

    const { data, error } = await supabasePublicClient
    .from('courses')
    .select('*')
    .eq('coursesem', semester)
    .eq('coursecode', code)
    .eq('coursenum', nums);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';  // Clear the existing rows

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

// Zaynin Sept 26 2024 (END)
// =====================================================


/*
async function fetchAllClasses(email) 
{
	console.log("fetchAllClasses() email: " + email)
	const { data, error } = await supabasePublicClient
    .from('courses')
    .select('*') // Selects all fields from the table
	.eq('facemail', email) // when the email matches up to the professor's
	 .order('coursenum', { ascending: true }); // Order by ascending course code
	//.eq('facemail', 'earl@t.edu')

  if (error) 
  {
    console.error('Error fetching courses:', error);
  } 
  else 
  {
    console.log('Courses:', data);
    return data;
  }
}


async function renderCourses(email) {
  const courses = await fetchAllClasses(email);
  const container = document.querySelector('#classesTab .account-container');

  if (courses && courses.length > 0) 
  {
    let html = '<ul>';
    courses.forEach(course => 
	{
      html += `<li>${course.courseid},${course.coursename},${course.coursesec},${course.coursesem}</li>`; // Assuming "name" is a column in the "courses" table
    });
    html += '</ul>';

    container.innerHTML += html;
  } 
  else 
  {
    container.innerHTML += '<p>No courses available.</p>';
  }
  
  return courses
  
}
*/


// Styling for tabbing added by Anthony: 
// Buttons for welcome, classes, create account, account, notifications, and log out
var classes_button = document.getElementById("classes_button_PROFESSOR");
var help_button = document.getElementById("help_button_PROFESSOR");
var account_button = document.getElementById("account_button_PROFESSOR");
var notification_button = document.getElementById("notification_button_PROFESSOR");
var log_out_button = document.getElementById("log_out_button_PROFESSOR");
var welcome_button = document.getElementById("welcome_button_PROFESSOR");

var currentTab = "welcomeTab"; // Default current tab

function resetButtonColors() {
    welcome_button.style.filter = "brightness(100%)";
    classes_button.style.filter = "brightness(100%)";
    help_button.style.filter = "brightness(100%)";
    account_button.style.filter = "brightness(100%)";
    notification_button.style.filter = "brightness(100%)";
    log_out_button.style.filter = "brightness(100%)";
}

 welcome_button.style.filter = "brightness(150%)";

    welcome_button.addEventListener("click", function() {
        resetButtonColors();
        if (currentTab != "welcomeTab") {
            currentTab = "welcomeTab";
            welcome_button.style.filter = "brightness(150%)";
        }
    });
    welcome_button.addEventListener("mouseover", function() {
        if (currentTab != "welcomeTab") {
            welcome_button.style.filter = "brightness(150%)";
        }
    });
    welcome_button.addEventListener("mouseout", function() {
        if (currentTab != "welcomeTab") {
            welcome_button.style.filter = "brightness(100%)";
        }
    });

// Classes tab logic
classes_button.addEventListener("click", function() {
    resetButtonColors();
    if (currentTab != "classesTab") {
        currentTab = "classesTab";
        classes_button.style.filter = "brightness(150%)";
    }
});
classes_button.addEventListener("mouseover", function() {
    if (currentTab != "classesTab") {
        classes_button.style.filter = "brightness(150%)";
    }
});
classes_button.addEventListener("mouseout", function() {
    if (currentTab != "classesTab") {
        classes_button.style.filter = "brightness(100%)";
    }
});

// Help tab logic
help_button.addEventListener("click", function() {
    resetButtonColors();
    if (currentTab != "helpTab") {
        currentTab = "helpTab";
        help_button.style.filter = "brightness(150%)";
    }
});
help_button.addEventListener("mouseover", function() {
    if (currentTab != "helpTab") {
        help_button.style.filter = "brightness(150%)";
    }
});
help_button.addEventListener("mouseout", function() {
    if (currentTab != "helpTab") {
        help_button.style.filter = "brightness(100%)";
    }
});


// Account tab logic
account_button.addEventListener("click", function() {
    resetButtonColors();
    if (currentTab != "accountTab") {
        currentTab = "accountTab";
        account_button.style.filter = "brightness(150%)";
    }
});
account_button.addEventListener("mouseover", function() {
    if (currentTab != "accountTab") {
        account_button.style.filter = "brightness(150%)";
    }
});
account_button.addEventListener("mouseout", function() {
    if (currentTab != "accountTab") {
        account_button.style.filter = "brightness(100%)";
    }
});


// Notification tab logic
notification_button.addEventListener("click", function() {
    resetButtonColors();
    if (currentTab != "notificationTab") {
        currentTab = "notificationTab";
        notification_button.style.filter = "brightness(150%)";
    }
});
notification_button.addEventListener("mouseover", function() {
    if (currentTab != "notificationTab") {
        notification_button.style.filter = "brightness(150%)";
    }
});
notification_button.addEventListener("mouseout", function() {
    if (currentTab != "notificationTab") {
        notification_button.style.filter = "brightness(100%)";
    }
});



// Log Out button logic
log_out_button.addEventListener("click", function() {
    resetButtonColors();
    if (currentTab != "log_out") {
        currentTab = "log_out";
        log_out_button.style.filter = "brightness(150%)";
    }
});
log_out_button.addEventListener("mouseover", function() {
    if (currentTab != "log_out") {
        log_out_button.style.filter = "brightness(150%)";
    }
});
log_out_button.addEventListener("mouseout", function() {
    if (currentTab != "log_out") {
        log_out_button.style.filter = "brightness(100%)";
    }
});
