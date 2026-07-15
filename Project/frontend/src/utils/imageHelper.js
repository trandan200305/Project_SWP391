export const getImageUrl = (imageNameOrUrl) => {
  if (!imageNameOrUrl) return '';
  // If it's a full URL or base64, return as is
  if (
    imageNameOrUrl.startsWith('http://') || 
    imageNameOrUrl.startsWith('https://') || 
    imageNameOrUrl.startsWith('data:')
  ) {
    return imageNameOrUrl;
  }
  // Otherwise, construct the full URL pointing to the server
  return `http://localhost:8080/api/uploads/${imageNameOrUrl}`;
};

export const getFilenameFromUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.substring(url.lastIndexOf('/') + 1);
  }
  return url;
};
