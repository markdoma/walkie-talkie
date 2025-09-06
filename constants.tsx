import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  Query,
} from "firebase/firestore";
import {
  TeamMember,
  TeamMemberStatus,
  TimeEntry,
  TimeEntryType,
} from "./types";

// --- Cloudinary Configuration ---
const CLOUDINARY_CLOUD_NAME = "ddblwgooz"; // TODO: Replace with your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = "walkie-talkie"; // TODO: Replace with your unsigned upload preset

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-jyl7YyPU2cDLZKZ-kieRUpcb-3ziqEQ",
  authDomain: "walkie-talkie-374a1.firebaseapp.com",
  projectId: "walkie-talkie-374a1",
  storageBucket: "walkie-talkie-374a1.firebasestorage.app",
  messagingSenderId: "31700431360",
  appId: "1:31700431360:web:d3a8b2b278194627909ee5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Keep logo URL
export const LOGO_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRnJc_ADm21t34dm_CvMMSMfFb5TeLbnNfPQ&s";
// "https://storage.googleapis.com/walkie-talkie-docs/logo.jpg";
// --- Employee API ---
export const getEmployees = async (): Promise<TeamMember[]> => {
  const querySnapshot = await getDocs(collection(db, "employees"));
  const employees: TeamMember[] = [];
  querySnapshot.forEach((doc) => {
    employees.push({ id: doc.id, ...doc.data() } as TeamMember);
  });
  return employees;
};

export const addEmployee = async (
  employeeData: Pick<TeamMember, "name">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "employees"), {
    ...employeeData,
    status: TeamMemberStatus.Out,
    lastSeen: "Newly Added",
  });
  return docRef.id;
};

export const updateEmployee = async (employee: TeamMember): Promise<void> => {
  const { id, ...data } = employee;
  const employeeRef = doc(db, "employees", id);
  await updateDoc(employeeRef, { ...data });
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  await deleteDoc(doc(db, "employees", employeeId));
};

// --- Time Entry API ---
const uploadSelfie = async (base64: string): Promise<string> => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", base64);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

export const addTimeEntry = async (
  employeeId: string,
  entry: Omit<TimeEntry, "id" | "employeeId">
): Promise<string> => {
  let selfieUrl = entry.selfieUrl;
  if (
    entry.type === TimeEntryType.ClockIn &&
    selfieUrl?.startsWith("data:image")
  ) {
    selfieUrl = await uploadSelfie(selfieUrl);
  }

  const docRef = await addDoc(collection(db, "timeEntries"), {
    employeeId,
    type: entry.type,
    timestamp: Timestamp.fromDate(entry.timestamp),
    selfieUrl: selfieUrl || null,
  });
  return docRef.id;
};

const fetchTimeEntries = async (q: Query): Promise<TimeEntry[]> => {
  const querySnapshot = await getDocs(q);
  const entries: TimeEntry[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    entries.push({
      id: doc.id,
      ...data,
      timestamp: (data.timestamp as Timestamp).toDate(),
    } as TimeEntry);
  });
  return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export const getTimeEntriesForUser = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeEntry[]> => {
  const q = query(
    collection(db, "timeEntries"),
    where("employeeId", "==", employeeId),
    where("timestamp", ">=", Timestamp.fromDate(startDate)),
    where("timestamp", "<=", Timestamp.fromDate(endDate)),
    orderBy("timestamp", "asc")
  );
  return fetchTimeEntries(q);
};

export const getAllTimeEntries = async (
  startDate: Date,
  endDate: Date
): Promise<TimeEntry[]> => {
  const q = query(
    collection(db, "timeEntries"),
    where("timestamp", ">=", Timestamp.fromDate(startDate)),
    where("timestamp", "<=", Timestamp.fromDate(endDate)),
    orderBy("timestamp", "asc")
  );
  return fetchTimeEntries(q);
};
