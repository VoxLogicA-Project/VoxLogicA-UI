import { writable, derived, type Readable } from 'svelte/store';

// View: raw data structure from scans_db.json
interface ScansData {
	images: string[];
}

// ViewModel: transformed data structure with complete URLs for frontend consumption
export interface ScanUrlsData {
	imageUrls: string[];
}

export const scansStore = writable<ScansData | null>(null);

// New derived store (readonly/Readable)
const BRAIN_SCAN_URL_PREFIX = '/brain_scan_examples/';
export const scanUrlsStore: Readable<ScanUrlsData | null> = derived(scansStore, ($scansStore) => {
	// Null-safety
	if (!$scansStore) return null;

	return {
		imageUrls: $scansStore.images.map((image) => `${BRAIN_SCAN_URL_PREFIX}${image}`),
	};
});

export async function loadScansData(): Promise<ScansData | null> {
	try {
		const response = await fetch('/brain_scan_examples/scans_db.json');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: ScansData = await response.json();
		scansStore.set(data);
		return data;
	} catch (error) {
		console.error('Error loading scans data:', error);
		return null;
	}
}
