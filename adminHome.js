// Declare the variables that will store the dropdown menus. These are for all of the dropdown menus on each tab of the page.
// These must be declared outside of the DOMContentLoaded so that they are global, however, must be initialized inside of DOMContentLoaded.
// Otherwise, this will not work, just trust me.
var semester_dropdown, new_student_semester_dropdown, courses_dropdown, new_student_courses_dropdown, department_dropdown, create_account_department_dropdown, new_student_department_dropdown;
var dept_dropdown_menus, courses_dropdown_menus, semesters_dropdown_menus;


// "MAIN()" - DOMContentLoaded - this stuff happens first in the program and is very important.
// 1. Immediately check the auth, 2. store the dropdown menus, 3. initialize the page
document.addEventListener('DOMContentLoaded', function() 
{
  checkAuth();
  getDropdownMenus();
  initializePage();
  
});

document.addEventListener('DOMContentLoaded', function() {
    const faqButtons = document.querySelectorAll('.question button');

    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            const icon = button.querySelector('.d-arrow');

            answer.classList.toggle('show'); // Toggle visibility
            icon.classList.toggle('rotate'); // Toggle icon rotation
        });
    });
});


// Function to check if the user is logged in
async function checkAuth() 
{
	// Call to get the current session
	const { data: { session }, error } = await supabasePublicClient.auth.getSession();
  
	// Check if there's an error getting the session (optional)
	if (error) 
	{ console.error('Error getting session:', error.message); return; }
  
	console.log("IN CHECKAUTH: ")
  
	// If no session exists, redirect to the login page
	if (!session) 
	{ window.location.href = 'index.html'; } // Redirect to login
	else 
	{ console.log('User is authenticated:', session.user); } // User is authenticated, log the user info and proceed
}



  // Sets the values for all dropdown menus across all tabs on this page. These variables are already declared globally.
  function getDropdownMenus()
  {
	  // Get the dropdown menus for each tab. Any future added dropdown menu must be added here
	  semester_dropdown = document.getElementById('semester_dropdown');
	  new_student_semester_dropdown = document.getElementById('new_student_semester_dropdown');
	  courses_dropdown = document.getElementById('courses_dropdown');
      new_student_courses_dropdown = document.getElementById('new_student_courses_dropdown');
	  department_dropdown = document.getElementById('department_dropdown');
	  create_account_department_dropdown = document.getElementById('create_department_dropdown');
	  new_student_department_dropdown = document.getElementById('new_student_department_dropdown');
	  
	  // Create a list containing every dropdown menu for each tab. Any future added dropdown menu must be added to a list
	  dept_dropdown_menus = [department_dropdown, create_account_department_dropdown, new_student_department_dropdown];
	  courses_dropdown_menus = [courses_dropdown, new_student_courses_dropdown];
	  semesters_dropdown_menus = [semester_dropdown, new_student_semester_dropdown];
  }  



  // Initializes the page - fetches user data (and waits for it to finish), and then fetches/renders courses.
  async function initializePage()
  {
	  // Get professor information and store their email
	  email = await fetchProfessorData();
	  console.log("Email: ", email);
	  
	  await fetchDepartments(email);			// Populate the departments dropdown menu with the valid departments that the prof/chair/admin is able to see
	  await fetchSemesters(email);				// Populate the semesters drop-down menu with the valid semesters of the professor's courses
	  
	  professor_courses = await fetchCourses(email);	// Populate the courses drop-down menu with the valid professor courses. Store prof courses
	  attachDepartmentDropdownListener(professor_courses);// Attach various dropdown menus to their update event listeners.
	  attachSemesterDropdownListener(professor_courses); // Attach various semester dropdown menus to their update event listeners.
	  attachCoursesDropdownListener();	// Attach various courses dropdown menus to their update event listeners
	  await populateDepartmentsDropdown();
  }
  
  
  // ===================================================
  // ===================================================
  // ===================================================
  // ===================================================
  
