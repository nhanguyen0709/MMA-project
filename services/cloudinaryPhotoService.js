// Complete Cloudinary photo service with user-based storage
import AsyncStorage from "@react-native-async-storage/async-storage";
import { classifyImageByUrl } from "./visionService";

export const CLOUDINARY_CONFIG = {
  cloud_name: "dbqp09bgy",
  upload_preset: "m1_default", // UNSIGNED preset (preset should enable add-ons server-side)
};

const STORAGE_KEY = "photos";

function extractAutoTags(uploadResult) {
  const explicitTags = Array.isArray(uploadResult?.tags) ? uploadResult.tags : [];
  const info = uploadResult?.info || {};
  const imagga = info?.categorization?.imagga_tagging?.data || [];
  const google = info?.categorization?.google_tagging?.data || [];
  const imaggaTags = imagga.map((x) => x.tag?.en || x.tag || "").filter(Boolean);
  const googleTags = google.map((x) => x.tag || x.label || "").filter(Boolean);
  return Array.from(new Set([...explicitTags, ...imaggaTags, ...googleTags]));
}

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
    // For unsigned uploads, only allowed params. Rely on preset for add-ons.
    formData.append("tags", `user:${userId},person,object`);

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

    const autoTags = extractAutoTags(result);

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
      bytes: result.bytes,
      format: result.format,
      autoTags,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

function detectType({ isSelfie, source }) {
  if (isSelfie) return "selfie";
  if (source === "camera") return "chụp";
  if (source === "picker") return "tải";
  return "khác";
}

function buildDateParts(dateIso) {
  const d = new Date(dateIso);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

async function readAll() {
  return JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
}

async function writeAll(list) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function articleFor(word) {
  const w = String(word || "").trim().toLowerCase();
  if (!w) return "a";
  return ["a","e","i","o","u"].includes(w[0]) ? "an" : "a";
}

function canonicalMap(label) {
  const l = String(label || "").toLowerCase();
  if (/(person|human|man|woman|people|girl|boy|selfie)/.test(l)) return "person";
  if (/(flower|blossom|rose|tulip)/.test(l)) return "flower";
  if (/(dog|puppy|canine)/.test(l)) return "dog";
  if (/(car|vehicle|automobile|sedan|suv)/.test(l)) return "car";
  if (/(mountain|mount|peak|alps|himalaya)/.test(l)) return "mountain";
  if (/(meal|food|dish|cuisine|plate|lunch|dinner|breakfast)/.test(l)) return "meal";
  return label;
}

function toPhrase(label) {
  if (!label) return "a photo";
  const raw = canonicalMap(label).toString().trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith("a ") || lower.startsWith("an ")) return raw;
  return `${articleFor(raw)} ${raw}`;
}

function formatLabels(labels) {
  const arr = Array.isArray(labels) ? labels : [];
  const phrases = arr.map(toPhrase);
  return Array.from(new Set(phrases));
}

export async function updatePhotoLabels(photoId, userId, newLabels) {
  const list = await readAll();
  const idx = list.findIndex(p => p.id === photoId && p.userId === userId);
  if (idx >= 0) {
    const merged = Array.from(new Set([...(list[idx].labels || []), ...formatLabels(newLabels)]));
    list[idx] = { ...list[idx], labels: merged };
    await writeAll(list);
  }
}

export async function savePhotoLocal({ uri, coords, note = "", labels = [], userId, isSelfie = false, source = "camera" }) {
  const timestamp = new Date().toISOString();
  const photo = {
    id: Date.now().toString(),
    uri,
    coords,
    note,
    labels,
    timestamp,
    userId,
    type: detectType({ isSelfie, source }),
    ...buildDateParts(timestamp),
  };
  const saved = await readAll();
  saved.push(photo);
  await writeAll(saved);
  return photo;
}

export async function savePhotoToCloudinary({ uri, coords, note = "", labels = [], isSelfie = false, source = "camera" }, userId) {
  // 1) Upload trước, lưu ngay
  const cloudinaryResult = await uploadImageToCloudinary(uri, userId);

  const timestamp = new Date().toISOString();
  const initialLabels = formatLabels([...(labels || []), ...(cloudinaryResult.autoTags || []), "person", "object"]);

  const photo = {
    id: Date.now().toString(),
    uri: cloudinaryResult.secureUrl,
    publicId: cloudinaryResult.publicId,
    width: cloudinaryResult.width,
    height: cloudinaryResult.height,
    coords,
    note,
    labels: initialLabels,
    timestamp,
    userId,
    type: detectType({ isSelfie, source }),
    ...buildDateParts(timestamp),
  };

  const saved = await readAll();
  saved.push(photo);
  await writeAll(saved);

  // 2) Chạy AI tagging không chặn luồng (fire-and-forget)
  (async () => {
    try {
      const hfLabels = await classifyImageByUrl(cloudinaryResult.secureUrl);
      if (hfLabels && hfLabels.length) {
        await updatePhotoLabels(photo.id, userId, hfLabels);
      }
    } catch {}
  })();

  return photo;
}

export async function getAllPhotos(userId) {
  const allPhotos = await readAll();
  return allPhotos.filter(photo => photo.userId === userId);
}

export async function getAllPhotosLocal() {
  return await readAll();
}

export async function getPhotoById(userId, photoId) {
  const allPhotos = await readAll();
  return allPhotos.find(p => p.userId === userId && p.id === photoId) || null;
}

export function subscribePhotoUpdates(userId, photoId, onChange, intervalMs = 1500) {
  let cancelled = false;
  const tick = async () => {
    if (cancelled) return;
    const p = await getPhotoById(userId, photoId);
    if (p) onChange(p);
    if (!cancelled) setTimeout(tick, intervalMs);
  };
  tick();
  return () => { cancelled = true; };
}

// Grouping helpers
export function groupByDate(photos) {
  const map = {};
  for (const p of photos) {
    const key = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

export function groupByType(photos) {
  const map = {};
  for (const p of photos) {
    const key = p.type || 'khác';
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

export function groupByLabel(photos) {
  const map = {};
  for (const p of photos) {
    const labels = Array.isArray(p.labels) && p.labels.length ? p.labels : ["unknown"];
    for (const l of labels) {
      if (!map[l]) map[l] = [];
      map[l].push(p);
    }
  }
  return map;
}
