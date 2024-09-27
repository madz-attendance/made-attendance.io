#readDatabase.py: This file serves as a means of outputting the data stored in the attendance.db database.
#David J. Johnson
#3/22/2024 || 3/23/2024

import defs

def get_all_entries(c):
    c.execute("SELECT * FROM users")
    return c.fetchall()

c, conn = defs.initDB()

entries = get_all_entries(c)
for entry in entries:
    print(entry)