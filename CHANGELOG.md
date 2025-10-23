# Change Log

All notable changes to the "AI Bridge Agent" extension will be documented in this file.

## [1.0.0] - 2025-10-23

### Added
- Initial release
- HTTP REST API server on localhost
- WebSocket server for real-time communication
- Command execution with safety checks
- File editing with backup system
- Test runner with framework detection (Jest, pytest, Go, Rust)
- Diagnostics reader for errors and warnings
- Browser automation with Playwright
- Session management
- Approval system for sensitive operations
- Rate limiting
- Credential masking
- Command sanitization
- Configuration system
- Status bar integration
- Output channel logging
- Comprehensive documentation
- ChatGPT integration template
- Quick start guide
- API reference

### Security Features
- Command allowlist/blocklist
- Path validation
- Command injection prevention
- Credential masking in logs
- User approval for dangerous operations
- Rate limiting

### Supported Frameworks
- Node.js (npm, yarn, pnpm)
- Python (pytest)
- Go
- Rust (cargo)
- Deno
- Bun

### Supported Test Runners
- Jest
- Mocha
- pytest
- Go test
- Rust cargo test

## [Unreleased]

### Planned Features
- Error handler with automatic recovery
- Rollback manager for failed operations
- Dashboard webview
- Git integration
- Docker support
- Multi-workspace support
- Custom action plugins
- Metrics and analytics
- Cloud sync for sessions
