# Contributing to Mysore Mess Menus

Thank you for your interest in contributing to Mysore Mess Menus! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A GitHub account

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/foodosys.git
   cd foodosys
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/AffanShaikhsurab/foodosys.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Fill in your development credentials
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🌿 Branching Strategy

We use a feature branch workflow:

- `main` - Production-ready code (protected)
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/update-name` - Documentation updates
- `refactor/component-name` - Code refactoring

### Creating a Feature Branch

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

## 📝 Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat(upload): add image compression before upload"
git commit -m "fix(auth): resolve Clerk webhook signature verification"
git commit -m "docs(readme): update setup instructions"
```

## 🧪 Testing Requirements

**All PRs must pass automated tests before merging.**

### Running Tests Locally

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Build check
npm run build
```

### Writing Tests

- Add tests for new features in `tests/` or `__tests__/` directories
- Ensure test coverage doesn't decrease
- Test edge cases and error handling

## 🔍 Code Quality Standards

### TypeScript

- Use TypeScript for all new files
- Avoid `any` type - use proper typing
- Document complex type definitions

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Optimize for performance (memoization when needed)
- Use proper error boundaries

### Styling

- Follow existing Tailwind CSS patterns
- Maintain responsive design (mobile-first)
- Use CSS modules for component-specific styles

### Code Style

- Run `npm run lint` before committing
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## 📤 Submitting a Pull Request

1. **Ensure your code is up to date**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run all tests and checks**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

3. **Push to your fork**:
   ```bash
   git push origin your-feature-branch
   ```

4. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Link any related issues
   - Add screenshots/videos for UI changes

5. **Address review feedback**:
   - Respond to comments
   - Make requested changes
   - Push updates to the same branch

## 🎯 PR Review Process

### What We Look For

- ✅ All automated tests pass
- ✅ Code follows project conventions
- ✅ No merge conflicts
- ✅ Changes are well-documented
- ✅ PR description is clear and complete
- ✅ No exposed secrets or credentials

### Timeline

- Initial review: Within 2-3 days
- Follow-up reviews: Within 1-2 days
- Merge: After approval and passing all checks

## 🐛 Reporting Bugs

### Before Submitting

- Check existing issues
- Verify it's reproducible
- Test on latest version

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Screenshots**
If applicable.

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Mockups, examples, etc.
```

## 📚 Documentation

- Update README if adding new features
- Add JSDoc comments for public APIs
- Update .env.example if adding environment variables
- Create/update documentation in `docs/` if needed

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Email security concerns to: [your-email@example.com]

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow OWASP security guidelines
- Sanitize user inputs
- Use parameterized queries for database operations

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone.

### Expected Behavior

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

## 📞 Getting Help

- 💬 **Discussions**: Use GitHub Discussions for questions
- 🐛 **Issues**: Report bugs via GitHub Issues
- 📧 **Email**: Contact maintainers for sensitive matters

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Mysore Mess Menus! 🍽️**
