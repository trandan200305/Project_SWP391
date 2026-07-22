package com.cny.backend.upload.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    private static final String UPLOADS_DIR = "uploads";
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    // Danh sách các định dạng bị CẤM hoàn toàn (file thực thi / mã độc nguy hiểm)
    private static final Set<String> FORBIDDEN_EXTENSIONS = new HashSet<>(Arrays.asList(
        "exe", "bat", "cmd", "sh", "msi", "vbs", "ps1", "scr", "com", "pif", 
        "dll", "jar", "php", "jsp", "asp", "aspx", "pl", "py", "cgi", "js", "html", "htm"
    ));

    // Danh sách các loại file AN TOÀN cho phép tải lên database (Ảnh, Tài liệu, File nén...)
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
        // Ảnh
        "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "ico", "heic",
        // Tài liệu
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv", "odt", "ods",
        // File nén
        "zip", "rar", "7z", "tar", "gz"
    ));

    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "File tải lên không có dữ liệu (file rỗng).");
            return ResponseEntity.badRequest().body(response);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            response.put("success", false);
            response.put("message", "Dung lượng file vượt quá giới hạn tối đa cho phép (50MB).");
            return ResponseEntity.badRequest().body(response);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        String extLower = "";
        if (originalFilename != null && originalFilename.lastIndexOf('.') != -1) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            extLower = extension.substring(1).toLowerCase();
        }

        // 1. Kiểm tra file bị cấm
        if (FORBIDDEN_EXTENSIONS.contains(extLower)) {
            response.put("success", false);
            response.put("message", "Định dạng file thực thi bị cấm bởi lý do bảo mật hệ thống (Không chấp nhận file ." + extLower + ").");
            return ResponseEntity.badRequest().body(response);
        }

        // 2. Kiểm tra định dạng hợp lệ
        if (!extLower.isEmpty() && !ALLOWED_EXTENSIONS.contains(extLower)) {
            response.put("success", false);
            response.put("message", "Định dạng file ." + extLower + " không nằm trong danh sách tài liệu/hình ảnh được hỗ trợ.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            File dir = new File(UPLOADS_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Tránh trùng lặp tên file
            String uniqueName = UUID.randomUUID().toString() + extension;

            // Lưu file vào ổ cứng máy chủ
            Path path = Paths.get(UPLOADS_DIR, uniqueName);
            Files.write(path, file.getBytes());

            String fileUrl = "http://localhost:8080/api/uploads/" + uniqueName;

            response.put("success", true);
            response.put("fileUrl", fileUrl);
            response.put("fileName", originalFilename);
            response.put("fileSize", file.getSize());
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Không thể lưu file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