//Mark addition 10/1/24
document.getElementById('create_account').addEventListener('keydown', function(event) { //Can press enter to sign in
	  if (event.key === 'Enter') {
		  createUser(); // Call the createUser function
	  }
});
  
  // Clicking on MADZ logo will go to home page
  var madzLogoButton = document.getElementById("madz_logo");
  madzLogoButton.addEventListener("click", function() {
	  window.location.href = "inAdminAccount.html";
  });
  
	function showWelcomeTab() {
	  // Hide all tab contents
	  var tabContents = document.querySelectorAll('.tab-content');
	  tabContents.forEach(function(tabContent) {
		tabContent.style.display = 'none';
	  });
	
	  // Always default to the home tab
	  document.getElementById('welcomeTab').style.display = 'block';
	
	  window.history.pushState({}, '', '?tab=welcomeTab');
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
	  console.log("GETTING TO FETCH PROFESSOR DATA");
	  
	  const { data: user, error: authError } = await supabasePublicClient.auth.getUser();
		console.log("USER: ", user);
		
	  if (authError) 
	  {
			console.error("AUTH ERROR ", authError);
			document.getElementById('welcomeMessage').innerText = 'Error fetching user details';
			return;
	  }
  
	  const email = user?.user?.email;
	  console.log("Email found: " + email);
  
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
  
  
  
  async function populateDepartmentsDropdown() {
	  try {
		  // Fetch all departments from the 'departments' table (assuming the table has 'id', 'name', and 'code' columns)
		  const { data: departments, error: departmentError } = await supabasePublicClient
			  .from('departments')
			  .select('deptcode, deptname');  // Assuming 'code' is the department code
  
		  if (departmentError) {
			  console.error('Error fetching departments:', departmentError);
			  return;
		  }

		  // Clear existing options
		  department_dropdown.innerHTML = '<option value="any">Any</option>';
		  create_account_department_dropdown.innerHTML = '<option value="any">Any</option>';
		  new_student_department_dropdown.innerHTML = '<option value="any">Any</option>';
  
		  // For every department dropdown menu
		  dept_dropdown_menus.forEach(dropdown_menu => {
			  // Append each department as an option
			  departments.forEach(department => {
				  const option = document.createElement('option');
				  option.value = department.deptcode;
				  //option.textContent = `${department.deptcode} - ${department.deptname}`; // Show department code and name as the label
				  option.textContent = `${department.deptcode}`;							// Show just the department code
				  
				  dropdown_menu.appendChild(option);
				  
			  });  
		  });
  
		  console.log('Departments dropdown populated with all departments.');
		  
	  } catch (error) {
		  console.error('Error populating departments dropdown:', error);
	  }
  }
  
  
  
  var create_account_button = document.getElementById("create_account_button");
  
  async function createUser() {
	  try {
		  const facemail = document.getElementById('facemail').value;
		  const password = document.getElementById('password').value;
		  const faclastname = document.getElementById('faclastname').value;  // Get the last name input
		  const facrank = document.getElementById('facrank').value; 
	  const deptcode = document.getElementById('create_department_dropdown').value;
		  
		  
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
					  faclastname: faclastname,
			  deptcode: deptcode
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
  
  
  
 
  
  
		  // Log out functionality
		  async function logOut() {
			  const { error } = await supabasePublicClient.auth.signOut();
			  if (!error) {
				  window.location.href = "index.html"; // Redirect to login page
			  }
		  }
  
		  // Fetch user data when page loads
		  fetchProfessorData();
  
  
  
  
  
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
  
  
  
  // Zaynin 09/26/2024
  // Queries the supabase "courses" table and retrieves each unique semester that this professor
  // has a course in. It will then populate the semester_dropdown dropdown menu with all of these
  // semesters as options. It is expected that the professor will choose a semester and then when
  // going to choose a specific course, only courses that they have from that semester will be options.
  // INPUT: email - the professor's email, necessary to determine this specific professor's courses/semesters.
  async function fetchSemesters(email)
  {
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
			  
		  // Query the database for every unique semester in "courses". Admins can see all semesters
		  const { data, error } = await supabasePublicClient
			  .from('courses')
			  .select('coursesem')
			  
		  if (error)
		  {
			  console.error('Error fetching unique coursesem:', error);
		  }
		  else
		  {
			  // Get the unique semesters in an array
			  uniqueSemesters = Array.from(new Set(data.map(item => item.coursesem)));
			  
			  // For every semester dropdown menu (on each tab)
			  semesters_dropdown_menus.forEach(dropdown_menu => {
			  
				  // Add each unique semester to the dropdown menu
				  uniqueSemesters.forEach(unique_semester =>
				  {
					  newOption = document.createElement("option");
					  newOption.value = unique_semester;
					  newOption.text = unique_semester;
					  dropdown_menu.appendChild(newOption);
					  console.log("Added option:", newOption.value);
				  });
			  });
		  }
	  }
  }
  
  
  
  // Zaynin 09/26/2024
  // Event Listener for the Semester Dropdown Menu - will handle selections
  // Function to attach the event listener to the semester dropdown menu
  // This must be done in a function, called in itializePage(). This will continue
  // to listen to changes in selection in the semesters dropdown menu. It will call
  // updateCoursesDropdown() to display the courses for the selected semester.
  function attachSemesterDropdownListener(professor_courses) 
  {

	  // If the "Classes" tab's Semester dropdown selection is changed, update the "Classes" tab's Courses dropdown options
	  semester_dropdown.addEventListener('change', function() 
	  {
		  const selectedDept = department_dropdown.value;
		  const selectedSemester = semester_dropdown.value;
		  updateCoursesDropdown(professor_courses, courses_dropdown, selectedDept, selectedSemester);
		  
	  });
	  
	  // If the "New Student" tab's Semester dropdown selection is changed, update the "New Student" tab's Courses dropdown options
	  new_student_semester_dropdown.addEventListener('change', function()
	  {
		  const selectedDept = new_student_department_dropdown.value;
		  const selectedSemester = new_student_semester_dropdown.value;
		  updateCoursesDropdown(professor_courses, new_student_courses_dropdown, selectedDept, selectedSemester);
	  });
	  
  }
  
  
  // Zaynin 09/26/2024
  // Called by the semester dropdown event listener to change the courses based on the selected
  // semester.
  
  // function updateCoursesDropdown(professor_courses)
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
  
  // Zaynin 09/26/2024
  // Event Listener for the Courses Dropdown Menu - will handle selections
  // Function to attach the event listener
  // This must be done in a function, called in itializePage(). This will continue
  // to listen to changes in selection in the courses dropdown menu.
  function attachCoursesDropdownListener() 
  {
	  // "Classes" Tab course dropdown
	  courses_dropdown.addEventListener('change', function() 
	  {
		  const selectedCourse = courses_dropdown.value;
		  console.log("Courses Dropdown Menu Selection Updated. Selected: ", selectedCourse);
		  // Do whatever you want with this selected course
		  
	  });
	  
	  // "New Student" Tab course dropdown
	  new_student_courses_dropdown.addEventListener('change', function ()
	  {
		 const selectedCourse = new_student_courses_dropdown.value; 
		 console.log("New Student Courses Dropdown Menu Selection Updated. Selected: ", selectedCourse);
		 // Do whatever you want with this selected course
	  });
	  

  }
  
  
  
  // Zaynin 09/26/2024
  // Event Listener for the Courses Dropdown Menu - will handle selections
  // Function to attach the event listener
  // This must be done in a function, called in itializePage(). This will continue
  // to listen to changes in selection in the courses dropdown menu.
  function attachDepartmentDropdownListener(professor_courses) 
  {
	  department_dropdown.addEventListener('change', function() 
	  {
		  // Update the courses table to only show courses in this department
		  const selectedDept = department_dropdown.value;
		  const selectedSemester = semester_dropdown.value;
		  updateCoursesDropdown(professor_courses, courses_dropdown, selectedDept, selectedSemester);
		  
	  });
	  
	  new_student_department_dropdown.addEventListener('change', function()
	  {
		  console.log("Selecting new student department");
		  // Update the new student courses table to only show courses in this department
		  const selectedDept = new_student_department_dropdown.value;
		  const selectedSemester = "any";
		  updateCoursesDropdown(professor_courses, new_student_courses_dropdown, selectedDept, selectedSemester);
	  });
  }
  
  
  // Zaynin 09/26/2024
  // Queries the supabase "users" table to find what the user's role is. If admin, query the "departments" table and
  // make every department an option. If any other role (prof/chair), query the "users" table, find the faculty's dept,
  // and then only display that dept as an option. In this last case, remove the "Any" option, since the prof/chair only
  // is part of one department. This will make it auto-select their department, which is convenient.
  async function fetchDepartments(email)
  {
	  console.log("In fetchDepartments, email: ", email);
	  //var department_dropdown = document.getElementById('department_dropdown');
	  // Get this faculty's role and dept by querying the "users" table
	  const { data: deptData, error } = await supabasePublicClient
		  .from('users')
		  .select("facrank, deptcode")
		  .eq('facemail', email);
	  
	  if (error)
	  { console.error("Error fetching facrank in fetchDepartments()", error); }
	  else
	  {
		  const { facrank, deptcode } = deptData[0]; // Store the faculty rank and dept of that faculty.
												 // Variables MUST be named the same as in database for some reason
											  

		  // Query the "departments" table and make every single department an option in department_dropdown. Admins can see all departments
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
  }
  

// Gets the values from all of the input fields & dropdown menus on the "New Student" tab.
// Finds the courseid of the course that matches this selected course. Then, inserts the student
// into that course if the course exists.
async function addStudentToRoster()
{
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
		}
		else {
			// Get the courseid of the course that you are trying to add this new student into the roster of
			var courseId = returnData.courseid;
			console.log("Found course with courseid: ", courseId);
			
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
			}
			else {
				console.log("Successfully insert student into roster table.");
			}
		}
	} 
	else {
		console.log("in addStudentToRoster(): Course extraction regex failed.");
	}
}


