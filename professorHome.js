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
document.addEventListener('DOMContentLoaded', function() 
{
	// Get the dropdown menus (for semester and courses)
	const semester_dropdown = document.getElementById('semester_dropdown');
    const courses_dropdown = document.getElementById('courses_dropdown');
	const department_dropdown = document.getElementById('department_dropdown');
	
	// Initialize the page (get professor info, get prof courses, fill in dropdown menus, etc)
	initializePage();
	
});

// =====================================================
// Zaynin Sept 26 2024 (START)
// Fetch user data when page loads
//email = fetchProfessorData();
//renderCourses(email); // Render courses

// Function that initializes the page - fetches user data (and waits for it to finish),
// and then fetches/renders courses.
async function initializePage()
{
	email = await fetchProfessorData();		// Get professor information and store email
	//renderCourses(email);					// Query & render professor's courses
	
	await fetchDepartments(email);			// Populate the departments dropdown menu with the valid departments that the prof/chair/admin is able to see
	
	await fetchSemesters(email);			// Populate the semesters drop-down menu with the valid semesters of the professor's courses
	professor_courses = await fetchCourses(email);	// Populate the courses drop-down menu with the valid professor courses. Store prof courses
	
	// IMPORTANT NOTE: "professor_courses" can actually represent the courses that a professor, chair, or admin sees.
	// I'm just too deep into this to change the variable name.
	
	attachDepartmentDropdownListener(professor_courses);// Now that the professor information is loaded, attach the event listener to its drop down menu. Must wait for prev async funcs to finish.
	attachSemesterDropdownListener(professor_courses); // Now that the semesters information is loaded, attach the event listener to its dropdown menu. Must wait for the previous async functions to finish.
	attachCoursesDropdownListener();	// Now that the courses information is loaded, attach the event listener to its dropdown menu. Must wait for previous async functions to finish.
	
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
async function fetchCourses(email)
{
	// Determine whether this faculty is an Admin or a Prof/Chair
	// Get faculty role and dept by querying "users" table
	const { data, error } = await supabasePublicClient
		.from('users')
		.select("facrank, deptcode")
		.eq('facemail', email);
	
	if (error)
	{ console.error("Error fetching facrank in fetchDepartments()", error); }
	else
	{
		const { facrank, deptcode } = data[0]; // Store the faculty rank and dept of that faculty.
		                                       // Variables MUST be named the same as in database for some reason
			
		// If the faculty is an Admin
		if (facrank == "Admin") //CORRECT, commented out for testing
		//if (facrank == "Professor") // WRONG, used for testing
		{
			const { data, error } = await supabasePublicClient
			.from("courses")
			.select("coursecode, coursename, coursesem, facemail, coursesec, days, start, finish, building, room, coursenum, faclastname")
			.order('coursecode', { ascending: true }) // Order by course code ascending
			.order('coursenum', { ascending: true }) // Order by course number ascending
			.order('coursesec', { ascending: false }) // Order by course section ascending
			.order('coursesem', { ascending: true }) // Order by course semester ascending
			.order('faclastname', { ascending: true }); // Order by faclastname ascending
			
			//print("ADMIN COURSES: ", data);
			
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
				courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`

				// Add the course entry into the courses dropdown menu
				//courses_dropdown = document.getElementById("courses_dropdown"); // Get the courses dropdown menu
				newOption = document.createElement("option"); // Create a new option for the dropdown menu
				newOption.value = courseEntry;
				newOption.text = courseEntry;
				courses_dropdown.appendChild(newOption);
			
			});
			
			return data; // Return the courses that this admin has. To be used when updating the courses displayed by selecting a semester
		}
			
		
		else
		{
			// Chairs/Professors can see only their own courses
			// Select all of the courses (and all of their fields) from this professor
			const { data, error } = await supabasePublicClient
			.from("courses")
			.select("coursecode, coursename, coursesem, facemail, coursesec, days, start, finish, building, room, coursenum, faclastname")
			.eq('facemail', email); // Only get this professor's courses
			
			//print("PROFESSOR COURSES: ", data);
			
			// For each course that this professor teaches, add it to the courses dropdown menu
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
				courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`

				// Add the course entry into the courses dropdown menu
				//courses_dropdown = document.getElementById("courses_dropdown"); // Get the courses dropdown menu
				newOption = document.createElement("option"); // Create a new option for the dropdown menu
				newOption.value = courseEntry;
				newOption.text = courseEntry;
				courses_dropdown.appendChild(newOption);
			
			});
			
			return data; // Return the courses that this professor has. To be used when updating the courses displayed by selecting a semester
		}
											   
	}
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
function updateCoursesDropdown(professor_courses)
{
	// Get the courses dropdown menu, will update its options
	const courses_dropdown = document.getElementById('courses_dropdown');
	
	// GET THE CURRENT SELECTED DEPT
	const department_dropdown = document.getElementById('department_dropdown');
	const selectedDept = department_dropdown.value;
	console.log("In updateCoursesDropdown, current_selected_dept: ", selectedDept);
	
	// GET THE CURRENT SELECTED SEMESTER
	const semester_dropdown = document.getElementById('semester_dropdown');
	const selectedSemester = semester_dropdown.value;
	console.log("In updateCoursesDropdown, current_selected_semester: ", selectedSemester);
	
	// Remove all options from the courses dropdown menu (except for the blank "none" option
	let valueToKeep = "none"; // The value of the option you want to keep

	for (let i = courses_dropdown.options.length - 1; i >= 0; i--) 
	{
	  if (courses_dropdown.options[i].value !== valueToKeep) 
	  {
		courses_dropdown.remove(i);
	  }
	}
	
	// If the "none" semester option was chosen (the blank option), then show ALL courses regardless of semester
	if (selectedSemester == "any")
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
			courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`;
			
			// Only add the course entry into the dropdown menu if it is in the selected department
			if (coursecode == selectedDept || selectedDept == "any")
			{
				// Add the course entry into the courses dropdown menu
				//courses_dropdown = document.getElementById("courses_dropdown"); // Get the courses dropdown menu
				newOption = document.createElement("option"); // Create a new option for the dropdown menu
				newOption.value = courseEntry;
				newOption.text = courseEntry;
				courses_dropdown.appendChild(newOption);
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
			courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`;
			
			// Only add this course to the dropdown menu if it is in the selected semester and department
			if (coursesem == selectedSemester && (coursecode == selectedDept || selectedDept == "any"))
			{
				// Add the course entry into the courses dropdown menu
				//courses_dropdown = document.getElementById("courses_dropdown"); // Get the courses dropdown menu
				newOption = document.createElement("option"); // Create a new option for the dropdown menu
				newOption.value = courseEntry;
				newOption.text = courseEntry;
				courses_dropdown.appendChild(newOption);	
			}	
		});
	}
}

