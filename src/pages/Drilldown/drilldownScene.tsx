import {
  AdHocFiltersVariable,
  DataSourceVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneReactObject,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { QuickSearch } from './MetricsGrid/QuickSearch';

import { LayoutSwitcher } from './MetricsGrid/LayoutSwitcher';
import { MetricsGrid } from './MetricsGrid/MetricsGrid';
import { SortSelector } from './MetricsGrid/SortSelector';
import { buildDrilldownSceneVariables } from './buildDrilldownSceneVariables';
import { registerRuntimeDataSources } from './registerRuntimeDataSources';

export function drilldownScene() {
  registerRuntimeDataSources();

  const { filteredMetricsVariable, metricGroupsVariable, metricTypesVariable, labelsVariable } =
    buildDrilldownSceneVariables();

  const metricsGrid = new MetricsGrid();

  const quickSearch = new QuickSearch({
    onChange: (searchText) => {
      // support comma-separated regex patterns
      const names = searchText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      quickSearch.updateCounts(filteredMetricsVariable.applyFilters({ names }));
    },
  });

  filteredMetricsVariable.subscribeToState((newState, prevState) => {
    if (newState.options.length !== prevState.options.length) {
      quickSearch.updateCounts({ current: newState.options.length, total: newState.options.length });
    }
  });

  function onGroupOrTypeFiltersChanged(values: string[], filterName: 'groups' | 'types') {
    const filterString = values.includes('$__all') ? [] : values;

    quickSearch.updateCounts(filteredMetricsVariable.applyFilters({ [filterName]: filterString }));

    // TODO: when landing, postpone after both metrics groups and types are updated to prevent unecessary queries
    labelsVariable.updateQuery(filteredMetricsVariable.getFilters());
  }

  metricGroupsVariable.subscribeToState((newState, prevState) => {
    if (newState.value !== prevState.value) {
      onGroupOrTypeFiltersChanged(newState.value as string[], 'groups');
    }
  });

  metricTypesVariable.subscribeToState((newState, prevState) => {
    if (newState.value !== prevState.value) {
      onGroupOrTypeFiltersChanged(newState.value as string[], 'types');
    }
  });

  return new EmbeddedScene({
    $timeRange: new SceneTimeRange({}),
    $variables: new SceneVariableSet({
      variables: [
        new DataSourceVariable({
          name: 'ds',
          label: 'Data Source',
          type: 'datasource',
          pluginId: 'prometheus',
          value: undefined, // will pick the default Prometheus datasource
        }),
        filteredMetricsVariable,
        metricGroupsVariable,
        metricTypesVariable,
        new AdHocFiltersVariable({
          name: 'filters',
          label: 'Filters',
          datasource: { uid: '${ds}' },
          applyMode: 'auto',
        }),
        labelsVariable,
      ],
    }),
    controls: [
      new VariableValueSelectors({ layout: 'vertical' }),
      new SceneControlsSpacer(),
      new SceneTimePicker({}),
      new SceneRefreshPicker({}),
    ],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexLayout({
          direction: 'row',
          maxHeight: '32px',
          children: [
            new SceneFlexItem({
              body: quickSearch,
            }),
            new SceneFlexItem({
              maxWidth: '240px',
              body: new SortSelector({
                onChange: (value) => {
                  filteredMetricsVariable.sort(value);
                },
              }),
            }),
            new SceneFlexItem({
              maxWidth: '240px',
              body: new SceneReactObject({
                component: labelsVariable.Component,
                props: { model: labelsVariable },
              }),
            }),
            new SceneFlexItem({
              width: 'auto',
              body: new LayoutSwitcher(),
            }),
          ],
        }),
        new SceneFlexItem({
          body: metricsGrid,
        }),
      ],
    }),
  });
}
