import { css } from '@emotion/css';
import { VariableHide, VariableRefresh } from '@grafana/data';
import { MultiValueVariable, QueryVariable, SceneComponentProps } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';
import { MetricFilters } from '../MetricVariables/FilteredMetricsVariable';
import { LabelsDataSource } from './LabelsDataSource';

export class LabelsVariable extends QueryVariable {
  constructor(state: { name: string }) {
    super({
      ...state,
      label: 'Group by label',
      placeholder: 'Group by label...',
      datasource: { uid: LabelsDataSource.uid },
      query: '',
      value: undefined,
      includeAll: false,
      isMulti: false,
      allowCustomValue: false,
      refresh: VariableRefresh.onTimeRangeChanged,
      hide: VariableHide.hideVariable,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this._subs.add(
      this.subscribeToState((newState, prevState) => {
        if (newState.query !== prevState.query) {
          this.setState({ value: '' });
          this.refreshOptions();
        }

        if (newState.options.length !== prevState.options.length) {
          this.setState({ label: `Group by labels (${newState.options.length})` });
        }
      })
    );
  }

  updateQuery(filters: MetricFilters) {
    if (filters.groups.length === 0 && filters.types.length === 0) {
      this.setState({
        query: '{__name__=~".+",$filters}',
      });
      return;
    }

    const groupMatcher = filters.groups.map((g) => `${g}`).join('|');
    const typeMatcher = filters.types.map((t) => `${t}`).join('|');
    const nameMatcher = typeMatcher ? `^(${groupMatcher}).+(${typeMatcher}).*` : `^(${groupMatcher}).+`;

    this.setState({
      query: `{__name__=~"${nameMatcher}",$filters}`,
    });
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const styles = useStyles2(getStyles);

    return (
      <div className={styles.container}>
        <QueryVariable.Component model={model} />
      </div>
    );
  };
}

const getStyles = () => ({
  container: css`
    [class*='input-wrapper'] {
      width: 240px;
    }
  `,
});
