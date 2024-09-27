import tkinter as tk
from tkinter import Label, Button, Frame, PhotoImage, OptionMenu, Menu, Scrollbar, Listbox, Entry
from tkinter import ttk
import defs
import logging
import threading
import time
import sys
#from PIL import Image, ImageTk
import os
from supabase import create_client, Client
from datetime import datetime
import database_functions

# Connect to Supabase
url = "https://agldqgjpcqqmqynizbcs.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbGRxZ2pwY3FxbXF5bml6YmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDA5OTgsImV4cCI6MjA0MDUxNjk5OH0.qIUhU-16YQzrIY_SnRxWDG3l5RzKj9s8ns3XaoQAEFo"
supabase: Client = create_client(url, key)


global current_swipe_name
current_swipe_name = "Default Name"

# Valid page numbers: "start", "1", "2"
def updatePageNumber(newPageNumber):
    pageNumber = newPageNumber
    print("Page: ", pageNumber)

    
# Determines whether or not to allow the card reader sequence to run. Initialize to false
global cardReaderSequenceRunning
cardReaderSequenceRunning = "false"

global cardReaderSequenceMode
cardReaderSequenceMode = "none"

global currentCourse
currentCourse = "Select Course"

global currentDept
currentDept = "Select Department"

# Updates cardReaderSequenceRunning. Can only pass in "false" or "true" as strings.
def updateCardReaderSequenceRunning(statusValue):
    global cardReaderSequenceRunning
    cardReaderSequenceRunning = statusValue
    print("Updated cardReaderSequenceRunning to be: ", cardReaderSequenceRunning)

def updateCardReaderSequenceMode(mode):
    global cardReaderSequenceMode
    cardReaderSequenceMode = mode
    print("Updated cardReaderSequenceMode to be: ", cardReaderSequenceMode)

def updateCurrentSwipeName(new_firstname, new_lastname):
    global current_swipe_name
    current_swipe_name = new_firstname + " " + new_lastname
    
    

# Tkinter is a single-threaded program when running the GUI. If you try and run code (while loop) while also
# updating the GUI, this crashes and freezes because it is trying to do two things simultaneously in the same thread.
# Must make the cardReadLoop its own thread so that both can run at the same time.
class CardReaderThread(threading.Thread):
    def __init__(self, controller):
        threading.Thread.__init__(self)
        self.controller = controller
        
    def run(self):
        # This method is called when thread is started
        cardReadLoop(self.controller)
    
