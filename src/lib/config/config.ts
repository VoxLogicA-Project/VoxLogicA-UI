import path from 'path';

export const DATASET_PATH = process.env.DATASET_PATH || path.join(process.cwd(), 'static/datasets');
