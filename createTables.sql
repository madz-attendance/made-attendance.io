
-- ==============================================================
-- TABLE: "courses"
-- DESCRIPTION: This table holds one entry for every unique course being offered 
-- right now at the university.
-- NOTES: "courseid SERIAL PRIMARY KEY" makes it so that the courseid is auto-assigned 
-- to the next available value when creating a new object in this table. Basically, if
-- you create a course, itll be assigned courseid: 1, if you create another course, 
-- it'll be assigned courseid: 2, and so on. This courseid is a unique identifier that
-- represents each unique course at the university, during a specific semester, during
-- a specific section. For example, CPSC 135 in Fall 2024 will have a different courseid
-- than CPSC 135 in Spring 2025. Different sections during the same semester will also
-- have different courseids.

CREATE TABLE courses (
    courseid SERIAL PRIMARY KEY,
    dept VARCHAR(32),
    coursecode VARCHAR(32),
    coursenum INT,
    coursename VARCHAR(64),
    coursesec VARCHAR(32),
    coursesem VARCHAR(32),
    building VARCHAR(64),
    room VARCHAR(32),
    days VARCHAR(32),
    start VARCHAR(32),
    finish VARCHAR(32),
    facfirstname VARCHAR(64),
    faclastname VARCHAR(64),
    facemail VARCHAR(64),
    FOREIGN KEY (facemail) REFERENCES users(facemail)
);


-- ==============================================================
-- TABLE: "attendance"
-- DESCRIPTION: Stores individual swipe information when a student swipes their id. Every
-- student swipe will have its own entry in this table. This table is referenced when
-- determining the attendance status of particular students on particular days for particular
-- courses.
-- NOTES: "courseid" is foreign keyed to the "courses" table. This is the identifier
-- used to determine which course this attendance entry is marking attendance for.

CREATE TABLE attendance (
    courseid INT NOT NULL,
    stufirstname VARCHAR(32) NOT NULL,
    stulastname VARCHAR(32) NOT NULL,
    stuid VARCHAR(128) NOT NULL,
    attendancetime TIMESTAMP NOT NULL,
    CONSTRAINT fk_courseid
        FOREIGN KEY (courseid)
        REFERENCES courses(courseid)
        ON DELETE CASCADE
);


-- ==============================================================
-- TABLE: "roster"
-- DESCRIPTION: This table will be used for the rosters of students
-- in courses. Each entry in this table will have a courseid foreign
-- key that links it to a specific course during a specific semester.
-- Each entry will also have student information, saying that they are
-- in this course. This table will be queried to determine what student
-- is in what course.
-- NOTES: courseid is foreign key to "courses" table courseid.
-- "rosterentryid" is a primary key for this table.

CREATE TABLE roster (
    rosterentryid SERIAL PRIMARY KEY,
    courseid INT NOT NULL,
    stufirstname VARCHAR(32) NOT NULL,
    stulastname VARCHAR(32) NOT NULL,
    stuid VARCHAR(128) NOT NULL,
    CONSTRAINT fk_courseid
        FOREIGN KEY (courseid)
        REFERENCES courses(courseid)
        ON DELETE CASCADE
);



-- ==============================================================
-- TABLE: "departments"
-- DESCRIPTION: This table stores department information for each
-- department at the university.
-- NOTES: "chairemail" foreign keys to "users" table "facemail"

CREATE TABLE departments (
    deptcode VARCHAR(32) PRIMARY KEY,
    deptname VARCHAR(64) NOT NULL,
    chairemail VARCHAR(64) NOT NULL,
    CONSTRAINT fk_chairemail FOREIGN KEY (chairemail) REFERENCES users(facemail)
);



-- ==============================================================
-- TABLE: users
-- DESCRIPTION: Stores each professor/admin account information. Does not
-- store password.
-- NOTES: 


CREATE TABLE users (
    facemail VARCHAR(64) PRIMARY KEY,
    facrank VARCHAR(32),
    faclastname VARCHAR(64)
);



-- ==============================================================
-- TABLE: stusubmission
-- DESCRIPTION: Stores data regarding an individual student's attendance
-- verification request.
-- NOTES: 


CREATE TABLE stusubmission (
    facemail VARCHAR(64),
    coursenum VARCHAR(32),
    coursesec VARCHAR(32),
    stufirstname VARCHAR(64),
    stulastname VARCHAR(64),
    note VARCHAR(512),
    CONSTRAINT fk_facemail FOREIGN KEY (facemail) REFERENCES users(facemail)
);



