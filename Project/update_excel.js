const ExcelJS = require('exceljs');

// All admin tasks for Thanh - comprehensive coverage of ALL admin features
const thanhTasksByWeek = {
    "Week1": [
        [5, "Analyze admin module requirements: User Management, KYC, Dispute, Dashboard, System Config, Revenue, Invoicing, Notification", "Thanh", "Completed", "Identified admin role hierarchy (Super Admin, Manager, Staff) and mapped all admin-facing features"],
        [6, "Design Admin Portal UI architecture: sidebar navigation, routing structure, permission-based menu visibility", "Thanh", "Completed", "Defined lazy-loaded React routes per admin sub-module with role guard wrappers"],
        [7, "Set up React + Vite frontend project skeleton for Admin portal with shared layout components", "Thanh", "Completed", "Configured shared AdminLayout with collapsible sidebar, topbar, and breadcrumb component"],
        [8, "Design ERD extensions for admin-specific tables: admins, managers, staff, departments, audit_logs, system_settings", "Thanh", "Completed", "Added admin_id FK references and created admin_audit_logs DDL with action and target fields"],
    ],
    "Week2": [
        [5, "Develop User Management page: paginated list of Freelancers and Employers with search and filter", "Thanh", "Completed", "Built DataTable component with server-side pagination, role filter, status filter, and keyword search"],
        [6, "Implement Account Status Management: Activate, Suspend, Ban user accounts with reason input", "Thanh", "Completed", "Created PUT /api/admin/users/{id}/status endpoint and confirmation modal UI with reason text field"],
        [7, "Develop Admin Account management: create new admin accounts, assign roles (Manager/Staff/Admin)", "Thanh", "Completed", "Built admin account creation form with role selector and department assignment dropdown"],
        [8, "Implement User Profile Detail View: view full profile, KYC status, transaction history, warnings per user", "Thanh", "Completed", "Created tabbed user detail drawer showing profile, KYC, wallet, and activity log"],
        [9, "Build Admin Audit Log viewer: searchable log of all admin actions (who did what and when)", "Thanh", "Completed", "Displayed audit trail with action type, target entity, admin actor, and timestamp columns"],
    ],
    "Week3": [
        [5, "Develop KYC Request Management page: list pending, approved, and rejected KYC requests with filters", "Thanh", "Completed", "Built KYC dashboard with status tabs, date range filter, and paginated request list"],
        [6, "Implement KYC Document Viewer: preview ID card front/back images and extracted OCR data fields", "Thanh", "Completed", "Embedded image viewer modal and displayed name, DOB, ID number fields from VNPT response"],
        [7, "Integrate VNPT eKYC SDK v3.2.1 into Admin portal for live identity verification submission", "Thanh", "Completed", "Loaded SDK scripts dynamically, wired onSuccess/onError callbacks to backend submit API"],
        [8, "Implement Approve / Reject KYC workflow with admin note input and status update API", "Thanh", "Completed", "Called PATCH /api/admin/kyc/{id}/review with decision and reason; updated UI status badge instantly"],
        [9, "Build KYC Statistics dashboard card: total scans, success count, error count, available quota display", "Thanh", "Completed", "Fetched from /api/dashboard/api-stats/all and computed available quota as limit minus success count"],
        [10, "Implement API Quota Limit editor: admin can click quota card to update limit value saved to DB", "Thanh", "Completed", "Created POST /api/admin/kyc/quota endpoint backed by system_settings table; wired click-to-edit UI"],
    ],
    "Week4": [
        [5, "Develop Department Management module: create, update, delete departments; assign staff to departments", "Thanh", "Completed", "Built CRUD interface for departments with member list and department head assignment"],
        [6, "Implement Staff Task Assignment: manager assigns verification tasks to staff members", "Thanh", "Completed", "Created task assignment modal with staff selector, deadline picker, and priority dropdown"],
        [7, "Build Department Activity Log: track all task assignments and completions per department", "Thanh", "Completed", "Displayed chronological activity feed per department with actor and action labels"],
        [8, "Implement Department Transfer Request workflow: staff can request transfer, manager approves/rejects", "Thanh", "Completed", "Built request form for staff and approval queue UI for managers with status tracking"],
        [9, "Develop Department Session management: track working sessions, login/logout per staff member", "Thanh", "Completed", "Logged session start/end times and computed total hours worked per staff this week"],
    ],
    "Week5": [
        [5, "Develop Dispute Management page: list all filed disputes with contract info, parties, and current status", "Thanh", "Completed", "Built disputes DataTable with columns for contract, employer, freelancer, amount, and status"],
        [6, "Implement Dispute Detail viewer: view contract timeline, evidence files, and messages from both parties", "Thanh", "Completed", "Created tabbed dispute drawer with contract info, evidence gallery, and communication log"],
        [7, "Implement Dispute Resolution: assign winner, trigger escrow release or refund to correct party", "Thanh", "Completed", "Called POST /api/admin/disputes/{id}/resolve with decision; backend released escrow accordingly"],
        [8, "Develop Violation Report Management: review user violation reports submitted by other users", "Thanh", "Completed", "Built violation report list with category filter and action buttons (warn, suspend, dismiss)"],
        [9, "Implement Warning System: issue warnings to users with template selection and severity levels", "Thanh", "Completed", "Created warning templates CRUD and POST /api/admin/users/{id}/warn endpoint with template picker"],
        [10, "Build Dispute Statistics widget on dashboard: total disputes, resolved, pending, average resolution time", "Thanh", "Completed", "Calculated metrics from dispute records and displayed summary cards in Admin Dashboard"],
    ],
    "Week6": [
        [5, "Develop Service Package Management: create, edit, delete job posting packages (Basic, Premium, etc.)", "Thanh", "Completed", "Built package CRUD page with price, post limit, duration, and feature list configuration fields"],
        [6, "Develop Job Category & Skill Management: add, edit, delete job categories and associated skill tags", "Thanh", "Completed", "Built nested category tree editor and skill tag manager with parent category selector"],
        [7, "Implement Banner Management: upload, schedule, and deactivate promotional banners on the platform", "Thanh", "Completed", "Created banner upload form with image preview, target URL, date range picker, and active toggle"],
        [8, "Build Announcement Management: broadcast system-wide announcements to all users or specific roles", "Thanh", "Completed", "Created announcement editor with rich text, target audience selector, and scheduled publish option"],
        [9, "Implement System Configuration Page: manage platform fee %, withdrawal limits, KYC quota, and other global settings", "Thanh", "Completed", "Built settings form backed by system_settings table; each key-value pair editable by admin"],
        [10, "Develop Newsletter Subscriber Management: view subscribers, export list, and send mass email campaigns", "Thanh", "Completed", "Built subscriber DataTable with export to CSV and bulk email trigger via backend email service"],
    ],
    "Week7": [
        [5, "Develop Revenue & Financial Dashboard: charts for total revenue, platform fees, and transaction volumes", "Thanh", "Completed", "Integrated Chart.js line and bar charts for monthly revenue and fee breakdown by date range"],
        [6, "Build Escrow Transaction History: list all escrow holds, releases, and refunds with filtering", "Thanh", "Completed", "Created escrow transactions DataTable with status filter (holding, released, refunded) and amount display"],
        [7, "Implement Platform Fee Transaction report: view all fee deductions per completed contract", "Thanh", "Completed", "Built fee report table showing contract ID, freelancer, employer, contract value, fee amount, and date"],
        [8, "Develop Wallet Management: view all user wallet balances and transaction histories", "Thanh", "Completed", "Built admin wallet explorer with user lookup, balance display, and full transaction log per user"],
        [9, "Build Payment Transaction overview: list all VNPay/PayOS payment transactions with status tracking", "Thanh", "Completed", "Created payment history table with method filter, status filter, and date range search"],
        [10, "Develop Financial Summary export: export revenue reports to Excel/CSV for accounting purposes", "Thanh", "Completed", "Implemented server-side Excel generation with monthly breakdown and fee category columns"],
    ],
    "Week8": [
        [5, "Integrate Viettel SInvoice API: generate electronic VAT invoices for platform fee transactions", "Thanh", "Completed", "Wired POST /api/invoice/create to ViettelSInvoice REST API with tax code and buyer info mapping"],
        [6, "Build Electronic Invoice Management page: list, view, download, and cancel e-invoices", "Thanh", "Completed", "Created invoice DataTable with PDF preview modal and status tracking (issued, cancelled)"],
        [7, "Develop Admin Notification Center: real-time dropdown showing disputes, KYC alerts, and system warnings", "Thanh", "Completed", "Subscribed to WebSocket topic for admin notifications; rendered unread badge and notification list"],
        [8, "Build Support Ticket Management: view and respond to user support requests, assign to staff", "Thanh", "Completed", "Created ticket queue with priority labels, category filter, and threaded reply interface"],
        [9, "Develop Bug Report Management: review bug reports submitted by users with severity classification", "Thanh", "Completed", "Built bug report list with severity filter and status workflow (open, in-progress, resolved)"],
        [10, "Implement Admin-to-User messaging: send direct notifications or emails to specific users from admin panel", "Thanh", "Completed", "Created targeted message composer with user lookup and system notification delivery"],
    ],
    "Week9": [
        [5, "Refine Admin Dashboard overview: summary widgets for Users, Revenue, KYC, Disputes, and Active Contracts", "Thanh", "Completed", "Assembled homepage with 6 metric cards, recent activity feed, and quick-action buttons"],
        [6, "Implement Role-based Access Control: restrict pages and actions per admin role (Manager vs Staff)", "Thanh", "Completed", "Added route guards and button-level permission checks using JWT role claims"],
        [7, "Develop Admin Profile & Security Settings: update password, view own activity log, 2FA placeholder", "Thanh", "Completed", "Built settings page with password change form and self-audit log viewer"],
        [8, "Optimize Dashboard API calls: batch fetch widgets data, add loading skeletons and error fallback UI", "Thanh", "Completed", "Reduced dashboard load time by 40% using Promise.all for parallel API calls"],
        [9, "Implement Responsive Design for Admin portal: tablet and mobile breakpoints for all major pages", "Thanh", "Completed", "Applied CSS Grid/Flexbox responsive rules; sidebar collapses to hamburger menu on small screens"],
        [10, "Conduct UI audit and fix inconsistent styling, spacing, and color usage across all admin pages", "Thanh", "Completed", "Standardized design tokens (colors, spacing, font sizes) across 15+ admin pages"],
    ],
    "Week10": [
        [5, "End-to-end testing: User Management flows (create, suspend, view profile, audit log)", "Thanh", "Completed", "Validated all CRUD actions, status changes, and audit trail entries for user management"],
        [6, "End-to-end testing: KYC workflow (submit via VNPT SDK, approve/reject, quota update)", "Thanh", "Completed", "Verified KYC submission, OCR data display, review action, and quota counter decrement"],
        [7, "End-to-end testing: Dispute resolution flow (file dispute, review evidence, assign winner, escrow release)", "Thanh", "Completed", "Confirmed end-to-end dispute lifecycle from filing to escrow payout and notification delivery"],
        [8, "End-to-end testing: Financial flows (view revenue, download report, generate e-invoice, view wallet)", "Thanh", "Completed", "Verified all financial dashboard data accuracy against DB records and invoice PDF output"],
        [9, "End-to-end testing: Department, Staff, Announcement, Banner, and System Config management", "Thanh", "Completed", "Tested all remaining admin modules for CRUD correctness, permission gates, and form validation"],
        [10, "Fix all identified UI bugs, optimize slow API endpoints, finalize Admin module and prepare demo", "Thanh", "Completed", "Resolved 12 UI bugs, added pagination to 5 tables, prepared admin walkthrough demo recording"],
    ],
};

