# Remaining tasks

## Rework: introduce workspaces

- Workspaces will persist on the server in the form:

```typescript
interface Workspace {
	id: string; // Unique identifier
	name: string; // User-friendly name
	createdAt: Date; // Creation timestamp
	lastModifiedAt: Date; // Last modification timestamp
	state: SerializedApplicationState; // The current state of the application
}
```

- The list of created workspaces will be persisted in the client's local storage
  - This will hide other users' workspaces
- This will also make workspaces shareable, as long as a user knows the workspace id
- Workspaces can be exported (along with the runs' outputs) / imported

### API

- POST `/workspaces/`: create a new workspace
- GET `/workspaces/[id]`: fetch a workspace by id
- PUT `/workspaces/[id]`: update a workspace by id (only sending the fields that changed)
- DELETE `/workspaces/[id]`: delete a workspace by id

## UI

- Rework the left sidebar (after workspaces are implemented):

  - Dataset selection able to handle a large number of dataset folders
  - Able to select multiple datasets
  - Cases selection also showing runs of the session
  - Implement runs filtering
  - Allow open/close runs

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

## Optimization

- Implement cleanup strategies for old workspaces and run outputs

## Localization

- Add support for other languages
