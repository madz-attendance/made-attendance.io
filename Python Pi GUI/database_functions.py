import os
from supabase import create_client, Client

# Connect to Supabase
url = "https://agldqgjpcqqmqynizbcs.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbGRxZ2pwY3FxbXF5bml6YmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NDA5OTgsImV4cCI6MjA0MDUxNjk5OH0.qIUhU-16YQzrIY_SnRxWDG3l5RzKj9s8ns3XaoQAEFo"
supabase: Client = create_client(url, key)

def parseSwipe(swipe):
    nameBeginIndex = swipe.find('^') #find the '^' before the last name
    nameSlash = swipe.find('/', nameBeginIndex+1) #find the '/' between last and first names
    nameEndIndex = swipe.find('^', nameSlash+1) #find the '^' at the end of the first name
                    
    idNum = swipe[2:nameBeginIndex] #ID Number is the first digits of the KU card swipe
    lastName = swipe[nameBeginIndex+1:nameSlash] #last name is the first of the names to show up
    firstName = swipe[nameSlash+1:nameEndIndex] #first name is the second of the names to show up
    return idNum, lastName, firstName #send the names and ID number back so the database can enter them
    
def parseCourseInfo(courseInfo):
    parts = courseInfo.split(' - ')
    
    coursecode = parts[0].split()[0]  # "CPSC"
    coursenum = int(parts[0].split()[1])  # 135
    coursesec = parts[1]  # "020"
    coursesem = parts[2]  # "Fall 2024"
    faclastname = parts[3]  # "ProfLast"
    
    return coursecode, coursenum, coursesec, coursesem, faclastname

