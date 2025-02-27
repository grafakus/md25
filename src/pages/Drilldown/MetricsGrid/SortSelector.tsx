import { SelectableValue } from '@grafana/data';
import { SceneObjectBase, SceneObjectState, SceneObjectUrlSyncConfig, SceneObjectUrlValues } from '@grafana/scenes';
import { Select } from '@grafana/ui';
import React from 'react';

interface SortSelectorState extends SceneObjectState {
  onChange: (value: string) => void;
  value?: string;
}

export class SortSelector extends SceneObjectBase<SortSelectorState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, {
    keys: ['sort'],
  });

  getUrlState() {
    return { sort: this.state.value };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const newValue = (values.sort as string) || '';

    if (newValue !== this.state.value) {
      this.onChange(newValue);
    }
  }

  constructor(state: { onChange: (value: string) => void }) {
    super({
      onChange: state.onChange,
      value: undefined,
    });
  }

  private onChange = (value: string) => {
    this.setState({ value });
    this.state.onChange(value);
  };

  static Component = ({ model }: { model: SortSelector }) => {
    const { value } = model.useState();

    return (
      <Select
        placeholder="Sort by..."
        value={value}
        onChange={(option: SelectableValue<string>) => {
          model.onChange(option.value as string);
        }}
        options={[
          { label: 'Alphabetical order (A-Z)', value: 'a-z' },
          { label: 'Reverse alphabetical order (Z-A)', value: 'z-a' },
        ]}
      />
    );
  };
}
