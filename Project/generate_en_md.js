const fs = require('fs');

const testCases = [
  // Auth_Security
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_001', name: 'Login Valid', proc: '1. Access /admin/login<br>2. Enter valid Email & Password<br>3. Submit', expected: 'Login successful, redirects to Admin Dashboard', pre: 'Admin account exists' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_002', name: 'Login Invalid Pass', proc: '1. Enter valid Email & invalid Password<br>2. Submit', expected: 'Displays error: "Incorrect account or password"', pre: 'Admin account exists' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_003', name: 'Login Empty Fields', proc: '1. Leave Email & Password blank<br>2. Submit', expected: 'Submit button disabled or UI shows "This field is required"', pre: 'None' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_004', name: 'Login SQL Injection', proc: '1. Enter SQL injection payload in Email (e.g., \' OR 1=1--)<br>2. Submit', expected: 'Login rejected, database remains secure', pre: 'None' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_005', name: 'Login XSS Payload', proc: '1. Enter XSS payload in Email (<script>alert(1)</script>)<br>2. Submit', expected: 'Format rejected or backend sanitizes input, login fails', pre: 'None' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_006', name: 'Login Long Text', proc: '1. Enter Password > 255 characters<br>2. Submit', expected: 'Displays error "Incorrect password", database does not crash', pre: 'None' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_007', name: 'Login Invalid Role', proc: '1. Login using a Freelancer/Employer account', expected: 'Displays error "Access denied for administrator role" (403 Forbidden)', pre: 'Freelancer account exists' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_008', name: 'Session Expiry', proc: '1. Login<br>2. Wait for JWT token to expire<br>3. Navigate to another tab', expected: '401 Unauthorized, automatically redirects to Login page', pre: 'Logged in' },
  { sheet: 'Auth_Security', scenario: 'Authentication & Security', tcId: 'TC_ADM_009', name: 'Concurrent Login', proc: '1. Login with the same Admin account on 2 different browsers simultaneously', expected: 'System handles session gracefully (either both allowed or oldest session is kicked out)', pre: 'Admin account exists' },

  // Staff_Workspaces
  { sheet: 'Staff_Workspaces', scenario: 'Staff Invitation & Management', tcId: 'TC_ADM_010', name: 'Invite Valid Staff', proc: '1. Navigate to Staff Management<br>2. Click Add New<br>3. Enter valid email and select Staff role<br>4. Submit', expected: 'Staff account created, invitation email sent', pre: 'Logged in as Admin' },
  { sheet: 'Staff_Workspaces', scenario: 'Staff Invitation & Management', tcId: 'TC_ADM_011', name: 'Invite Duplicate Email', proc: '1. Try to invite an email that already exists in the system', expected: 'Displays error "Email already exists in the system"', pre: 'Logged in as Admin' },
  { sheet: 'Staff_Workspaces', scenario: 'Staff Invitation & Management', tcId: 'TC_ADM_012', name: 'Invite Invalid Email Format', proc: '1. Enter incorrectly formatted email (e.g., admin#gmail,com)', expected: 'Validation error: "Invalid email format"', pre: 'Logged in as Admin' },
  { sheet: 'Staff_Workspaces', scenario: 'Staff Invitation & Management', tcId: 'TC_ADM_013', name: 'Change User Pass Normal', proc: '1. Select a Staff user<br>2. Force reset password to "Admin123!"', expected: 'Password successfully updated, user can login with new password', pre: 'Logged in as Admin' },
  { sheet: 'Staff_Workspaces', scenario: 'Staff Invitation & Management', tcId: 'TC_ADM_014', name: 'Change User Pass Weak', proc: '1. Force reset password to a 1-character string', expected: 'Validation error: "Password must be at least 6 characters"', pre: 'Logged in as Admin' },
  { sheet: 'Staff_Workspaces', scenario: 'Staff Invitation & Management', tcId: 'TC_ADM_015', name: 'Change User Pass Long', proc: '1. Force reset password to > 300 characters', expected: 'Validation error: Maximum length exceeded (Data truncation prevented)', pre: 'Logged in as Admin' },

  // Manager_Workspaces
  { sheet: 'Manager_Workspaces', scenario: 'Manager Oversight', tcId: 'TC_ADM_016', name: 'View Manager List', proc: '1. Navigate to Manager Workspaces tab', expected: 'Displays list of all Manager accounts with their status and activity logs', pre: 'Logged in as Admin' },
  { sheet: 'Manager_Workspaces', scenario: 'Manager Oversight', tcId: 'TC_ADM_017', name: 'Revoke Manager Access', proc: '1. Select an active Manager<br>2. Click Revoke Access<br>3. Confirm', expected: 'Manager status changes to BANNED/REVOKED, their current session is terminated', pre: 'Logged in as Admin, Manager exists' },

  // ROLE ADMIN
  { sheet: 'ROLE ADMIN', scenario: 'Dashboard Analytics', tcId: 'TC_ADM_018', name: 'Load Stats Normal', proc: '1. Open Dashboard<br>2. Observe Total Revenue & Orders (30 days filter)', expected: 'Data loads accurately matching the database records', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Dashboard Analytics', tcId: 'TC_ADM_019', name: 'Zero Data Handling', proc: '1. Connect backend to an empty database (0 transactions)<br>2. Load Dashboard', expected: 'No "Divide by Zero" errors, displays 0 Revenue, 0 Orders, chart shows "No data"', pre: 'Empty database' },
  { sheet: 'ROLE ADMIN', scenario: 'Dashboard Analytics', tcId: 'TC_ADM_020', name: 'Spam Filter Clicks', proc: '1. Rapidly click between "Today", "Week", "Month" filters', expected: 'UI does not freeze/crash, API requests are debounced, final render matches the last clicked filter', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Dashboard Analytics', tcId: 'TC_ADM_021', name: 'Donut Chart Hover', proc: '1. Slowly hover mouse over a slice on the Donut Chart', expected: 'Tooltip appears at exact mouse coordinates, displays correct slice data, subtle hover sound plays', pre: 'Data exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Dashboard Analytics', tcId: 'TC_ADM_022', name: 'Donut Mouse Escape', proc: '1. Move mouse extremely fast across the chart and out of the browser window', expected: 'Tooltip hides cleanly (onMouseLeave fires correctly), no orphaned tooltips stuck on screen', pre: 'Data exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Dashboard Analytics', tcId: 'TC_ADM_023', name: 'Donut Coordinate Limit', proc: '1. Scroll page down entirely<br>2. Hover over the chart', expected: 'Tooltip calculates fixed coordinates correctly, does not offset out of bounds', pre: 'Data exists' },

  { sheet: 'ROLE ADMIN', scenario: 'User Management', tcId: 'TC_ADM_024', name: 'Pagination Boundary', proc: '1. Manually edit URL to page=-1 or page=999999', expected: 'System defaults to page 1 or shows "No data", backend does not crash', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'User Management', tcId: 'TC_ADM_025', name: 'Search SQLi', proc: '1. Enter "%" or "_" in user search box', expected: 'Does not dump entire database, safely escapes query characters', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'User Management', tcId: 'TC_ADM_026', name: 'Search Special Chars', proc: '1. Enter emojis or long Unicode characters in search', expected: 'Processes normally, returns matching strings or empty results', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'User Management', tcId: 'TC_ADM_027', name: 'Ban User Normal', proc: '1. Ban an ACTIVE account<br>2. Enter reason "Spam"<br>3. Submit', expected: 'Account status changes to BANNED, user is forced logged out', pre: 'Active user exists' },
  { sheet: 'ROLE ADMIN', scenario: 'User Management', tcId: 'TC_ADM_028', name: 'Ban Empty Reason', proc: '1. Ban account but leave reason empty', expected: 'System requires a reason to be entered before submitting', pre: 'Active user exists' },
  { sheet: 'ROLE ADMIN', scenario: 'User Management', tcId: 'TC_ADM_029', name: 'Ban Long Reason', proc: '1. Enter ban reason > 5000 characters', expected: 'Validation error for max length, prevents DB Data Truncation crash', pre: 'Active user exists' },

  { sheet: 'ROLE ADMIN', scenario: 'Financial Configuration', tcId: 'TC_ADM_030', name: 'Fee Normal Update', proc: '1. Update platform fee to 10%', expected: 'Saves successfully, database updated', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Financial Configuration', tcId: 'TC_ADM_031', name: 'Fee Upper Limit', proc: '1. Update platform fee to 100%', expected: 'Saves successfully (or shows warning), new contracts take 100% revenue', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Financial Configuration', tcId: 'TC_ADM_032', name: 'Fee Over Limit', proc: '1. Update platform fee to 101%', expected: 'Validation error: "Fee must be between 0 and 100%"', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Financial Configuration', tcId: 'TC_ADM_033', name: 'Fee Negative Limit', proc: '1. Update platform fee to -1%', expected: 'Validation error: "Fee cannot be negative"', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Financial Configuration', tcId: 'TC_ADM_034', name: 'Fee String Input', proc: '1. Send API POST request with string "abc" instead of number', expected: 'Backend returns HTTP 400 Bad Request safely', pre: 'API access' },
  { sheet: 'ROLE ADMIN', scenario: 'Financial Configuration', tcId: 'TC_ADM_035', name: 'Fee Decimal Precision', proc: '1. Enter fee as 10.123456%', expected: 'Saves successfully but rounds to 2 decimal places (10.12%) or rejects', pre: 'Logged in as Admin' },

  { sheet: 'ROLE ADMIN', scenario: 'Service Packages Management', tcId: 'TC_ADM_036', name: 'Package Update Normal', proc: '1. Update Medium package price to 50,000 VND', expected: 'Saves successfully', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Service Packages Management', tcId: 'TC_ADM_037', name: 'Package Negative Price', proc: '1. Set price to -10000 VND', expected: 'Validation error: "Price cannot be negative"', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Service Packages Management', tcId: 'TC_ADM_038', name: 'Package Zero Price', proc: '1. Set price to 0', expected: 'Saves successfully (becomes Free package) or shows specific business rule error', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'Service Packages Management', tcId: 'TC_ADM_039', name: 'Package BigInt Price', proc: '1. Set price to 99,999,999,999 VND', expected: 'Validation error: Exceeds allowed budget constraints, prevents DB Integer Overflow', pre: 'Logged in as Admin' },

  { sheet: 'ROLE ADMIN', scenario: 'VNPay Transactions', tcId: 'TC_ADM_040', name: 'Query Status Normal', proc: '1. Query a valid VNPay transaction ID', expected: 'Report matches data between VNPay server and Local DB', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'VNPay Transactions', tcId: 'TC_ADM_041', name: 'Query Invalid ID', proc: '1. Query a fake/non-existent VNPay ID', expected: 'Returns error "Transaction code does not exist" or VNPay Code 97', pre: 'Logged in as Admin' },
  { sheet: 'ROLE ADMIN', scenario: 'VNPay Transactions', tcId: 'TC_ADM_042', name: 'Refund Normal', proc: '1. Refund 10,000 VND from a transaction', expected: 'Refund successful, status changes to PARTIAL_REFUND', pre: 'Valid transaction exists' },
  { sheet: 'ROLE ADMIN', scenario: 'VNPay Transactions', tcId: 'TC_ADM_043', name: 'Refund Greater Than Original', proc: '1. Attempt to refund 150k from a 100k transaction', expected: 'API rejected: "Refund amount exceeds original transaction amount"', pre: 'Valid transaction exists' },
  { sheet: 'ROLE ADMIN', scenario: 'VNPay Transactions', tcId: 'TC_ADM_044', name: 'Refund Negative Amount', proc: '1. Attempt to refund -50000 VND', expected: 'Validation error: Invalid refund amount', pre: 'Valid transaction exists' },
  { sheet: 'ROLE ADMIN', scenario: 'VNPay Transactions', tcId: 'TC_ADM_045', name: 'Refund Race Condition', proc: '1. Double-click the Confirm Refund button extremely fast', expected: 'Only processes the first request, subsequent requests blocked (Transaction Lock), preventing double refunds', pre: 'Valid transaction exists' },

  { sheet: 'ROLE ADMIN', scenario: 'Moderation (KYC & Projects)', tcId: 'TC_ADM_046', name: 'KYC Approve Normal', proc: '1. Approve a valid KYC profile', expected: 'Profile status becomes APPROVED', pre: 'Pending KYC exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Moderation (KYC & Projects)', tcId: 'TC_ADM_047', name: 'KYC Race Condition', proc: '1. Open same KYC on 2 tabs<br>2. Tab 1 clicks Approve, Tab 2 clicks Reject', expected: 'Tab 2 shows error "Profile already processed by another administrator" (Data Concurrency handled)', pre: 'Pending KYC exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Moderation (KYC & Projects)', tcId: 'TC_ADM_048', name: 'KYC Reject Empty Reason', proc: '1. Reject KYC but leave reason blank', expected: 'System strictly requires a rejection reason', pre: 'Pending KYC exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Moderation (KYC & Projects)', tcId: 'TC_ADM_049', name: 'Project Approve', proc: '1. Approve a valid project', expected: 'Project status becomes PUBLISHED', pre: 'Pending project exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Moderation (KYC & Projects)', tcId: 'TC_ADM_050', name: 'Report Resolve Ban', proc: '1. Process a user report<br>2. Select Ban User action', expected: 'Report becomes RESOLVED, user is immediately BANNED', pre: 'Pending report exists' },

  { sheet: 'ROLE ADMIN', scenario: 'Dispute Resolution', tcId: 'TC_ADM_051', name: 'Dispute Normal Resolve', proc: '1. Enter ratio: 70% Freelancer - 30% Employer<br>2. Submit', expected: 'Escrow funds split accurately according to the 70-30 ratio', pre: 'Active dispute exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Dispute Resolution', tcId: 'TC_ADM_052', name: 'Dispute Over 100%', proc: '1. Enter ratio: 70% and 40% (Total = 110%)', expected: 'Validation error: "Total refund ratio must equal exactly 100%"', pre: 'Active dispute exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Dispute Resolution', tcId: 'TC_ADM_053', name: 'Dispute Under 100%', proc: '1. Enter ratio: 50% and 40% (Total = 90%)', expected: 'Validation error: "Total refund ratio must equal exactly 100%"', pre: 'Active dispute exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Dispute Resolution', tcId: 'TC_ADM_054', name: 'Dispute Negative %', proc: '1. Enter ratio: -10% and 110%', expected: 'Validation error: "Ratio cannot be negative"', pre: 'Active dispute exists' },

  { sheet: 'ROLE ADMIN', scenario: 'Withdrawals Processing', tcId: 'TC_ADM_055', name: 'Withdrawal Approve Normal', proc: '1. Approve a valid withdrawal request', expected: 'Changes to SUCCESS, wallet balance is formally deducted', pre: 'Pending withdrawal exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Withdrawals Processing', tcId: 'TC_ADM_056', name: 'Withdrawal Double Click', proc: '1. Use Postman to fire Approve and Reject API calls simultaneously', expected: 'Only records the first state, second request rejected via Transaction Isolation / Optimistic Locking', pre: 'Pending withdrawal exists' },
  { sheet: 'ROLE ADMIN', scenario: 'Withdrawals Processing', tcId: 'TC_ADM_057', name: 'Withdrawal Insufficient Funds', proc: '1. User requests withdrawal<br>2. User somehow spends wallet funds before admin approves<br>3. Admin clicks Approve', expected: 'Admin approval is blocked; backend re-verifies wallet balance at the exact moment of approval', pre: 'Pending withdrawal exists' },
];

let mdContent = `# COMPLETE ADMIN SYSTEM TEST CASES (ENGLISH VERSION)\n\n`;
mdContent += `This markdown is formatted to exactly match your Excel template (15 columns). When you copy the table and paste it into Excel, it will perfectly align with columns A through O.\n\n`;
mdContent += `> **Tip:** You can directly paste these tables into Excel. The "Scenario" rows will be in the first column, which you can easily highlight and color cyan in Excel.\n\n`;

const sheets = ['Auth_Security', 'Staff_Workspaces', 'Manager_Workspaces', 'ROLE ADMIN'];

sheets.forEach(sheetName => {
    mdContent += `## 📋 Sheet: **${sheetName}**\n\n`;
    mdContent += `| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |\n`;
    mdContent += `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
    
    let currentScenario = '';
    const sheetTcs = testCases.filter(tc => tc.sheet === sheetName);
    
    sheetTcs.forEach(tc => {
        if (tc.scenario !== currentScenario) {
            currentScenario = tc.scenario;
            // Scenario Row (will span column A in Excel if pasted, other columns empty)
            mdContent += `| **Scenario: ${currentScenario}** | | | | | | | | | | | | | | |\n`;
        }
        mdContent += `| ${tc.tcId} | ${tc.name} | ${tc.proc} | ${tc.expected} | ${tc.pre} | Pending | | | Pending | | | Pending | | | |\n`;
    });
    
    mdContent += `\n---\n\n`;
});

fs.writeFileSync('Admin_Detailed_Test_Cases_English.md', mdContent, 'utf8');
console.log('Markdown generated.');
