import { writable } from 'svelte/store';

interface ScansData {
    images: string[];
}

export const scansStore = writable<ScansData | null>(null);

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