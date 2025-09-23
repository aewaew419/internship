# 🎭 Mock Data Infrastructure

This directory contains a comprehensive mock data infrastructure designed to support frontend development while the backend is being migrated. The mock system provides realistic data, response times, and error simulation to ensure a smooth development experience.

## 📁 Structure

```
mock-data/
├── README.md           # This documentation
├── index.ts           # Main export point
├── service.ts         # Mock API service with realistic behavior
├── store.ts           # Comprehensive mock data store
└── admin.ts           # Legacy admin mock data (backward compatibility)
```

## 🚀 Quick Start

```typescript
import { apiService, mockApiService, configureMockAPI } from '@/lib/mock-data';

// Use the configured API service (automatically switches between mock/real)
const users = await apiService.getUsers();

// Or use mock service directly
const companies = await mockApiService.getCompanies();

// Configure mock behavior
configureMockAPI.enableErrors(0.1); // 10% error rate
configureMockAPI.setNetworkCondition('mobile'); // Simulate mobile network
```

## 🎯 Features

### ✅ Comprehensive Data Coverage
- **Users & Profiles**: Students, instructors, visitors, admins
- **Companies**: Various types (private, government, startup, NGO)
- **Co-op Information**: Complete internship data
- **Evaluations**: Student, company, and visitor evaluations
- **Status Tracking**: Document and approval workflows
- **Notifications**: Real-time notification system
- **Analytics**: Dashboard statistics and reports

### ✅ Realistic API Behavior
- **Response Times**: Configurable delays (50ms-10s)
- **Error Simulation**: Configurable error rates and types
- **Network Conditions**: Fast, slow, mobile, offline simulation
- **Pagination**: Proper pagination with metadata
- **Search & Filtering**: Query, role, date range filters
- **Validation**: File size, type, and data validation

### ✅ TypeScript Integration
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Schema Compatibility**: Types match database schema for easy migration
- **IDE Support**: Full IntelliSense and auto-completion

### ✅ Development Tools
- **Configuration API**: Easy behavior modification
- **Debug Utilities**: Global access in development mode
- **Test Support**: Comprehensive test coverage
- **Environment Switching**: Easy toggle between mock/real API

## 🔧 Configuration

### Environment Variables

```bash
# Enable mock API (default: true in development)
NEXT_PUBLIC_USE_MOCK_API=true

# Mock API configuration
NEXT_PUBLIC_MOCK_API_DELAY=500
NEXT_PUBLIC_MOCK_API_ERROR_RATE=0.1
```

### Runtime Configuration

```typescript
import { configureMockAPI } from '@/lib/mock-data';

// Enable error simulation
configureMockAPI.enableErrors(0.2); // 20% error rate

// Simulate network conditions
configureMockAPI.setNetworkCondition('slow'); // 500-2000ms delays

// Reset to defaults
configureMockAPI.reset();
```

### Network Simulation

| Condition | Min Delay | Max Delay | Use Case |
|-----------|-----------|-----------|----------|
| `fast`    | 50ms      | 200ms     | Local development |
| `slow`    | 500ms     | 2000ms    | Slow internet testing |
| `mobile`  | 800ms     | 3000ms    | Mobile network simulation |
| `offline` | 5000ms    | 10000ms   | Offline/timeout testing |

## 📊 Data Structure

### Users and Profiles

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  permissions: string[];
  profile?: StudentProfile | InstructorProfile | VisitorProfile;
}
```

### Companies

```typescript
interface Company {
  id: string;
  name: string;
  type: 'government' | 'private' | 'startup' | 'ngo';
  industry: string;
  address: CompanyAddress;
  contact: CompanyContact;
  internshipSlots: number;
  currentInterns: number;
  rating?: number;
}
```

### Co-op Information

```typescript
interface CoopInfo {
  id: string;
  studentId: string;
  companyId: string;
  position: string;
  supervisor: CompanySupervisor;
  startDate: string;
  endDate: string;
  status: CoopStatus;
  // ... more fields
}
```

## 🔌 API Methods

### Authentication
- `login(credentials)` - User authentication
- `logout()` - User logout
- `refreshToken(token)` - Token refresh

### User Management
- `getUsers(filters?)` - Get paginated users
- `getUserById(id)` - Get user by ID
- `createUser(userData)` - Create new user
- `updateUser(id, userData)` - Update user
- `deleteUser(id)` - Delete user

### Student Profiles
- `getStudentProfile(id)` - Get student profile
- `updateStudentProfile(id, data)` - Update profile

### Companies
- `getCompanies(filters?)` - Get paginated companies
- `getCompanyById(id)` - Get company by ID

### Co-op Management
- `getCoopInfos(studentId?)` - Get co-op information
- `createCoopInfo(data)` - Create co-op record

### Status Tracking
- `getStatusItems(entityId?)` - Get status items
- `updateStatusItem(id, data)` - Update status

### File Management
- `uploadFile(file, entityId, type)` - Upload file
- File validation (size, type)

### Notifications
- `getNotifications(userId)` - Get user notifications
- `markNotificationAsRead(id)` - Mark as read

### Analytics
- `getDashboardStats()` - Get dashboard statistics
- `getCompanyStats()` - Get company analytics

## 🧪 Testing

The mock infrastructure includes comprehensive tests:

```bash
# Run mock data tests
npm test -- --testPathPattern=mock-data

