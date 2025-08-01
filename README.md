# EmpTrack Backend

## EmpTrack - Employee, Leave, Attendance & Payroll Management System

EmpTrack is a comprehensive web application designed to streamline employee management, attendance tracking, leave management, complaints, holidays, and payroll operations for small to medium-sized businesses. Built with modern web technologies, it provides a secure, scalable solution for HR departments and business owners to manage their workforce efficiently.

The application handles everything from employee onboarding and attendance tracking to automated payroll calculations, leave applications, complaint handling, and holiday management. With its intuitive role-based access system, different users can access only the features they need - whether you're an HR manager processing payroll, a department head reviewing team performance, or an employee checking your salary details.

## Why EmpTrack?

Managing employees, attendance, leave, complaints, and payroll manually is time-consuming and error-prone. EmpTrack automates these processes while maintaining the flexibility businesses need. Whether you're tracking attendance, handling leave requests, resolving employee complaints, or generating compliance reports, EmpTrack simplifies these tasks with an easy-to-use interface and robust backend.

**Perfect for:**  
- Small to medium businesses looking to digitize HR processes  
- Companies with multiple departments and varying employee types  
- Organizations needing detailed attendance, leave, and payroll analytics  
- Businesses requiring role-based access to sensitive employee data  

## ✨ Key Features

### ✅ Employee Management
- Complete employee lifecycle management from hiring to exit
- Profile management with photo uploads and document storage
- Department and designation assignment with hierarchy support
- Advanced search and filtering capabilities
- Bulk operations for efficiency

### ✅ Attendance Management
- Daily attendance tracking with clock-in and clock-out times
- Automated calculation of total working hours
- Late arrival, early departure, and absence detection
- Admin/HR can approve or modify attendance records
- Employees can view their own attendance history
- Attendance summary reports for management

### ✅ Leave Management
- Configurable leave policies with carry-forward and paid/unpaid options
- Employee self-service for applying and tracking leaves
- HR and Senior Managers can approve, reject, or cancel leaves
- Leave history and filters by status, employee, or date
- Detailed tracking of allowed and used leave days

### ✅ Complaint Management
- Employees can raise complaints with subject and description
- HR, Managers, and Senior Managers can view and update complaints
- Complaint statuses: Pending, In Progress, Resolved, Rejected
- Filters by employee, status, and search functionality

### ✅ Holiday Management
- Company-specific or general holidays
- HR/Admin can create, update, and delete holidays
- Filtering by date range or holiday type
- Holidays visible to all employees for better planning

### ✅ Payroll Automation
- Automated salary calculations based on configurable parameters
- Support for different employee types (Permanent, Contract, Intern, etc.)
- Tax calculations including EPF, ESI, TDS, and Professional Tax
- Flexible allowances and deductions management
- Monthly payroll generation with detailed breakdowns

### ✅ Analytics & Reporting
- Real-time employee statistics and distribution charts
- Attendance summaries and leave trends
- Payroll summaries with financial insights
- Department-wise performance metrics
- Exportable reports for compliance and auditing
- Dashboard with key performance indicators

### ✅ Security & Access Control
- Multi-level role-based permissions (Admin, HR, Manager, Accountant, Employee)
- Company-specific data isolation
- Secure authentication with JWT tokens
- Audit trails for sensitive operations
- Data encryption and secure file handling

## 🛠 Tech Stack

- **Backend:** Node.js & Express.js  
- **Database:** PostgreSQL with Prisma ORM  
- **Authentication:** JWT with refresh token rotation  
- **File Storage:** Cloudinary for profile pictures and documents  
- **Security:** bcrypt for password hashing, CORS protection  
- **Validation:** Joi for input validation  
- **Date Handling:** dayjs for reliable date operations  

## 🚀 Installation

1. Clone the repository  
```bash
git clone <repository-url>
cd emptrack
```

2. Install dependencies  
```bash
npm install
```

3. Set up environment variables  
```bash
cp .env.example .env
```

4. Configure your `.env` file:  
```env
DATABASE_URL="postgresql://username:password@localhost:5432/emptrack"
ACCESS_TOKEN_SECRET="your-secret-key"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRY="7d"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
PORT=8000
CORS_ORIGIN="http://localhost:3000"
```

5. Set up the database  
```bash
npx prisma generate
npx prisma db push
```

6. Start the server  
```bash
npm run dev
```

## 👥 User Roles & Permissions

### Admin
- Complete system access and company management
- Can manage all users, holidays, leave policies, attendance, and complaints
- Full access to all features, analytics, and reports

### HR Manager
- Manage employees, departments, designations, leave policies, attendance, and holidays
- Generate and manage payroll for all employees
- Handle employee complaints and leave approvals
- Access to comprehensive analytics and reports

### Senior Manager
- Strategic oversight with department management capabilities
- Access to payroll, attendance, leave, complaint data, and employee analytics
- Can approve/reject leave applications and complaints

### Manager
- Manage employees within their assigned department
- Handle team-specific complaints
- View department attendance and leave records
- Department-specific analytics and reporting

### Accountant
- Full payroll and financial operations management
- Access to all salary-related data and calculations
- Generate financial reports and summaries

### Employee
- Clock-in and clock-out for daily attendance
- View personal profile, payroll, attendance, leave, and complaint information
- Apply for leave and raise complaints
- Access to individual payslips, tax documents, and holiday list

## 🗄 Database Schema (Core Entities)

- **Company** - Organization details and settings  
- **Admin** - Company administrators with full access  
- **Employee** - Employee records with roles and permissions  
- **Department** - Organizational departments and teams  
- **Designation** - Job positions with hierarchy levels  
- **Attendance** - Daily attendance records with timestamps  
- **PayMaster** - Individual salary records and calculations  
- **PayParameter** - Configurable salary calculation rules  
- **LeavePolicy** - Company-specific leave rules  
- **LeaveApplication** - Employee leave requests and tracking  
- **Complaint** - Employee complaints with status tracking  
- **Holiday** - Company or general holidays  
- **Location Data** - States, cities, and banking information  

## 🔐 Security Features

- **JWT Authentication** with short-lived access tokens and secure refresh tokens  
- **Role-Based Access Control** ensuring users only access authorized data  
- **Company Data Isolation** preventing cross-company data access  
- **Password Security** using bcrypt hashing with salt rounds  
- **File Upload Validation** with type and size restrictions  
- **Input Sanitization** preventing injection attacks  
- **CORS Protection** for secure cross-origin requests  
- **Audit Trails** for sensitive operations  

## 🧹 Code Style & Best Practices

- Follow ESLint configuration for consistent code style  
- Use meaningful, self-explanatory variable and function names  
- Implement proper error handling throughout  
- Modular controller structure for scalability  
- Input validation and strict permission checks on all routes  

## ⚡ Performance Considerations

- Database indexing for frequently queried fields  
- Connection pooling for efficient database operations  
- Caching for static data like departments and designations  
- Monitoring API response times and optimizing slow queries  
- Efficient pagination for large datasets  

## 🤝 Contributing

We welcome contributions to improve EmpTrack! Here's how you can help:

1. Fork the repository and create a feature branch  
2. Make your changes with proper testing  
3. Ensure code follows the existing style guidelines  
4. Update documentation if needed  
5. Submit a pull request with a clear description  

## 📢 Future Enhancements

- Employee Attendance Location Tracking (Geo-fencing)  
- Real-time Notifications  
- Mobile App Integration  
- Salary Slip PDF Generation  
- Multi-Language Support  
- Enhanced Graphical Dashboards & Reports  
