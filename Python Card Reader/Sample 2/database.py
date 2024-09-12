#database.py: A database management file designed to be used in conjunction with the scanner.py and defs.py files. The database is built on this
#               app and the data is accessed for checking attendance via scanner.py.
#David J. Johnson
#3/22/2024 || 3/23/2024

import defs

def main(c, conn):
    while True:
        initialInput = input("Enter 'add' to add user || Enter 'remove' to delete a user || Type 'quit' to quit\n") #prompt the user for action
        if(initialInput.lower() == 'add'): #add a user to the database
            while True:
                swipe = input("Swipe card and validate information || Retry if card swipe is invalid || Press <ENTER> to cancel\n") #prompt the user for action
                if(swipe.startswith('%B')): #valid swipe
                    while True:
                        idNum, lastName, firstName = defs.parseSwipe(swipe) #get the names and idNumber from the swipe
                        if(defs.findUser(idNum, c) == None): #check if the person is in the database yet. Need to know if we need to add them or not
                            print(f"\nID NUMBER:  {idNum}") #print the ID Number for verification
                            print(f"NAME:       {firstName} {lastName}") #print the names for verification
                            confirmation = input("\nPress <Enter> if this is correct. Swipe again if it is not\n") #confirm credentials
                            if(confirmation == ""):
                                defs.addStudent(firstName, lastName, idNum, c, conn) #add student name and ID Number into database
                                break
                            else:
                                swipe = confirmation #credentials are wrong. Attempt again
                        else:
                            print("User is already in database\n") #Cannot add a duplicate student to the database
                            break
                elif(swipe == ""): #leave the selection screen
                    break
            
        elif(initialInput.lower() == 'remove'): #remove a user from the database
            while True:
                swipe = input("Swipe card and validate information || Retry if card swipe is invalid || Press <ENTER> to cancel\n") #prompt the user for action
                if(swipe.startswith('%B')): #valid swipe
                    while True:
                        idNum, lastName, firstName = defs.parseSwipe(swipe) #get the names and idNumber from the swipe
                        if(defs.findUser(idNum, c)): #check if the personis in the database yet. Cannot remove them if they aren't there
                            print(f"\nID NUMBER:  {idNum}") #print the ID Number for verification
                            print(f"NAME:       {firstName} {lastName}") #print the names for verification
                            confirmation = input("\nPress <Enter> if this is correct. Swipe again if it is not\n") #confirm credentials
                            if(confirmation == ""):
                                defs.removeStudent(idNum, c, conn) #remove student name and ID Number from the database
                                break
                            else:
                                swipe = confirmation #credentials are wrong. Attempt again
                        else:
                            print("User is not in database\n") #Cannot remove a name that does not exist in the database
                            break
                elif(swipe == ""): #leave the selection screen
                    break
                
        elif(initialInput.lower() == 'quit'): #user is turning off the database entry
            break
        
if __name__ == "__main__":
    c, conn = defs.initDB() #establish the database connection
    main(c, conn) #run the main function
    conn.close() #close the connection to the database