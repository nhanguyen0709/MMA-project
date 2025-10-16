// Dynamic Expo config: reads secrets from environment variables
// Do NOT commit your real secrets; use .env (not committed) or CI secrets

module.exports = ({ config }) => {
  return {
    ...config,
    name: "ngu",
    slug: "snack-9cbf59d1-ba35-4d79-a4e8-6bcd3c587c1b",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    },
  };
};
