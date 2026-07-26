const ExcelJS = require('exceljs');

// Dates map (Excel serial numbers) per week for Section III/IV
const weekDates = {
    "Week1":  { next: 46166, suggestion: 46157 },
    "Week2":  { next: 46173, suggestion: 46164 },
    "Week3":  { next: 46180, suggestion: 46171 },
    "Week4":  { next: 46187, suggestion: 46178 },
    "Week5":  { next: 46194, suggestion: 46185 },
    "Week6":  { next: 46201, suggestion: 46192 },
    "Week7":  { next: 46208, suggestion: 46199 },
    "Week8":  { next: 46215, suggestion: 46206 },
    "Week9":  { next: 46222, suggestion: 46213 },
    "Week10": { next: 46229, suggestion: 46220 },
};

// Section II: Issues Thanh encountered each week
const thanhIssues = {
    "Week1": [
        ["Admin portal route guard caused infinite redirect loop when JWT token expired during session", "Thanh", "Completed", "Added token expiry check before route evaluation and redirected to login page on expiry"],
        ["Sidebar navigation did not highlight active menu item correctly on deep nested routes", "Thanh", "Completed", "Used React Router useLocation() hook to match pathname prefix for active state styling"],
    ],
    "Week2": [
        ["Admin user list API returned all users at once, causing slow load on large datasets", "Thanh", "Completed", "Switched to server-side pagination with page/size query params; reduced initial load to <200ms"],
        ["Account suspension confirmation modal closed unexpectedly on outside click, losing reason text", "Thanh", "Completed", "Disabled backdrop dismiss and added Cancel button for explicit close action"],
    ],
    "Week3": [
        ["VNPT eKYC SDK scripts failed to load in production due to incorrect public folder path", "Thanh", "Completed", "Moved SDK files to /public/ekyc/ and updated script src paths to use root-relative URLs"],
        ["KYC approve/reject API returned 500 error when request body contained null fields", "Thanh", "Completed", "Added null-safety checks in AdminKycController and defaulted missing fields to empty strings"],
    ],
    "Week4": [
        ["Department member assignment form did not reflect real-time changes when staff was added", "Thanh", "Completed", "Refetched department member list after each successful assignment API call"],
        ["Task assignment deadline date picker did not validate past dates, allowing invalid submissions", "Thanh", "Completed", "Added minDate constraint to date picker set to today's date"],
    ],
    "Week5": [
        ["Dispute list page did not auto-refresh after admin resolved a dispute from the detail drawer", "Thanh", "Completed", "Triggered list refetch via callback after successful resolve API response"],
        ["Warning template selector rendered blank on first open due to async data not yet loaded", "Thanh", "Completed", "Added loading spinner inside dropdown and awaited template list fetch before rendering"],
    ],
    "Week6": [
        ["Service package edit form reset all fields when switching between packages quickly", "Thanh", "Completed", "Memoized form state per package ID and reset only when package ID changes"],
        ["Banner image upload failed silently for files larger than 2MB without user feedback", "Thanh", "Completed", "Added client-side file size validation with clear error message before upload attempt"],
    ],
    "Week7": [
        ["Revenue chart showed incorrect totals when date range spanned across months with missing data", "Thanh", "Completed", "Filled missing date entries with zero values before rendering Chart.js dataset"],
        ["Escrow history filter by status returned cached stale data after resolving a dispute", "Thanh", "Completed", "Disabled query caching for escrow endpoint and forced fresh fetch on filter change"],
    ],
    "Week8": [
        ["Viettel SInvoice API rejected invoice creation when buyer tax code field was empty string", "Thanh", "Completed", "Set buyer tax code to 'N/A' default value when not provided by the transaction record"],
        ["Admin notification WebSocket connection failed silently when backend restarted during session", "Thanh", "Completed", "Implemented auto-reconnect with exponential backoff on STOMP connection error event"],
    ],
    "Week9": [
        ["Role-based route guard allowed Staff users to access Manager-only config pages via direct URL", "Thanh", "Completed", "Added server-side permission validation on all Manager-restricted API endpoints"],
        ["Admin dashboard widgets showed stale data after navigating back from detail pages", "Thanh", "Completed", "Added useEffect dependency on navigation pathname to refetch widget data on return"],
    ],
    "Week10": [
        ["E2E test revealed escrow release did not trigger wallet balance update for freelancer", "Thanh", "Completed", "Fixed backend service to update wallet balance atomically within the same DB transaction"],
        ["PDF invoice preview modal did not render correctly on Firefox due to iframe sandbox restrictions", "Thanh", "Completed", "Switched from iframe to object tag with application/pdf type for cross-browser compatibility"],
    ],
};

