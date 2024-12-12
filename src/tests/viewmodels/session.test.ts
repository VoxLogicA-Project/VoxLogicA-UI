import { describe, it, expect, vi } from 'vitest';
import { sessionViewModel } from '$lib/viewmodels/session.svelte';
import { apiRepository, loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { Workspace, LocalWorkspaceEntry } from '$lib/models/types';

// Mock the repository
vi.mock('$lib/models/repository.svelte', async () => {
	const actual = await vi.importActual('$lib/models/repository.svelte');
	return {
		...actual,
		apiRepository: {
			fetchWorkspaces: vi.fn(async () => {}),
			fetchWorkspace: vi.fn(async () => {}),
			fetchAndLoadWorkspace: vi.fn(async () => {}),
			saveWorkspace: vi.fn(async () => {}),
			createWorkspace: vi.fn(async () => {}),
			deleteWorkspace: vi.fn(async () => {}),
			getLocalWorkspaces: vi.fn(() => []),
			saveLocalWorkspaces: vi.fn(() => {}),
			removeLocalWorkspace: vi.fn(() => {}),
		},
	};
});

describe('sessionViewModel', () => {
	resetTestState();

	const mockWorkspace: Workspace = {
		id: 'workspace1',
		name: 'Test Workspace',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		state: {
			data: {
				openedDatasetsNames: [],
				openedCasesPaths: [],
				openedRunsIds: [],
			},
			datasetLayersState: {
				openedLayersPathsByCasePath: {},
				stylesByLayerName: {},
			},
			runsLayersStates: {},
			ui: {
				isDarkMode: false,
				sidebars: {
					datasetCollapsed: false,
					layerCollapsed: false,
					scriptCollapsed: false,
				},
				viewers: {
					fullscreenCasePath: null,
				},
				layers: {
					layerContext: { type: 'dataset' },
				},
				scriptEditor: {
					content: '',
				},
			},
		},
	};

	const mockWorkspaceEntries: LocalWorkspaceEntry[] = [
		{ id: 'workspace1', name: 'Test Workspace' },
		{ id: 'workspace2', name: 'Another Workspace' },
	];

	describe('loadWorkspaces', () => {
		it('should handle successful workspaces loading', async () => {
			vi.mocked(apiRepository.fetchWorkspaces).mockImplementationOnce(async () => {
				loadedData.availableWorkspacesIdsAndNames = mockWorkspaceEntries;
			});

			await sessionViewModel.loadWorkspaces();

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
			expect(sessionViewModel.hasWorkspaces).toBe(true);
			expect(sessionViewModel.availableWorkspacesIdsAndNames).toEqual(mockWorkspaceEntries);
		});

		it('should handle loading errors', async () => {
			vi.mocked(apiRepository.fetchWorkspaces).mockRejectedValueOnce(new Error('Network error'));
			// Clear any existing workspaces
			loadedData.availableWorkspacesIdsAndNames = [];

			await sessionViewModel.loadWorkspaces();

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBe('Network error');
			expect(sessionViewModel.hasWorkspaces).toBe(false);
			expect(sessionViewModel.availableWorkspacesIdsAndNames).toEqual([]);
		});
	});

	describe('selectWorkspace', () => {
		it('should handle successful workspace selection', async () => {
			vi.mocked(apiRepository.fetchAndLoadWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});

			await sessionViewModel.selectWorkspace('workspace1');

			expect(sessionViewModel.selectedWorkspaceId).toBe('workspace1');
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
			expect(sessionViewModel.hasUnsavedChanges).toBe(false);
		});

		it('should handle selection errors', async () => {
			vi.mocked(apiRepository.fetchAndLoadWorkspace).mockRejectedValueOnce(
				new Error('Failed to load workspace')
			);

			await sessionViewModel.selectWorkspace('workspace1');

			expect(sessionViewModel.selectedWorkspaceId).toBe('');
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBe('Failed to load workspace');
		});
	});

	describe('saveWorkspace', () => {
		it('should handle successful workspace saving', async () => {
			// First select a workspace
			vi.mocked(apiRepository.fetchAndLoadWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});
			await sessionViewModel.selectWorkspace('workspace1');

			// Make some changes
			currentWorkspace.state.ui.isDarkMode = true;

			// Save the workspace
			vi.mocked(apiRepository.saveWorkspace).mockImplementationOnce(async () => {});

			await sessionViewModel.saveWorkspace();

			expect(sessionViewModel.isSaving).toBe(false);
			expect(sessionViewModel.errorSaving).toBeNull();
			expect(sessionViewModel.hasUnsavedChanges).toBe(false);
		});

		it('should handle saving errors', async () => {
			// First select a workspace to ensure we have a valid state
			vi.mocked(apiRepository.fetchAndLoadWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});
			await sessionViewModel.selectWorkspace('workspace1');

			// Make some changes to ensure hasUnsavedChanges will be true
			currentWorkspace.state.ui.isDarkMode = true;

			// Mock the save failure
			vi.mocked(apiRepository.saveWorkspace).mockRejectedValueOnce(new Error('Failed to save'));

			await sessionViewModel.saveWorkspace();

			expect(sessionViewModel.isSaving).toBe(false);
			expect(sessionViewModel.errorSaving).toBe('Failed to save');
			expect(sessionViewModel.hasUnsavedChanges).toBe(true);
		});
	});

	describe('createWorkspace', () => {
		it('should handle successful workspace creation', async () => {
			vi.mocked(apiRepository.createWorkspace).mockResolvedValueOnce(mockWorkspace);

			const result = await sessionViewModel.createWorkspace('New Workspace');

			expect(result).toEqual(mockWorkspace);
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
		});

		it('should handle creation errors', async () => {
			vi.mocked(apiRepository.createWorkspace).mockRejectedValueOnce(
				new Error('Failed to create workspace')
			);

			await expect(sessionViewModel.createWorkspace('New Workspace')).rejects.toThrow(
				'Failed to create workspace'
			);
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBe('Failed to create workspace');
		});
	});

	describe('deleteWorkspace', () => {
		it('should handle successful workspace deletion', async () => {
			vi.mocked(apiRepository.deleteWorkspace).mockResolvedValueOnce();
			vi.mocked(apiRepository.fetchWorkspaces).mockImplementationOnce(async () => {
				loadedData.availableWorkspacesIdsAndNames = mockWorkspaceEntries.slice(1);
			});

			await sessionViewModel.deleteWorkspace('workspace1');

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
		});

		it('should reset state when deleting current workspace', async () => {
			// Set up current workspace
			Object.assign(currentWorkspace, mockWorkspace);

			vi.mocked(apiRepository.deleteWorkspace).mockResolvedValueOnce();
			vi.mocked(apiRepository.fetchWorkspaces).mockImplementationOnce(async () => {
				loadedData.availableWorkspacesIdsAndNames = [];
			});

			await sessionViewModel.deleteWorkspace(currentWorkspace.id);

			expect(sessionViewModel.selectedWorkspaceId).toBe('');
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
		});

		it('should handle deletion errors', async () => {
			vi.mocked(apiRepository.deleteWorkspace).mockRejectedValueOnce(
				new Error('Failed to delete workspace')
			);

			await expect(sessionViewModel.deleteWorkspace('workspace1')).rejects.toThrow(
				'Failed to delete workspace'
			);
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBe('Failed to delete workspace');
		});
	});

	describe('reset', () => {
		it('should reset all session state', async () => {
			// First set up some state
			vi.mocked(apiRepository.fetchAndLoadWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});
			await sessionViewModel.selectWorkspace('workspace1');

			// Then reset
			sessionViewModel.reset();

			expect(sessionViewModel.selectedWorkspaceId).toBe('');
			expect(sessionViewModel.hasWorkspaces).toBe(false);
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
			expect(sessionViewModel.hasUnsavedChanges).toBe(false);
			expect(loadedData.availableWorkspacesIdsAndNames).toEqual([]);
		});
	});
});
