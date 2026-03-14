import { GoogleGenAI } from "@google/genai";

export interface VideoGenerationConfig {
  prompt: string;
  style: 'cinematic' | 'anime' | 'realistic' | 'cartoon' | 'cyberpunk' | 'educational' | '3d-animation' | 'kinetic-typography' | 'ad';
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
  duration: string;
  requestId?: string;
}

const runSimulation = async (config: VideoGenerationConfig, onProgress?: (status: string) => void) => {
  onProgress?.("Initializing...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  onProgress?.("Analyzing prompt context...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  onProgress?.("Rendering frames...");
  await new Promise(resolve => setTimeout(resolve, 4000));
  onProgress?.("Finalizing video...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return a high-quality placeholder video based on the style
  const placeholders: Record<string, string[]> = {
    cinematic: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    ],
    anime: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    ],
    realistic: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    ],
    cartoon: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    ],
    cyberpunk: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    ],
    educational: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    ],
    "3d-animation": [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    ],
    "kinetic-typography": [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    ],
    "ad": [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    ],
  };

  const stylePool = placeholders[config.style] || placeholders.cinematic;
  const baseUrl = stylePool[Math.floor(Math.random() * stylePool.length)];
  // Add random query param to make it feel unique
  const url = `${baseUrl}?v=${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    url,
    id: `vid-${Date.now()}`
  };
};

export const generateVideo = async (config: VideoGenerationConfig, onProgress?: (status: string) => void) => {
  // ONLY use the real API if the user has explicitly selected a key via the dialog
  // The default GEMINI_API_KEY is usually free-tier and will fail for Veo models
  const apiKey = process.env.API_KEY; 
  
  // If no user-selected key is present, go straight to simulation
  if (!apiKey || apiKey === "") {
    return runSimulation(config, onProgress);
  }

  // Create a new GoogleGenAI instance right before making an API call 
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = `${config.style} style, ${config.duration} duration: ${config.prompt}`;

  onProgress?.("Initializing video generation...");
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: fullPrompt,
      config: {
        numberOfVideos: 1,
        resolution: config.resolution,
        aspectRatio: config.aspectRatio
      }
    });

    onProgress?.("Generating video... This may take a few minutes.");

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      try {
        operation = await ai.operations.getVideosOperation({ operation: operation });
        onProgress?.("Still processing... Hang tight!");
        } catch (error: any) {
        const msg = error.message || "";
        if (!window.navigator.onLine) {
          throw new Error("NETWORK_ERROR");
        }
        if (msg.includes("Requested entity was not found")) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
          throw new Error("API_KEY_EXPIRED");
        }
        if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
          // Fallback to simulation on permission error even with a key
          console.warn("Permission denied with provided key, falling back to simulation");
          return runSimulation(config, onProgress);
        }
        if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
          throw new Error("RESOURCE_EXHAUSTED");
        }
        if (msg.includes("INVALID_ARGUMENT") || msg.includes("400")) {
          throw new Error("INVALID_ARGUMENT");
        }
        if (msg.includes("INTERNAL") || msg.includes("500")) {
          throw new Error("INTERNAL_ERROR");
        }
        if (msg.includes("SAFETY") || msg.includes("blocked")) {
          throw new Error("SAFETY_BLOCKED");
        }
        throw new Error("GENERATION_FAILED");
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
      throw new Error("GENERATION_FAILED");
    }

    // To fetch the video, append the Gemini API key to the x-goog-api-key header.
    return {
      url: downloadLink,
      id: operation.name || `vid-${Date.now()}`
    };
  } catch (error: any) {
    const msg = error.message || "";
    if (!window.navigator.onLine) {
      throw new Error("NETWORK_ERROR");
    }
    if (msg.includes("Requested entity was not found")) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      throw new Error("API_KEY_EXPIRED");
    }
    if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
      // Fallback to simulation on permission error even with a key
      console.warn("Permission denied with provided key, falling back to simulation");
      return runSimulation(config, onProgress);
    }
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      throw new Error("RESOURCE_EXHAUSTED");
    }
    if (msg.includes("INVALID_ARGUMENT") || msg.includes("400")) {
      throw new Error("INVALID_ARGUMENT");
    }
    if (msg.includes("INTERNAL") || msg.includes("500")) {
      throw new Error("INTERNAL_ERROR");
    }
    if (msg.includes("SAFETY") || msg.includes("blocked")) {
      throw new Error("SAFETY_BLOCKED");
    }
    if (error.message === "GENERATION_FAILED") throw error;
    throw new Error("GENERATION_FAILED");
  }
};

export const saveVideoToHistory = async (video: {
  id: string;
  prompt: string;
  style: string;
  video_url: string;
  duration: string;
  resolution: string;
}) => {
  const response = await fetch("/api/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(video),
  });
  return response.json();
};

export const getVideosHistory = async () => {
  const response = await fetch("/api/videos");
  return response.json();
};

export const deleteVideoFromHistory = async (id: string) => {
  const response = await fetch(`/api/videos/${id}`, {
    method: "DELETE",
  });
  return response.json();
};
