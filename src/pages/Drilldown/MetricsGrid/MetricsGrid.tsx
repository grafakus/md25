import {
  behaviors,
  EmbeddedScene,
  SceneByVariableRepeater,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { DashboardCursorSync } from '@grafana/schema';
import { Alert, Spinner } from '@grafana/ui';
import React from 'react';
import { MetricsVariable } from '../MetricVariables/MetricsVariable';
import { MetricsPanel } from './MetricsPanel';
import { isEqual } from 'lodash';
import { LayoutSwitcher, LayoutSwitcherState, LayoutType } from './LayoutSwitcher';

interface MetricsListState extends SceneObjectState {
  body: SceneByVariableRepeater;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';

export class MetricsGrid extends SceneObjectBase<MetricsListState> {
  startColorIndex = 0;

  constructor() {
    super({
      body: new SceneByVariableRepeater({
        variableName: 'metrics',
        body: new SceneCSSGridLayout({
          children: [],
          templateColumns: GRID_TEMPLATE_COLUMNS,
          autoRows: '240px',
          alignItems: 'start',
          isLazy: true,
          $behaviors: [
            new behaviors.CursorSync({
              key: 'metricCrosshairSync',
              sync: DashboardCursorSync.Crosshair,
            }),
          ],
        }),
        getLayoutChild: (option) => {
          // Scenes does not pass an index :man_shrug: :sad_panda:
          return new SceneCSSGridItem({
            body: new MetricsPanel({ metricOption: option, colorIndex: this.startColorIndex++ }),
          });
        },
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    this.subscribeToVariableChange();
    this.subscribeToLayoutChange();
  }

  subscribeToVariableChange() {
    const drilldownVariables = sceneGraph.getVariables(sceneGraph.getAncestor(this, EmbeddedScene));

    this._subs.add(
      (drilldownVariables.getByName(this.state.body.state.variableName) as MetricsVariable).subscribeToState(
        (newState, prevState) => {
          if (!isEqual(newState.options, prevState.options)) {
            this.startColorIndex = 0; // see sad panda comment above
          }
        }
      )
    );
  }

  subscribeToLayoutChange() {
    const layoutSwitcher = sceneGraph.findByKeyAndType(this, 'layout-switcher', LayoutSwitcher);
    const body = this.state.body.state.body as SceneCSSGridLayout;

    const onChangeState = (newState: LayoutSwitcherState, prevState?: LayoutSwitcherState) => {
      if (newState.layout !== prevState?.layout) {
        body.setState({
          templateColumns: newState.layout === LayoutType.ROWS ? GRID_TEMPLATE_ROWS : GRID_TEMPLATE_COLUMNS,
        });
      }
    };

    onChangeState(layoutSwitcher.state); // ensure layout when landing on the page

    this._subs.add(layoutSwitcher.subscribeToState(onChangeState));
  }

  static Component = ({ model }: { model: MetricsGrid }) => {
    const { body } = model.useState();

    const drilldownVariables = sceneGraph.getVariables(sceneGraph.getAncestor(model, EmbeddedScene));

    const { loading, error, options } = (
      drilldownVariables.getByName(body.state.variableName) as MetricsVariable
    )?.useState();

    if (loading) {
      return <Spinner inline />;
    }

    if (error) {
      return (
        <Alert severity="error" title="Error while loading metrics!">
          <p>&quot;{error.message || error.toString()}&quot;</p>
          <p>Please try to reload the page. Sorry for the inconvenience.</p>
        </Alert>
      );
    }

    if (!options?.length) {
      return (
        <Alert title="" severity="info">
          No metrics found for the current groups, filters and time range.
        </Alert>
      );
    }

    return <body.Component model={body} />;
  };
}
