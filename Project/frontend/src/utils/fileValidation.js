/**
 * Frontend File Upload Validation Helper
 */

/**
 * Validates image upload files (Avatar, Company Logo, Portfolio Images)
 * @param {File} file 
 * @param {number} maxMB Maximum allowed size in Megabytes (default 5MB)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateImageFile(file, maxMB = 5) {
  if (!file) {
    return { valid: false, message: 'Vui lòng chọn file hình ảnh.' };
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

  const isMimeValid = file.type && file.type.startsWith('image/');
  const isExtValid = allowedExtensions.includes(ext);

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      message: 'Định dạng file không hợp lệ. Chỉ chấp nhận các định dạng tệp ảnh (JPG, PNG, GIF, WEBP, SVG).'
    };
  }

  if (file.size > maxMB * 1024 * 1024) {
    return {
      valid: false,
      message: `Dung lượng ảnh (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn cho phép ${maxMB}MB.`
    };
  }

  return { valid: true };
}

/**
 * Validates general document/attachment uploads (GPKD, CCCD, Deliverables, Project Files)
 * @param {File} file 
 * @param {number} maxMB Maximum allowed size in Megabytes (default 50MB)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateDocumentFile(file, maxMB = 50) {
  if (!file) {
    return { valid: false, message: 'Vui lòng chọn tệp đính kèm.' };
  }

  // Security check: Block executable files
  const forbiddenExtensions = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.dll', '.scr', '.ps1', '.jar', '.app'];
  const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

  if (forbiddenExtensions.includes(ext)) {
    return {
      valid: false,
      message: `Tệp dạng thực thi (${ext}) không được phép tải lên hệ thống vì lý do an toàn bảo mật.`
    };
  }

  if (file.size > maxMB * 1024 * 1024) {
    return {
      valid: false,
      message: `Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn cho phép ${maxMB}MB.`
    };
  }

  return { valid: true };
}
