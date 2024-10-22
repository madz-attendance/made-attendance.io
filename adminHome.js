// Declare the variables that will store the dropdown menus. These are for all of the dropdown menus on each tab of the page.
// These must be declared outside of the DOMContentLoaded so that they are global, however, must be initialized inside of DOMContentLoaded.
// Otherwise, this will not work, just trust me.
var semester_dropdown, courses_dropdown, new_student_courses_dropdown, department_dropdown, create_account_department_dropdown, new_student_department_dropdown;
var dept_dropdown_menus, courses_dropdown_menus, semesters_dropdown_menus;


// "MAIN()" - DOMContentLoaded - this stuff happens first in the program and is very important.
// 1. Immediately check the auth, 2. store the dropdown menus, 3. initialize the page
document.addEventListener('DOMContentLoaded', function() 
{
  checkAuth();
  getDropdownMenus();
  initializePage();
  
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



  // Sets the values for all dropdown menus across all tabs on this page. These variables are already declared globally. Must be done this way.
  function getDropdownMenus()
  {
	  // Get the dropdown menus for each tab. Any future added dropdown menu must be added here
	  semester_dropdown = document.getElementById('semester_dropdown');
	  courses_dropdown = document.getElementById('courses_dropdown');
      new_student_courses_dropdown = document.getElementById('new_student_courses_dropdown');
	  department_dropdown = document.getElementById('department_dropdown');
	  create_account_department_dropdown = document.getElementById('create_department_dropdown');
	  new_student_department_dropdown = document.getElementById('new_student_department_dropdown');
	  
	  // Create a list containing every dropdown menu for each tab. Any future added dropdown menu must be added to a list
	  dept_dropdown_menus = [department_dropdown, create_account_department_dropdown, new_student_department_dropdown];
	  courses_dropdown_menus = [courses_dropdown, new_student_courses_dropdown];
	  semesters_dropdown_menus = [semester_dropdown];
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
	  //console.log("Professor Courses in ATTACH: ", professor_courses)
	  //const semester_dropdown = document.getElementById('semester_dropdown');
	  semester_dropdown.addEventListener('change', function() 
	  {
		  const selectedDept = department_Dropdown.value;
		  const selectedSemester = semester_dropdown.value;
  
		  updateCoursesDropdown(professor_courses, courses_dropdown, selectedDept, selectedSemester);
		  
	  });
	  console.log("Event listener successfully attached to semester_dropdown.");
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
			  //courseEntry = `${coursecode} ${coursenum} - ${coursesec} : ${coursename} - ${coursesem} - ${faclastname}`;
			  courseEntry = `${coursecode} ${coursenum} : ${coursesec} - ${coursesem} - ${faclastname}`;
			  
			  // Only add the course entry into the dropdown menu if it is in the selected department
			  if (coursecode == selectedDept || selectedDept == "any")
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
  
  
  // Zaynin Sept 26 2024 (END)
  // =====================================================
  
  
  // Styling for tabbing added by Anthony: 
  // Buttons for welcome, classes, create account, account, notifications, and log out
  var welcome_button = document.getElementById("welcome_button_ADMIN");
  var classes_button = document.getElementById("classes_button_ADMIN");
  var add_student_button =document.getElementById("add_student_button");
  var create_account_button = document.getElementById("create_account_button_ADMIN");
  var help_button = document.getElementById("help_button_ADMIN");
  var account_button = document.getElementById("account_button_ADMIN");
  var notification_button = document.getElementById("notification_button_ADMIN");
  var log_out_button = document.getElementById("log_out_button_ADMIN");
  
  var currentTab = "welcomeTab"; // Default current tab
  
  function resetButtonColors() {
	  welcome_button.style.filter = "brightness(100%)";
	  classes_button.style.filter = "brightness(100%)";
	  add_student_button.style.filter = "brightness(100%)";
	  help_button.style.filter = "brightness(100%)";
	  create_account_button.style.filter = "brightness(100%)";
	  account_button.style.filter = "brightness(100%)";
	  notification_button.style.filter = "brightness(100%)";
	  log_out_button.style.filter = "brightness(100%)";
  }
  
  welcome_button.style.filter = "brightness(150%)";
  
  // Welcome tab logic
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

		  //window.location.reload();
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
  

  //New student tab logic
  add_student_button.addEventListener("click", function() {
	  resetButtonColors();
	  if (currentTab != "newStudent") {
		  currentTab = "newStudent";
		  add_student_button.style.filter = "brightness(150%)";

		  //window.location.reload();
	  }
  });
  

  add_student_button.addEventListener("mouseover", function() {
	  if (currentTab != "classesTab") {
		  add_student_button.style.filter = "brightness(150%)";
	  }
  });
  add_student_button.addEventListener("mouseout", function() {
	  if (currentTab != "classesTab") {
		  add_student_button.style.filter = "brightness(100%)";
	  }
  });
  document.getElementById("student_creation_form").addEventListener("submit", function(event) {
    event.preventDefault();
    // Your form submission logic
});


  
  // Create Account tab logic
  create_account_button.addEventListener("click", function() {
	  resetButtonColors();
	  if (currentTab != "create_account") {
		  currentTab = "create_account";
		  create_account_button.style.filter = "brightness(150%)";
	  }
  });
  create_account_button.addEventListener("mouseover", function() {
	  if (currentTab != "create_account") {
		  create_account_button.style.filter = "brightness(150%)";
	  }
  });
  create_account_button.addEventListener("mouseout", function() {
	  if (currentTab != "create_account") {
		  create_account_button.style.filter = "brightness(100%)";
	  }
  });
  
  // Account tab logic
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
  
  
  // Account tab logic
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
