MADZ Reader Update Version 2.0

1. The biggest change to this iteration is that the database is no longer being managed by the scanner.py file.
    a. Advantages:
        -Less messy code
        -Easy to manage the data
        -In a real scenario, we wouldn't want the student to be able to alter the database during check-in time
        -Needs cleaned up and optimized. There is a lot of repetitive code, but it made life a lot easier than passing functions into functions
    b. Disadvantages:
        -More files to manage
        -More complexity when running
        -No "on the fly" changes since it won't be on the already running scanner.py file

2. readDatabase.py:
    a. A more subtle change to the folder, but we can now see the contents of the attendance.db database without needing to run the main program
    b. Allows for quick testing and checking without extra clutter of running another program
    c. Meant to be a testing file, but can be scaled up to what we were thinking of the teacher's view where they can print every person that attended

3. defs.py:
    a. Added the removeStudent function into the file
    b. Is now imported into two more files:
        -database.py
        -readDatabase.py

4. database.py:
    a. This file now allows us to add and remove users without ever needing to boot up the attendance menus
    b. Gives us that separation between the student's access and the administrative access
    c. This file means scanner.py will have zero editing privelages for the database from here onward. 
        -All database editing will take place in this file
        -Database will act more like a central list of students. 
        -Am currently brainstorming the teacher perspective of being able to add students to a class from the central database

5. scanner.py:
    a. No more database management in the file!
    b. When the attendance is successful (good swipe) there will be a time stamp and logfile being kept up to date
    c. This file is being oriented towards what the student would be seeing in a deployed scenario
