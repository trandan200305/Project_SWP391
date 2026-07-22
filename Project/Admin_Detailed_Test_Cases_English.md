# COMPLETE ADMIN SYSTEM TEST CASES (ENGLISH VERSION)

This markdown is formatted to exactly match your Excel template (15 columns). When you copy the table and paste it into Excel, it will perfectly align with columns A through O.

> **Tip:** You can directly paste these tables into Excel. The "Scenario" rows will be in the first column, which you can easily highlight and color cyan in Excel.

## 📋 Sheet: **Auth_Security**

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Scenario: Authentication & Security** | | | | | | | | | | | | | | |
| TC_ADM_001 | Login Valid | 1. Access /admin/login<br>2. Enter valid Email & Password<br>3. Submit | Login successful, redirects to Admin Dashboard | Admin account exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_002 | Login Invalid Pass | 1. Enter valid Email & invalid Password<br>2. Submit | Displays error: "Incorrect account or password" | Admin account exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_003 | Login Empty Fields | 1. Leave Email & Password blank<br>2. Submit | Submit button disabled or UI shows "This field is required" | None | Pending | | | Pending | | | Pending | | | |
| TC_ADM_004 | Login SQL Injection | 1. Enter SQL injection payload in Email (e.g., ' OR 1=1--)<br>2. Submit | Login rejected, database remains secure | None | Pending | | | Pending | | | Pending | | | |
| TC_ADM_005 | Login XSS Payload | 1. Enter XSS payload in Email (<script>alert(1)</script>)<br>2. Submit | Format rejected or backend sanitizes input, login fails | None | Pending | | | Pending | | | Pending | | | |
| TC_ADM_006 | Login Long Text | 1. Enter Password > 255 characters<br>2. Submit | Displays error "Incorrect password", database does not crash | None | Pending | | | Pending | | | Pending | | | |
| TC_ADM_007 | Login Invalid Role | 1. Login using a Freelancer/Employer account | Displays error "Access denied for administrator role" (403 Forbidden) | Freelancer account exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_008 | Session Expiry | 1. Login<br>2. Wait for JWT token to expire<br>3. Navigate to another tab | 401 Unauthorized, automatically redirects to Login page | Logged in | Pending | | | Pending | | | Pending | | | |
| TC_ADM_009 | Concurrent Login | 1. Login with the same Admin account on 2 different browsers simultaneously | System handles session gracefully (either both allowed or oldest session is kicked out) | Admin account exists | Pending | | | Pending | | | Pending | | | |

---

## 📋 Sheet: **Staff_Workspaces**

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Scenario: Staff Invitation & Management** | | | | | | | | | | | | | | |
| TC_ADM_010 | Invite Valid Staff | 1. Navigate to Staff Management<br>2. Click Add New<br>3. Enter valid email and select Staff role<br>4. Submit | Staff account created, invitation email sent | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_011 | Invite Duplicate Email | 1. Try to invite an email that already exists in the system | Displays error "Email already exists in the system" | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_012 | Invite Invalid Email Format | 1. Enter incorrectly formatted email (e.g., admin#gmail,com) | Validation error: "Invalid email format" | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_013 | Change User Pass Normal | 1. Select a Staff user<br>2. Force reset password to "Admin123!" | Password successfully updated, user can login with new password | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_014 | Change User Pass Weak | 1. Force reset password to a 1-character string | Validation error: "Password must be at least 6 characters" | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_015 | Change User Pass Long | 1. Force reset password to > 300 characters | Validation error: Maximum length exceeded (Data truncation prevented) | Logged in as Admin | Pending | | | Pending | | | Pending | | | |

---

## 📋 Sheet: **Manager_Workspaces**

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Scenario: Manager Oversight** | | | | | | | | | | | | | | |
| TC_ADM_016 | View Manager List | 1. Navigate to Manager Workspaces tab | Displays list of all Manager accounts with their status and activity logs | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_017 | Revoke Manager Access | 1. Select an active Manager<br>2. Click Revoke Access<br>3. Confirm | Manager status changes to BANNED/REVOKED, their current session is terminated | Logged in as Admin, Manager exists | Pending | | | Pending | | | Pending | | | |

---

## 📋 Sheet: **ROLE ADMIN**

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Round 2 | Test date | Tester | Round 3 | Test date | Tester | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Scenario: Dashboard Analytics** | | | | | | | | | | | | | | |
| TC_ADM_018 | Load Stats Normal | 1. Open Dashboard<br>2. Observe Total Revenue & Orders (30 days filter) | Data loads accurately matching the database records | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_019 | Zero Data Handling | 1. Connect backend to an empty database (0 transactions)<br>2. Load Dashboard | No "Divide by Zero" errors, displays 0 Revenue, 0 Orders, chart shows "No data" | Empty database | Pending | | | Pending | | | Pending | | | |
| TC_ADM_020 | Spam Filter Clicks | 1. Rapidly click between "Today", "Week", "Month" filters | UI does not freeze/crash, API requests are debounced, final render matches the last clicked filter | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_021 | Donut Chart Hover | 1. Slowly hover mouse over a slice on the Donut Chart | Tooltip appears at exact mouse coordinates, displays correct slice data, subtle hover sound plays | Data exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_022 | Donut Mouse Escape | 1. Move mouse extremely fast across the chart and out of the browser window | Tooltip hides cleanly (onMouseLeave fires correctly), no orphaned tooltips stuck on screen | Data exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_023 | Donut Coordinate Limit | 1. Scroll page down entirely<br>2. Hover over the chart | Tooltip calculates fixed coordinates correctly, does not offset out of bounds | Data exists | Pending | | | Pending | | | Pending | | | |
| **Scenario: User Management** | | | | | | | | | | | | | | |
| TC_ADM_024 | Pagination Boundary | 1. Manually edit URL to page=-1 or page=999999 | System defaults to page 1 or shows "No data", backend does not crash | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_025 | Search SQLi | 1. Enter "%" or "_" in user search box | Does not dump entire database, safely escapes query characters | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_026 | Search Special Chars | 1. Enter emojis or long Unicode characters in search | Processes normally, returns matching strings or empty results | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_027 | Ban User Normal | 1. Ban an ACTIVE account<br>2. Enter reason "Spam"<br>3. Submit | Account status changes to BANNED, user is forced logged out | Active user exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_028 | Ban Empty Reason | 1. Ban account but leave reason empty | System requires a reason to be entered before submitting | Active user exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_029 | Ban Long Reason | 1. Enter ban reason > 5000 characters | Validation error for max length, prevents DB Data Truncation crash | Active user exists | Pending | | | Pending | | | Pending | | | |
| **Scenario: Financial Configuration** | | | | | | | | | | | | | | |
| TC_ADM_030 | Fee Normal Update | 1. Update platform fee to 10% | Saves successfully, database updated | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_031 | Fee Upper Limit | 1. Update platform fee to 100% | Saves successfully (or shows warning), new contracts take 100% revenue | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_032 | Fee Over Limit | 1. Update platform fee to 101% | Validation error: "Fee must be between 0 and 100%" | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_033 | Fee Negative Limit | 1. Update platform fee to -1% | Validation error: "Fee cannot be negative" | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_034 | Fee String Input | 1. Send API POST request with string "abc" instead of number | Backend returns HTTP 400 Bad Request safely | API access | Pending | | | Pending | | | Pending | | | |
| TC_ADM_035 | Fee Decimal Precision | 1. Enter fee as 10.123456% | Saves successfully but rounds to 2 decimal places (10.12%) or rejects | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| **Scenario: Service Packages Management** | | | | | | | | | | | | | | |
| TC_ADM_036 | Package Update Normal | 1. Update Medium package price to 50,000 VND | Saves successfully | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_037 | Package Negative Price | 1. Set price to -10000 VND | Validation error: "Price cannot be negative" | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_038 | Package Zero Price | 1. Set price to 0 | Saves successfully (becomes Free package) or shows specific business rule error | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_039 | Package BigInt Price | 1. Set price to 99,999,999,999 VND | Validation error: Exceeds allowed budget constraints, prevents DB Integer Overflow | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| **Scenario: VNPay Transactions** | | | | | | | | | | | | | | |
| TC_ADM_040 | Query Status Normal | 1. Query a valid VNPay transaction ID | Report matches data between VNPay server and Local DB | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_041 | Query Invalid ID | 1. Query a fake/non-existent VNPay ID | Returns error "Transaction code does not exist" or VNPay Code 97 | Logged in as Admin | Pending | | | Pending | | | Pending | | | |
| TC_ADM_042 | Refund Normal | 1. Refund 10,000 VND from a transaction | Refund successful, status changes to PARTIAL_REFUND | Valid transaction exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_043 | Refund Greater Than Original | 1. Attempt to refund 150k from a 100k transaction | API rejected: "Refund amount exceeds original transaction amount" | Valid transaction exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_044 | Refund Negative Amount | 1. Attempt to refund -50000 VND | Validation error: Invalid refund amount | Valid transaction exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_045 | Refund Race Condition | 1. Double-click the Confirm Refund button extremely fast | Only processes the first request, subsequent requests blocked (Transaction Lock), preventing double refunds | Valid transaction exists | Pending | | | Pending | | | Pending | | | |
| **Scenario: Moderation (KYC & Projects)** | | | | | | | | | | | | | | |
| TC_ADM_046 | KYC Approve Normal | 1. Approve a valid KYC profile | Profile status becomes APPROVED | Pending KYC exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_047 | KYC Race Condition | 1. Open same KYC on 2 tabs<br>2. Tab 1 clicks Approve, Tab 2 clicks Reject | Tab 2 shows error "Profile already processed by another administrator" (Data Concurrency handled) | Pending KYC exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_048 | KYC Reject Empty Reason | 1. Reject KYC but leave reason blank | System strictly requires a rejection reason | Pending KYC exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_049 | Project Approve | 1. Approve a valid project | Project status becomes PUBLISHED | Pending project exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_050 | Report Resolve Ban | 1. Process a user report<br>2. Select Ban User action | Report becomes RESOLVED, user is immediately BANNED | Pending report exists | Pending | | | Pending | | | Pending | | | |
| **Scenario: Dispute Resolution** | | | | | | | | | | | | | | |
| TC_ADM_051 | Dispute Normal Resolve | 1. Enter ratio: 70% Freelancer - 30% Employer<br>2. Submit | Escrow funds split accurately according to the 70-30 ratio | Active dispute exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_052 | Dispute Over 100% | 1. Enter ratio: 70% and 40% (Total = 110%) | Validation error: "Total refund ratio must equal exactly 100%" | Active dispute exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_053 | Dispute Under 100% | 1. Enter ratio: 50% and 40% (Total = 90%) | Validation error: "Total refund ratio must equal exactly 100%" | Active dispute exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_054 | Dispute Negative % | 1. Enter ratio: -10% and 110% | Validation error: "Ratio cannot be negative" | Active dispute exists | Pending | | | Pending | | | Pending | | | |
| **Scenario: Withdrawals Processing** | | | | | | | | | | | | | | |
| TC_ADM_055 | Withdrawal Approve Normal | 1. Approve a valid withdrawal request | Changes to SUCCESS, wallet balance is formally deducted | Pending withdrawal exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_056 | Withdrawal Double Click | 1. Use Postman to fire Approve and Reject API calls simultaneously | Only records the first state, second request rejected via Transaction Isolation / Optimistic Locking | Pending withdrawal exists | Pending | | | Pending | | | Pending | | | |
| TC_ADM_057 | Withdrawal Insufficient Funds | 1. User requests withdrawal<br>2. User somehow spends wallet funds before admin approves<br>3. Admin clicks Approve | Admin approval is blocked; backend re-verifies wallet balance at the exact moment of approval | Pending withdrawal exists | Pending | | | Pending | | | Pending | | | |

---

