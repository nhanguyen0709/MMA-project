// Complete Cloudinary photo service with user-based storage
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CLOUDINARY_CONFIG = {
  cloud_name: "dbqp09bgy",
  upload_preset: "m1_default", // UNSIGNED preset
};

const STORAGE_KEY = "photos";

export async function uploadImageToCloudinary(fileUri, userId) {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: "image/jpeg",
      name: `photo_${Date.now()}.jpg`,
    });
    formData.append("upload_preset", CLOUDINARY_CONFIG.upload_preset);
    formData.append("folder", `photos/${userId}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Upload failed");
    }

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function savePhotoLocal({ uri, coords, note = "", labels = [] }, userId) {
  const photo = {
    id: Date.now().toString(),
    uri,
    coords,
    note,
    labels,
    timestamp: new Date().toISOString(),
    userId,
  };
  const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
  saved.push(photo);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return photo;
}

export async function savePhotoToCloudinary({ uri, coords, note = "", labels = [] }, userId) {
  try {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadImageToCloudinary(uri, userId);
    
    const photo = {
      id: Date.now().toString(),
      uri: cloudinaryResult.secureUrl,
      publicId: cloudinaryResult.publicId,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      coords,
      note,
      labels,
      timestamp: new Date().toISOString(),
      userId,
    };
    
    // Save metadata locally
    const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
    saved.push(photo);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    
    return photo;
  } catch (error) {
    console.error('Save photo error:', error);
    // Fallback to local storage if Cloudinary fails
    return savePhotoLocal({ uri, coords, note, labels }, userId);
  }
}

export async function getAllPhotos(userId) {
  const allPhotos = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
  return allPhotos.filter(photo => photo.userId === userId);
}

export async function getAllPhotosLocal() {
  return JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
}
