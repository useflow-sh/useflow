# Contributing to useFlow

Thank you for considering contributing to useFlow! We welcome contributions from the community.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.2.23 or higher
- Node.js v18 or higher

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/useflow.git
   cd useflow
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Build packages:
   ```bash
   bun run build
   ```

5. Run tests:
   ```bash
   bun test
   ```

## Project Structure

```
useFlow/
├── packages/
│   ├── core/          # Framework-agnostic flow logic
│   └── react/         # React hooks and components
├── apps/
│   └── docs/          # Documentation site
└── examples/
    └── react-examples/ # Example implementations
```

## Development Workflow

### Running Tests

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# With coverage
bun test:coverage

# UI mode
bun test:ui
```

### Type Checking

```bash
bun run typecheck
```

### Linting and Formatting

```bash
bun run check
```

### Running Examples

```bash
cd examples/react-examples
bun dev
```

### Running Documentation Locally

```bash
bun run build:docs
cd apps/docs
bun dev
```

## Making Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure:
   - Tests pass: `bun test`
   - Types are valid: `bun run typecheck`
   - Code is formatted: `bun run check`

3. Write tests for your changes when applicable

4. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

   Commit message format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `chore:` - Maintenance tasks
   - `test:` - Test changes
   - `refactor:` - Code refactoring

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request from your fork to the main repository

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include tests for new functionality
- Update documentation if needed
- Ensure all tests pass and types are valid
- Follow the existing code style
- Reference any related issues in the PR description

## Reporting Issues

- Use the [issue tracker](https://github.com/useflow-sh/useflow/issues)
- Check if the issue already exists before creating a new one
- Provide a clear description and reproduction steps
- Include relevant code examples and error messages

## Questions?

Feel free to open an issue for questions or discussions about contributing.

## License

By contributing to useFlow, you agree that your contributions will be licensed under the MIT License.
