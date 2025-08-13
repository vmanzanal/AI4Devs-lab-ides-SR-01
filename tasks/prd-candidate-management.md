# Product Requirements Document (PRD) - Candidate Management System

## 1. Introduction/Overview

The LTI Applicant Tracking System (ATS) requires a candidate management feature that allows HR recruiters and hiring managers to efficiently add, store, and manage candidate information. This feature serves as the foundation for the talent acquisition process by providing a centralized database where candidate profiles, contact information, experience, and CVs can be stored and accessed.

**Problem Statement:** Currently, LTI lacks a centralized system for managing candidate information, leading to scattered data, duplicate entries, and inefficient recruitment processes.

**Goal:** Create a robust, user-friendly candidate management system that allows authorized users to add candidates with comprehensive profiles while ensuring data integrity and preventing duplicates.

## 2. Goals

1. **Data Centralization:** Establish a single source of truth for all candidate information
2. **User Efficiency:** Enable quick and intuitive candidate data entry with proper validation
3. **Data Integrity:** Prevent duplicate candidates and ensure data quality through validation
4. **File Management:** Securely handle CV uploads with proper file type and size restrictions
5. **Scalability:** Support up to 1,000 candidates with room for future growth
6. **Access Control:** Ensure only authorized users (HR/Recruiters and Hiring Managers) can add candidates

## 3. User Stories

### Primary User Stories

**US-001: Add New Candidate**
- **As a** HR Recruiter
- **I want to** add a new candidate to the system with their complete profile information
- **So that** I can track their application progress and maintain organized candidate records

**US-002: Upload Candidate CV**
- **As a** HR Recruiter or Hiring Manager
- **I want to** upload a candidate's CV in PDF format
- **So that** I can review their qualifications and share documents with the hiring team

**US-003: Prevent Duplicate Candidates**
- **As a** HR Recruiter
- **I want to** be prevented from adding candidates with duplicate email addresses
- **So that** I maintain data integrity and avoid confusion in the hiring process

**US-004: Access Candidate Addition Feature**
- **As a** Hiring Manager
- **I want to** have access to add candidates to the system
- **So that** I can directly input promising candidates I encounter

### Secondary User Stories

**US-005: Data Validation**
- **As a** System User
- **I want to** receive immediate feedback on data validation errors
- **So that** I can correct information before submitting

**US-006: Confirmation Feedback**
- **As a** HR Recruiter
- **I want to** receive confirmation when a candidate is successfully added
- **So that** I know the operation completed successfully

## 4. Functional Requirements

### 4.1 User Authentication & Authorization
1. The system **must** authenticate users using email/password login
2. The system **must** restrict candidate addition to users with HR Recruiter or Hiring Manager roles
3. The system **must** maintain user sessions securely

### 4.2 Candidate Data Management
4. The system **must** provide a form with the following fields:
   - **Mandatory:** First Name, Last Name, Email, Phone, Experience Level
   - **Optional:** Address, Education Details, Previous Experience Details
5. The system **must** validate email format using standard email regex patterns
6. The system **must** ensure all mandatory fields are completed before submission
7. The system **must** prevent duplicate candidates based on email address uniqueness
8. The system **must** display appropriate error messages for validation failures

### 4.3 File Upload Management
9. The system **must** allow CV upload in PDF format only
10. The system **must** enforce a maximum file size of 5MB for CV uploads
11. The system **must** store uploaded files securely with unique identifiers
12. The system **must** validate file types on both client and server side

### 4.4 User Interface Requirements
13. The system **must** provide a clearly visible "Add Candidate" button/link on the main dashboard
14. The system **must** display a confirmation message upon successful candidate addition
15. The system **must** show appropriate error messages for failed operations
16. The system **must** provide form validation feedback in real-time

### 4.5 Data Storage & Retrieval
17. The system **must** store candidate data in PostgreSQL database using Prisma ORM
18. The system **must** provide advanced filtering capabilities by skills, experience, and location
19. The system **must** maintain data consistency and referential integrity

### 4.6 Performance Requirements
20. The system **must** support concurrent access by multiple users
21. The system **must** handle up to 1,000 candidate records efficiently
22. The system **must** respond to candidate addition requests within 3 seconds

## 5. Non-Goals (Out of Scope)

- **Email notifications** to candidates after being added
- **Automatic job matching** algorithms
- **AI-powered CV parsing** (future backlog item)
- **Full-text search** within CV content (future backlog item)
- **Calendar integration** for scheduling
- **Third-party job board** integrations
- **Bulk candidate import** functionality
- **Advanced reporting** and analytics
- **Mobile application** support

## 6. Design Considerations

### 6.1 User Interface Guidelines
- Follow modern, clean design principles consistent with React best practices
- Implement responsive design for desktop and tablet compatibility
- Use intuitive form layouts with clear labeling and helpful tooltips
- Provide immediate visual feedback for form validation states

### 6.2 Component Architecture
- **CandidateForm Component:** Main form for candidate data entry
- **FileUpload Component:** Reusable component for CV uploads
- **ValidationMessage Component:** Consistent error/success message display
- **Dashboard Component:** Main navigation with add candidate functionality

