// Declare the variables that will store the dropdown menus for the "Create Course", "Roster Entry" and "Roster Removal" tabs.
// On the Admin page, this functionality is used for ALL dropdown menus, but the professor page already had some different setup
// so this stuff will only be used for those tabs. Make sure to keep "email" declared here as it makes it global to be used in a
// check in the csv parsing to ensure that prof can only add courses/students and remove students from their own courses.
var new_student_semester_dropdown, remove_student_semester_dropdown, new_student_courses_dropdown, remove_student_courses_dropdown, create_account_department_dropdown, new_student_department_dropdown, remove_student_department_dropdown, course_creation_department_dropdown;
var dept_dropdown_menus, courses_dropdown_menus, semesters_dropdown_menus;
var email;

// "MAIN()" - DOMContentLoaded - this stuff happens first in the program
window.addEventListener('DOMContentLoaded', function()
{
	checkAuth();
	setupClassesPage();
	setupFAQFunctionality();
	loadAccountInfo();
	getDropdownMenus(); // For "Create Course", "Roster Entry", and "Roster Removal" tabs
	initializePage();
});

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



// Sets the values for all dropdown menus across the "Create Course", "Roster Entry", and "Roster Removal" tabs on this page.
// These variables are declared globally.
function getDropdownMenus()
{
	console.log("getDropdownMenus 1");
	new_student_semester_dropdown = document.getElementById('new_student_semester_dropdown');
	remove_student_semester_dropdown = document.getElementById('remove_student_semester_dropdown');
	new_student_courses_dropdown = document.getElementById('new_student_courses_dropdown');
	remove_student_courses_dropdown = document.getElementById('remove_student_courses_dropdown');
	create_account_department_dropdown = document.getElementById('create_department_dropdown');
	new_student_department_dropdown = document.getElementById('new_student_department_dropdown');
	remove_student_department_dropdown = document.getElementById('remove_student_department_dropdown');
	course_creation_department_dropdown = document.getElementById('course_creation_department_dropdown');
	
	// Create a list containing every dropdown menu for each tab. Any future added dropdown menu must be added to a list
	dept_dropdown_menus = [new_student_department_dropdown, remove_student_department_dropdown, course_creation_department_dropdown];
	courses_dropdown_menus = [new_student_courses_dropdown, remove_student_courses_dropdown];
	semesters_dropdown_menus = [new_student_semester_dropdown, remove_student_semester_dropdown];
	console.log("getDropdownMenus 2");
	console.log("dept_dropdown_menus: ", dept_dropdown_menus);
	console.log("courses_dropdown_menus: ", courses_dropdown_menus);
	console.log("semesters_dropdown_menus: ", semesters_dropdown_menus);
}

async function initializePage()
{
	email = await fetchProfessorData();
	console.log("Email: ", email);
	
	
	//await fetchDepartments(email); // Populate the "Create Course", "Roster Entry", and "Roster Removal" page dropdown menus
	await fetchSemesters(email);   // Populate the "Create Course", "Roster Entry", and "Roster Removal" page dropdown menus
	
	professor_courses = await fetchCourses(email); // Populate the "Create Course", "Roster Entry", and "Roster Removal" page dropdown menus
	attachDepartmentDropdownListener(professor_courses);
	attachSemesterDropdownListener(professor_courses);
	attachCoursesDropdownListener();
	await populateDepartmentsDropdown(email);
	
	// For the "Create Course" tab, set the options for "Semester" and "Building". These are different from the other semester dropdowns and does not impact any other dropdown options.
	setCreateCourseIsolatedDropdownOptions(email);
	
}


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
    const { data: { session }, error: authError } = await supabasePublicClient.auth.getSession();

    if (authError || !session) {
        console.error('Error fetching user session:', authError || 'No active session');
        return;
    }

    const loggedInFacemail = session.user.email;
    const { data, error } = await supabasePublicClient
        .from('temptable')
        .select('*')
        .eq('facemail', loggedInFacemail)
	.eq('status', 'Pending');

    if (error) {
        console.error('Error fetching notifications:', error);
        return;
    }

    const notificationsContainer = document.getElementById('notifications-container');
    notificationsContainer.innerHTML = data.length > 0 ? '' : '<p>No notifications found.</p>';

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
                        data-student-id="${notification.stuid}">Approve</button>
                <button class="deny-button" data-unique-key="${uniqueKey}">Deny</button>
            </div>
        `;
        notificationsContainer.appendChild(notificationElement);
    });

    attachButtonListeners(session);
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
    const stufirstname = event.target.getAttribute('data-student-firstname');
    const stulastname = event.target.getAttribute('data-student-lastname');
    const stuid = event.target.getAttribute('data-student-id');
    const courseFullCode = event.target.getAttribute('data-course');
    const deptCode = event.target.getAttribute('data-dept');
    const courseNum = event.target.getAttribute('data-course-num');
    const courseSec = event.target.getAttribute('data-course-sec');

    const attendanceTime = new Date(); // Set to current time for approval

    // Fetch the course ID
    const { data: courseData, error: courseError } = await supabasePublicClient
        .from('courses')
        .select('courseid')
        .eq('coursecode', deptCode)
        .eq('coursenum', courseNum)
        .eq('coursesec', courseSec)
        .single();

    if (courseError || !courseData) {
        console.error('Error fetching course ID:', courseError || 'Course not found');
        displayErrorMessage('Could not find the course. Please try again.');
        return;
    }

    // Insert attendance record
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
        console.error('Error inserting attendance:', attendanceError);
        displayErrorMessage('Could not record attendance. Please try again.');
        return;
    }

    console.log('Attendance approved successfully!');
    displaySuccessMessage(stufirstname, stulastname);

    // Fetch the insertdate for the selected student
    const { data: notificationData, error: notificationError } = await supabasePublicClient
        .from('temptable')
        .select('insertdate')
        .eq('facemail', session.user.email)
        .eq('studentfirstname', stufirstname)
        .eq('studentlastname', stulastname)
        .eq('status', 'Pending')
        .single();

    if (notificationError || !notificationData) {
        console.error('Error fetching notification data:', notificationError || 'Notification not found');
        displayErrorMessage('Could not find notification data. Please try again.');
        return;
    }

    const insertdate = notificationData.insertdate; // Get the insertdate from the fetched notification
    const uniqueKey = `${stufirstname}-${stulastname}-${insertdate}`; // Construct the unique key using insertdate

    // Update status in the temptable
    const { error: updateError } = await supabasePublicClient
        .from('temptable')
        .update({ status: 'approved' })
        .eq('facemail', session.user.email)
        .eq('insertdate', insertdate)
        .eq('studentfirstname', stufirstname)
        .eq('studentlastname', stulastname);

    if (updateError) {
        console.error('Error updating notification status:', updateError);
        displayErrorMessage('Could not update notification status. Please try again.');
    } else {
        // Remove notification from UI using the unique key
        removeNotificationFromUI(uniqueKey);
    }
}


async function handleDeny(event, session) {
    const uniqueKey = event.target.getAttribute('data-unique-key');
    const [stufirstname, stulastname] = uniqueKey.split('-');

    console.log('Attempting to deny attendance for:', {
        stufirstname,
        stulastname,
        facemail: session.user.email
    });

    // Update status to 'denied' instead of delete to keep records
    const { error } = await supabasePublicClient
        .from('temptable')
        .update({ status: 'denied' })
        .eq('facemail', session.user.email)
        .eq('studentfirstname', stufirstname)
        .eq('studentlastname', stulastname);

    if (error) {
        console.error('Error updating notification to denied:', error);
        displayErrorMessage('Could not deny notification. Please try again.');
    } else {
        console.log('Notification denied successfully');
        removeNotificationFromUI(uniqueKey);
        displayDeniedMessage(stufirstname, stulastname);
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


function displaySuccessMessage(firstName, lastName) {
    const messageContainer = document.getElementById('message-container');
    const message = `Added ${firstName} ${lastName}'s attendance successfully.`;

    const messageElement = document.createElement('div');
    messageContainer.style.backgroundColor = 'green';
    messageElement.className = 'success-message';
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

