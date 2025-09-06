import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

const db = getFirestore();

// Get the shift in effect for an employee at a specific date
export const getEmployeeShiftAtDate = async (
  employeeId: string,
  date: Date
): Promise<string> => {
  const shiftRef = collection(db, `employees/${employeeId}/shifts`);
  const q = query(shiftRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  let shift = "9:00 AM";
  let target = Timestamp.fromDate(date);
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.date && data.date.toDate() <= date) {
      shift = data.shift || "9:00 AM";
      return false; // break
    }
  });
  return shift;
};
