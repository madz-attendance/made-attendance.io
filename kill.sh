#!/bin/bash
#https://supabase.com/docs/reference/javascript/auth-signup

# Define the process name (or part of it)
PROCESS_NAME="/Library/Frameworks/Python.framework/Versions/3.12/Resources/Python.app/Contents/MacOS/Python -m http.server 8000"

# Find the PID of the process
PID=$(ps aux | grep "$PROCESS_NAME" | grep -v grep | awk '{print $2}')

# If a process was found, kill it
if [ ! -z "$PID" ]; then
    echo "Killing process $PROCESS_NAME with PID: $PID"
    kill $PID
else
    echo "No process found with name: $PROCESS_NAME"
fi