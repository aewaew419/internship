# Parallel Work Assignment

## 🖥️ เครื่อง Mac Pro 2017 (i5, 16GB RAM) - Heavy Tasks

### Monorepo Migration Tasks:
- **Task 4**: Create Shared UI Components Package
  - Build และ compile React components
  - Setup Storybook (resource intensive)
  - Component testing และ visual regression tests
  
- **Task 5**: Setup Build System and Development Scripts
  - Turborepo configuration และ optimization
  - Build performance tuning
  - Hot reload system setup

- **Task 6**: Implement Testing Strategy
  - Jest configuration และ test running
  - E2E testing setup with Playwright
  - Performance testing และ coverage reports

### Student Registration Tasks:
- **Tasks 3.1-3.2**: Shared Types Package Updates
- **Tasks 4.1-4.3**: Frontend Registration Form Development
- **Tasks 9.1-9.3**: Testing Implementation (Heavy testing workloads)

---

## 💻 เครื่อง Lenovo G400 (i3, 12GB RAM) - Light Tasks

### Monorepo Migration Tasks:
- **Task 8**: Create Documentation and Developer Experience
  - Write documentation files
  - Create getting started guides
  - Setup automated documentation generation

- **Task 9**: Implement Security and Access Control
  - Security configuration files
  - Access control setup
  - Security documentation

### Student Registration Tasks:
- **Tasks 8.1-8.2**: Mobile Responsive Design
- **Tasks 10.1-10.3**: Documentation and Deployment
- **Tasks 7.1**: Password Security (Configuration heavy, not computation heavy)

---

## 🖥️ เครื่องปัจจุบัน - Backend Focus

### Monorepo Migration Tasks:
- **Task 2**: Migrate Existing Applications
- **Task 3**: Create Shared Types Package (Database models)
- **Task 7**: Configure CI/CD Pipeline

### Student Registration Tasks:
- **Tasks 1.1-1.2**: Database Schema Updates
- **Tasks 2.1-2.4**: Backend API Development
- **Tasks 5.1-5.3**: Authentication System Updates
- **Tasks 6.1-6.2**: User Profile Management (Backend)
- **Tasks 7.2-7.3**: Security Implementation (Backend)

---

## 📋 Coordination Guidelines

### Git Workflow:
```bash
# แต่ละเครื่องสร้าง branch แยก
git checkout -b feature/mac-pro-ui-components
git checkout -b feature/lenovo-documentation  
git checkout -b feature/backend-registration

# Merge เมื่อ task เสร็จ
git checkout main
git merge feature/branch-name
```

### Communication:
- ใช้ commit message ภาษาไทยเพื่อความชัดเจน
- Tag เครื่องที่ทำใน commit: `[MAC]`, `[LENOVO]`, `[BACKEND]`
- Update task status ใน .kiro/specs/*/tasks.md

### Dependencies:
1. **Database Models** (Backend) → **Shared Types** (Mac Pro)
2. **Shared Types** (Mac Pro) → **Frontend Forms** (Mac Pro/Lenovo)
3. **Backend API** (Backend) → **Frontend Integration** (Mac Pro)

### Testing Coordination:
- Mac Pro: Component และ integration tests
- Lenovo: Documentation และ manual testing
- Backend: API และ database tests

---

## 🚀 Getting Started Commands

### Mac Pro 2017:
```bash
git pull origin main
cd internship-management
pnpm install
pnpm --filter @internship/ui-components dev
pnpm --filter @internship/shared-types build
```

### Lenovo G400:
```bash
git pull origin main  
cd internship-management
pnpm install
# Focus on documentation และ configuration files
code docs/
```

### Backend เครื่องปัจจุบัน:
```bash
git pull origin main
cd internship-management
pnpm install
cd apps/backend
pnpm dev
```