function displayDeniedMessage(firstName, lastName) {
    const messageContainer = document.getElementById('message-container');
    const message = `Denied ${firstName} ${lastName}'s attendance request.`;

    const messageElement = document.createElement('div');
    messageContainer.style.backgroundColor = 'red'; 
    messageElement.className = 'denied-message'; 
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Initial call to fetch notifications
fetchNotificationsForCurrentUser();




  // Zaynin 09/26/2024 & 11/16/2024
  // Returns the courses relevant to the specific faculty member.
  // If the faculty logged in is a professor/chair, it will query all courses that they have.
  // If the faculty logged in is a admin, it will query all courses.
  // Course options will later be filtered based on dept/semester, but this function obtains
  // all possible courses that would need to be seen by this faculty
  async function fetchCourses(email)
  {
	  // Determine whether this faculty is an Admin or a Prof/Chair
	  // Get faculty role and dept by querying "users" table
	  const { data: courseData, error } = await supabasePublicClient
		  .from('users')
		  .select("facrank, deptcode")
		  .eq('facemail', email);
	  
	  if (error)
	  { console.error("Error fetching facrank in fetchDepartments()", error); }
	  else
	  {
		  const { facrank, deptcode } = courseData[0]; // Store the faculty rank and dept of that faculty.
												 // Variables MUST be named the same as in database for some reason
			  
		  const { data, error } = await supabasePublicClient
		  .from("courses")
		  .select("coursecode, coursename, coursesem, facemail, coursesec, days, start, finish, building, room, coursenum, faclastname")
		  .eq('facemail', email)
		  .order('coursecode', { ascending: true }) 
		  .order('coursenum', { ascending: true }) 
		  .order('coursesec', { ascending: false }) 
		  .order('coursesem', { ascending: true })
		  .order('faclastname', { ascending: true }); 
		  
		  //print("ADMIN COURSES: ", data);
		  
		  courses_dropdown_menus.forEach(dropdown_menu =>
		  {
			  // For each course that this admin has access to (all the courses), add it to the courses dropdown menu
			  data.forEach(course => 
			  {
				  // Extract all the variables from this course
				  const coursecode = course.coursecode;
				  const coursename = course.coursename;
				  const coursesem = course.coursesem;
				  const facemail = course.facemail;
				  const coursesec = course.coursesec;
				  const days = course.days;
				  const start = course.start;
				  const finish = course.finish;
				  const building = course.building;
				  const room = course.room;
				  const coursenum = course.coursenum;
				  const faclastname = course.faclastname;
				  
				  // Create an entry into the courses dropdown menu
				  //courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`
				  courseEntry = `${coursecode} ${coursenum} : ${coursesec} - ${coursesem} - ${faclastname}`;
  
				  // Add the course entry into the courses dropdown menu
				  newOption = document.createElement("option"); // Create a new option for the dropdown menu
				  newOption.value = courseEntry;
				  newOption.text = courseEntry;
				  dropdown_menu.appendChild(newOption);
			  
			  });
		  });
		  

		  
		  return data; // Return the courses that this admin has. To be used when updating the courses displayed by selecting a semester										 
	  }
  }
  
  
  // Zaynin 09/26/2024 & 11/16/2024
  // Queries the supabase "courses" table and retrieves each unique semester that this professor
  // has a course in. It will then populate the semester_dropdown dropdown menu with all of these
  // semesters as options. It is expected that the professor will choose a semester and then when
  // going to choose a specific course, only courses that they have from that semester will be options.
  // INPUT: email - the professor's email, necessary to determine this specific professor's courses/semesters.
  async function fetchSemesters(email)
  {
	  console.log("fetchSemesters1");
	  // Determine whether this faculty is an Admin or a Prof/Chair
	  // Get faculty role and dept by querying "users" table
	  const { data: semData, error } = await supabasePublicClient
		  .from('users')
		  .select("facrank, deptcode")
		  .eq('facemail', email);
  
	  if (error)
	  { console.error("Error fetching facrank in fetchDepartments()", error); }
	  else
	  {
		  const { facrank, deptcode } = semData[0]; // Store the faculty rank and dept of that faculty.
												 // Variables MUST be named the same as in database for some reason
			  
		  // Query the database for every unique semester in "courses" where facemail == "email" parameter. Admins can see all semesters
		  const { data, error } = await supabasePublicClient
			  .from('courses')
			  .select('coursesem')
			  .eq('facemail', email)
			  
		  if (error)
		  {
			  console.error('Error fetching unique coursesem:', error);
		  }
		  else
		  {
			  // Get the unique semesters in an array
			  uniqueSemesters = Array.from(new Set(data.map(item => item.coursesem)));
			  
			  // For every semester dropdown menu (on each tab)
			  console.log("semesters_dropdown_menus: ", semesters_dropdown_menus);
			  semesters_dropdown_menus.forEach(dropdown_menu => {
			  
				  // Add each unique semester to the dropdown menu
				  uniqueSemesters.forEach(unique_semester =>
				  {
					  newOption = document.createElement("option");
					  newOption.value = unique_semester;
					  newOption.text = unique_semester;
					  console.log("dropdown_menu: ", dropdown_menu);
					  dropdown_menu.appendChild(newOption);
					  console.log("Added option:", newOption.value);
				  });
			  });
		  }
	  }
  }
  
  


async function getProfessorCourses() {
    const email = await fetchProfessorData();
    const { data, error } = await supabasePublicClient
        .from('courses')
        .select('coursecode, coursenum, coursesem, coursesec')
	.order('coursecode', { ascending: true }) 
	.order('coursenum', { ascending: true }) 
	.order('coursesec', { ascending: false }) 
	.order('coursesem', { ascending: true })
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
function setupFAQFunctionality()
{
        const buttons = document.querySelectorAll('#helpTab .question button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const faq = button.nextElementSibling; // The <p> tag
                const icon = button.querySelector('.d-arrow'); // The arrow icon
                faq.classList.toggle('show'); // Toggle visibility
                icon.classList.toggle('rotate'); // Toggle arrow rotation
            });
        });
    }


