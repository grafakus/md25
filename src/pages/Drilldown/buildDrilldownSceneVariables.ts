import { LabelsVariable } from './Labels/LabelsVariable';
import { MetricGroupsVariable } from './MetricVariables/MetricGroupsVariable';
import { MetricTypesVariable } from './MetricVariables/MetricTypesVariable';
import { FilteredMetricsVariable } from './MetricVariables/FilteredMetricsVariable';

export function buildDrilldownSceneVariables() {
  const filteredMetricsVariable = new FilteredMetricsVariable();

  const metricGroupsVariable = new MetricGroupsVariable({
    metricsVariable: filteredMetricsVariable,
  });

  const metricTypesVariable = new MetricTypesVariable({
    metricsVariable: filteredMetricsVariable,
  });

  const labelsVariable = new LabelsVariable({ name: 'labels' });

  return {
    filteredMetricsVariable,
    metricGroupsVariable,
    metricTypesVariable,
    labelsVariable,
  };
}
