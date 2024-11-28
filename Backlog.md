# Remaining tasks

## Rework: introduce workspaces

- A workspace persists on the server the current saved state (we can't trust the users)
- Each user have their own workspaces, to not create confusion
- Workspaces are not shareable (too difficult for now, maybe in the future)
- Workspaces can be exported/imported
- Each workspace have a unique id
- Runs are limited inside a workspace

## UI

- Rework the left sidebar:

  - Dataset selection able to handle a large number of dataset folders
  - Able to select multiple datasets
  - Cases selection also showing runs of the session
  - Implement runs filtering

- Stretch goal:
  - Add view-only mode:
    - View cases one at a time
    - No script editing
    - Preselected per-case layers to show
    - Possibility to score the runs

## Security

- Path Traversal Vulnerabilities:

```typescript
function isPathSafe(basePath: string, requestedPath: string): boolean {
	const normalizedPath = path.normalize(path.join(basePath, requestedPath));
	return normalizedPath.startsWith(path.normalize(basePath));
}
```

- File System Access:
  - Implement a whitelist of allowed file extensions
  - Add proper access controls
  - Consider using a database instead of filesystem for sensitive data
- Error Handling Exposing Paths:
  - Sanitize error messages before sending to client
- Process Execution:
  - Validate script content before execution
  - Run in a sandboxed environment
  - Consider using proper argument escaping
- Temporary File Management:
  - Implement proper cleanup in a finally block
  - Set up periodic cleanup of old temporary files
  - Consider using `fs.mkdtemp()` for safer temporary directories
- Cache Control Headers:
  - Review cache policies based on content sensitivity and update frequency
- Environment Variables:
  - Validate environment variables at startup
  - Use a configuration validation library like `zod`
  - Consider using .env file validation
- Missing Rate Limiting:
  - Implement it
- CORS Configuration:
  - Add proper CORS configuration based on your requirements

## Localization

- Add support for other languages
