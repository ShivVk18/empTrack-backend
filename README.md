# EmpTrack Backend

# EmpTrack - Employee & Payroll Management System

EmpTrack is a comprehensive web application designed to streamline employee management and payroll operations for small to medium-sized businesses. Built with modern web technologies, it provides a secure, scalable solution for HR departments and business owners to manage their workforce efficiently.

The application handles everything from employee onboarding and profile management to automated payroll calculations and financial reporting. With its intuitive role-based access system, different users can access only the features they need - whether you're an HR manager processing payroll, a department head reviewing team statistics, or an employee checking your salary details.

## Why EmpTrack?

Managing employees and payroll manually is time-consuming and error-prone. EmpTrack automates these processes while maintaining the flexibility businesses need. Whether you're tracking employee performance, calculating complex salary structures, or generating compliance reports, EmpTrack simplifies these tasks with an easy-to-use interface and robust backend.

**Perfect for:**
- Small to medium businesses looking to digitize HR processes
- Companies with multiple departments and varying employee types
- Organizations needing detailed payroll analytics and reporting
- Businesses requiring role-based access to sensitive employee data

## Key Features

### Employee Management
- Complete employee lifecycle management from hiring to exit
- Profile management with photo uploads and document storage
- Department and designation assignment with hierarchy support
- Advanced search and filtering capabilities
- Bulk operations for efficiency

### Payroll Automation
- Automated salary calculations based on configurable parameters
- Support for different employee types (Permanent, Contract, Intern, etc.)
- Tax calculations including EPF, ESI, TDS, and Professional Tax
- Flexible allowances and deductions management
- Monthly payroll generation with detailed breakdowns

### Analytics & Reporting
- Real-time employee statistics and distribution charts
- Payroll summaries with financial insights
- Department-wise performance metrics
- Exportable reports for compliance and auditing
- Dashboard with key performance indicators

### Security & Access Control
- Multi-level role-based permissions (Admin, HR, Manager, Accountant, Employee)
- Company-specific data isolation
- Secure authentication with JWT tokens
- Audit trails for sensitive operations
- Data encryption and secure file handling

## Tech Stack

- **Backend:** Node.js & Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with refresh token rotation
- **File Storage:** Cloudinary for profile pictures and documents
- **Security:** bcrypt for password hashing, CORS protection
- **Validation:** Joi for input validation

## Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd emptrack
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env
\`\`\`

4. Configure your `.env` file:
\`\`\`env
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
\`\`\`

5. Set up the database
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

6. Start the server
\`\`\`bash
npm run dev
\`\`\`


## User Roles & Permissions

### Admin
- Complete system access and company management
- Can delete company data and manage all users
- Full access to all features and analytics

### HR Manager
- Manage employees, departments, and designations
- Generate and manage payroll for all employees
- Access to comprehensive analytics and reports

### Senior Manager
- Strategic oversight with department management capabilities
- Access to payroll data and employee analytics
- Can manage departments and designations

### Manager
- Manage employees within their assigned department
- Limited payroll access for their team members
- Department-specific analytics and reporting

### Accountant
- Full payroll and financial operations management
- Access to all salary-related data and calculations
- Generate financial reports and summaries

### Employee
- View personal profile and payroll information
- Update personal details and contact information
- Access to individual payslips and tax documents


## Database Schema

The application uses a well-structured relational database with the following main entities:

- **Company** - Organization details and settings
- **Admin** - Company administrators with full access
- **Employee** - Employee records with roles and permissions
- **Department** - Organizational departments and teams
- **Designation** - Job positions with hierarchy levels
- **PayMaster** - Individual salary records and calculations
- **PayParameter** - Configurable salary calculation rules
- **Location Data** - States, cities, and banking information

## Security Features

EmpTrack implements multiple layers of security to protect sensitive employee and financial data:

- **JWT Authentication** with short-lived access tokens and secure refresh tokens
- **Role-Based Access Control** ensuring users only access authorized data
- **Company Data Isolation** preventing cross-company data access
- **Password Security** using bcrypt hashing with salt rounds
- **File Upload Validation** with type and size restrictions
- **Input Sanitization** preventing injection attacks
- **CORS Protection** for secure cross-origin requests

### Code Style
- Follow ESLint configuration for consistent code style
- Use meaningful variable and function names
- Implement proper error handling throughout


### Performance Considerations
- Implement database indexing for frequently queried fields
- Use connection pooling for database connections
- Set up caching for static data (departments, designations)
- Monitor API response times and optimize slow queries

## Contributing

We welcome contributions to improve EmpTrack! Here's how you can help:

1. Fork the repository and create a feature branch
2. Make your changes with proper testing
3. Ensure code follows the existing style guidelines
4. Update documentation if needed
5. Submit a pull request with a clear description