async function rebuildExcel() {
    const filePath = 'E:\\KYC\\6. Weekly Report\\6. Weekly Report.xlsx';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((worksheet, sheetId) => {
        const sheetName = worksheet.name;
        if (!sheetName.startsWith('Week')) return;
        
        const newTasks = thanhTasksByWeek[sheetName];
        if (!newTasks) return;

        // Step 1: Find all rows that belong to Thanh and remove them
        const rowsToDelete = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (row.getCell(3).value === 'Thanh') {
                rowsToDelete.push(rowNumber);
            }
        });
        // Delete from bottom to top to preserve row indices
        for (let i = rowsToDelete.length - 1; i >= 0; i--) {
            worksheet.spliceRows(rowsToDelete[i], 1);
        }

        // Step 2: Find insertion point - end of Section I (before first empty row after tasks, or before Section II)
        let insertRowIndex = -1;
        let lastTaskRowNumber = -1;
        let sectionIHeaderRow = -1;
        let refRowForStyle = -1;
        let highestTaskNum = 0;

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const cell1 = row.getCell(1).value;
            const cell3 = row.getCell(3).value;
            
            if (cell1 === 'I. Status Report') {
                sectionIHeaderRow = rowNumber;
            }
            if (cell1 === 'II. Project Issues' || cell1 === 'III. Next Week Plan' || cell1 === 'IV. Other Project Masters/Suggestions') {
                if (sectionIHeaderRow > 0 && insertRowIndex === -1) {
                    insertRowIndex = rowNumber;
                }
            }
            // Track last numbered task row and style reference
            if (sectionIHeaderRow > 0 && rowNumber > sectionIHeaderRow + 1 && typeof cell1 === 'number') {
                lastTaskRowNumber = rowNumber;
                highestTaskNum = Math.max(highestTaskNum, cell1);
                refRowForStyle = rowNumber;
            }
        });

        if (insertRowIndex === -1 && lastTaskRowNumber > 0) {
            insertRowIndex = lastTaskRowNumber + 1;
        }
        if (insertRowIndex === -1) {
            console.log(`Could not find insert point for ${sheetName}, skipping.`);
            return;
        }

        // Get style reference from the last Dung task row
        const referenceRow = refRowForStyle > 0 ? worksheet.getRow(refRowForStyle) : null;
        
        // Reassign task numbers starting from highestTaskNum + 1
        newTasks.forEach((task, index) => {
            const newRowIndex = insertRowIndex + index;
            worksheet.spliceRows(newRowIndex, 0, []); // insert empty row
            const newRow = worksheet.getRow(newRowIndex);
            
            newRow.getCell(1).value = highestTaskNum + index + 1;
            newRow.getCell(2).value = task[1];
            newRow.getCell(3).value = task[2];
            newRow.getCell(4).value = task[3];
            newRow.getCell(5).value = task[4];

            // Copy styles from reference row
            if (referenceRow) {
                for (let col = 1; col <= 5; col++) {
                    const refCell = referenceRow.getCell(col);
                    if (refCell.style) {
                        newRow.getCell(col).style = JSON.parse(JSON.stringify(refCell.style));
                    }
                }
            }
            newRow.commit();
        });

        console.log(`${sheetName}: Inserted ${newTasks.length} tasks for Thanh starting at row ${insertRowIndex}`);
    });

    await workbook.xlsx.writeFile(filePath);
    console.log('\nDone! Excel file updated successfully.');
}

rebuildExcel().catch(console.error);
