// src/services/photoService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db, storage } from "./firebase";
import { doc, setDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const STORAGE_KEY = "photos";

export async function savePhotoLocal({ uri, coords, note = "", labels = [] }) {
  const photo = {
    id: Date.now().toString(),
    uri,
    coords,
    note,
    labels,
    timestamp: new Date().toISOString(),
  };
  const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
  saved.push(photo);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return photo;
}

export async function getAllPhotosLocal() {
  return JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
}

export async function savePhotoForUser({ uri, coords, note = "", labels = [] }) {
  const user = auth.currentUser;
  if (!user) {
    return savePhotoLocal({ uri, coords, note, labels });
  }
  const photoId = Date.now().toString();
  const storagePath = `users/${user.uid}/photos/${photoId}.jpg`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  const docRef = doc(db, "users", user.uid, "photos", photoId);
  await setDoc(docRef, {
    id: photoId,
    uri: downloadURL,
    storagePath,
    coords,
    note,
    labels,
    timestamp: serverTimestamp(),
    owner: user.uid,
  });
  return { id: photoId, uri: downloadURL, coords, note, labels };
}

export async function getAllPhotosForCurrentUser() {
  const user = auth.currentUser;
  if (!user) return getAllPhotosLocal();
  const snap = await getDocs(collection(db, "users", user.uid, "photos"));
  const items = [];
  snap.forEach((d) => items.push(d.data()));
  return items;
}