#scanner.py: A file used in conjunction with defs.py. This file takes in a card swipe and determines what to do depending on the input.
#               This file calls upon functions in defs.py for cleanliness sake.
#David J. Johnson
#3/22/2024 || 3/23/2024
def cardReadLoop(controller):
    print("Beginning Card Read Loop Sequence")
    
    global cardReaderSequenceRunning # reference the global variable
    print(f"cardReaderSequenceRunning: {cardReaderSequenceRunning}")
    
    global cardReaderSequenceMode # reference the global variable
    print(f"cardReaderSequenceMode: {cardReaderSequenceMode}")
    
    global currentCourse # reference the global variable
    print(f"currentCourse: {currentCourse}")
    
    global current_swipe_name # reference current swipe name
    
    def handle_input(event=None):

        # Check if card reader sequence is running
        if cardReaderSequenceRunning == "false":
            input_entry.grid_remove() # Remove from screen
            controller.show_frame(PageOne) # Go to page one
            return # Stop handling input if sequence is not running
            
        initialInput = input_entry.get().strip()
        if initialInput.startswith('%B'): # User swipes and swipe is valid
            idNum, lastName, firstName = database_functions.parseSwipe(initialInput) # Parses input and returns information about student
            
            # Get the courseid of the currently selected course (course_selec.get())
            #curr_course_full_info_string = course_selection.get() # Ex: "CPSC 135 - 010 - Fall 2024 - ProfFirst ProfLast"
            curr_course_full_info_string = currentCourse # Ex: "CPSC 135 - 010 - Fall 2024 - ProfFirst ProfLast"
            coursecode, coursenum, coursesec, coursesem, faclastname = database_functions.parseCourseInfo(curr_course_full_info_string) # Return info about course
            
            # Query the database for the course (hopefully just one) that corresponds to the selected course in drop-down menu
            courseQuery = (
                supabase.table("courses")
                .select("courseid")
                .eq("coursecode", coursecode)
                .eq("coursenum", coursenum)
                .eq("coursesec", coursesec)
                .eq("coursesem", coursesem)
                .eq("faclastname", faclastname)
                .execute()
            )
            courseQueryList = courseQuery.data
            
            # Store the courseid for the current course
            courseid = courseQueryList[0]["courseid"]
            print(f"Course id: {courseid}")
            
            # Attendance Mode - You are taking attendance on students that are already in the course roster
            if (cardReaderSequenceMode == "attendance"):
                # Determine if this student is in the course by checking the "roster" table
                enrollmentStatusQuery = (
                    supabase.table("roster")
                    .select("stufirstname, stulastname")
                    .eq("courseid", courseid)
                    .eq("stuid", idNum)
                    .execute()
                )
                enrollmentStatusQueryList = enrollmentStatusQuery.data # Convert query response to a Python list
                
                # If the Python List is empty (nothing was returned from the query)
                if not enrollmentStatusQueryList:
                    # Student is not in the course, flash the yellow "Not Recognized" icon
                    print(f"\n Name {firstName} {lastName} with ID {idNum} is not in this class. Please try again.\n")
                    if (cardReaderSequenceRunning == "true"):
                        controller.show_frame(PageSix)
                        controller.after(1500, lambda: controller.show_frame(PageTwo))
                    
                else:
                    # Student is in the course, flash the green icon
                    print(f"\n Welcome Back {firstName} {lastName} with ID {idNum}\n")
                    if (cardReaderSequenceRunning == "true"):
                        controller.show_frame(PageFour)
                        controller.after(1500, lambda: controller.show_frame(PageTwo))
                        
                    # Mark attendance in database
                    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S") # Get the current date and time
                    response = ( 
                        supabase.table("attendance")
                        .insert({"courseid": courseid, "stufirstname": firstName, "stulastname": lastName, "stuid": idNum, "attendancetime": current_time})
                        .execute()
                    )
            
            
            # Enroll Mode - You are enrolling students into the course for the first time, when they are not yet in the roster
            elif (cardReaderSequenceMode == "enrollment"):
                # Query the database to determine if the student (idNum) is already in this course
                # Query the "roster" table to determine if there is an entry with courseid == courseid && stuid == idNum
                rosterQuery = (
                    supabase.table("roster")
                    .select("stufirstname, stulastname")
                    .eq("courseid", courseid)
                    .eq("stuid", idNum)
                    .execute()
                )
                rosterQueryList = rosterQuery.data
                print("rosterQueryList: ")
                print(rosterQueryList)
                
                # If the student is not in the roster
                if len(rosterQueryList) <= 0:
                    # Flash Enrollment Icon
                    print(f"Enrolling {firstName} {lastName} with ID {idNum} into course with courseid: {courseid}")
                    if (cardReaderSequenceRunning == "true"):
                        controller.show_frame(PageSeven)
                        controller.after(1500, lambda: controller.show_frame(PageTwo))

                    # Add the student to the roster
                    response2 = (
                        supabase.table("roster")
                        .insert({"courseid": courseid, "stufirstname": firstName, "stulastname": lastName, "stuid": idNum})
                        .execute()
                    )
                    
                    # Mark attendance in database - Convenient because this will mark a student's attendance for when they enroll. This means that the professor won't
                    # have to have two swiping sessions - one for enrolling and one for marking attendance.
                    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S") # Get the current date and time
                    response3 = ( 
                        supabase.table("attendance")
                        .insert({"courseid": courseid, "stufirstname": firstName, "stulastname": lastName, "stuid": idNum, "attendancetime": current_time})
                        .execute()
                    )
                    
                else:
                    # Student is already in the roster for this course
                    print(f"Student {firstName} {lastName} with ID {idNum} is already in roster for courseid: {courseid}")
                    # Flash 'Already Enrolled' Page
                    if (cardReaderSequenceRunning == "true"):
                        controller.show_frame(PageEight)
                        controller.after(1500, lambda: controller.show_frame(PageTwo))
                    
        # HERE
        elif(initialInput.lower() == "quit"): #user entered 'quit'
            conn.close() #close connection to 'attendance.db'
            #break
        
        else: #bad card swipe. No usable data
            print("ID Swipe error. Please try again\n")
            
            if (cardReaderSequenceRunning == "true"):
                controller.show_frame(PageFive)
                controller.after(1500, lambda: controller.show_frame(PageTwo))
                
        # Clear the input entry after processing
        input_entry.delete(0, tk.END)

    
    # Create a tkinter Entry widget for input
    input_entry = tk.Entry(controller)
    input_entry.grid(row=0,column=0, pady=(365, 0), sticky='e')
    input_entry.configure(bg='#ffffff', fg='#ffffff', insertbackground='#ffffff', bd=0, highlightthickness=0, relief='flat')
    
    # Bind the Return key (Enter key) to the handle_input function
    #input_entry.bind('<Return>', handle_input)
    input_entry.bind('<Return>', handle_input)
    input_entry.bind('<KP_Enter>', handle_input)
    
    # Focus on the input entry to start receiving input
    input_entry.focus_set()
    






class SampleApp(tk.Tk):
    def __init__(self):
        tk.Tk.__init__(self)

        self.title("MADZ Attendance Interface")
        self.attributes("-fullscreen", True)  # Start in fullscreen mode
        self.configure(bg='white') # Set window background to white

        # Container to hold different pages
        self.container = tk.Frame(self)
        self.container.grid(row=0, column=0, sticky="nsew")

        self.frames = {}  # Dictionary to store different frames/pages

        # Create and add pages to the dictionary
        for F in (StartPage, PageOne, PageTwo, PageThree, PageFour, PageFive, PageSix, PageSeven, PageEight):
            frame = F(self.container, self)
            self.frames[F] = frame
            frame.grid(row=0, column=0, sticky="nsew")

        # Show the initial page
        #self.show_frame(StartPage)
        self.show_frame(PageOne)
        
        # Bind Escape key to exit fullscreen
        self.bind("<Escape>", self.exit_fullscreen)

        # Track fullscreen state
        self.fullscreen_state = True

    def show_frame(self, cont):
        # Raise the specified frame to the top
        frame = self.frames[cont]
        frame.tkraise()

    def toggle_fullscreen(self, event=None):
        self.fullscreen_state = not self.fullscreen_state  # Toggle fullscreen state
        self.attributes("-fullscreen", self.fullscreen_state)

    def exit_fullscreen(self, event=None):
        if self.fullscreen_state:
            self.fullscreen_state = False
            self.attributes("-fullscreen", False)