// Added today <- when is today
function setupClassesPage()
{
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
	
}

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
		// (Censor it)
		var student_id = student.stuid;
		var student_id_length = student_id.length;
		if (student_id_length <= 4)
		{ student.stuid = '*'.repeat(student_id_length); }
		else
		{
			var lastFourChars = student.stuid.slice(-4);
			var num_asterisks = student_id_length - 4;
			var censored_student_id = ('*'.repeat(num_asterisks)) + lastFourChars;
			student.stuid = censored_student_id;
		}
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
	"log_out_button_PROFESSOR"		: "log_out",
	"add_student_button_PROFESSOR"	: "add_student",
	"remove_student_button_PROFESSOR"		: "remove_student",
	"create_course_button_PROFESSOR"		: "create_course"
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
		
		// Censor the student IDs - only show the last 4 characters
		rosterData.forEach(student => {
			var student_id = student.stuid;
			var student_id_length = student_id.length;
			if (student_id_length <= 4)
			{
				student.stuid = '*'.repeat(student_id_length);
			}
			else
			{
				var lastFourChars = student.stuid.slice(-4);
				var num_asterisks = student_id_length - 4;
				var censored_student_id = ('*'.repeat(num_asterisks)) + lastFourChars;
				student.stuid = censored_student_id;
			}
		});

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

