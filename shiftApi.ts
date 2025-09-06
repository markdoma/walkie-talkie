import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

const db = getFirestore();

// Add a new shift change to the employee's shift subcollection
export const addEmployeeShiftChange = async (
  employeeId: string,
  newShift: string
) => {
  const shiftRef = collection(db, `employees/${employeeId}/shifts`);
  await addDoc(shiftRef, {
    shift: newShift,
    date: Timestamp.now(),
  });
};

// Get the latest shift for an employee (returns string, defaults to '9:00 AM' if none)
export const getLatestEmployeeShift = async (
  employeeId: string
): Promise<string> => {
  const shiftRef = collection(db, `employees/${employeeId}/shifts`);
  const q = query(shiftRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const data = snapshot.docs[0].data();
    return data.shift || "9:00 AM";
  }
  return "9:00 AM";
};