# Run simple verification tests
npm test -- --testPathPattern=mock-data-simple
```

### Test Coverage
- ✅ Authentication flows
- ✅ CRUD operations
- ✅ Error handling
- ✅ Pagination
- ✅ Search and filtering
- ✅ File upload validation
- ✅ Network simulation
- ✅ Configuration utilities

## 🔄 Migration to Real API

The mock system is designed for seamless migration:

### 1. Environment Switch
```bash
# Switch to real API
NEXT_PUBLIC_USE_MOCK_API=false
```

### 2. Interface Compatibility
All mock responses match the expected real API structure:

```typescript
// Same interface for both mock and real API
const response = await apiService.getUsers();
// Works with both mock and real implementation
```

### 3. Error Handling
Error handling is consistent between mock and real API:

```typescript
try {
  const user = await apiService.getUserById('123');
} catch (error) {
  // Same error handling for both mock and real API
  console.error('Failed to fetch user:', error.message);
}
```

## 🛠️ Development Utilities

### Global Debug Access
In development mode, mock utilities are available globally:

```javascript
// Available in browser console
window.__mockAPI.service.setErrorMode(true, 0.5);
window.__mockAPI.configure.setNetworkCondition('slow');
window.__mockAPI.store.users; // Access mock data
```

### Custom Mock Data
You can extend the mock data store:

```typescript
import { mockDataStore } from '@/lib/mock-data';

// Add custom data
mockDataStore.users.push({
  id: 'custom-user',
  email: 'custom@test.com',
  // ... other fields
});
```

## 📝 Best Practices

### 1. Use the Adapter
Always use `apiService` instead of direct mock service:

```typescript
// ✅ Good - uses adapter
import { apiService } from '@/lib/mock-data';
const users = await apiService.getUsers();

// ❌ Avoid - direct mock service
import { mockApiService } from '@/lib/mock-data';
const users = await mockApiService.getUsers();
```

### 2. Handle Errors Properly
Always implement proper error handling:

```typescript
try {
  const response = await apiService.getUsers();
  setUsers(response.data.data);
} catch (error) {
  setError(error.message);
  console.error('Failed to fetch users:', error);
}
```

### 3. Use TypeScript Types
Leverage the provided TypeScript interfaces:

```typescript
import type { User, Company, CoopInfo } from '@/lib/mock-data';

const handleUser = (user: User) => {
  // Full type safety
  console.log(user.name, user.roles);
};
```

### 4. Test with Different Conditions
Test your components with various network conditions:

```typescript
// Test with slow network
configureMockAPI.setNetworkCondition('mobile');

// Test with errors
configureMockAPI.enableErrors(0.3);

// Reset after testing
configureMockAPI.reset();
```

## 🚨 Important Notes

1. **Development Only**: Mock data is primarily for development. Production should use real API.

2. **Data Persistence**: Mock data changes are not persisted between page reloads.

3. **File Uploads**: File uploads are simulated - files are not actually stored.

4. **Authentication**: Mock authentication uses simple password checking (password123 for all users).

5. **Performance**: Mock delays are simulated - actual performance may vary.

## 🤝 Contributing

When adding new mock data or API methods:

1. **Add Types**: Define TypeScript interfaces in `types/mock.ts`
2. **Add Data**: Add mock data to `store.ts`
3. **Add Methods**: Implement API methods in `service.ts`
4. **Add Tests**: Write tests in `__tests__/unit/`
5. **Update Docs**: Update this README

## 📚 Related Documentation

- [API Routes Constants](../../constants/api-routes.ts)
- [Type Definitions](../../types/)
- [Test Examples](./__tests__/unit/)
- [Real API Services](../api/services/)

---

**Happy Coding! 🎉**

The mock data infrastructure provides everything you need for frontend development while maintaining compatibility with the real API. If you encounter any issues or need additional features, please refer to the test files for examples or create new issues.