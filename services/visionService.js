// Vision service using Hugging Face Inference API (optional)
// Set HUGGINGFACE_API_KEY in env or app.json extra
import Constants from "expo-constants";

const HUGGINGFACE_ENDPOINT = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224";

export async function classifyImageByUrl(imageUrl) {
  try {
    const apiKey = (Constants?.expoConfig?.extra?.HUGGINGFACE_API_KEY) || process.env.HUGGINGFACE_API_KEY || undefined;
    if (!apiKey) {
      return ["unknown"];
    }

    const res = await fetch(HUGGINGFACE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ inputs: imageUrl }),
    });

    if (!res.ok) {
      return ["unknown"];
    }

    const data = await res.json();
    // Response format: array of arrays of {label, score}
    const top = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    const labels = top.slice(0, 5).map(x => x.label || "unknown");
    return labels.length ? labels : ["unknown"];
  } catch (e) {
    return ["unknown"];
  }
}
