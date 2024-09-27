#defs.py: A library file used in conjunction with scanner.py. Contains the functions used by scanner.py
#David J. Johnson
#3/22/2024 || 3/23/2024

import sqlite3
import os
import datetime

def initDB():
    conn = sqlite3.connect('attendance.db') #initialize the database file names "attendance.db" using sqlite3
    c = conn.cursor() #the cursor is used to search through the table
    c.execute('''CREATE TABLE IF NOT EXISTS users (firstName TEXT, lastName TEXT, idNum TEXT)''') #establish a table using the firstName, lastName, and idNumber of the student
    return c, conn #return the connection and the cursor

def addStudent(firstName, lastName, idNum, c, conn):
    c.execute("INSERT INTO users VALUES (?, ?, ?)", (firstName, lastName, idNum)) #enter the format for the values that are being entered
    conn.commit() #submit the values into the database
    
def removeStudent(idNum, c, conn):
    c.execute("DELETE FROM users WHERE idNum=?", (idNum,))
    conn.commit()
    
def parseSwipe(swipe):
    nameBeginIndex = swipe.find('^') #find the '^' before the last name
    nameSlash = swipe.find('/', nameBeginIndex+1) #find the '/' between last and first names
    nameEndIndex = swipe.find('^', nameSlash+1) #find the '^' at the end of the first name
                    
    idNum = swipe[2:nameBeginIndex] #ID Number is the first digits of the KU card swipe
    lastName = swipe[nameBeginIndex+1:nameSlash] #last name is the first of the names to show up
    firstName = swipe[nameSlash+1:nameEndIndex] #first name is the second of the names to show up
    return idNum, lastName, firstName #send the names and ID number back so the database can enter them

def findUser(idNum, c):
    c.execute("SELECT * FROM users WHERE idNum=?", (idNum,)) #look for the given ID Number in the database
    return c.fetchone() #return a boolean on whether the ID Number was found in the database

def initLog(logDir="records"):
    if not os.path.exists(logDir): #check if the directory already exists
        os.makedirs(logDir) #make a new directory if it does not exist
    # logFilename = f"{datetime.datetime.now().strftime("%H;%M;%S %m-%d-%y")}.log" #generate the name of the logfile using a timestamp and appending .log - Original code by David
    logFilename = datetime.datetime.now().strftime("%H;%M;%S %m-%d-%y") + ".log" #Generate the name of the logfile using a timestamp and appending .log - Rewrote by Zaynin to prevent some specific environment/path syntax prioritization snytax error
    return os.path.join(logDir, logFilename) #put the logfile in the new directory for logfiles and return the path for use in the config function