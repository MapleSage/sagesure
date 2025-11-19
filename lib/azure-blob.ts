import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = "user-media";

let blobServiceClient: BlobServiceClient;
let containerClient: ContainerClient;

// Initialize blob service
function initializeBlobService() {
  if (!blobServiceClient) {
    blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }
  return { blobServiceClient, containerClient };
}

// Create container if it doesn't exist
export async function ensureContainerExists() {
  const { containerClient } = initializeBlobService();
  try {
    await containerClient.createIfNotExists();
  } catch (error) {
    console.error("Error creating container:", error);
    throw error;
  }
}

// Upload file to blob storage
export async function uploadFile(
  userId: string,
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const { containerClient } = initializeBlobService();

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobName = `${userId}/${timestamp}-${sanitizedFilename}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.upload(file, file.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Generate SAS URL for temporary access
export async function generateSasUrl(
  blobUrl: string,
  expiryMinutes: number = 60
): Promise<string> {
  // For now, return the blob URL directly
  // In production, implement SAS token generation
  return blobUrl;
}

// Delete file from blob storage
export async function deleteFile(blobUrl: string): Promise<void> {
  const { containerClient } = initializeBlobService();

  try {
    // Extract blob name from URL
    const url = new URL(blobUrl);
    const blobName = url.pathname.split(`/${containerName}/`)[1];

    if (blobName) {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// List files for a user
export async function listUserFiles(
  userId: string,
  folder?: string
): Promise<string[]> {
  const { containerClient } = initializeBlobService();

  const prefix = folder ? `${userId}/${folder}/` : `${userId}/`;
  const files: string[] = [];

  try {
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      files.push(blob.name);
    }
    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
}

// Download file from URL
export async function downloadFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Get image dimensions
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  // Simple implementation - in production use sharp or similar
  // For now, return default dimensions
  return { width: 0, height: 0 };
}