document.getElementById('downloadRoster').addEventListener('click', async () => {
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
            .select('courseid')
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

        // Step 2: Fetch roster data in CSV format by matching courseid in the roster table
        const { data: csvData, error: csvError } = await supabasePublicClient
            .from('roster')
            .select('stufirstname, stulastname, stuid')
            .eq('courseid', courseId)
            .csv();

        if (csvError) {
            console.error('Error fetching roster CSV:', csvError);
            return;
        }

        // Create a downloadable link for the CSV data
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `roster_${selectedCourse.replace(/\s+/g, '_')}_${selectedSemester}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error downloading roster CSV:', error);
    }
});

























// Zaynin 09/26/2024 && 11/16/2024
// Event Listener for the Courses Dropdown Menu - will handle selections
// Function to attach the event listener
// This must be done in a function, called in itializePage(). This will continue
// to listen to changes in selection in the courses dropdown menu.
function attachDepartmentDropdownListener(professor_courses) 
{
  new_student_department_dropdown.addEventListener('change', function()
  {
	  console.log("Selecting new student department");
	  // Update the new student courses table to only show courses in this department
	  const selectedDept = new_student_department_dropdown.value;
	  const selectedSemester = new_student_semester_dropdown.value;
	  updateCoursesDropdown(professor_courses, new_student_courses_dropdown, selectedDept, selectedSemester);
  });
  
  remove_student_department_dropdown.addEventListener('change', function ()
  {
	  const selectedDept = remove_student_department_dropdown.value;
	  const selectedSemester = remove_student_semester_dropdown.value;
	  updateCoursesDropdown(professor_courses, remove_student_courses_dropdown, selectedDept, selectedSemester);
  });
}

// Zaynin 09/26/2024 && 11/16/2024
// Event Listener for the Semester Dropdown Menu - will handle selections
// Function to attach the event listener to the semester dropdown menu
// This must be done in a function, called in itializePage(). This will continue
// to listen to changes in selection in the semesters dropdown menu. It will call
// updateCoursesDropdown() to display the courses for the selected semester.
function attachSemesterDropdownListener(professor_courses) 
{
  // If the "New Student" tab's Semester dropdown selection is changed, update the "New Student" tab's Courses dropdown options
  new_student_semester_dropdown.addEventListener('change', function()
  {
	  const selectedDept = new_student_department_dropdown.value;
	  const selectedSemester = new_student_semester_dropdown.value;
	  updateCoursesDropdown(professor_courses, new_student_courses_dropdown, selectedDept, selectedSemester);
  });
  
  remove_student_semester_dropdown.addEventListener('change', function ()
  {
	 const selectedDept = remove_student_department_dropdown.value;
	 const selectedSemester = remove_student_semester_dropdown.value;
	 updateCoursesDropdown(professor_courses, remove_student_courses_dropdown, selectedDept, selectedSemester);
  });
  
  
}

  
// Zaynin 09/26/2024 && 11/16/2024
// Event Listener for the Courses Dropdown Menu - will handle selections
// Function to attach the event listener
// This must be done in a function, called in itializePage(). This will continue
// to listen to changes in selection in the courses dropdown menu.
function attachCoursesDropdownListener() 
{
  
  // "New Student" Tab course dropdown
  new_student_courses_dropdown.addEventListener('change', function ()
  {
	 const selectedCourse = new_student_courses_dropdown.value; 
	 console.log("New Student Courses Dropdown Menu Selection Updated. Selected: ", selectedCourse);
	 // Do whatever you want with this selected course
  });
  
  remove_student_courses_dropdown.addEventListener('change', function ()
  {
	 const selectedCourse = remove_student_courses_dropdown.value;
	 // Do whatever you want with this selected course
  });

}

// 11/16/2024
async function populateDepartmentsDropdown(email) {
  try {
	  // Fetch the departments of every course that this professor teaches
	  const { data: profDepts, error: profDeptsError } = await supabasePublicClient
		.from('courses')
		.select('dept')
		.eq('facemail', email);
		
	  if (profDeptsError)
	  { console.log("Error fetching professor departments: ", profDeptsError); return }

	   var departments = [...new Set(profDepts.map(item => item.dept))];
	   console.log("deparmtentsnsts: ", departments);

	  // Clear existing options
	  //department_dropdown.innerHTML = '<option value="any">Any</option>';
	  //create_account_department_dropdown.innerHTML = '<option value="any">Any</option>';
	  new_student_department_dropdown.innerHTML = '<option value="any">Any</option>';

	  // For every department dropdown menu
	  dept_dropdown_menus.forEach(dropdown_menu => {
		  // Append each department as an option
		  departments.forEach(department => {
			  const option = document.createElement('option');
			  option.value = department;
			  option.textContent = `${department}`;
			  
			  dropdown_menu.appendChild(option);
			  
		  });  
	  });
	  
	  // Set JUST the "Create Course" tab's Department dropdown menu to be only the department that the professor
	  // officially teaches. Whereas the other tabs will allow them to add/remove students from a course in any of the departments
	  // that they teach (if they have courses in multiple departments).
	  // Fetch the professor's department.
	  const { data: profDept, error: profDeptError } = await supabasePublicClient
		.from('users')
		.select('deptcode')
		.eq('facemail', email);
		
		if (profDeptError)
		{ console.error("Error fetching professor department: ", profDeptError); return; }
		
		var uniqueProfDept = profDept[0].deptcode;
		const option = document.createElement('option');
		option.value = uniqueProfDept;
		option.textContent = `${uniqueProfDept}`;
		course_creation_department_dropdown.innerHTML = "";
		course_creation_department_dropdown.appendChild(option);

	  console.log('Departments dropdown populated with all departments.');
	  
  } catch (error) {
	  console.error('Error populating departments dropdown:', error);
  }
}


// 11/16/2024
async function setCreateCourseIsolatedDropdownOptions(email)
{
	var course_creation_semester_dropdown = document.getElementById('course_creation_semester_dropdown');
	var course_creation_building_dropdown = document.getElementById('course_creation_building_dropdown');
	var course_creation_professor_dropdown = document.getElementById('course_creation_professor_dropdown');
	course_creation_professor_dropdown.innerHTML = "";
	
	// SEMESTER DROPDOWN
	// Query supabase for all valid semesters. This is needed because we aren't just doing the semesters that a prof/chair/admin has courses in, we are doing ALL semesters.
	// Important distinction from normal method because we are including semesters that may not even have any courses made for them yet.
	const {data: semesterResult, error: semesterError} = await supabasePublicClient
		.from('semesters')
		.select('semester');
		
	if (semesterError)
	{ console.log("Error fetching semesters from 'semesters' table: ", semesterError); }
	else
	{
		var semestersArray = semesterResult.map(item => item.semester); // Convert supabase data object to an array
		semestersArray.forEach(semester => {
			var option = document.createElement("option");
			option.value = semester;
			option.text = semester;
			course_creation_semester_dropdown.appendChild(option);
		});
	}
	
	// BUILDING DROPDOWN
	const {data: buildingResult, error: buildingError} = await supabasePublicClient
		.from('buildings')
		.select('building');
		
	if (buildingError)
	{ console.log("Error fetching buildings from 'buildings' table: ", buildingError); }
	else
	{
		var buildingsArray = buildingResult.map(item => item.building); // Convert supabase data object to an array
		buildingsArray.forEach(building => {
			var option = document.createElement("option");
			option.value = building;
			option.text = building;
			course_creation_building_dropdown.appendChild(option);
		});
	}
	
	// PROFESSOR DROPDOWN
	const {data: profResult, error: profError} = await supabasePublicClient
		.from('users')
		.select('faclastname')
		.eq('facemail', email)
		
	if (profError)
	{ console.log("Error fetching professors from 'users' table: ", profError); }
	else
	{
		var profArray = profResult.map(item => item.faclastname); // Convert supabase data object to an array
		profArray.forEach(prof => {
			var option = document.createElement("option");
			option.value = prof;
			option.text = prof;
			course_creation_professor_dropdown.appendChild(option);
		});
	}
}



function updateCoursesDropdown(professor_courses, specific_courses_dropdown, dept_selection, sem_selection)
{
  // Get the current selected department and semester
  const selectedDept = dept_selection;
  const selectedSemester = sem_selection;
  
  // Remove all options from the courses dropdown menu (except for the blank "none" option
  let valueToKeep = "none"; // The value of the option you want to keep

  for (let i = specific_courses_dropdown.options.length - 1; i >= 0; i--) 
  {
	if (specific_courses_dropdown.options[i].value !== valueToKeep) 
	{
	  specific_courses_dropdown.remove(i);
	}
  }
  
  // If the "none" semester option was chosen (the blank option), then show ALL courses regardless of semester
  if (selectedSemester == "any" || selectedSemester == "Any" || selectedSemester == "none")
  {
	  console.log("option: any chosen.");
	  
	  professor_courses.forEach(course =>
	  {
		  const coursecode = course.coursecode;
		  const coursenum = course.coursenum;
		  const coursesec = course.coursesec;
		  const coursename = course.coursename;
		  const coursesem = course.coursesem;
		  const faclastname = course.faclastname;
	  
		  // Create an entry into the courses dropdown menu
		  //courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`;
		  courseEntry = `${coursecode} ${coursenum} : ${coursesec} - ${coursesem} - ${faclastname}`;
		  
		  // Only add the course entry into the dropdown menu if it is in the selected department
		  if (coursecode == selectedDept || selectedDept == "any" || selectedDept == "Any")
		  {
			  // Add the course entry into the courses dropdown menu
			  //courses_dropdown = document.getElementById("courses_dropdown"); // Get the courses dropdown menu
			  newOption = document.createElement("option"); // Create a new option for the dropdown menu
			  newOption.value = courseEntry;
			  newOption.text = courseEntry;
			  specific_courses_dropdown.appendChild(newOption);
		  }
	  });
  }
  
  else
  {
	  console.log("option: ", selectedSemester);
	  
	  // Otherwise, show all courses with coursesem == selectedSemester
	  professor_courses.forEach(course =>
	  {
		  const coursecode = course.coursecode;
		  const coursenum = course.coursenum;
		  const coursesec = course.coursesec;
		  const coursename = course.coursename;
		  const coursesem = course.coursesem;
		  const faclastname = course.faclastname;
	  
		  // Create an entry into the courses dropdown menu
		  //courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`;
		  courseEntry = `${coursecode} ${coursenum} : ${coursesec} - ${coursesem} - ${faclastname}`;
		  
		  // Only add this course to the dropdown menu if it is in the selected semester and department
		  if (coursesem == selectedSemester && (coursecode == selectedDept || selectedDept == "any"))
		  {
			  // Add the course entry into the courses dropdown menu
			  //courses_dropdown = document.getElementById("courses_dropdown"); // Get the courses dropdown menu
			  newOption = document.createElement("option"); // Create a new option for the dropdown menu
			  newOption.value = courseEntry;
			  newOption.text = courseEntry;
			  specific_courses_dropdown.appendChild(newOption);	
			  console.log("Adding course option: ", newOption);
		  }	
	  });
  }
}

