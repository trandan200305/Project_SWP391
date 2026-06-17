package com.cny.backend.upload.controller;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "*")
public class UploadController {

    private static final String UPLOADS_DIR = "uploads";

    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "File is empty");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            
            File dir = new File(UPLOADS_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.lastIndexOf('.') != -1) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }
            String uniqueName = UUID.randomUUID().toString() + extension;

            
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
            response.put("message", "Failed to store file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