// Section III: Next Week Plans for Thanh
const thanhNextWeekPlan = {
    "Week1": [
        ["Set up Admin portal User Management page with paginated user list, search, and role filter", "Thanh", "Implement account status management (Activate/Suspend) and admin account creation form"],
    ],
    "Week2": [
        ["Build KYC Management page for admin with pending/approved/rejected filter tabs", "Thanh", "Integrate VNPT eKYC SDK and implement KYC approve/reject workflow with admin note input"],
    ],
    "Week3": [
        ["Develop Department Management module and Staff Task Assignment feature", "Thanh", "Build department CRUD, member assignment, and task assignment with deadline tracking"],
    ],
    "Week4": [
        ["Build Dispute Management dashboard and Violation Report review module", "Thanh", "Implement dispute resolution with escrow release and user warning system with templates"],
    ],
    "Week5": [
        ["Develop Service Package, Banner, Announcement, and System Configuration management", "Thanh", "Build CRUD pages for all platform-level config; integrate system_settings table for global config"],
    ],
    "Week6": [
        ["Build Revenue & Financial Dashboard with Chart.js charts and Escrow Transaction History", "Thanh", "Implement monthly revenue visualization, fee report table, and Excel export functionality"],
    ],
    "Week7": [
        ["Integrate Viettel SInvoice API and build Electronic Invoice Management page", "Thanh", "Wire e-invoice creation for platform fee transactions; build invoice list with PDF preview"],
    ],
    "Week8": [
        ["Refine Admin UI/UX, implement responsive design, and enforce role-based access control", "Thanh", "Audit all admin pages for consistency; restrict Manager-only pages using JWT role claims"],
    ],
    "Week9": [
        ["Perform end-to-end testing for all Admin modules and fix identified bugs", "Thanh", "Test User Mgmt, KYC, Disputes, Finance, Departments, Config, Invoices, and Notifications"],
    ],
    "Week10": [
        ["Finalize Admin module documentation, prepare demo recording and project handover", "Thanh", "Record admin walkthrough video covering all features; compile technical notes for handover"],
    ],
};

// Section IV: Suggestions from Thanh
const thanhSuggestions = {
    "Week1": [
        ["Recommend implementing a shared AdminLayout wrapper component to avoid duplicating sidebar and topbar across all admin pages", "Thanh", "Reduces code duplication and ensures consistent navigation structure across entire admin portal"],
    ],
    "Week2": [
        ["Propose adding server-side search indexing on user email and name fields for faster admin user lookup", "Thanh", "Full-text search index on users table would reduce query time significantly as user base grows"],
    ],
    "Week3": [
        ["Suggest storing KYC quota limit in a system_settings database table instead of hardcoding in frontend", "Thanh", "Allows admin to update quota limit dynamically through UI without requiring code deployment"],
    ],
    "Week4": [
        ["Propose adding an activity timeline view per department showing all task completions and transfers in chronological order", "Thanh", "Provides managers with a clear audit trail of department operations without querying raw logs"],
    ],
    "Week5": [
        ["Recommend auto-notifying both parties (employer and freelancer) via email when a dispute decision is made", "Thanh", "Ensures transparent dispute resolution communication and reduces follow-up support tickets"],
    ],
    "Week6": [
        ["Suggest adding a preview mode for Announcements before publishing to all users", "Thanh", "Allows admin to review exact message formatting and audience targeting before broadcast"],
    ],
    "Week7": [
        ["Propose adding a monthly automated financial summary email sent to Super Admin with key revenue metrics", "Thanh", "Reduces need for manual report generation and keeps management informed of platform health"],
    ],
    "Week8": [
        ["Recommend implementing a notification preferences setting allowing admins to choose which alert types they receive", "Thanh", "Prevents notification overload by letting admins subscribe only to relevant event types"],
    ],
    "Week9": [
        ["Suggest creating a reusable PermissionGuard component that accepts required role as prop for cleaner access control", "Thanh", "Centralizes permission logic and makes it easier to add new restricted pages in the future"],
    ],
    "Week10": [
        ["Propose adding a system health monitoring page in Admin dashboard showing API response times and error rates", "Thanh", "Enables proactive detection of performance issues before they impact end users"],
    ],
};