// Creates a course, is the "Submit" button for Create Course.
async function createCourse(event)
{
	event.preventDefault(); // Prevent page from reloading upon submission
	console.log('In createCourse()');
	// Get all of the fields
	// DROPDOWN MENUS - IF NOT SELECTED, .value == "none"
	// INPUT FIELDS   - IF NOT SELECTED, .value == ""
	// CHECKBOXES     - IF NOT SELECTED, .checked == false
	var course_creation_form_ADMIN = document.getElementById("course_creation_form_ADMIN"); // The form itself
	var course_creation_department_dropdown = document.getElementById("course_creation_department_dropdown");
	var course_creation_semester_dropdown = document.getElementById("course_creation_semester_dropdown");
	var cc_coursenum_input = document.getElementById("cc_coursenum_input");
	var cc_coursename_input = document.getElementById("cc_coursename_input");
	var cc_coursesection_input = document.getElementById("cc_coursesection_input");
	var course_creation_building_dropdown = document.getElementById("course_creation_building_dropdown");
	var cc_courseroom_input = document.getElementById("cc_courseroom_input");
	var mondayCheckbox = document.getElementById("monday");
	var tuesdayCheckbox = document.getElementById("tuesday");
	var wednesdayCheckbox = document.getElementById("wednesday");
	var thursdayCheckbox = document.getElementById("thursday");
	var fridayCheckbox = document.getElementById("friday");
	var saturdayCheckbox = document.getElementById("saturday");
	var sundayCheckbox = document.getElementById("sunday");
	var daysArray = [mondayCheckbox, tuesdayCheckbox, wednesdayCheckbox, thursdayCheckbox, fridayCheckbox, saturdayCheckbox, sundayCheckbox];
	var any_day_selected = false;
	var days_selected_string = "";
	var cc_start_time_input = document.getElementById("cc_start_time_input");
	var cc_end_time_input = document.getElementById("cc_end_time_input");
	var course_creation_professor_dropdown = document.getElementById("course_creation_professor_dropdown");
	var feedback_container = document.getElementById("create_course_manual_submission_feedback_container");
	var facemail = "emailNotFound@error.com";
	
	// Check to see if at least one day was selected. Iterates through all of the days and sets 'any_day_selected' to true if a day is checked
	// Also, will combine the strings of all of the selected days. For example, if "M", "W", and "F" are selected, will store "MWF" in 'days_selected_string'
	daysArray.forEach(function(thisDay) {
		if (thisDay.checked) {
			any_day_selected = true;
			days_selected_string += thisDay.value;
		}
	});
	
	// Make sure that at least one day was selected AND make sure that all of the TEXT fields are not empty. This does not check for the dropdown fields, because they always technically have a default value of 'none'
	if (any_day_selected == false || !course_creation_form_PROFESSOR.checkValidity()) // If all of the fields are provided (EXCEPT FOR DAYS, WHICH ARE OPTIONAL)
	{
		alert("Please fill out all the required fields.");
		return; // Stop further execution
	}
	else
	{
		// Check to see if a course with this department, semester, course number, and section already exists.
		// A course with the same department, semester, course number, and semester are allowed to exist, but must have different section numbers.
		const { data: dupData, error: dupError } = await supabasePublicClient
			.from('courses')
			.select('courseid')
			.eq('dept', course_creation_department_dropdown.value)
			.eq('coursesem', course_creation_semester_dropdown.value)
			.eq('coursenum', parseInt(cc_coursenum_input.value, 10)) // Convert to integer probably
			.eq('coursesec', cc_coursesection_input.value);
			
		if (dupError)
		{
			console.log("In createCourse(), unable to check for duplicate section: ", dupError);
			feedback_container.innerHTML = '<span style="color: red;">There was a database error, apologies for the inconvenience.</span>';
		}
		else
		{
			console.log("DUPDATA: ", dupData);
			// If there is at least one class with this section, alert the user to try again with a new section number
			if (dupData.length > 0)
			{
				console.log("In createCourse(), section already exists.");
				feedback_container.innerHTML = '<span style="color: red;">Error: A course with these fields under the same section already exists. Please create the course with a new section, or resolve any field issues.</span>';
			}
			// If there is no course with this section, then create the course and alert of success
			else
			{
				// Retreive the faculty email of the selected professor from the 'users' table
				const { data: feData, error: feError } = await supabasePublicClient
					.from('users')
					.select('facemail')
					.eq('faclastname', course_creation_professor_dropdown.value);
					
				if (feError)
				{
					console.log("In createCourse(), unable to get faculty email: ", feError);
					feedback_container.innerHTML = '<span style="color: red;">There was a database error, apologies for the inconvenience.</span>';
				}
				else
				{
					if (feData.length > 0)
					{ facemail = feData[0].facemail; console.log("faculty email: ", facemail); }
				}
				
				// Create the new course in the database
				const { data: ccData, error: ccError } = await supabasePublicClient
					.from('courses')
					.insert([
						{
							dept: course_creation_department_dropdown.value,
							coursecode: course_creation_department_dropdown.value,
							coursenum: parseInt(cc_coursenum_input.value, 10),
							coursename: cc_coursename_input.value,
							coursesec: cc_coursesection_input.value,
							coursesem: course_creation_semester_dropdown.value,
							building: course_creation_building_dropdown.value,
							room: cc_courseroom_input.value,
							days: days_selected_string,
							start: cc_start_time_input.value,
							finish: cc_end_time_input.value,
							facemail: facemail,
							faclastname: course_creation_professor_dropdown.value,
						}
					]);
					
				console.log("Successfully created course.");
				feedback_container.innerHTML = '<span style="color: green;">Successfully created course.</span>';
			}
		}
	}
}


