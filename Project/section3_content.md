## 3.1 User Authentication
### 3.1.1 Authentication Screens
#### 3.1.1.1 Login Screen
[Insert UI Mockup here]
**Description:** This screen allows users (Freelancers, Employers, Admins) to log into the system to access authenticated features. Map to UC: UC-AUTH-02.
**Fields:**
| Field Name | Description |
|---|---|
| Email | Varchar(255), required. Must follow valid email format. Initial data: empty. |
| Password | Varchar(255), required. Min 8 characters. Masked input. Initial data: empty. |
| Login Button | Action: Submits credentials to the server. |
| Login with Google | Action: Initiates OAuth2 flow with Google. |

#### 3.1.1.2 Register Screen
[Insert UI Mockup here]
**Description:** This screen allows new guest users to create an account as a Freelancer or Employer. Map to UC: UC-AUTH-01.
**Fields:**
| Field Name | Description |
|---|---|
| Full Name | Varchar(100), required. Min 2 characters. |
| Email | Varchar(255), required. Must be unique. |
| Password | Varchar(255), required. Min 8 characters, at least 1 number, 1 special character. |
| Confirm Password | Varchar(255), required. Must match Password field. |
| Role Selection | Enum/Radio (Freelancer/Employer), required. Default: Freelancer. |
| Register Button | Action: Submits registration request. |

## 3.2 Project Management
### 3.2.1 Job Creation & Browsing
#### 3.2.1.1 Post Job Screen
[Insert UI Mockup here]
**Description:** Employers use this screen to publish new projects for bidding. Map to UC: UC-PROJ-01.
**Fields:**
| Field Name | Description |
|---|---|
| Job Title | Varchar(200), required. Min 10 characters. |
| Description | Text/HTML, required. Min 50 characters. Rich text editor enabled. |
| Category | Dropdown (Category Entity), required. Loaded from database. |
| Required Skills | Multi-select Tags (Skill Entity). Max 10 skills. |
| Min Budget | Decimal, required. Must be > 0. |
| Max Budget | Decimal, required. Must be >= Min Budget. |
| Publish Button | Action: Creates job and sets status to OPEN. |

#### 3.2.1.2 Find Jobs Screen
[Insert UI Mockup here]
**Description:** Freelancers use this screen to search, filter, and browse open projects. Map to UC: UC-PROJ-02.
**Fields:**
| Field Name | Description |
|---|---|
| Search Keyword | Varchar(100), optional. Filters by Job Title. |
| Budget Filter | Range Slider, optional. Filters by Min/Max budget. |
| Category Filter | Checkbox list, optional. Filters by specific job categories. |
| Job List | Grid/List view showing Job cards (Title, Budget, Employer Name, Posted Time). |

## 3.3 User Profile
### 3.3.1 Profile Display & Edit
#### 3.3.1.1 Edit Profile Screen
[Insert UI Mockup here]
**Description:** Allows users to update their personal information and portfolio. Map to UC: UC-USER-01.
**Fields:**
| Field Name | Description |
|---|---|
| Avatar | File input (Image: JPG/PNG), max size 5MB. |
| Headline | Varchar(100), optional. Brief professional summary. |
| Bio | Text, optional. Detailed description of skills and experience. |
| Contact Phone | Varchar(15), optional. Must contain only numbers. |
| Save Button | Action: Updates the profile data via API. |

## 3.4 Payment & Checkout
### 3.4.1 Transaction Processing
#### 3.4.1.1 Checkout Screen
[Insert UI Mockup here]
**Description:** Employers select payment methods to purchase service packages or top-up funds. Map to UC: UC-PAY-01.
**Fields:**
| Field Name | Description |
|---|---|
| Selected Package | Read-only. Displays the VIP package name being purchased. |
| Price | Read-only Decimal. Dynamically loaded from ServicePackageConfig. |
| Payment Gateway | Radio selection: PayOS (Primary) or VNPay (Fallback). |
| Pay Now Button | Action: Generates secure payment URL and redirects to Gateway. |

## 3.5 System Administration
### 3.5.1 Admin Dashboards
#### 3.5.1.1 Staff Dashboard Screen
[Insert UI Mockup here]
**Description:** Staff members use this to moderate content and manage disputes.
**Fields:**
| Field Name | Description |
|---|---|
| Pending Projects Table | Data grid showing projects awaiting approval. Actions: Approve/Reject. |
| Reported Users Table | Data grid showing flagged users. Actions: Warn/Ban. |

#### 3.5.1.2 Manager Dashboard Screen
[Insert UI Mockup here]
**Description:** Managers use this to oversee Staff activities and transfer personnel. Map to UC: UC-DEPT-01.
**Fields:**
| Field Name | Description |
|---|---|
| Personnel Table | Data grid showing Staff members and their current departments. |
| Transfer Button | Action: Opens modal to select destination department. |
| Transfer Reason | Varchar(255), required when transferring personnel. |

## 3.6 Communication
### 3.6.1 Real-time Chat
#### 3.6.1.1 Messenger Screen
[Insert UI Mockup here]
**Description:** Real-time messaging interface for direct communication via WebSocket. Map to UC: UC-CHAT-01.
**Fields:**
| Field Name | Description |
|---|---|
| Contact List | Sidebar showing active chat threads. |
| Message History | Scrollable area displaying past messages. |
| Message Input | Text, required to send. Supports Enter key to submit. |
| Send Button | Action: Emits WebSocket event to send message. |
