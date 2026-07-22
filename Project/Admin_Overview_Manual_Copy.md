# ADMIN ROLE - TEST CASES OVERVIEW

Please open your Excel file, go to the **`Test Cases`** sheet (the main menu/overview sheet), and paste the following rows into the table (starting from the `Function Name` column).

| Function Name | Sheet Name | Description | Pre-conditions |
| --- | --- | --- | --- |
| Authentication & Admin Security | Auth_Security | Handles admin login credential validation, boundary limits on passwords, SQL injection/XSS prevention, concurrent login policies, and session expiry handling. | Admin has an active account, valid network connection, and active backend server. |
| Staff Management & Privileges | Staff_Workspaces | Manages internal staff operations including creating and inviting staff accounts, validating duplicate or invalid emails, and enforcing strict access rules. | Admin is securely logged in and possesses system configuration privileges. |
| Manager Oversight & Escalation | Manager_Workspaces | Handles the oversight of Manager accounts, enforcing boundary constraints on account modifications, role assignments, and higher-level escalations. | Admin is logged in with highest-level system privileges (Super Admin). |
| Finance, Config & Moderation (Exclusive) | ROLE ADMIN | Encompasses system-wide financial configurations (Platform fee boundary limits), VNPay refund race conditions, transaction queries, UI stress tests, and complex dispute resolution ratios. | Admin is fully authenticated. System database and VNPay Gateway connections are active. |

---

### 💡 Copy/Paste Instructions:
1. Open your Excel file and navigate to the **`Test Cases`** sheet.
2. Scroll down to the first empty row in your overview table.
3. Select the text inside the table above (from `Authentication & Admin Security` down to the end of the `ROLE ADMIN` row).
4. Paste it directly into your Excel cells. *(You may need to double-click the cell or use 'Paste Special -> Text' if the formatting looks weird).*