// Gets the values from all of the input fields & dropdown menus on the "New Student" tab.
// Finds the courseid of the course that matches this selected course. Then, inserts the student
// into that course if the course exists.
async function addStudentToRoster(event)
{
	event.preventDefault(); // Prevent page from reloading upon submit
	var feedback_container = document.getElementById('new_student_manual_submission_feedback_container');
	// Get the input HTML elements. We already have the dropdown menus from earlier in code.
	var id_input = document.getElementById('id_num');
	var firstname_input = document.getElementById('first_name');
	var lastname_input = document.getElementById('last_name');
	
	// Get the values from the inputs/dropdowns
	var stuid = id_input.value;
	var firstname = firstname_input.value;
	var lastname = lastname_input.value;
	var department = new_student_department_dropdown.value;
	var semester = new_student_semester_dropdown.value;
	var course = new_student_courses_dropdown.value;
	
	// Extract the course information from the course string. Current format: MATH 115 : 010 - Fall 2024 - Wong
	var extraction_regex = /^([A-Z]+)\s+(\d+)\s+:\s+(\d+)\s+-\s+([A-Za-z]+\s+\d{4})\s+-\s+([A-Za-z]+)$/;
	var match = course.match(extraction_regex);
	
	if (match) {
		// Extract each element of the course
		var course_dept = match[1];   // "MATH"
		var course_num = parseInt(match[2]);  // 115 (as integer)
		var course_sec = match[3];    // "010"
		var course_sem = match[4];    // "Fall 2024"
		var course_fac = match[5];    // "Wong"
		
		// Look for a course in the "courses" table that matches these specifications.
		// Extract its courseid so we can add the student to this course roster.
		const { data: returnData, error } = await supabasePublicClient
			.from('courses')
			.select('courseid')
			.eq('dept', course_dept)
			.eq('coursenum', course_num)
			.eq('coursesec', course_sec)
			.eq('coursesem', course_sem)
			.eq('faclastname', course_fac)
			.single();
			
		if (error) {
			console.error("Unable to find a course that meets the same specifications as the course that you are trying to add this new student to: ", error);
			feedback_container.innerHTML = '<span style="color: red;">Unable to find course that you are trying to add this student to.</span>';
		}
		else {
			// Get the courseid of the course that you are trying to add this new student into the roster of
			var courseId = returnData.courseid;
			console.log("Found course with courseid: ", courseId);
			
			// Check to see if this student is already in the roster. If so, skip over. If not, add them to the roster.
			const { data: checkInData, error: checkInError } = await supabasePublicClient
				.from('roster')
				.select('courseid')
				.eq('courseid', courseId)
				.ilike('stufirstname', firstname)
				.ilike('stulastname', lastname)
				.ilike('stuid', stuid);
				
			if (checkInError) // If there was an error doing the query
			{ console.log("Error checking roster for duplicate entry: ", checkInError); }
			else if (checkInData.length == 0) // If an entry was not found, meaning that the student is not yet in this course roster, then add them to the roster. Otherwise, skip this student
			{
				// Add this student to the rosters table with this courseid
				const { data: insertData, error: insertError } = await supabasePublicClient
					.from('roster')
					.insert([
						{
							courseid: courseId,
							stufirstname: firstname,
							stulastname: lastname,
							stuid: stuid
						}
					]);
					
				if (insertError) {
					console.log("Unable to insert student into roster table.");
					feedback_container.innerHTML = '<span style="color: red;">Unable to add student to roster.</span>';
				}
				else {
					console.log("Successfully insert student into roster table.");
					feedback_container.innerHTML = '<span style="color: green;">Successfully added student to roster.</span>';
				}
			}
			// If an entry was found, meaning that the student is already in the course, then output this in the feedback and skip over them
			else
			{
				feedback_container.innerHTML = '<span style="color: orange;">Student is already in the course roster.</span>';
			}
		}
	} 
	else {
		console.log("in addStudentToRoster(): Course extraction regex failed.");
		feedback_container.innerHTML = '<span style="color: red;">Unable to extract course information for the course. Please contact an admin.</span>';
	}
}


// Upload a file to the New Student tab
function handleNewStudentCSVChooseFile()
{
	var fileInput = document.getElementById("new_student_csv_file_input");
	var fileNameDisplay = document.getElementById("new_student_csv_file_name");
	var uploadButton = document.getElementById("new_student_csv_upload_button");
	
	// If a valid file was selected, update the fileNameDisplay and make the "Upload" button visually active
	if (fileInput.files.length > 0)
	{ 
		fileNameDisplay.textContent = fileInput.files[0].name;
		uploadButton.style.backgroundColor = "#2A4C6B";
		uploadButton.style.cursor = "pointer";
	}
	// If no file was chosen, update the fileNameDisplay and make the "Uploadd" button visually inactive
	else
	{ 
		fileNameDisplay.textContent = "No file chosen"; 
		uploadButton.style.backgroundColor = "gray";
		uploadButton.style.cursor = "default";
	}	
}

// Upload student information to rosters database and update the feedback on the page
async function handleNewStudentCSVUpload()
{
	var fileInput = document.getElementById("new_student_csv_file_input");
	var fileItself = fileInput.files[0];
	var fileNameDisplay = document.getElementById("new_student_csv_file_name");
	var feedback = document.getElementById("new_student_csv_feedback_col");

	// If a file was uploaded (it is guaranteed to be a .txt file)
	if (fileInput.files.length > 0)
	{ 
		// Attempt to parse the file
		var parseResult = await parseNewStudentCSV(fileItself);
		console.log("parseResult: ", parseResult);
		var parseResultStatus = parseResult[0];
		var parseResultNumSuccess = parseResult[1];
		var parseResultTotalAttempted = parseResult[2];
		var parseResultInvalidLines = parseResult[3];
		
		// If parsing was successful
		if (parseResultStatus == true)
		{ feedback.innerHTML = `<span style="color: green;">Successfully uploaded ${parseResultNumSuccess}/${parseResultTotalAttempted} students to rosters.</span>`; }
		else // If parsing failed
		{
			feedback.innerHTML = `<span style="color: red;">${parseResultNumSuccess}/${parseResultTotalAttempted} students uploaded. Check file format for errors.</span>`;
			
			if (parseResultInvalidLines.length != 0)
			{
				feedback.innerHTML += `<br>Error lines in file:<br>`;
				for (const errorLine of parseResultInvalidLines)
				{ feedback.innerHTML += `<span style="color: black; font-weight: normal;">${errorLine}<br></span>`; }
			}
		}
	}
	// If no file was uploaded, provide feedback demanding file
	else
	{ feedback.innerHTML = '<span style="color: red;">Please provide a valid .txt file.</span>'; }	
}

// Parse student info file and upload to rosters. 
// Returns [status (bool), numSuccess, total] where status is t/f based on success/fail, numSuccess is the number of 
// students successfully added to courses, and total is the total number of students trying to be added to courses
async function parseNewStudentCSV(file)
{
	if (file)
	{
		return new Promise((resolve) => {
			var counterObj = { successStatus: true, lineCounter: 0, totalLines: 0, invalidLines: []};
			var reader = new FileReader();
			reader.onload = async function(event)
			{
				var fileContent = event.target.result;		// The file content in its entirety
				var lines = fileContent.trim().split("\n"); // Split file content by lines
				counterObj.totalLines = lines.length;
				
				for (const line of lines) {
					
					var studentData = line.split(",").map(item => item.trim());		// Get each element split up by commas. Trim any return characters
					
					if (studentData.length === 8)
					{
						// Store this specific student's information
						var stuId = studentData[0]; firstName = studentData[1]; var lastName = studentData[2]; var deptCode = studentData[3];
						var courseNum = studentData[4]; var section = studentData[5]; var semester = studentData[6]; var profLastName = studentData[7];
						
						// Query the "courses" table to see if a course exists that meets this information. ilike is case-insensitive comparison
						const { data: courseInfo, error: courseLookupError } = await supabasePublicClient
							.from('courses')
							.select('courseid')
							.ilike('dept', deptCode)
							.eq('coursenum', parseInt(courseNum, 10))
							.ilike('coursesec', section)
							.ilike('coursesem', semester)
							.ilike('faclastname', profLastName)
							.eq('facemail', email) // Ensures that can only add to only this professor's course
							.limit(1)
							.single();
							
						// If a valid course was not found, return false
						if (courseLookupError)
						{
							console.log("In parseNewStudentCSV: Unable to find course that a student is attempting to be inserted into the roster of.", courseLookupError);
							counterObj.successStatus = false;
							counterObj.invalidLines.push(line.trim());
						}
						// If a valid course was found, check to see if that student is already in that roster. If not, insert the student into that roster
						else
						{
							var foundCourseId = courseInfo.courseid;
							
							
							// Determine if this student is already in this roster
							const { data: checkData, error: checkError } = await supabasePublicClient
								.from('roster')
								.select('courseid')
								.eq('courseid', foundCourseId)
								.ilike('stufirstname', firstName)
								.ilike('stulastname', lastName)
								.ilike('stuid', stuId);
							
							if (checkError) // If there was an error doing the query
							{ console.log("Error checking roster for duplicate entry: ", checkError); counterObj.successStatus = false; }//return false; }//return [false, lineCounter, totalLines]}
							else if (checkData.length == 0) // If an entry was not found, meaning that the student is not yet in this course roster, then add them to the roster. Otherwise, skip this student
							{
								// Add the student to this course roster
								var rosterEntryInfo = {
									courseid: foundCourseId,
									stufirstname: firstName,
									stulastname: lastName,
									stuid: stuId
								}

								// Attempt to insert student into the roster table
								const { data: insert, error: insertError } = await supabasePublicClient
									.from('roster')
									.insert(rosterEntryInfo);
									
								// If there was an error inserting into the roster table
								if (insertError)
								{
									console.log("Error inserting student into roster table.", insertError);
									counterObj.successStatus = false;
								}
								// If student was successfully inserted into the roster table
								else
								{ console.log("Successfully inserted student into roster table: ", rosterEntryInfo) }
							}
							else
							{ console.log("checkData:", checkData); console.log("Student: ", firstName, lastName, "already in roster."); }
							counterObj.lineCounter += 1;
						}
					}
					else
					{ counterObj.successStatus = false; }
				}
				resolve([counterObj.successStatus, counterObj.lineCounter, counterObj.totalLines, counterObj.invalidLines]);
			};
			reader.readAsText(file);
		});
	}
	else
	{
		// File was unable to be read
		return [false, 0, 0, [""]];
	}
}

