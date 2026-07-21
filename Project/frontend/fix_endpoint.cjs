const fs = require('fs');
let content = fs.readFileSync('../backend/src/main/java/com/cny/backend/admin/controller/AdminController.java', 'utf8');

const endpointCode = 
    @GetMapping("/vnpay-transactions")
    public ResponseEntity<org.springframework.data.domain.Page<PaymentTransaction>> getVnpayTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.getVnpayTransactions(page, size));
    }

    @PostMapping("/vnpay-transactions/{id}/reconcile")
    public ResponseEntity<Map<String, Object>> reconcileVnpayTransaction(@PathVariable int id) {
        // hardcode adminId 1 for now or get from context
        return ResponseEntity.ok(adminService.reconcileVnpayTransaction(id, 1));
    }
;

if (!content.includes('/vnpay-transactions')) {
    content = content.replace(
        'public class AdminController {',
        'public class AdminController {\n' + endpointCode
    );
    fs.writeFileSync('../backend/src/main/java/com/cny/backend/admin/controller/AdminController.java', content, 'utf8');
    console.log('Added endpoints');
} else {
    console.log('Endpoints already exist');
}
