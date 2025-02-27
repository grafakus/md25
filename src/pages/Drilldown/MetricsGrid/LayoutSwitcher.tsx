import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
} from '@grafana/scenes';
import { RadioButtonGroup } from '@grafana/ui';
import React from 'react';

export enum LayoutType {
  GRID = 'grid',
  ROWS = 'rows',
}

export interface LayoutSwitcherState extends SceneObjectState {
  layout: LayoutType;
  onChange?: (layout: LayoutType) => void;
}

export class LayoutSwitcher extends SceneObjectBase<LayoutSwitcherState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['layout'] });

  static OPTIONS = [
    { label: 'Grid', value: LayoutType.GRID },
    { label: 'Rows', value: LayoutType.ROWS },
  ];

  static DEFAULT_LAYOUT = LayoutType.GRID;

  constructor() {
    super({
      key: 'layout-switcher',
      layout: LayoutSwitcher.DEFAULT_LAYOUT,
    });
  }

  getUrlState() {
    return {
      layout: this.state.layout,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<LayoutSwitcherState> = {};

    if (typeof values.layout === 'string' && values.layout !== this.state.layout) {
      stateUpdate.layout = Object.values(LayoutType).includes(values.layout as LayoutType)
        ? (values.layout as LayoutType)
        : LayoutSwitcher.DEFAULT_LAYOUT;
    }

    this.setState(stateUpdate);
  }

  onChange = (layout: LayoutType) => {
    this.setState({ layout });
  };

  static Component = ({ model }: SceneComponentProps<LayoutSwitcher>) => {
    const { layout } = model.useState();

    return (
      <RadioButtonGroup
        aria-label="Layout switcher"
        options={LayoutSwitcher.OPTIONS}
        value={layout}
        onChange={model.onChange}
        fullWidth={false}
      />
    );
  };
}
