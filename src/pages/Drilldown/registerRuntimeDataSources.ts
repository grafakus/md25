import { registerRuntimeDataSource } from '@grafana/scenes';
import { LabelsDataSource } from './Labels/LabelsDataSource';

export function registerRuntimeDataSources() {
  try {
    registerRuntimeDataSource({ dataSource: new LabelsDataSource() });
  } catch (error) {
    console.error('Failed to register runtime labels data source!');
    console.error(error);
  }
}
