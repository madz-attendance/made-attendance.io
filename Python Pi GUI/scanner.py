#scanner.py: A file used in conjunction with defs.py. This file takes in a card swipe and determines what to do depending on the input.
#               This file calls upon functions in defs.py for cleanliness sake.
#David J. Johnson
#3/22/2024 || 3/23/2024

import defs
import logging

def main(c, conn): #main function
    while True: #keep looping until the user types in 'quit'
        initialInput = input("Swipe your card || type 'quit' to quit\n") #prompt user and retrieve a card swipe or another action
                        
        if(initialInput.startswith('%B')): #user swipes and swipe is valid
            idNum, lastName, firstName = defs.parseSwipe(initialInput) #function parses input and returns three variables
            if(defs.findUser(idNum, c)): #check the database and see if ID Number can be found
                print(f"\nWelcome Back {firstName} {lastName}\n") #ID Number has been found
                logging.info(f"\n\tNAME: {firstName} {lastName} \n\tID NUMBER: {idNum}") #log the name and ID Number of the student swiping
            else:
                print(f"\nName '{firstName} {lastName}' with ID Number '{idNum}' is not in this class. Please try again\n") #ID Number has not been found
            
        elif(initialInput.lower() == "quit"): #user entered 'quit'
            conn.close() #close connection to 'attendance.db'
            break
        
        else: #bad card swipe. No usable data
            print("ID Swipe error. Please try again\n")
            
if __name__ == "__main__":
    c, conn = defs.initDB() #establish the database file and its connection
    logging.basicConfig(filename=defs.initLog(), level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s') #configure the logfile to use a timestamp and then the message
    main(c, conn) #go to the main function
