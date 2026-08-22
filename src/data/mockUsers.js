/**
 * Mock user data for CampusOps frontend prototype.
 * Contains mock records for Students, Technicians, and Administrators.
 */

export const mockUsers = [
  {
    id: 'USR-001',
    name: 'Rahul Sharma',
    email: 'rahul@campus.edu',
    role: 'STUDENT',
    department: 'Computer Science',
  },
  {
    id: 'USR-002',
    name: 'Priya Patel',
    email: 'priya@campus.edu',
    role: 'STUDENT',
    department: 'Electronics Engineering',
  },
  {
    id: 'USR-003',
    name: 'Dr. Meera Jones',
    email: 'meera@campus.edu',
    role: 'STUDENT',
    department: 'Physics',
  },
];

export const mockTechnicians = [
  {
    id: 'USR-101',
    name: 'Arun Prasad',
    email: 'arun@campus.edu',
    role: 'TECHNICIAN',
    specialization: 'Facility & Electrical Systems',
    activeRequests: 2,
  },
  {
    id: 'USR-102',
    name: 'Vikram Singh',
    email: 'vikram@campus.edu',
    role: 'TECHNICIAN',
    specialization: 'Network & IT Infrastructure',
    activeRequests: 2,
  },
  {
    id: 'USR-103',
    name: 'Rajesh Nair',
    email: 'rajesh@campus.edu',
    role: 'TECHNICIAN',
    specialization: 'Hardware & AV Equipment',
    activeRequests: 1,
  },
];

export const mockAdmins = [
  {
    id: 'USR-201',
    name: 'Admin User',
    email: 'admin@campus.edu',
    role: 'ADMIN',
    department: 'Campus IT Operations',
  },
];

/**
 * Predefined default mock accounts for the login UI dropdown.
 */
export const defaultMockAccounts = {
  STUDENT: mockUsers[0],
  TECHNICIAN: mockTechnicians[0],
  ADMIN: mockAdmins[0],
};
