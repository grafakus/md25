import { VariableHide, VariableRefresh, VariableSort } from '@grafana/data';
import { QueryVariable } from '@grafana/scenes';

export class MetricsVariable extends QueryVariable {
  constructor(state: { name: string; label: string }) {
    super({
      ...state,
      datasource: { uid: '${ds}' },
      query: 'label_values({${filters}}, __name__)',
      includeAll: true,
      value: '$__all',
      refresh: VariableRefresh.onTimeRangeChanged,
      sort: VariableSort.alphabeticalAsc,
      hide: VariableHide.hideVariable,
    });
  }
}