// Zaynin 09/26/2024
// Event Listener for the Courses Dropdown Menu - will handle selections
// Function to attach the event listener
// This must be done in a function, called in itializePage(). This will continue
// to listen to changes in selection in the courses dropdown menu.
function attachCoursesDropdownListener() 
{
	//console.log("Professor Courses in ATTACH: ", professor_courses)
    const courses_dropdown = document.getElementById('courses_dropdown');
    courses_dropdown.addEventListener('change', function() 
	{
        const selectedCourse = courses_dropdown.value;

		console.log("Courses Dropdown Menu Selection Updated. Selected: ", selectedCourse);
		
    });
    console.log("Event listener successfully attached to courses_dropdown.");
}



// Zaynin 09/26/2024
// Event Listener for the Courses Dropdown Menu - will handle selections
// Function to attach the event listener
// This must be done in a function, called in itializePage(). This will continue
// to listen to changes in selection in the courses dropdown menu.
function attachDepartmentDropdownListener(professor_courses) 
{
	//console.log("Professor Courses in ATTACH: ", professor_courses)
    const department_dropdown = document.getElementById('department_dropdown');
    department_dropdown.addEventListener('change', function() 
	{
        const selectedDepartment = department_dropdown.value;

		console.log("Department Dropdown Menu Selection Updated. Selected: ", selectedDepartment);
		
		// UPDATE THE COURSES TABLE TO ONLY SHOW COURSES IN THIS DEPARTMENT
		updateCoursesDropdown(professor_courses);
		
    });
    console.log("Event listener successfully attached to department_dropdown.");
}


// Zaynin 09/26/2024
// Queries the supabase "users" table to find what the user's role is. If admin, query the "departments" table and
// make every department an option. If any other role (prof/chair), query the "users" table, find the faculty's dept,
// and then only display that dept as an option. In this last case, remove the "Any" option, since the prof/chair only
// is part of one department. This will make it auto-select their department, which is convenient.
async function fetchDepartments(email)
{
	console.log("In fetchDepartments, email: ", email);
	// Get this faculty's role and dept by querying the "users" table
	const { data, error } = await supabasePublicClient
		.from('users')
		.select("facrank, deptcode")
		.eq('facemail', email);
	
	if (error)
	{ console.error("Error fetching facrank in fetchDepartments()", error); }
	else
	{
		const { facrank, deptcode } = data[0]; // Store the faculty rank and dept of that faculty.
		                                       // Variables MUST be named the same as in database for some reason
											   
		// If the facrank is ADMIN
		if (facrank == "Admin") // CORRECT
		//if (facrank == "Professor") //WRONG, REMOVE, using for testing
		{
			// Query the "departments" table and make every single department an option in department_dropdown
			const { data, error } = await supabasePublicClient
				.from('departments')
				.select("deptcode");
				
				data.forEach(dept =>
				{
					deptName = dept.deptcode;
					deptOption = document.createElement("option");
					deptOption.value = deptName;
					deptOption.text = deptName;
					department_dropdown.appendChild(deptOption);
				});
		}
		// If the facrank is NOT an admin
		else
		{
			// Add factdept as the only option to the dropdown menu. Remove the "Any" option as well
			department_dropdown.remove(0);	// Remove the "any" option
			deptOption = document.createElement("option"); // Create the dept option for the dropdown menu
			deptOption.value = deptcode;
			deptOption.text = deptcode;
			department_dropdown.appendChild(deptOption);	// Add it to the dropdown menu
		
		}
	}
}


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
var home_button = document.getElementById("home_button");
var classes_button = document.getElementById("classes_button");
var help_button = document.getElementById("help_button");
var account_button = document.getElementById("account_button");
var notification_button = document.getElementById("notification_button");
var log_out_button = document.querySelector(".log-out-button");

var currentTab = "welcomeTab"; // Default current tab

function resetButtonColors() {
    welcome_button.style.filter = "brightness(100%)";
    classes_button.style.filter = "brightness(100%)";
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
