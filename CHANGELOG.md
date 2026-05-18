# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-03-05

### Added
- Repository metadata in package.json (repository, bugs, homepage fields)
- npm version badge in README
- GitHub Actions workflow for CI (lint and build on PRs)
- GitHub Actions workflow for automated npm publishing on version tags
- CONTRIBUTING.md with setup and development guidelines
- GitHub issue templates (bug report and feature request)
- This CHANGELOG

### Changed
- Updated .gitignore to properly exclude all .DS_Store files recursively

### Removed
- .DS_Store files from git tracking

## [1.0.2] - 2026-03-05

### Added
- Published package to npm

## [1.0.0] - 2026-03-05

### Added
- Initial release
- TestdocTest class for automated documentation generation
- Accessibility testing with axe-core integration
- Visual regression testing utilities
- Element highlighting and screenshot utilities
- Date formatting utilities
- Markdown test parser
- CLI tool for running markdown-based tests
- Comprehensive example tests for Open edX
- Full TypeScript support with type definitions
