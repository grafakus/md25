import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  VariableValueOption,
  VizPanel,
} from '@grafana/scenes';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';
import { getColorByIndex } from './helpers/getColorByIndex';

interface MetricsPanelState extends SceneObjectState {
  metricOption: VariableValueOption;
  colorIndex: number;
  body: VizPanel;
}

function buildPromQuery(metricName: string) {
  const isCounter = ['_total', '_count'].some((suffix) => metricName.endsWith(suffix));

  // Create the appropriate query expression based on metric type
  if (isCounter) {
    return {
      refId: `sum-rate-${metricName}`,
      expr: `sum(rate(${metricName}{__ignore_usage__=\"\"}[$__rate_interval]))`,
    };
  }

  const isSum = metricName.endsWith('_sum');

  if (isSum) {
    const countMetric = metricName.replace(/_sum$/, '_count');

    return {
      refId: `sum-rate-ratio-${metricName}`,
      expr: `sum(rate(${metricName}{__ignore_usage__=\"\"}[$__rate_interval]))/sum(rate(${countMetric}{}[$__rate_interval]))`,
    };
  }

  return {
    refId: `avg-${metricName}`,
    expr: `avg(${metricName}{__ignore_usage__=\"\"})`,
  };
}

export class MetricsPanel extends SceneObjectBase<MetricsPanelState> {
  public constructor(state: { metricOption: VariableValueOption; colorIndex: number }) {
    const query = buildPromQuery(state.metricOption.value as string);

    super({
      ...state,
      body: PanelBuilders.timeseries()
        .setTitle(state.metricOption.label as string)
        .setData(
          new SceneQueryRunner({
            datasource: { uid: '${ds}' },
            queries: [query],
          })
        )
        .setColor({ mode: 'fixed', fixedColor: getColorByIndex(state.colorIndex) })
        .setCustomFieldConfig('fillOpacity', 9)
        .setHeaderActions(
          <Button variant="primary" fill="text" size="sm" onClick={() => console.log(state.metricOption)}>
            Select
          </Button>
        )
        .build(),
    });
  }

  static Component = ({ model }: SceneComponentProps<MetricsPanel>) => {
    const styles = useStyles2(getStyles);
    const { body } = model.useState();

    return (
      <div className={styles.panel}>
        <body.Component model={body} />
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  panel: css`
    height: 240px;
  `,
});
