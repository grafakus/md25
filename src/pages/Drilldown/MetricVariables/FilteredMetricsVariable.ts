import { SceneVariableValueChangedEvent, VariableValueOption } from '@grafana/scenes';
import { cloneDeep } from 'lodash';
import { MetricsVariable } from './MetricsVariable';
import { localeCompare } from '../helpers/localCompare';

export type MetricFilters = { groups: string[]; types: string[]; names: string[] };

export class FilteredMetricsVariable extends MetricsVariable {
  private initOptions: VariableValueOption[] = [];
  private filters: MetricFilters = { groups: [], types: [], names: [] };
  private sortType = '';
  public onOptionsChanged: (options: VariableValueOption[]) => void = () => {};

  constructor() {
    super({
      name: 'metrics',
      label: 'Filtered Metrics',
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    this._subs.add(
      this.subscribeToState((newState, prevState) => {
        if (newState.loading === false && prevState.loading === true) {
          this.initOptions = cloneDeep(newState.options);

          this.applyFilters(this.filters, false);
        }
      })
    );
  }

  getFilters() {
    return this.filters;
  }

  applyFilters(filters: Partial<MetricFilters>, forceRerender = true) {
    this.filters = { ...this.filters, ...filters };

    // logical OR
    const regexGroup = FilteredMetricsVariable.buildRegex(this.filters.groups.map((g) => `^${g}`).join('|'));
    let filteredOptions = this.initOptions.filter((o) => regexGroup.test(o.value as string));

    // logical OR
    // TODO: logical AND
    const regexTypes = FilteredMetricsVariable.buildRegex(this.filters.types.join('|'));
    filteredOptions = filteredOptions.filter((o) => regexTypes.test(o.value as string));

    const total = filteredOptions.length;

    const regexMetric = FilteredMetricsVariable.buildRegex(this.filters.names.join('|'));
    filteredOptions = filteredOptions.filter((o) => regexMetric.test(o.value as string));

    this.setState({
      options: filteredOptions,
    });

    this.sort(this.sortType, false);

    if (forceRerender) {
      // hack to force SceneByVariableRepeater to re-render
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }

    return { current: this.state.options.length, total };
  }

  static buildRegex(pattern: string) {
    try {
      return new RegExp(pattern);
    } catch {
      return new RegExp('.*');
    }
  }

  sort(sortType: string, forceRerender = true) {
    this.sortType = sortType;

    // clone so that lodash comparison work as expected (e.g. in MetricsGrid)
    let sortedOptions = [...this.state.options];

    if (sortType === 'a-z') {
      sortedOptions.sort((a, b) => localeCompare(a.value as string, b.value as string));
    } else if (sortType === 'z-a') {
      sortedOptions.sort((a, b) => localeCompare(b.value as string, a.value as string));
    }

    this.setState({
      options: sortedOptions,
    });

    if (forceRerender) {
      // hack to force SceneByVariableRepeater to re-render
      this.publishEvent(new SceneVariableValueChangedEvent(this), true);
    }
  }
}
