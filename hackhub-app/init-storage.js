import { StorageService } from "./src/services/storageService.js"

async function initStorage() {
  console.log("Initializing Supabase storage buckets...")
  try {
    await StorageService.initializeBuckets()
    console.log("Storage buckets initialized successfully!")
  } catch (error) {
    console.error("Error initializing storage:", error)
  }
}

initStorage()