// Button highlights for New Student CSV "Choose file" and "Upload" - Upload only highlightable if a file has been selected
var new_student_choose_file_button = document.getElementById("new_student_csv_choose_file_button");
new_student_choose_file_button.addEventListener("mouseover", function () { new_student_choose_file_button.style.filter = "brightness(150%)"; });
new_student_choose_file_button.addEventListener("mouseout", function () { new_student_choose_file_button.style.filter = "brightness(100%)"; });

var new_student_upload_button = document.getElementById("new_student_csv_upload_button");
new_student_upload_button.addEventListener("mouseover", function ()
{ var fileInput = document.getElementById("new_student_csv_file_input");
  if (fileInput.files.length > 0) { new_student_upload_button.style.filter = "brightness(150%)"; } });
new_student_upload_button.addEventListener("mouseout", function ()
{ var fileInput = document.getElementById("new_student_csv_file_input");
  if (fileInput.files.length > 0) { new_student_upload_button.style.filter = "brightness(100%)"; } });
  
  


// Gets the values from all of the input fields & dropdown menus on the "Remove Student" tab.
// Finds the courseid of the course that matches this selected course. Then, check to see if the student
// is in that course. Then, removes the student from that course if the course exists and the student is in that course.
async function removeStudentFromRoster(event)
{
	event.preventDefault(); // Prevent page from reloading upon submission
	var feedback_container = document.getElementById('remove_student_manual_submission_feedback_container');
	console.log("In removeStudentFromRoster()");
	// Get the input HTML elements. We already have the dropdown menus from earlier in code.
	var id_input = document.getElementById('removal_id_num');
	var firstname_input = document.getElementById('removal_first_name');
	var lastname_input = document.getElementById('removal_last_name');
	
	// Get the values from the inputs/dropdowns
	var stuid = id_input.value;
	var firstname = firstname_input.value;
	var lastname = lastname_input.value;
	var department = remove_student_department_dropdown.value;
	var semester = remove_student_semester_dropdown.value;
	var course = remove_student_courses_dropdown.value;
	
	// Extract the course information from the course string. Current format: MATH 115 : 010 - Fall 2024 - Wong
	var extraction_regex = /^([A-Z]+)\s+(\d+)\s+:\s+(\d+)\s+-\s+([A-Za-z]+\s+\d{4})\s+-\s+([A-Za-z]+)$/;
	var match = course.match(extraction_regex);
	
	if (match) {
		// Extract each element of the course
		var course_dept = match[1];   // "MATH"
		var course_num = parseInt(match[2]);  // 115 (as integer)
		var course_sec = match[3];    // "010"
		var course_sem = match[4];    // "Fall 2024"
		var course_fac = match[5];    // "Wong"
		
		// Look for a course in the "courses" table that matches these specifications.
		// Extract its courseid so we can add the student to this course roster.
		const { data: returnData, error } = await supabasePublicClient
			.from('courses')
			.select('courseid')
			.eq('dept', course_dept)
			.eq('coursenum', course_num)
			.eq('coursesec', course_sec)
			.eq('coursesem', course_sem)
			.eq('faclastname', course_fac)
			.single();
			
		if (error) {
			console.error("Unable to find a course that meets the same specifications as the course that you are trying to add this new student to: ", error);
			feedback_container.innerHTML  = '<span style="color: red;">Unable to find course that you are attempting to remove student from.</span>';
		}
		else {
			// Get the courseid of the course that you are trying to add this new student into the roster of
			var courseId = returnData.courseid;
			console.log("Found course with courseid: ", courseId);
			
			// Check to see if the student is in the "roster" table under this course id
			const { data: rosterCheckData, error: rosterCheckError } = await supabasePublicClient
				.from('roster')
				.select('rosterentryid')
				.eq('courseid', courseId)
				.eq('stufirstname', firstname)
				.eq('stulastname', lastname)
				.eq('stuid', stuid)
				.single();
				
			// The student is not in this class' roster. Do not remove student
			if (rosterCheckError)
			{ console.log("In removeStudentFromRoster, this student is not in the course roster. ", rosterCheckError); 
			  feedback_container.innerHTML = '<span style="color: orange;">Student is not in the course roster.</span>';
			}
			// The student is in the course roster. Remove the student
			else
			{
				// Remove this student from the 'roster' table. Get the primary key for this student's entry in the roster table
				var rosterentryId = rosterCheckData.rosterentryid;
				
				const { error: removalError } = await supabasePublicClient
					.from('roster')
					.delete()
					.eq('rosterentryid', rosterentryId);
					
				// If there was an error removing the student from the roster
				if (removalError)
				{ console.log("In removeStudentFromRoster, error removing student from roster table. ", removalError); 
				  feedback_container.innerHTML = '<span style="color: red;">Error removing student from roster.</span>';
				}
				// Student successfully removed from roster
				else
				{
					console.log("Removed Student from roster.");
					feedback_container.innerHTML = '<span style="color: green;">Successfully removed student from roster.</span>'
				}
				
			}
		}
	} 
	else {
		console.log("in removeStudentFromRoster(): Course extraction regex failed.");
		feedback_container.innerHTML = '<span style="color: red;">Unable to extract course information. Please contact an admin.</span>';
	}
}


