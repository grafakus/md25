import { CustomVariable } from '@grafana/scenes';
import { isEqual } from 'lodash';
import { FilteredMetricsVariable } from './FilteredMetricsVariable';

export class MetricTypesVariable extends CustomVariable {
  private static readonly WORDS_TO_MATCH = [
    'memory',
    'cpu',
    'error',
    'request',
    'response',
    'latency',
    'bucket',
    'duration',
    'count',
    'sum',
    'total',
    'size',
    'rate',
    'milliseconds',
    'heap',
    'bytes',
    'info',
    'version',
    'length',
    'time',
    'status',
    'max',
    'min',
    'avg',
    'threshold',
    'calls',
  ];

  constructor(state: { metricsVariable: FilteredMetricsVariable }) {
    super({
      name: 'metricTypes',
      label: 'Metric types',
      options: [],
      includeAll: true,
      defaultToAll: true,
      isMulti: true,
      allowCustomValue: false,
    });

    this.addActivationHandler(this.onActivate.bind(this, state.metricsVariable));
  }

  private onActivate(metricsVariable: FilteredMetricsVariable) {
    this._subs.add(
      metricsVariable.subscribeToState((newState, prevState) => {
        if (!newState.loading && !isEqual(newState.options, prevState.options)) {
          const { options: newOptions } = this.buildGroupOptions(
            // we're using the variable state here, because of weird behaviour when landing on the page with a selected group:
            // in this case, it appears that newState.options is not filtered :man_shrug:
            metricsVariable.state.options as Array<{ value: string; label: string }>
          );

          this.setState({
            options: newOptions,
            isReadOnly: !newOptions.length,
            // TODO: improve, filter to keep only the values contained in the new groups Map?
            value: !newOptions.length ? ['$__all'] : this.state.value || '$__all',
            label: `Metric types (${newOptions.length})`,
          });
        }
      })
    );
  }

  buildGroupOptions(options: Array<{ value: string }>) {
    const groups = new Map();

    for (const { value } of options) {
      MetricTypesVariable.WORDS_TO_MATCH.forEach((word) => {
        if (value.includes(word)) {
          groups.set(word, (groups.get(word) ?? 0) + 1);
        }
      });
    }

    return {
      groups,
      options: Array.from(groups.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({
          value,
          label: `${value} (${count})`,
        })),
    };
  }
}
