#scanner.py: A file used in conjunction with defs.py. This file takes in a card swipe and determines what to do depending on the input.
#               This file calls upon functions in defs.py for cleanliness sake.
#David J. Johnson
#3/22/2024

import defs

def main(c, conn): #main function
    while True: #keep looping until the user types in 'quit'
        initialInput = input("Swipe your card || press <ENTER> to input a new profile || type 'quit' to quit\n") #prompt user and retrieve a card swipe or another action

        if(initialInput == ""): #if the input is <ENTER>
            while True: #keep looping until the proper action is taken
                newInput = input("Swipe card and validate entered information\n") #have the user swipe again in order to collect their ID info
                if(newInput.startswith('%B')): #swipe is valid
                    while True: #loop until confirmation is ""
                        idNum, lastName, firstName = defs.parseSwipe(newInput) #function parses input and returns three variables
                        
                        print(f"\nID NUMBER:  {idNum}") #print the ID Number for verification
                        print(f"NAME:       {firstName} {lastName}") #print the names for verification
                        
                        confirmation = input("\nPress <Enter> if this is correct. Swipe again if it is not\n") #determine if user is happy with output
                        if(confirmation == ""): #user is happy with output
                            defs.addStudent(firstName, lastName, idNum, c, conn) #add the student ID Number and names into the database
                            break
                        else:
                            newInput = confirmation #swipe was no good, allow user to swipe again
                else:
                    continue #swipe was invalid
                break #leave loop once confirmation is ""
                        
        elif(initialInput.startswith('%B')): #user swipes and swipe is valid
            idNum, lastName, firstName = defs.parseSwipe(initialInput) #function parses input and returns three variables
            if(defs.findUser(idNum, c)): #check the database and see if ID Number can be found
                print(f"\nWelcome Back {firstName} {lastName}\n") #ID Number has been found
            else:
                print(f"\nName '{firstName} {lastName}' with ID Number '{idNum}' is not in this class. Please try again\n") #ID Number has not been found
            
        elif(initialInput.lower() == "quit"): #user entered 'quit'
            conn.close() #close connection to 'attendance.db'
            break
        
        else: #bad card swipe. No usable data
            print("ID Swipe error. Please try again\n")
            
if __name__ == "__main__":
    c, conn = defs.initDB() #establish the database file and its connection
    main(c, conn) #go to the main function
