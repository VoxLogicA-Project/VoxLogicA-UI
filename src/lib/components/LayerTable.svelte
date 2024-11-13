<script lang="ts">
	import { datasetStore } from '$lib/viewmodels/datasetStore';

	// Stores layer information for each selected case
	let layersData: Record<string, string[]> = {};
	let loading = false;
	let error: string | null = null;

	// Fetches layer information for all selected cases
	async function loadLayers() {
		if (!$datasetStore.currentDataset || $datasetStore.selectedCases.length === 0) {
			layersData = {};
			return;
		}

		loading = true;
		error = null;
		try {
			const promises = $datasetStore.selectedCases.map(async (caseName) => {
				const response = await fetch(
					`/datasets/${$datasetStore.currentDataset?.path}/cases/${caseName}/layers`
				);
				const layers = await response.json();
				return [caseName, layers];
			});

			const results = await Promise.all(promises);
			layersData = Object.fromEntries(results);
		} catch (err) {
			error = 'Failed to load layers';
		} finally {
			loading = false;
		}
	}

	$: if ($datasetStore.selectedCases) {
		loadLayers();
	}
</script>

<div class="w-full">
	{#if loading}
		<div class="flex justify-center p-4">
			<span class="loader" />
		</div>
	{:else if error}
		<div class="alert variant-filled-error">
			{error}
		</div>
	{:else if Object.keys(layersData).length > 0}
		<div class="table-container">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>Case</th>
						<th>Layers</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(layersData) as [caseName, layers]}
						<tr>
							<td>{caseName}</td>
							<td>
								<div class="flex flex-wrap gap-2">
									{#each layers as layer}
										<span class="chip variant-soft">
											{layer}
										</span>
									{/each}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		Select cases to view their layers
	{/if}
</div>