// ROSTER REMOVAL PAGE
// Upload a file to the Remove Student tab
function handleRemoveStudentCSVChooseFile()
{
	var fileInput = document.getElementById("remove_student_csv_file_input");
	var fileNameDisplay = document.getElementById("remove_student_csv_file_name");
	var uploadButton = document.getElementById("remove_student_csv_upload_button");
	
	// If a valid file was selected, update the fileNameDisplay and make the "Upload" button visually active
	if (fileInput.files.length > 0)
	{ 
		fileNameDisplay.textContent = fileInput.files[0].name;
		uploadButton.style.backgroundColor = "#2A4C6B";
		uploadButton.style.cursor = "pointer";
	}
	// If no file was chosen, update the fileNameDisplay and make the "Uploadd" button visually inactive
	else
	{ 
		fileNameDisplay.textContent = "No file chosen"; 
		uploadButton.style.backgroundColor = "gray";
		uploadButton.style.cursor = "default";
	}	
}

// Upload student information to rosters database and update the feedback on the page
async function handleRemoveStudentCSVUpload()
{
	var fileInput = document.getElementById("remove_student_csv_file_input");
	var fileItself = fileInput.files[0];
	var fileNameDisplay = document.getElementById("remove_student_csv_file_name");
	var feedback = document.getElementById("remove_student_csv_feedback_col");

	// If a file was uploaded (it is guaranteed to be a .txt file)
	if (fileInput.files.length > 0)
	{ 
		// Attempt to parse the file
		var parseResult = await parseRemoveStudentCSV(fileItself);
		console.log("parseResult: ", parseResult);
		var parseResultStatus = parseResult[0];
		var parseResultNumSuccess = parseResult[1];
		var parseResultTotalAttempted = parseResult[2];
		var parseResultInvalidLines = parseResult[3];
		
		// If parsing was successful
		if (parseResultStatus == true)
		{ feedback.innerHTML = `<span style="color: green;">Successfully removed ${parseResultNumSuccess}/${parseResultTotalAttempted} students from rosters.</span>`; }
		else // If parsing failed
		{
			feedback.innerHTML = `<span style="color: red;">${parseResultNumSuccess}/${parseResultTotalAttempted} students removed. Check file format for errors.</span>`;
			
			if (parseResultInvalidLines.length != 0)
			{
				feedback.innerHTML += `<br>Error lines in file:<br>`;
				for (const errorLine of parseResultInvalidLines)
				{ feedback.innerHTML += `<span style="color: black; font-weight: normal;">${errorLine}<br></span>`; }
			}
		}
	}
	// If no file was uploaded, provide feedback demanding file
	else
	{ feedback.innerHTML = '<span style="color: red;">Please provide a valid .txt file.</span>'; }	
}



// Parse student info file and remove from rosters. 
// Returns [status (bool), numSuccess, total] where status is t/f based on success/fail, numSuccess is the number of 
// students successfully removed from courses, and total is the total number of students trying to be removed from courses
async function parseRemoveStudentCSV(file)
{
	if (file)
	{
		return new Promise((resolve) => {
			var counterObj = { successStatus: true, lineCounter: 0, totalLines: 0, invalidLines: []};
			var reader = new FileReader();
			reader.onload = async function(event)
			{
				var fileContent = event.target.result;		// The file content in its entirety
				var lines = fileContent.trim().split("\n"); // Split file content by lines
				counterObj.totalLines = lines.length;
				
				for (const line of lines) {
					
					var studentData = line.split(",").map(item => item.trim());		// Get each element split up by commas. Trim any return characters
					
					if (studentData.length === 8)
					{
						// Store this specific student's information
						var stuId = studentData[0]; firstName = studentData[1]; var lastName = studentData[2]; var deptCode = studentData[3];
						var courseNum = studentData[4]; var section = studentData[5]; var semester = studentData[6]; var profLastName = studentData[7];
						
						// Query the "courses" table to see if a course exists that meets this information. ilike is case-insensitive comparison
						const { data: courseInfo, error: courseLookupError } = await supabasePublicClient
							.from('courses')
							.select('courseid')
							.ilike('dept', deptCode)
							.eq('coursenum', parseInt(courseNum, 10))
							.ilike('coursesec', section)
							.ilike('coursesem', semester)
							.ilike('faclastname', profLastName)
							.eq('facemail', email) // Ensures that can only remove from only this professor's course
							.limit(1)
							.single();
							
							
						// If a valid course was not found, return false
						if (courseLookupError)
						{
							console.log("In parseNewStudentCSV: Unable to find course that a student is attempting to be removed from the roster of.", courseLookupError);
							counterObj.successStatus = false;
							counterObj.invalidLines.push(line.trim());
						}
						// If a valid course was found, check to see if that student is already in that roster. If not, insert the student into that roster
						else
						{
							var foundCourseId = courseInfo.courseid;
							console.log("foundCourseId: ", foundCourseId);
							
							console.log("In Parse Remove: Email: ", email);
							
							// Determine if this student is already in this roster
							const { data: checkData, error: checkError } = await supabasePublicClient
								.from('roster')
								.select('rosterentryid')
								.eq('courseid', foundCourseId)
								.ilike('stufirstname', firstName)
								.ilike('stulastname', lastName)
								.ilike('stuid', stuId);
							
							if (checkError) // If there was an error doing the query
							{ console.log("Error checking roster for duplicate entry: ", checkError); counterObj.successStatus = false; }//return false; }//return [false, lineCounter, totalLines]}
							
							// If an entry was not found, meaning that the student is not in this roster, then let feedback say that student is already not in
							if (!checkError && checkData.length == 0) 
							{
								console.log("checkData:", checkData); console.log("Student: ", firstName, lastName, "is not in the roster."); 
							}
							// If the student is in the roster, then remove them from it
							else
							{ 
								// Remove the student from this course roster
								var rosterentryId = checkData[0].rosterentryid;
								console.log("checkData !: ", checkData);
								console.log("rosterentryId: ", rosterentryId);
								
								const { error: removalError } = await supabasePublicClient
									.from('roster')
									.delete()
									.eq('rosterentryid', rosterentryId);
									
								// If there was an error removing the student from the roster
								if (removalError)
								{
									console.log("Error removing student from roster (CSV)");
									counterObj.successStatus = false;
								}
								// Student successfully removed from the roster
								else
								{
									console.log("Successfully removed student from roster (CSV)");
								}
							}
							counterObj.lineCounter += 1;
						}
					}
					else
					{ counterObj.successStatus = false; }
				}
				resolve([counterObj.successStatus, counterObj.lineCounter, counterObj.totalLines, counterObj.invalidLines]);
			};
			reader.readAsText(file);
		});
	}
	else
	{
		// File was unable to be read
		return [false, 0, 0, [""]];
	}
}