# Define each page as a separate class
class StartPage(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')

        label = tk.Label(self, text="Start Page")
        label.grid(row=0, column=0, pady=10, padx=10)

        button1 = tk.Button(self, text="Go to Page One", command=lambda: (controller.show_frame(PageOne), updatePageNumber("1"), updateCardReaderSequenceRunning("false")))
        button1.grid(row=1, column=0)

        button2 = tk.Button(self, text="Go to Page Two", command=lambda: (controller.show_frame(PageTwo), updatePageNumber("2"), updateCardReaderSequenceRunning("true")))
        button2.grid(row=2, column=0)

class PageOne(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')

        global currentCourse # reference the global variable
        currentCourse = "Select Course" # Set the global variable to the selected course
        print(f"currentCourse updated to: {currentCourse}")

        # Function for determining if the begin attendance button (defined at the bottom of PageOne) is able to be clicked
        def determine_if_begin_attendance(controller, dept_selec, course_selec):
            # print("Begin Attendance Button Clicked. Current selections:")
            # print("Dept selection: ", dept_selection.get())
            # print("Course selection: ", course_selection.get())
            if dept_selec.get() != "Select Department" and course_selec.get() != "Select Course":
                controller.show_frame(PageTwo)
                updateCardReaderSequenceMode("attendance")
                updateCardReaderSequenceRunning("true")
                #cardReadLoop()
                thread = CardReaderThread(controller)
                thread.start()
            else:
                print("Department and/or course not selected")
                
        def determine_if_enroll_students(controller, dept_selec, course_selec):
            if dept_selec.get() != "Select Department" and course_selec.get() != "Select Course":
                controller.show_frame(PageTwo)
                updateCardReaderSequenceMode("enrollment")
                updateCardReaderSequenceRunning("true")
                thread = CardReaderThread(controller)
                thread.start()
            else:
                print("Department and/or course not selected")
                


        # CSC355 September 5 2024
        # Course options dropdown
        course_options = ['Select Course']
        dept_options = ['Select Department']

        # ===========================================================
        # "BEGIN ATTENDANCE" button
        # This button is at the bottom of the page but must be initialized before everything else
        # since its color/visibility status is constantly updated depending on whether a department and course are selected.
        begin_attendance_button = tk.Button(self, activebackground="#2A4C6B", activeforeground="#DDDDDD", text="Begin Attendance", command=lambda: determine_if_begin_attendance(controller, dept_selection, course_selection))
        begin_attendance_button.configure(font=('Corbel', 12, 'bold'), bg="#2A4C6B", fg="#FFFFFF")
        begin_attendance_button.grid(row=4, column=0, pady=40, padx=(0, 160)) # Comment out to Do not initially put button on grid. Dept/course selection will determine its visibility status
        begin_attendance_button.config(state='disabled', bg="#DDDDDD")       # Begin the button in a disabled state
        
        def determine_begin_attendance_button_visibility_status(dept_selec, course_selec):
            # If the department and course are both selected
            if (dept_selec.get() != "Select Department" and course_selec.get() != "Select Course"):
                # Make the "Begin Attendance" button activated
                begin_attendance_button.config(state='normal', bg="#2A4C6B")     # Re-enable button (button is able to be clicked) and make background blue
            else:
                # Otherwise, if department and course are not both selected, deactivate the begin_attendance_button
                begin_attendance_button.config(state='disabled', bg="#DDDDDD")  # Disable button (not able to be clicked) and turn its background gray
                
        # ===========================================================
        # ===========================================================
        # CSC355 Sept 9
        # "ENROLL STUDENTS" button
        enroll_students_button = tk.Button(self, activebackground="#2A4C6B", activeforeground="#DDDDDD", text="   Enroll Students   ", command=lambda: determine_if_enroll_students(controller, dept_selection, course_selection))
        enroll_students_button.configure(font=('Corbel', 12, 'bold'), bg="#2A4C6B", fg="#FFFFFF")
        enroll_students_button.grid(row=4, column=0, pady=40, padx=(165, 0))
        enroll_students_button.config(state='disabled', bg="#DDDDDD") # Begin the button in a disabled state
        
        def determine_enroll_students_button_visibility_status(dept_selec, course_selec):
            # If the department and course are both selected
            if (dept_selec.get() != "Select Department" and course_selec.get() != "Select Course"):
                # Make the "Enroll Students" button activated
                enroll_students_button.config(state='normal', bg="#2A4C6B") # Re-enable button (button is able to be clicked) and make background blue
            else:
                # Otherwise, if department and course are not both selected, deactivate the enroll_students_button
                enroll_students_button.config(state='disabled', bg="#DDDDDD") # Disable button (not able to be clicked) and turn its background gray
        
        #===========================================================

        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar.grid(row=0, column=0, columnspan=2, sticky="ew")

        #label = tk.Label(self, text="Page One")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================


        # =======================================================
        # Temporary X-Button on main page to exit program (without keyboard)
        temporary_x_button = tk.Button(self, text="X", command=lambda: (sys.exit(), updateCardReaderSequenceRunning("false")))
        temporary_x_button.grid(row=1, column=0, sticky='w', pady=0)
        temporary_x_button.configure(relief=tk.FLAT, highlightthickness=0, bg='#ffffff', fg='#ffffff')
        # ====================================================== 
        
        # =======================================================
        # Go back to start page button
        #button = tk.Button(self, text="Go back to Start Page", command=lambda: controller.show_frame(StartPage))
        #button.grid(row=2, column=0, pady=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image = PhotoImage(file="./madz_attendance.png")#PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image = self.original_image.subsample(1, 1) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label = Label(self, image=self.resized_image, bd=0, highlightthickness=0)
        image_label.grid(row=1, column=0, padx=10, pady=35)

        # ==========================================================

        # MADZ Logo using Pillow (PIL) Library
        #self.original_image = Image.open("./madz_attendance.png") # Load the image using Pillow
        

        # ==========================================================
        # "Select Department" text
        # select_department_text_label = tk.Label(self, text="Select Department", bg='white', font=('Corbel', 18, 'bold'), fg='#2A4C6B')
        # select_department_text_label.grid(row=2,column=0,pady=10)
        # ==========================================================


        # Initialize the dept_selection and course_selection variables. Set their default values to "Select Department" and "Course Selection"
        dept_selection = tk.StringVar()
        course_selection = tk.StringVar()
        
        dept_selection.set("Select Department")
        course_selection.set("Select Course")


        # ===========================================================
        # DEPARTMENT Combobox Dropdown scroll menu
        # Create list of items for the Combobox
        #dept_options = ["Select Department", "(CPSC) Computer Science", "(POLI) Political Science", "(MATH) Mathematics", "(BIOL) Biology", "(CHEM) Chemistry", "(ARTH) Art History", "Test7", "Test8", "Test9", "Test10", "Test11", "Test12", "Test13", "Test14", "Test15", "Test16", "Test17", "Test18", "Test19", "Test20", "Test21", "Test22", "Test23"]

        # -----------
        # Query the database "departments" table for all departments.
        # Order alphabetically by deptcode
        queried_depts = (
            supabase.table("departments")
            .select("deptcode, deptname")
            .order("deptcode", desc=False)
            .execute()
        )
        # Convert the query response into a Python List
        list_of_depts = queried_depts.data
        
        # For every dept in list_of_depts, add it as an option in dept_options.
        # DEPT Combobox Dropdown scroll menu. Format: (<deptcode>) <deptname>
        for dept in list_of_depts:
            # Extract all the values from this particular department
            deptcode = dept['deptcode']
            deptname = dept['deptname']
            
            # Special case: for CPSC (Computer Science & Information Technology), that is super long,
            # will look weird in box and I don't want the box to be massive to fit it. Rename deptname
            # to Computer Science & IT
            if deptcode == 'CPSC':
                deptname = 'Computer Science & IT'
            
            # Format the entry that will go into dept_options
            dept_list_entry = (f"({deptcode}) {deptname}")
            dept_options.append(dept_list_entry)
        
        # Update the dept_combobox with the new options. This can be done before dept_combobox is defined in the code
        # because this is an on_select scope that is not reached until after the dept_combobox is created.
        #dept_combobox.config(values=dept_options)
        # -----------

        # Selected department option stored in variable
        #dept_selection = tk.StringVar()


        # Create a Combobox widget
        # height = amount of elements to be displayed in dropdown before scrolling occurs
        dept_combobox = ttk.Combobox(self, values=dept_options, height=10, textvariable=dept_selection, justify='center')

       # Set default option to "Select a Department"
        dept_combobox.current(0)

        # Put combobox in right spot in grid
        dept_combobox.grid(row=2, column=0, pady=10)

        # Configure styles for combobox
        dept_combobox.config(font=('Calibri', 12, 'bold'), foreground="#2A4C6B", width=35)

        # Define on_select. Updates the dept_selection variable when selecting from dropdown
        def on_select(event):
            dept_selection.set(dept_combobox.get())
            print("- Selected Department: ", dept_selection.get())

            # Set the cursor position to the end of text (prevent text auto-selection)
            dept_combobox.selection_range(len(dept_combobox.get()), len(dept_combobox.get()))

            # Set the cursor to focus on the MADZ logo, so that the cursor is not inside of
            # the selected dept option, and the blinking cursor is not there since you can
            # type in that box. The MADZ logo is used as a dummy object to set the cursor to focus to.
            image_label.focus_set()
            
            # Update the "Begin Attendance" button's visibility status
            determine_begin_attendance_button_visibility_status(dept_selection, course_selection)
            # Update the "Enroll Students" button's visibility status
            determine_enroll_students_button_visibility_status(dept_selection, course_selection)
            
 
            # <
            # CSC355 September 5 2024 - 9 pm
            # If the CPSC dept is selected
            #if dept_selection.get() == "(CPSC) Computer Science":
            if dept_selection.get() == "(CPSC) Computer Science & IT":

                # Query the database "courses" table for all courses in the selected department.
                # Chooses only courses in the selected semester. Add in another drop-down menu later for semester selection.
                # Orders the courses by increasing course number and sec number, so that we can add it to the list of course options later in order
                queried_courses = (
                    supabase.table("courses")
                    .select("coursecode, coursenum, coursesec, coursename, coursesem, faclastname")
                    .eq("dept", "CPSC")
                    .eq("coursesem", "Fall 2024")
                    .order("coursenum", desc=False)
                    .order("coursesec", desc=False)
                    .execute()
                )

                #print(type(queried_courses))
                #print(queried_courses)
                
                # Convert the query response (queried_courses) into a Python list, formatted like [{x, y, z,}, {x, y, z}]
                list_of_courses = queried_courses.data
                #print(type(list_of_courses))
                #print(list_of_courses)
                
                # Empty out / reset course_options
                course_options.clear()
                
                # For every course in list_of_courses, add it as an option in course_options for the 
                # COURSE Combobox Dropdown scroll menu. Format: <course code> - <section> - <semester> - <facname>
                for course in list_of_courses:
                    # Extract all the values from this particular course
                    coursecode = course['coursecode']
                    coursenum = course['coursenum']
                    coursesec = course['coursesec']
                    coursesem = course['coursesem']
                    #facname = course['facname']
                    #facfirstname = course['facfirstname']
                    faclastname = course['faclastname']
                    
                    # Format the entry that will go into course_options and then add it to course_options
                    course_list_entry = (f"{coursecode} {coursenum} - {coursesec} - {coursesem} - {faclastname}")
                    course_options.append(course_list_entry)
                
                # Update the course_combobox with the new options. This can be done before course_combobox is defined in the code
                # because this on_select scope is not reached until after the course_comobox is created.
                course_combobox.config(values=course_options)
                
            elif dept_selection.get() == "(MATH) Mathematics":
                course_options.clear()
                course_options.append("math")
                course_combobox.config(values=course_options)
            else:
                course_options.clear()
                course_options.append("Select Course")
                course_combobox.config(values=course_options)
                
            # >
             
             
        # Bind a <<ComboboxSelected>> event to the Combobox (keeps updating dept_selection I believe)
        dept_combobox.bind("<<ComboboxSelected>>", on_select)
        # ===========================================================

        # ===========================================================
        # COURSE Combobox Dropdown scroll menu
        # Create list of items for the Combobox
        # (when the database is implemented and this program can read data from the database, display relevant courses for the selected department)
        #course_options = ["Select Course", "CPSC 135 - 010", "CPSC 135 - 020", "CPSC 136 - 010", "CPSC 136 - 020", "CPSC 235 - 010", "CPSC 235 - 020", "CPSC 237 - 010", "CPSC 237 - 020", "CPSC 354 - 010", "CPSC 402 - 010", "Test7", "Test8", "Test9", "Test10", "Test11", "Test12", "Test13", "Test14", "Test15", "Test16", "Test17", "Test18", "Test19", "Test20", "Test21", "Test22", "Test23"]


        # Selected course option stored in variable
        #course_selection = tk.StringVar()


        # Create a Combobox widget
        # height = amount of elements to be displayed in dropdown before scrolling occurs
        course_combobox = ttk.Combobox(self, values=course_options, height=10, textvariable=course_selection, justify='center')

       # Set default option to "Select Course"
        course_combobox.current(0)
        course_selection.set(course_combobox.get())

        # Put combobox in right spot in grid
        course_combobox.grid(row=3, column=0, pady=40)

        # Configure styles for combobox
        course_combobox.config(font=('Calibri', 12, 'bold'), foreground="#2A4C6B", width=35)

        # Define on_select. Updates the dept_selection variable when selecting from dropdown
        def course_on_select(event):
            course_selection.set(course_combobox.get())
            print("- Selected course: ", course_selection.get())
            
            global currentCourse # reference the global variable
            currentCourse = course_selection.get() # Set the global variable to the selected course
            print(f"currentCourse updated to: {currentCourse}")

            # Set the cursor position to the end of text (prevent text auto-selection)
            course_combobox.selection_range(len(course_combobox.get()), len(course_combobox.get()))

            # Set the cursor to focus on the MADZ logo, so that the cursor is not inside of
            # the selected dept option, and the blinking cursor is not there since you can
            # type in that box. The MADZ logo is used as a dummy object to set the cursor to focus to.
            image_label.focus_set()
            
            # Update the "Begin Attendance" button's visibility status
            determine_begin_attendance_button_visibility_status(dept_selection, course_selection)
            # Update the "Enroll Students" button's visibility status
            determine_enroll_students_button_visibility_status(dept_selection, course_selection)

        # Bind a <<ComboboxSelected>> event to the Combobox (keeps updating dept_selection I believe)
        course_combobox.bind("<<ComboboxSelected>>", course_on_select)
        # ===========================================================










        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)


class PageTwo(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')

        
        # ============================================
        # Original Code from template
        #label = tk.Label(self, text="Page Two")
        #label.grid(row=0, column=0, pady=10, padx=10)

        #button = tk.Button(self, text="Go back to Start Page", command=lambda: controller.show_frame(StartPage))
        #button.grid(row=1, column=0)
        # ============================================
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p2 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p2.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p2 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p2 = self.original_image_p2.subsample(2, 2) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p2 = Label(self, image=self.resized_image_p2, bd=0, highlightthickness=0)
        image_label_p2.grid(row=1, column=0, padx=10, pady=0, sticky = 'n')

        # ==========================================================
        
        
        # ==========================================================
        # WHITE / CHECKMARK / XMARK Image
        # Three images of the same size will be cycled through to display whether or not the user's card reader swipe was a success (checkmark), a failure (xmark), or display not needed (white).
        #self.responsive_image = PhotoImage(file="./check_mark_150x150.png")
        #self.responsive_image = PhotoImage(file="./smiley_face_150x150.png")
        #self.responsive_image = PhotoImage(file="./x_mark_150x150.png")
        self.responsive_image = PhotoImage(file="./student_id_v1_150x150.png")
        
        # Resize image using subsample if needed
        
        # Create a label widget to display the image
        responsive_image_label = Label(self, image=self.responsive_image, bd=0, highlightthickness=0)
        responsive_image_label.grid(row=2, column=0, padx=0, pady=(0, 50))
        
        
        # ==========================================================
        # Text label displaying either "Swipe your card," "Please try again", OR the swiped card user's name after they successfully swipe.
        # - Will start out default as "Swipe your card", if a user swipes and it is success, will change to that person's name for ~0.5 seconds, then back to "Swipe your card"
        # - If user swipes and fails, will switch to "Please try again" for ~0.5 seconds, then back to "Swipe your card"
        responsive_text = tk.Label(self, text="Swipe your ID", bg='white', font=('Corbel', 24, 'bold'), fg='#2A4C6B')
        responsive_text.grid(row=3,column=0,pady=0)
        # ==========================================================



        # =======================================================
        # Go back to Dept/Course Selection page (PageOne) button
        back_to_pg1_button = tk.Button(self, relief=tk.FLAT, borderwidth=0, highlightthickness=0, activebackground="#FFFFFF", activeforeground = "#2A4C6B", text="‹", command=lambda: (controller.show_frame(PageThree), updateCardReaderSequenceRunning("false")))
        back_to_pg1_button.configure(font=('Corbel', 32, 'bold'), bg="#FFFFFF", fg="#2A4C6B")   
        back_to_pg1_button.grid(row=4, column=0, padx = 0, pady=0, sticky='w') # pady4 original 40
        # =======================================================
        
        
        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)
        
        



class PageThree(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p3 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p3.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p3 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p3 = self.original_image_p3.subsample(1, 1) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p3 = Label(self, image=self.resized_image_p3, bd=0, highlightthickness=0)
        image_label_p3.grid(row=1, column=0, padx=10, pady=35, sticky = 'n')

        # ==========================================================
        
        # ==========================================================
        # Text display of "ENDING ATTENDANCE" page.
        #ending_text = tk.Label(self, text="Do you want to end attendance?", bg='white', font=('Corbel', 20, 'bold'), fg='#2A4C6B')
        #ending_text.grid(row=2,column=0,pady=40)
        # ==========================================================
        
        
        # ==========================================================
        # Text informing the user to swipe and ID in order to end attendance
        informative_text = tk.Label(self, text="Swipe your ID to end attendance", bg='white', font=('Corbel', 20, 'bold'), fg='#2A4C6B')
        informative_text.grid(row=3,column=0,pady=40)
        # ==========================================================
        
        # ==========================================================
        # Button to cancel ending attendance. Will resume attendance
        resume_attendance_button = tk.Button(self, activebackground="#2A4C6B", activeforeground="#DDDDDD", text="Resume Attendance", command=lambda: (updateCardReaderSequenceRunning("true"), controller.show_frame(PageTwo)))
        resume_attendance_button.configure(font=('Corbel', 12, 'bold'), bg="#2A4C6B", fg="#FFFFFF")
        resume_attendance_button.grid(row=4, column=0, pady=40) # Comment out to Do not initially put button on grid. Dept/course selection will determi


        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)
        
        
        
        
        
# Page showing Attendance Success for a small period of time
class PageFour(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')
        
        global current_swipe_name # get a reference to the current swipe name. This will be displayed in the responsive_text_p4
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p4 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p4.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p4 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p4 = self.original_image_p4.subsample(2, 2) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p4 = Label(self, image=self.resized_image_p4, bd=0, highlightthickness=0)
        image_label_p4.grid(row=1, column=0, padx=10, pady=0, sticky = 'n')

        # ==========================================================
        
        
        # ==========================================================
        # WHITE / CHECKMARK / XMARK Image
        # Three images of the same size will be cycled through to display whether or not the user's card reader swipe was a success (checkmark), a failure (xmark), or display not needed (white).
        self.responsive_image_p4 = PhotoImage(file="./check_mark_150x150.png")
        #self.responsive_image_p4 = PhotoImage(file="./smiley_face_150x150.png")
        #self.responsive_image_p4 = PhotoImage(file="./x_mark_150x150.png")
        
        # Resize image using subsample if needed
        
        # Create a label widget to display the image
        responsive_image_label_p4 = Label(self, image=self.responsive_image_p4, bd=0, highlightthickness=0)
        responsive_image_label_p4.grid(row=2, column=0, padx=0, pady=(0, 50))
        
        
        # ==========================================================
        # Text label displaying either "Swipe your card," "Please try again", OR the swiped card user's name after they successfully swipe.
        # - Will start out default as "Swipe your card", if a user swipes and it is success, will change to that person's name for ~0.5 seconds, then back to "Swipe your card"
        # - If user swipes and fails, will switch to "Please try again" for ~0.5 seconds, then back to "Swipe your card"

        responsive_text_p4 = tk.Label(self, text="Attendance Taken", bg='white', font=('Corbel', 24, 'bold'), fg='#2A4C6B')
        responsive_text_p4.grid(row=3,column=0,pady=0)
        # ==========================================================



        # =======================================================
        # Go back to Dept/Course Selection page (PageOne) button - NO LONGER EXISTS ON THIS PAGE, BUT KEPT HERE FOR PADDING. PRESSING DOES NOTHING, AND APPEARS INVISIBLE
        back_to_pg1_button_p4 = tk.Button(self, relief=tk.FLAT, borderwidth=0, highlightthickness=0, activebackground="#FFFFFF", activeforeground = "#2A4C6B", text="") #command=lambda: (controller.show_frame(PageThree), updateCardReaderSequenceRunning("false")))
        back_to_pg1_button_p4.configure(font=('Corbel', 32, 'bold'), bg="#FFFFFF", fg="#2A4C6B")   
        back_to_pg1_button_p4.grid(row=4, column=0, padx = 0, pady=0, sticky='w') # pady4 original 40
        # =======================================================
        
        
        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)
               

# Page showing Attendance Failure for a small period of time
class PageFive(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')
        
        global current_swipe_name # get a reference to the current swipe name. This will be displayed in the responsive_text_p4
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p5 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p5.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p5 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p5 = self.original_image_p5.subsample(2, 2) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p5 = Label(self, image=self.resized_image_p5, bd=0, highlightthickness=0)
        image_label_p5.grid(row=1, column=0, padx=10, pady=0, sticky = 'n')

        # ==========================================================
        
        
        # ==========================================================
        # WHITE / CHECKMARK / XMARK Image
        # Three images of the same size will be cycled through to display whether or not the user's card reader swipe was a success (checkmark), a failure (xmark), or display not needed (white).
        #self.responsive_image_p5 = PhotoImage(file="./check_mark_150x150.png")
        #self.responsive_image_p5 = PhotoImage(file="./smiley_face_150x150.png")
        self.responsive_image_p5 = PhotoImage(file="./x_mark_150x150.png")
        
        # Resize image using subsample if needed
        
        # Create a label widget to display the image
        responsive_image_label_p5 = Label(self, image=self.responsive_image_p5, bd=0, highlightthickness=0)
        responsive_image_label_p5.grid(row=2, column=0, padx=0, pady=(0, 50))
        
        
        # ==========================================================
        # Text label displaying either "Swipe your card," "Please try again", OR the swiped card user's name after they successfully swipe.
        # - Will start out default as "Swipe your card", if a user swipes and it is success, will change to that person's name for ~0.5 seconds, then back to "Swipe your card"
        # - If user swipes and fails, will switch to "Please try again" for ~0.5 seconds, then back to "Swipe your card"

        responsive_text_p5 = tk.Label(self, text="Please Try Again", bg='white', font=('Corbel', 24, 'bold'), fg='#2A4C6B')
        responsive_text_p5.grid(row=3,column=0,pady=0)
        # ==========================================================



        # =======================================================
        # Go back to Dept/Course Selection page (PageOne) button - NO LONGER EXISTS ON THIS PAGE, BUT KEPT HERE FOR PADDING. PRESSING DOES NOTHING, AND APPEARS INVISIBLE
        back_to_pg1_button_p5 = tk.Button(self, relief=tk.FLAT, borderwidth=0, highlightthickness=0, activebackground="#FFFFFF", activeforeground = "#2A4C6B", text="") #command=lambda: (controller.show_frame(PageThree), updateCardReaderSequenceRunning("false")))
        back_to_pg1_button_p5.configure(font=('Corbel', 32, 'bold'), bg="#FFFFFF", fg="#2A4C6B")   
        back_to_pg1_button_p5.grid(row=4, column=0, padx = 0, pady=0, sticky='w') # pady4 original 40
        # =======================================================
        
        
        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)      
        
        
        
# Page showing Attendance Failure - Student not in class for a small period of time
class PageSix(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')
        
        global current_swipe_name # get a reference to the current swipe name. This will be displayed in the responsive_text_p4
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p6 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p6.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p6 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p6 = self.original_image_p6.subsample(2, 2) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p6 = Label(self, image=self.resized_image_p6, bd=0, highlightthickness=0)
        image_label_p6.grid(row=1, column=0, padx=10, pady=0, sticky = 'n')

        # ==========================================================
        
        
        # ==========================================================
        # WHITE / CHECKMARK / XMARK Image
        # Three images of the same size will be cycled through to display whether or not the user's card reader swipe was a success (checkmark), a failure (xmark), or display not needed (white).
        #self.responsive_image_p6 = PhotoImage(file="./check_mark_150x150.png")
        #self.responsive_image_p6 = PhotoImage(file="./smiley_face_150x150.png")
        #self.responsive_image_p6 = PhotoImage(file="./x_mark_150x150.png")
        self.responsive_image_p6 = PhotoImage(file="./exclamation_mark_150x150.png")
        
        # Resize image using subsample if needed
        
        # Create a label widget to display the image
        responsive_image_label_p6 = Label(self, image=self.responsive_image_p6, bd=0, highlightthickness=0)
        responsive_image_label_p6.grid(row=2, column=0, padx=0, pady=(0, 50))
        
        
        # ==========================================================
        # Text label displaying either "Swipe your card," "Please try again", OR the swiped card user's name after they successfully swipe.
        # - Will start out default as "Swipe your card", if a user swipes and it is success, will change to that person's name for ~0.5 seconds, then back to "Swipe your card"
        # - If user swipes and fails, will switch to "Please try again" for ~0.5 seconds, then back to "Swipe your card"

        responsive_text_p6 = tk.Label(self, text="Student Not Recognized", bg='white', font=('Corbel', 24, 'bold'), fg='#2A4C6B')
        responsive_text_p6.grid(row=3,column=0,pady=0)
        # ==========================================================



        # =======================================================
        # Go back to Dept/Course Selection page (PageOne) button - NO LONGER EXISTS ON THIS PAGE, BUT KEPT HERE FOR PADDING. PRESSING DOES NOTHING, AND APPEARS INVISIBLE
        back_to_pg1_button_p6 = tk.Button(self, relief=tk.FLAT, borderwidth=0, highlightthickness=0, activebackground="#FFFFFF", activeforeground = "#2A4C6B", text="") #command=lambda: (controller.show_frame(PageThree), updateCardReaderSequenceRunning("false")))
        back_to_pg1_button_p6.configure(font=('Corbel', 32, 'bold'), bg="#FFFFFF", fg="#2A4C6B")   
        back_to_pg1_button_p6.grid(row=4, column=0, padx = 0, pady=0, sticky='w') # pady4 original 40
        # =======================================================
        
        
        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)      
        
        
        
# Page showing Enrolled Into Class - When a student first enrolls into a class
class PageSeven(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')
        
        global current_swipe_name # get a reference to the current swipe name. This will be displayed in the responsive_text_p4
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p7 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p7.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p7 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p7 = self.original_image_p7.subsample(2, 2) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p7 = Label(self, image=self.resized_image_p7, bd=0, highlightthickness=0)
        image_label_p7.grid(row=1, column=0, padx=10, pady=0, sticky = 'n')

        # ==========================================================
        
        
        # ==========================================================
        # WHITE / CHECKMARK / XMARK Image
        # Three images of the same size will be cycled through to display whether or not the user's card reader swipe was a success (checkmark), a failure (xmark), or display not needed (white).
        #self.responsive_image_p6 = PhotoImage(file="./check_mark_150x150.png")
        #self.responsive_image_p6 = PhotoImage(file="./smiley_face_150x150.png")
        #self.responsive_image_p6 = PhotoImage(file="./x_mark_150x150.png")
        self.responsive_image_p7 = PhotoImage(file="./enrolled_mark_150x150.png")
        
        # Resize image using subsample if needed
        
        # Create a label widget to display the image
        responsive_image_label_p7 = Label(self, image=self.responsive_image_p7, bd=0, highlightthickness=0)
        responsive_image_label_p7.grid(row=2, column=0, padx=0, pady=(0, 50))
        
        
        # ==========================================================
        # Text label displaying either "Swipe your card," "Please try again", OR the swiped card user's name after they successfully swipe.
        # - Will start out default as "Swipe your card", if a user swipes and it is success, will change to that person's name for ~0.5 seconds, then back to "Swipe your card"
        # - If user swipes and fails, will switch to "Please try again" for ~0.5 seconds, then back to "Swipe your card"

        responsive_text_p7 = tk.Label(self, text="Enrolled Into Course", bg='white', font=('Corbel', 24, 'bold'), fg='#2A4C6B')
        responsive_text_p7.grid(row=3,column=0,pady=0)
        # ==========================================================



        # =======================================================
        # Go back to Dept/Course Selection page (PageOne) button - NO LONGER EXISTS ON THIS PAGE, BUT KEPT HERE FOR PADDING. PRESSING DOES NOTHING, AND APPEARS INVISIBLE
        back_to_pg1_button_p7 = tk.Button(self, relief=tk.FLAT, borderwidth=0, highlightthickness=0, activebackground="#FFFFFF", activeforeground = "#2A4C6B", text="") #command=lambda: (controller.show_frame(PageThree), updateCardReaderSequenceRunning("false")))
        back_to_pg1_button_p7.configure(font=('Corbel', 32, 'bold'), bg="#FFFFFF", fg="#2A4C6B")   
        back_to_pg1_button_p7.grid(row=4, column=0, padx = 0, pady=0, sticky='w') # pady4 original 40
        # =======================================================
        
        
        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)    
        

# Page showing Already Enrolled Into Course - When a student is already enrolled into a course
class PageEight(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent, bg='white')
        
        global current_swipe_name # get a reference to the current swipe name. This will be displayed in the responsive_text_p4
        
        # =======================================================
        # Blue horizontal bar across top of screen
        # the width=800 defines the width of the screen, as this is the longest object in the window. pi is 800px.
        top_bar_p8 = tk.Frame(self, height=25, width=800, bg='#2A4C6B')
        top_bar_p8.grid(row=0, column=0, columnspan=2, pady=0, sticky="ew")

        #label = tk.Label(self, text="Page Two")
        #label.grid(row=1, column=0, pady=20, padx=10)
        # =======================================================

        # =======================================================
        # MADZ Logo
        self.original_image_p8 = PhotoImage(file="./madz_attendance.png")

        # Resize the image using subsample
        self.resized_image_p8 = self.original_image_p8.subsample(2, 2) # Divides width and height by this number

        # Create a label widget to display the resized image
        image_label_p8 = Label(self, image=self.resized_image_p8, bd=0, highlightthickness=0)
        image_label_p8.grid(row=1, column=0, padx=10, pady=0, sticky = 'n')

        # ==========================================================
        
        
        # ==========================================================
        # WHITE / CHECKMARK / XMARK Image
        # Three images of the same size will be cycled through to display whether or not the user's card reader swipe was a success (checkmark), a failure (xmark), or display not needed (white).
        #self.responsive_image_p6 = PhotoImage(file="./check_mark_150x150.png")
        #self.responsive_image_p6 = PhotoImage(file="./smiley_face_150x150.png")
        #self.responsive_image_p6 = PhotoImage(file="./x_mark_150x150.png")
        self.responsive_image_p8 = PhotoImage(file="./enrolled_already_mark_150x150.png")
        
        # Resize image using subsample if needed
        
        # Create a label widget to display the image
        responsive_image_label_p8 = Label(self, image=self.responsive_image_p8, bd=0, highlightthickness=0)
        responsive_image_label_p8.grid(row=2, column=0, padx=0, pady=(0, 50))
        
        
        # ==========================================================
        # Text label displaying either "Swipe your card," "Please try again", OR the swiped card user's name after they successfully swipe.
        # - Will start out default as "Swipe your card", if a user swipes and it is success, will change to that person's name for ~0.5 seconds, then back to "Swipe your card"
        # - If user swipes and fails, will switch to "Please try again" for ~0.5 seconds, then back to "Swipe your card"

        responsive_text_p8 = tk.Label(self, text="Student Already Enrolled", bg='white', font=('Corbel', 24, 'bold'), fg='#2A4C6B')
        responsive_text_p8.grid(row=3,column=0,pady=0)
        # ==========================================================



        # =======================================================
        # Go back to Dept/Course Selection page (PageOne) button - NO LONGER EXISTS ON THIS PAGE, BUT KEPT HERE FOR PADDING. PRESSING DOES NOTHING, AND APPEARS INVISIBLE
        back_to_pg1_button_p8 = tk.Button(self, relief=tk.FLAT, borderwidth=0, highlightthickness=0, activebackground="#FFFFFF", activeforeground = "#2A4C6B", text="") #command=lambda: (controller.show_frame(PageThree), updateCardReaderSequenceRunning("false")))
        back_to_pg1_button_p8.configure(font=('Corbel', 32, 'bold'), bg="#FFFFFF", fg="#2A4C6B")   
        back_to_pg1_button_p8.grid(row=4, column=0, padx = 0, pady=0, sticky='w') # pady4 original 40
        # =======================================================
        
        
        # Configure row and column weights to make the content stretch
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)   

# Main function to run the application
if __name__ == "__main__":
    pageNumber = "start"
    app = SampleApp()
    app.mainloop()
    













