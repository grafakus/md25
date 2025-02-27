import { CustomVariable } from '@grafana/scenes';
import { FilteredMetricsVariable } from './FilteredMetricsVariable';
import { localeCompare } from '../helpers/localCompare';

export class MetricGroupsVariable extends CustomVariable {
  constructor(state: { metricsVariable: FilteredMetricsVariable }) {
    super({
      name: 'metricGroups',
      label: 'Metric groups',
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
        if (newState.loading === false && prevState.loading === true) {
          const newOptions = this.buildGroupOptions(newState.options as Array<{ value: string; label: string }>);

          this.setState({
            options: newOptions,
            isReadOnly: !newOptions.length,
            value: !newOptions.length ? ['$__all'] : this.state.value || '$__all',
            label: `Metric groups (${newOptions.length})`,
          });
        }
      })
    );
  }

  buildGroupOptions(options: Array<{ value: string }>) {
    const groups = new Map();

    for (const { value } of options) {
      // order is important
      const done = [':', '_'].some((separator) => {
        if (value.includes(separator)) {
          const [prefix] = (value as string).split(separator);
          const key = prefix || value;

          groups.set(key, (groups.get(key) ?? 0) + 1);
          return true;
        }

        return false;
      });

      if (!done) {
        groups.set(value, (groups.get(value) ?? 0) + 1);
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => localeCompare(a[0], b[0]))
      .map(([value, count]) => ({
        value,
        label: `${value} (${count})`,
      }));
  }
}
