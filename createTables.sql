-- For facID, we will need to generate one when they create an account & then insert it into table. 
-- this is Fac Registration 
CREATE TABLE FacInfo (
    FacID INT PRIMARY KEY,
    Dept VARCHAR2(4),
    Email VARCHAR2(15) UNIQUE,
    FirstName VARCHAR2(20),
    LastName VARCHAR2(20),
    ClassesTaught VARCHAR2(100),
    IsChair CHAR(1) DEFAULT 'N',
    
    CHECK (IsChair IN ('Y', 'N'))
);


-- For Faculty login
CREATE TABLE FacultyLogin (
    Email VARCHAR2(15) PRIMARY KEY,
    Password VARCHAR2(16) NOT NULL,
    FacID INT NOT NULL,
    
    FOREIGN KEY (FacID, Email) REFERENCES FacInfo(FacID, Email)
);

--For attendance Verification
CREATE TABLE AttendanceVerification (
    StudentFirstName VARCHAR2(20) NOT NULL,
    StudentLastName VARCHAR2(20) NOT NULL,
    DeptCode VARCHAR2(4) NOT NULL,
    CourseCode VARCHAR2(10) NOT NULL,
    FacEmail VARCHAR2(15) NOT NULL,
    Note TEXT,
    InsertDate DATE NOT NULL,
    InsertTime TIME NOT NULL,
    
    FOREIGN KEY (FacEmail) REFERENCES FacInfo(Email)
);

-- this should handle all attendance for all professors and students. To get specifics, we will have to write queries (select stmts).
CREATE TABLE ClassAttendance (
    AttendanceID INT PRIMARY KEY AUTO_INCREMENT,
    AttendanceDate DATE NOT NULL,
    CourseCode VARCHAR2(10) NOT NULL,
    FacEmail VARCHAR2(15) NOT NULL,
    StudentFirstName VARCHAR2(20) NOT NULL,
    StudentLastName VARCHAR2(20) NOT NULL,
    DeptCode VARCHAR2(4) NOT NULL,
    AttendanceStatus VARCHAR2(10) NOT NULL,
    Note TEXT,
    InsertDate DATE NOT NULL,
    InsertTime TIME NOT NULL,
    
    FOREIGN KEY (FacEmail) REFERENCES FacInfo(Email)
);


