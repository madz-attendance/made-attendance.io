import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDt0z6Li5YXqagcPgbOzXzSaUiEbLZ6_qc",
  authDomain: "madz-attendance.firebaseapp.com",
  databaseURL: "https://madz-attendance-default-rtdb.firebaseio.com",
  projectId: "madz-attendance",
  storageBucket: "madz-attendance.appspot.com",
  messagingSenderId: "488541010538",
  appId: "1:488541010538:web:cf16a08c8a4b026a4ca813",
  measurementId: "G-04LKDVYT0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to add a new document to the 'attendance_requests' collection
export async function addAttendanceRequest(studentFirstname, studentLastname, departmentCode, classSection, professorEmail, professorNote) {
  try {
    const docRef = await addDoc(collection(db, "attendance_requests"), {
      student_firstname: studentFirstname,
      student_lastname: studentLastname,
      department_code: departmentCode,
      class_section: classSection,
      professor_email: professorEmail,
      professor_note: professorNote
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}
