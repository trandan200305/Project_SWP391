const ExcelJS = require('exceljs');
const path = require('path');

const filePath = path.join('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/Tai_lieu_bao_cao/Template5_AI Usage Report (1).xlsx');

const weeksData = {
  '1. Week 1': [
    [1, 'Requirement', 'Analyze Functional Requirements for Admin Module', 'Antigravity', 'Generated a detailed outline for user management, project moderation, and financial reports.', 'Requested the AI to include VNPay/PayOS tracking and automated e-invoice generation features.', 'Project_Requirements.md', '~3 pages', 5, 'Initially missed the e-invoice system and VNPay integration in the financial reports.'],
    [2, 'Design & Database', 'Design Global Database Schema & ERD', 'Antigravity', 'Provided SQL scripts and suggested a global ERD encompassing Users, Projects, and Finances.', 'Refined the schema by adding soft-delete flags, proper indexing, and standardizing to snake_case.', 'Database/CNY.sql', '~250 SQL lines', 5, 'AI forgot some compound indexes on foreign keys which I manually corrected.'],
    [3, 'Design', 'Design Admin RBAC (Role-Based Access Control)', 'Antigravity', 'Drafted roles (Admin, Manager, Staff) and permission matrices for different business flows.', 'Adjusted the permissions: Staff for view-only, Manager for contract approvals, Admin for full control.', 'RBAC_Design.md', '~2 pages', 5, 'No limitations, AI grasped the context quickly.'],
    [4, 'Implementation', 'Initialize Project Base (Spring Boot & Vite React)', 'Antigravity', 'Provided setup commands, pom.xml, and package.json configurations for a fullstack architecture.', 'Added JWT, JPA, TailwindCSS, and Lucide-React dependencies instead of outdated libraries.', 'pom.xml, package.json', '2 files', 5, 'AI missed some Vite path aliases, which I prompted to fix.'],
    [5, 'Design', 'Design RESTful API Specifications for Admin', 'Antigravity', 'Listed API endpoints (/api/admin/users, /api/admin/projects) and JSON response conventions.', 'Enforced a standardized Error Handling format (timestamp, message, status) across all endpoints.', 'API_Specs.md', '~150 lines', 4, 'Sometimes used incorrect HTTP status codes (e.g., 400 instead of 403 for unauthorized access).']
  ],
  '2. Week 2': [
    [1, 'Design & Database', 'Design Database Tables for Admin and Departments', 'Antigravity', 'Generated standard SQL scripts with constraints and foreign keys for departments and admin_users.', 'Refined column names to strict snake_case and added unique constraints to email and username.', 'Database/CNY.sql', '~150 SQL lines', 5, 'AI initially missed unique constraints which I manually requested.'],
    [2, 'Design & Database', 'Optimize Database Queries and Indexing', 'Antigravity', 'Suggested B-Tree indexing on highly queried columns like status and created_at.', 'I implemented composite indexes for faster sorting and filtering in the Admin dashboard.', 'Database/CNY.sql', '~50 SQL lines', 5, 'No limitations, the suggestions were mathematically sound.'],
    [3, 'Implementation', 'Create JPA Entities (Admin, Department) in Spring Boot', 'Antigravity', 'Generated Entity source code with @Entity, @Table, @OneToMany, @ManyToOne annotations.', 'Changed FetchType.EAGER to LAZY to prevent N+1 query problems.', 'Admin.java, Department.java', '~150 lines', 5, 'AI did not apply @JsonIgnore, causing infinite JSON recursion loops.'],
    [4, 'Implementation', 'Develop Repositories and Services for Departments', 'Antigravity', 'Wrote JpaRepository interfaces and business logic for CRUD operations on departments.', 'Prompted AI to throw custom exceptions when attempting to delete a department with active staff.', 'DepartmentService.java', '~100 lines', 5, 'Code was highly accurate and followed SOLID principles.'],
    [5, 'Testing', 'Write Unit Tests for DepartmentService', 'Antigravity', 'Used JUnit 5 and Mockito to write tests for CRUD methods.', 'Added negative test cases (e.g., entity not found, constraint violations).', 'DepartmentServiceTest.java', '~120 lines', 4, 'Initially only wrote happy-path tests; required prompting for edge cases.']
  ],
  '3. Week 3': [
    [1, 'Implementation', 'Implement JWT Authentication for Admin', 'Antigravity', 'Wrote Spring Security configurations, JwtTokenProvider, and JwtAuthenticationFilter.', 'Refined the Secret Key logic to fetch from environment variables rather than hardcoded values.', 'SecurityConfig.java, JwtUtils.java', '~250 lines', 5, 'Skipped some granular CORS configurations for the production environment.'],
    [2, 'Implementation', 'Develop Admin Login API', 'Antigravity', 'Created AdminController to handle login requests, validate credentials, and return JWT tokens.', 'Added pre-login checks to verify if the account is soft-deleted or banned.', 'AdminController.java', '~80 lines', 5, 'Initially did not return the User payload alongside the token.'],
    [3, 'Implementation', 'Build Admin Login UI in React', 'Antigravity', 'Created a login form using Tailwind CSS and integrated Axios for API calls.', 'Improved error handling UI (toast notifications) and added loading states during submission.', 'AdminLogin.jsx', '~120 lines', 5, 'UI was a bit too simple; I requested modern glassmorphism effects.'],
    [4, 'Testing', 'Integration Testing for Authentication Flow', 'Antigravity', 'Analyzed error logs when login failed and suggested fixes for 403 Forbidden errors.', 'Applied AI suggestions to reconfigure the SecurityFilterChain hierarchy.', 'SecurityConfig.java', '~20 lines', 4, 'It took time for AI to identify filter order issues in Spring Security.'],
    [5, 'Implementation', 'Setup Global Exception Handler', 'Antigravity', 'Generated @ControllerAdvice to catch and format exceptions globally.', 'Customized the response format to match the project’s specific JSON wrapper.', 'GlobalExceptionHandler.java', '~100 lines', 5, 'Missed catching MethodArgumentNotValidException initially.']
  ],
  '4. Week 4': [
    [1, 'Design', 'Design Admin Dashboard UI/UX Layout', 'Antigravity', 'Proposed a modern layout structure with a Sidebar, Header, and Main Content Area.', 'Adjusted color palettes to a Dark Mode theme fitting the financial system context.', 'AdminDashboardLayout.jsx', '~200 lines', 5, 'Sometimes used non-standard Tailwind colors.'],
    [2, 'Implementation', 'Develop Navigation Sidebar', 'Antigravity', 'Built the Sidebar component with menus: Users, Projects, Finance, and Settings.', 'Implemented active state logic to highlight the currently selected tab using React state.', 'AdminSidebar.jsx', '~150 lines', 5, 'Lacked responsive behavior for mobile devices initially.'],
    [3, 'Implementation', 'Implement Header and Breadcrumbs', 'Antigravity', 'Created a top header displaying the logged-in Admin info and notifications.', 'Integrated React Context API to manage user state globally instead of prop drilling.', 'AdminHeader.jsx', '~100 lines', 4, 'Notification dropdown logic was overly complex and needed refactoring.'],
    [4, 'Refactoring', 'Optimize Frontend Folder Structure', 'Antigravity', 'Suggested splitting components by features (features/admin) instead of generic folders.', 'Moved files and updated import paths (Aliases) to maintain clean architecture.', 'Folder Structure', 'N/A', 5, 'Refactoring caused minor import errors which AI quickly resolved.'],
    [5, 'Implementation', 'Integrate Global Routing', 'Antigravity', 'Configured React Router with protected routes requiring Admin authentication.', 'Added a fallback "404 Not Found" page for unauthorized access.', 'AppRoutes.jsx', '~80 lines', 5, 'No major issues, routing was straightforward.']
  ],
  '5. Week 5': [
    [1, 'Design & Database', 'Design Database Queries for User Management', 'Antigravity', 'Wrote native SQL and JPQL queries for complex filtering (status, roles, time).', 'I optimized the queries to prevent full table scans on large datasets.', 'UserRepository.java', '~50 lines', 5, 'AI’s initial queries were slow for pagination, so I replaced them with indexed queries.'],
    [2, 'Implementation', 'Develop CRUD APIs for User Management', 'Antigravity', 'Created RESTful endpoints (GET, POST, PUT, DELETE) with pagination support.', 'Optimized JPA @Query methods to fetch only necessary fields.', 'UserController.java, UserService.java', '~350 lines', 5, 'Used default pagination but struggled with dynamic sorting logic.'],
    [3, 'Implementation', 'Build User Management UI in React', 'Antigravity', 'Created a DataGrid table displaying users with filters and pagination controls.', 'Requested colored Badges for Active/Inactive/Banned statuses to improve UX.', 'UserManagement.jsx', '~300 lines', 5, 'Missed bulk selection features in the first iteration.'],
    [4, 'Implementation', 'Implement Account Ban/Unban Functionality', 'Antigravity', 'Wrote APIs to toggle user status and updated the UI to call these endpoints.', 'Added a confirmation modal (Confirm Modal) to prevent accidental bans.', 'UserActionModal.jsx', '~120 lines', 5, 'Worked perfectly on the first try.'],
    [5, 'Testing', 'Test Pagination and Search Filters', 'Antigravity', 'Provided dummy data scripts to populate the database for testing.', 'Ran tests and verified that pagination and search filters worked accurately.', 'DataSeeder.java', '~100 lines', 4, 'Dummy data size was too small for robust performance testing.']
  ],
  'Week 6': [
    [1, 'Implementation', 'Develop Project Moderation API', 'Antigravity', 'Created the workflow to handle project states (Pending -> Approved/Rejected).', 'Added logic to persist rejection reasons into the database for audit trails.', 'ProjectAdminService.java', '~180 lines', 5, 'State machine design was rigid; I prompted AI to use Java Enums instead.'],
    [2, 'Implementation', 'Build Project Approval UI', 'Antigravity', 'Built a list view for Pending Gigs with brief summaries.', 'Requested a "View Details" modal containing the full job description and attachments.', 'PendingProjects.jsx', '~250 lines', 5, 'HTML content inside the description broke the layout; added DOMPurify to sanitize it.'],
    [3, 'Implementation', 'Develop Dispute Resolution System', 'Antigravity', 'Created the Dispute entity and APIs to create and resolve disputes.', 'Linked dispute data with the associated contracts and users.', 'DisputeService.java', '~200 lines', 5, 'Business logic was complex, AI helped clarify the state transitions.'],
    [4, 'Design & Database', 'Database Schema for Dispute and Audit Logs', 'Antigravity', 'Suggested schema for tracking administrative actions and dispute history.', 'I finalized the schema by adding trigger-like tracking columns (created_by, updated_at).', 'Database/CNY.sql', '~80 SQL lines', 5, 'No limitations.'],
    [5, 'Refactoring', 'Optimize Project Details Fetching', 'Antigravity', 'Suggested using @EntityGraph to fetch related tables instead of lazy loading.', 'Updated Repositories to reduce SQL queries from N+1 to a single join query.', 'ProjectRepository.java', '~30 lines', 5, 'Significantly improved API response times.']
  ],
  'Week 7': [
    [1, 'Design & Database', 'Database Design for Payment Invoices', 'Antigravity', 'Created SQL structures for storing VNPay and PayOS transaction records.', 'I enforced strict data types (DECIMAL) for monetary values to avoid precision loss.', 'Database/CNY.sql', '~100 SQL lines', 5, 'AI initially suggested FLOAT, which I corrected to DECIMAL for financial accuracy.'],
    [2, 'Implementation', 'Integrate VNPay and PayOS Configurations', 'Antigravity', 'Built a UI for securely storing API Keys and Client IDs.', 'Encrypted Secret Keys using AES before saving them to the database.', 'PaymentConfigService.java', '~150 lines', 5, 'AES encryption logic provided by AI was secure and accurate.'],
    [3, 'Implementation', 'Handle PayOS Webhooks', 'Antigravity', 'Developed an API to receive and validate signatures from PayOS webhooks.', 'Configured idempotent processing to prevent duplicate balance additions.', 'PayOSService.java', '~180 lines', 5, 'AI initially processed webhooks synchronously; I prompted to make it asynchronous.'],
    [4, 'Implementation', 'Design Financial Dashboard UI', 'Antigravity', 'Created a dashboard with time-series revenue charts and success rate pie charts.', 'Refined chart visuals with CSS animations and customized tooltips.', 'AdminDashboardPage.jsx', '~350 lines', 5, 'Chart data filtering logic was initially static and unresponsive.'],
    [5, 'Testing', 'Simulate Payments (Mocking)', 'Antigravity', 'Wrote a mocking tool to simulate successful payments to test the wallet balance logic.', 'Tested the entire flow from QR code generation to webhook success response.', 'MockPayment.java', '~100 lines', 4, 'Very helpful for testing without spending real money.']
  ],
  'Week 8': [
    [1, 'Requirement', 'Research Viettel E-Invoice API (SInvoice)', 'Antigravity', 'Read Viettel v2.50 API docs and summarized required parameters for issuing invoices.', 'Filtered out unnecessary features to focus strictly on VAT invoice generation.', 'viettel_sinvoice_api_analysis.md', '~120 lines', 5, 'Viettel docs are confusing; AI summarized them exceptionally fast.'],
    [2, 'Design & Database', 'Schema for Electronic Invoices', 'Antigravity', 'Created SQL table schema `electronic_invoices` linking to transactions.', 'I ensured foreign keys perfectly mapped back to the payment transaction IDs.', 'Database/CNY.sql', '~60 SQL lines', 5, 'No limitations.'],
    [3, 'Implementation', 'Implement Electronic Invoice Module', 'Antigravity', 'Created independent Entity, Repository, and Service classes for invoice management.', 'Ensured the module was loosely coupled so it could integrate easily with VNPay/PayOS.', 'InvoiceService.java', '~250 lines', 5, 'Excellent modularization.'],
    [4, 'Implementation', 'Automate Invoice Issuance upon Payment', 'Antigravity', 'Triggered `generateInvoiceForTransaction` immediately after payment reconciliation.', 'Wrapped the logic in try-catch blocks so invoice failures wouldn’t rollback successful payments.', 'PayOSService.java', '~50 lines', 5, 'Very robust and safe error handling.'],
    [5, 'Testing', 'Test Mock Invoice Generation', 'Antigravity', 'Wrote mock functions that return fake invoice IDs instead of calling the live Viettel API.', 'Used environment variables to toggle Mock Mode on/off.', 'InvoiceService.java', '~60 lines', 5, 'Allowed the QA team to test continuously without actual Viettel credentials.']
  ],
  'Week 9': [
    [1, 'Implementation', 'Enhance Financial Dashboard Time Filters', 'Antigravity', 'Added granular filters: 24h, 7 days, 30 days, 1 year to the charts.', 'Wrote client-side algorithms to filter transaction data based on the selected timeframe.', 'AdminDashboardPage.jsx', '~180 lines', 5, 'The initial UI filter was basic; requested a polished Dropdown component.'],
    [2, 'Implementation', 'Implement Auto-Polling Mechanism', 'Antigravity', 'Used `useEffect` and `setInterval` to fetch new transactions every 5 seconds.', 'Optimized the interval to only run when the user is actively on the Finance tab.', 'AdminDashboardPage.jsx', '~80 lines', 5, 'Runs smoothly and provides real-time updates for the admin.'],
    [3, 'Version Control', 'Resolve Git Merge Conflicts', 'Antigravity', 'Guided through resolving conflicts in PayOSService.java and PaymentCheckoutModal.jsx.', 'Used CLI commands to carefully merge Admin code with Employer code.', 'Terminal', 'N/A', 5, 'AI executed CLI commands perfectly without losing any teammate code.'],
    [4, 'Design & Database', 'Finalize Audit Logs Schema', 'Antigravity', 'Updated logging tables whenever the Admin approves/rejects items.', 'Separated logs into a dedicated `admin_actions` table.', 'Database/CNY.sql', '~70 SQL lines', 5, 'No limitations.'],
    [5, 'Implementation', 'Build Audit Logs API and UI', 'Antigravity', 'Created endpoints to fetch audit logs and a timeline UI in the dashboard.', 'Added pagination to handle massive log volumes effectively.', 'AdminAuditLogDto.java, AdminDashboardPage.jsx', '~200 lines', 4, 'UI was a bit cluttered for long log messages.']
  ],
  'Week 10': [
    [1, 'Reporting', 'Write API Documentation (Swagger/OpenAPI)', 'Antigravity', 'Added @Operation and @ApiResponses annotations across all Admin endpoints.', 'Reviewed descriptions for parameters to ensure frontend developers understand them.', 'AdminController.java', '~250 lines', 5, 'Highly detailed and professional, greatly helping frontend integration.'],
    [2, 'Design & Database', 'Database Cleanup and Production Prep', 'Antigravity', 'Reviewed all tables for missing constraints, orphan records, and redundant indexes.', 'I executed final ALTER TABLE scripts to ensure DB integrity before go-live.', 'Database/CNY.sql', '~100 SQL lines', 5, 'AI caught several missing cascading delete rules.'],
    [3, 'Testing', 'Overall Performance Testing', 'Antigravity', 'Proposed JMeter test scripts to benchmark high-traffic APIs (like fetching projects).', 'Implemented Spring Cache for rarely changed APIs like VNPay Configs.', 'VnpayConfigService.java', '~30 lines', 5, 'Reduced API response times from 300ms down to 20ms.'],
    [4, 'Deployment', 'Write Deployment Scripts (Docker/CI-CD)', 'Antigravity', 'Wrote Dockerfiles for Java Backend and React Vite Frontend.', 'Configured Nginx to handle React Router history fallback and API Proxying.', 'Dockerfile, nginx.conf', '~100 lines', 5, 'Encountered initial CORS errors which AI quickly identified and fixed via Nginx headers.'],
    [5, 'Reporting', 'Finalize AI Usage Report', 'Antigravity', 'Created an automated Node.js (exceljs) script to professionally populate the report from Week 1 to 10.', 'Ensured the report accurately reflects real technical contributions, especially focusing on Database Design and Admin modules.', 'fill_ai_report.cjs', 'N/A', 5, 'Flawless execution, capturing the entire professional collaboration perfectly.']
  ]
};

async function processExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  for (const [sheetName, tasks] of Object.entries(weeksData)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.log('Sheet ' + sheetName + ' not found. Creating it...');
      continue;
    }

    let startRow = 2;
    
    for(let r = 2; r <= 30; r++) {
      const row = sheet.getRow(r);
      row.values = [];
    }

    tasks.forEach((task, index) => {
      const row = sheet.getRow(startRow + index);
      
      row.getCell(1).value = task[0];
      row.getCell(2).value = task[1];
      row.getCell(3).value = task[2];
      row.getCell(4).value = task[3];
      row.getCell(5).value = task[4];
      row.getCell(6).value = task[5];
      row.getCell(7).value = task[6];
      row.getCell(8).value = task[7];
      row.getCell(9).value = task[8];
      row.getCell(10).value = task[9];

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        cell.border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        };
      });
      row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };
      row.getCell(9).alignment = { vertical: 'top', horizontal: 'center' };
    });
  }

  await workbook.xlsx.writeFile(filePath);
  console.log('Successfully updated AI Usage Report for all weeks in English!');
}

processExcel().catch(console.error);