async function addThanhToSectionsIIIIIIV() {
    const filePath = 'E:\\KYC\\6. Weekly Report\\6. Weekly Report.xlsx';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((worksheet, sheetId) => {
        const sheetName = worksheet.name;
        if (!sheetName.startsWith('Week')) return;

        const dates = weekDates[sheetName];
        const issues = thanhIssues[sheetName];
        const plans = thanhNextWeekPlan[sheetName];
        const suggestions = thanhSuggestions[sheetName];
        if (!dates || !issues) return;

        console.log(`Processing ${sheetName}...`);

        // Step 1: Remove existing Thanh rows from sections II, III, IV (prevent duplicates)
        const rowsToDelete = [];
        let inSection = '';
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const c1 = row.getCell(1).value;
            if (c1 === 'II. Project Issues') inSection = 'II';
            else if (c1 === 'III. Next Week Plan') inSection = 'III';
            else if (c1 === 'IV. Other Project Masters/Suggestions') inSection = 'IV';
            else if (c1 === 'I. Status Report') inSection = '';
            if (inSection && (row.getCell(3).value === 'Thanh' || row.getCell(2).value === 'Thanh')) {
                rowsToDelete.push(rowNumber);
            }
        });
        for (let i = rowsToDelete.length - 1; i >= 0; i--) {
            worksheet.spliceRows(rowsToDelete[i], 1);
        }

        // Helper: find section boundaries and last numbered item
        function findSectionInfo(sectionTitle) {
            let sectionStart = -1;
            let nextSectionRow = -1;
            let highestNum = 0;
            let lastNumRow = -1;
            let refStyleRow = -1;
            let passedSection = false;

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                const c1 = row.getCell(1).value;
                if (c1 === sectionTitle) { sectionStart = rowNumber; passedSection = true; return; }
                if (passedSection && (c1 === 'I. Status Report' || c1 === 'II. Project Issues' || c1 === 'III. Next Week Plan' || c1 === 'IV. Other Project Masters/Suggestions') && rowNumber > sectionStart) {
                    if (nextSectionRow === -1) nextSectionRow = rowNumber;
                }
                if (passedSection && sectionStart > 0 && typeof c1 === 'number' && (nextSectionRow === -1 || rowNumber < nextSectionRow)) {
                    if (c1 > highestNum) { highestNum = c1; lastNumRow = rowNumber; refStyleRow = rowNumber; }
                }
            });
            return { sectionStart, nextSectionRow, highestNum, lastNumRow, refStyleRow };
        }

        function insertRows(data, sectionTitle, buildRow) {
            const info = findSectionInfo(sectionTitle);
            if (info.sectionStart === -1) { console.log(`  ${sectionTitle} not found in ${sheetName}`); return; }

            const insertAt = info.nextSectionRow !== -1
                ? info.nextSectionRow  // insert before next section
                : (info.lastNumRow !== -1 ? info.lastNumRow + 1 : info.sectionStart + 2);

            const refRow = info.refStyleRow > 0 ? worksheet.getRow(info.refStyleRow) : null;

            data.forEach((item, idx) => {
                const rowIdx = insertAt + idx;
                worksheet.spliceRows(rowIdx, 0, []);
                const newRow = worksheet.getRow(rowIdx);
                buildRow(newRow, item, info.highestNum + idx + 1);
                if (refRow) {
                    for (let col = 1; col <= 5; col++) {
                        const refCell = refRow.getCell(col);
                        if (refCell && refCell.style) {
                            try { newRow.getCell(col).style = JSON.parse(JSON.stringify(refCell.style)); } catch(e) {}
                        }
                    }
                }
                newRow.commit();
            });
            console.log(`  Added ${data.length} rows to ${sectionTitle}`);
        }

        // --- Section II: Project Issues ---
        insertRows(issues, 'II. Project Issues', (row, item, num) => {
            row.getCell(1).value = num;
            row.getCell(2).value = item[0]; // Issue description
            row.getCell(3).value = item[1]; // Owner = Thanh
            row.getCell(4).value = item[2]; // Status
            row.getCell(5).value = item[3]; // Solution notes
        });

        // --- Section III: Next Week Plan ---
        insertRows(plans, 'III. Next Week Plan', (row, item, num) => {
            row.getCell(1).value = num;
            row.getCell(2).value = item[0]; // Task description
            row.getCell(3).value = item[1]; // Thanh
            row.getCell(4).value = dates.next; // Deadline (Excel date serial)
            row.getCell(5).value = item[2]; // Notes
        });

        // --- Section IV: Other Suggestions ---
        insertRows(suggestions, 'IV. Other Project Masters/Suggestions', (row, item, num) => {
            row.getCell(1).value = num;
            row.getCell(2).value = item[0]; // Suggestion
            row.getCell(3).value = 'Thanh';
            row.getCell(4).value = dates.suggestion; // Date
            row.getCell(5).value = item[2]; // Notes
        });
    });

    await workbook.xlsx.writeFile(filePath);
    console.log('\nAll sections II, III, IV updated successfully!');
}

addThanhToSectionsIIIIIIV().catch(console.error);
