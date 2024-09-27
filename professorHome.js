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

// Tab functionality to toggle between Welcome and Classes sections
function openTab(tabName) 
{
	// Hide all tab content
	const tabContents = document.getElementsByClassName('tab-content');
	for (let i = 0; i < tabContents.length; i++) 
	{
		tabContents[i].classList.remove('active');
	}

	// Remove active class from all buttons
	const tabButtons = document.getElementsByClassName('tab-button');
	for (let i = 0; i < tabButtons.length; i++) 
	{
		tabButtons[i].classList.remove('active');
	}

	// Show the clicked tab's content
	document.getElementById(tabName).classList.add('active');

	// Add active class to the clicked tab button
	event.target.classList.add('active');
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
// Attach departments to the input datalist instead of a select dropdown
async function fetchDepartments(email) {
    console.log("In fetchDepartments, email: ", email);

    // Get the user's role and department from the "users" table
    const { data, error } = await supabasePublicClient
        .from('users')
        .select("facrank, deptcode")
        .eq('facemail', email);
    
    if (error) {
        console.error("Error fetching facrank in fetchDepartments()", error);
    } else {
        const { facrank, deptcode } = data[0]; // Store faculty rank and department
        
        const departmentDatalist = document.getElementById('departments'); // datalist instead of dropdown
        
        // If user is an Admin, populate the list with all departments
        if (facrank === "Admin") {
            const { data, error } = await supabasePublicClient
                .from('departments')
                .select("deptcode");
            
            if (!error) {
                data.forEach(dept => {
                    const deptOption = document.createElement("option");
                    deptOption.value = dept.deptcode;
                    departmentDatalist.appendChild(deptOption);
                });
            }
        } else { // For non-admin, show only the user's department
            const deptOption = document.createElement("option");
            deptOption.value = deptcode;
            departmentDatalist.appendChild(deptOption);
            
            // Auto-select the department for non-admins
            document.getElementById('dept_code').value = deptcode;
        }
    }
}

// Clear button functionality
document.getElementById('clear_dept_button').addEventListener('click', function() {
    const deptInput = document.getElementById('dept_code');
    deptInput.value = ""; // Clear the input
    deptInput.focus(); // Bring focus back to the input
    this.style.display = 'none'; // Hide the button
});

// Show the clear button when there's input
document.getElementById('dept_code').addEventListener('input', function() {
    const clearButton = document.getElementById('clear_dept_button');
    if (this.value) {
        clearButton.style.display = 'inline-block';
    } else {
        clearButton.style.display = 'none';
    }
});


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