### 6.3 User Experience
- Progressive form validation (field-by-field feedback)
- Clear file upload progress indicators
- Consistent button styling and placement
- Accessibility compliance (WCAG 2.1 AA standards)

## 7. Technical Considerations

### 7.1 Technology Stack
- **Frontend:** React 18.3.1 with TypeScript
- **Backend:** Node.js with Express and TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **File Storage:** Local file system with organized directory structure
- **Testing:** Jest for unit testing, React Testing Library for component tests

### 7.2 Database Schema Requirements
```sql
-- Users table (extends existing)
- Add role field (ENUM: 'HR_RECRUITER', 'HIRING_MANAGER', 'ADMIN')

-- Candidates table (new)
- id, firstName, lastName, email (unique), phone
- experienceLevel, address, education, workExperience
- cvFileName, cvFilePath, createdAt, updatedAt, createdBy
```

### 7.3 API Endpoints
- `POST /api/candidates` - Create new candidate
- `GET /api/candidates` - List candidates with filtering
- `POST /api/candidates/upload-cv` - Handle CV file uploads
- `GET /api/candidates/:id` - Retrieve specific candidate

### 7.4 Security Considerations
- Input sanitization for all form fields
- File type validation and scanning
- Role-based access control (RBAC)
- SQL injection prevention through Prisma ORM
- Cross-site scripting (XSS) protection

### 7.5 SOLID Principles Implementation
- **Single Responsibility:** Separate services for candidate management, file handling, and validation
- **Open/Closed:** Interface-based design for extensibility
- **Liskov Substitution:** Abstract base classes for user roles
- **Interface Segregation:** Specific interfaces for different user operations
- **Dependency Inversion:** Dependency injection for database and file services

## 8. Success Metrics

### 8.1 Functional Metrics
- **User Adoption:** 100% of HR team using the system within 2 weeks
- **Data Quality:** <1% duplicate candidate entries
- **System Reliability:** 99.5% uptime during business hours
- **Performance:** <3 seconds average response time for candidate operations

### 8.2 User Experience Metrics
- **Task Completion:** 95% successful candidate addition on first attempt
- **User Satisfaction:** >4.5/5 rating in user feedback surveys
- **Error Rate:** <5% form submission errors due to validation issues

### 8.3 Technical Metrics
- **Test Coverage:** >80% code coverage for all components
- **Security:** Zero critical security vulnerabilities
- **Scalability:** Support 1,000 candidates without performance degradation

## 9. Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1-2)
- Database schema design and migration
- User authentication and authorization
- Basic CRUD API endpoints
- File upload functionality
- Unit tests for backend services

### Phase 2: Frontend Development (Week 3-4)
- React components for candidate form
- File upload interface
- Form validation and error handling
- Integration with backend APIs
- Component unit tests

### Phase 3: Integration & Testing (Week 5)
- End-to-end testing
- Security testing
- Performance optimization
- User acceptance testing
- Bug fixes and refinements

### Phase 4: Deployment & Documentation (Week 6)
- Production deployment
- User training materials
- Technical documentation
- Monitoring setup

## 10. Testing Strategy (TDD Approach)

### 10.1 Backend Testing
- **Unit Tests:** Service layer functions, data validation, file handling
- **Integration Tests:** API endpoints, database operations
- **Test Coverage:** Minimum 80% coverage for all backend code

### 10.2 Frontend Testing
- **Component Tests:** React Testing Library for UI components
- **Integration Tests:** Form submission, API integration
- **E2E Tests:** Complete user workflows using Jest and testing utilities

### 10.3 Test-Driven Development Process
1. Write failing tests first for each requirement
2. Implement minimum code to pass tests
3. Refactor while maintaining test coverage
4. Continuous integration with automated test execution

## 11. Open Questions

1. **File Storage Strategy:** Should we implement cloud storage (AWS S3) for CV files in future iterations?
2. **Advanced Search Priority:** When should we prioritize the full-text search feature from the backlog?
3. **User Role Management:** Should we implement a user management interface for role assignments?
4. **Audit Trail:** Do we need to track who added/modified candidate information?
5. **Data Export:** Will users need to export candidate data to external systems?
6. **Mobile Responsiveness:** What is the priority for mobile-optimized interfaces?

## 12. Future Backlog Items

### High Priority
- **AI-Powered CV Parsing:** Automatic extraction of candidate information from uploaded CVs
- **Full-Text Search:** Advanced search capabilities within CV content
- **Bulk Import:** Excel/CSV import functionality for existing candidate databases

### Medium Priority
- **Email Notifications:** Automated communication workflows
- **Calendar Integration:** Interview scheduling capabilities
- **Advanced Analytics:** Reporting dashboard for recruitment metrics

### Low Priority
- **Mobile Application:** Native mobile app for recruiters
- **Social Media Integration:** LinkedIn profile import
- **Video Interview:** Integrated video conferencing for remote interviews

---

**Document Version:** 1.0  
**Created By:** Product Architecture Team  
**Last Updated:** [Current Date]  
**Review Date:** [Current Date + 30 days]  
**Stakeholders:** HR Department, Engineering Team, Product Management