// Upload a file to the New Student tab
function handleNewStudentCSVChooseFile()
{
	var fileInput = document.getElementById("new_student_csv_file_input");
	var fileNameDisplay = document.getElementById("new_student_csv_file_name");
	
	if (fileInput.files.length > 0)
	{ fileNameDisplay.textContent = fileInput.files[0].name; }
	else
	{ fileNameDisplay.textContent = "No file chosen"; }	
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
							.limit(1)
							.single();
							
						// If a valid course was not found, return false
						if (courseLookupError)
						{
							console.error("In parseNewStudentCSV: Unable to find course that a student is attempting to be inserted into the roster of.", courseLookupError);
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
							{ console.error("Error checking roster for duplicate entry: ", checkError); counterObj.successStatus = false; }//return false; }//return [false, lineCounter, totalLines]}
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
									console.error("Error inserting student into roster table.", insertError);
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


 
// Buttons highlighting logic
var pageButtons = {
	"welcome_button_ADMIN"			: "welcome",
	"classes_button_ADMIN"			: "classes",
	"add_student_button"			: "add",
	"create_account_button_ADMIN"	: "create",
	"help_button_ADMIN"				: "help",
	"account_button_ADMIN"			: "account",
	"notification_button_ADMIN"		: "notification",
	"log_out_button_ADMIN"			: "log_out"
};
var currentTab = "welcome";
document.getElementById("welcome_button_ADMIN").style.filter = "brightness(150%)";

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
