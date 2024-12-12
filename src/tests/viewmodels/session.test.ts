import { describe, it, expect, vi } from 'vitest';
import { sessionViewModel } from '$lib/viewmodels/session.svelte';
import { apiRepository, loadedData, currentWorkspace } from '$lib/models/repository.svelte';
import { resetTestState } from './viewmodel-test-utils';
import type { Workspace } from '$lib/models/types';

// Mock the repository
vi.mock('$lib/models/repository.svelte', async () => {
	const actual = await vi.importActual('$lib/models/repository.svelte');
	return {
		...actual,
		apiRepository: {
			fetchWorkspaces: vi.fn(async () => {}),
			fetchWorkspace: vi.fn(async () => {}),
			saveWorkspace: vi.fn(async () => {}),
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
				openedDatasetName: 'dataset1',
				openedCasesPaths: ['/case1'],
				openedRunsIds: [],
			},
			datasetLayersState: {
				openedLayersPathsByCasePath: {},
				stylesByLayerName: {},
			},
			runsLayersStates: [],
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
					bottomPanelTab: 'layers',
				},
				scriptEditor: {
					content: '',
				},
			},
		},
	};

	describe('loadWorkspaces', () => {
		it('should handle successful workspaces loading', async () => {
			const mockWorkspaceIds = ['workspace1', 'workspace2'];

			vi.mocked(apiRepository.fetchWorkspaces).mockImplementationOnce(async () => {
				loadedData.availableWorkspacesIds = mockWorkspaceIds;
			});

			await sessionViewModel.loadWorkspaces();

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
			expect(sessionViewModel.hasWorkspaces).toBe(true);
			expect(sessionViewModel.availableWorkspaces).toEqual(mockWorkspaceIds);
		});

		it('should handle loading errors', async () => {
			vi.mocked(apiRepository.fetchWorkspaces).mockRejectedValueOnce(new Error('Network error'));

			await sessionViewModel.loadWorkspaces();

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBe('Network error');
			expect(sessionViewModel.hasWorkspaces).toBe(false);
			expect(sessionViewModel.availableWorkspaces).toEqual([]);
		});
	});

	describe('selectWorkspace', () => {
		it('should handle successful workspace selection', async () => {
			vi.mocked(apiRepository.fetchWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});

			await sessionViewModel.selectWorkspace('workspace1');

			expect(sessionViewModel.selectedWorkspaceId).toBe('workspace1');
			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
			expect(sessionViewModel.hasUnsavedChanges).toBe(false);
		});

		it('should handle selection errors', async () => {
			vi.mocked(apiRepository.fetchWorkspace).mockRejectedValueOnce(
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
			vi.mocked(apiRepository.fetchWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});
			await sessionViewModel.selectWorkspace('workspace1');

			// Make some changes
			currentWorkspace.state.ui.isDarkMode = true;

			// Save the workspace
			vi.mocked(apiRepository.saveWorkspace).mockImplementationOnce(async () => {
				// Update would happen on the server
			});

			await sessionViewModel.saveWorkspace();

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBeNull();
			expect(sessionViewModel.hasUnsavedChanges).toBe(false);
		});

		it('should handle saving errors', async () => {
			vi.mocked(apiRepository.saveWorkspace).mockRejectedValueOnce(new Error('Failed to save'));

			await sessionViewModel.saveWorkspace();

			expect(sessionViewModel.isLoading).toBe(false);
			expect(sessionViewModel.error).toBe('Failed to save');
			expect(sessionViewModel.hasUnsavedChanges).toBe(true);
		});
	});

	describe('hasUnsavedChanges', () => {
		it('should detect changes in workspace state', async () => {
			// Load initial workspace
			vi.mocked(apiRepository.fetchWorkspace).mockImplementationOnce(async () => {
				Object.assign(currentWorkspace, mockWorkspace);
			});
			await sessionViewModel.selectWorkspace('workspace1');
			expect(sessionViewModel.hasUnsavedChanges).toBe(false);

			// Make changes
			currentWorkspace.state.ui.isDarkMode = true;
			expect(sessionViewModel.hasUnsavedChanges).toBe(true);
		});
	});

	describe('reset', () => {
		it('should reset all session state', async () => {
			// First set up some state
			vi.mocked(apiRepository.fetchWorkspace).mockImplementationOnce(async () => {
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
			expect(loadedData.availableWorkspacesIds).toEqual([]);

			// Verify workspace state is reset
			expect(currentWorkspace.state.data.openedDatasetName).toBeNull();
			expect(currentWorkspace.state.data.openedCasesPaths).toEqual([]);
			expect(currentWorkspace.state.ui.isDarkMode).toBe(false);
		});
	});
});
