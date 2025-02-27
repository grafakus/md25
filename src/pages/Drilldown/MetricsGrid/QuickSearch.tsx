import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneObjectBase, SceneObjectState, SceneObjectUrlSyncConfig, SceneObjectUrlValues } from '@grafana/scenes';
import { IconButton, Input, Tag, useStyles2 } from '@grafana/ui';
import { debounce } from 'lodash';
import React, { KeyboardEvent } from 'react';

interface QuickSearchState extends SceneObjectState {
  onChange: (value: string) => void;
  value: string;
  counts: { current: number; total: number };
}

export class QuickSearch extends SceneObjectBase<QuickSearchState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, {
    keys: ['qs'],
  });

  getUrlState() {
    return { qs: this.state.value };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const newValue = (values.qs as string) || '';

    if (newValue !== this.state.value) {
      this.onChange(newValue);
    }
  }

  public constructor(state: { onChange: QuickSearchState['onChange'] }) {
    super({
      value: '',
      onChange: debounce(state.onChange, 250),
      counts: { current: 0, total: 0 },
    });
  }

  public updateCounts(counts: { current: number; total: number }) {
    this.setState({ counts });
  }

  public onChange = (value: string) => {
    this.setState({ value });
    this.state.onChange(value);
  };

  public clear = () => {
    this.onChange('');
  };

  private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.clear();
    }
  };

  static Component = ({ model }: { model: QuickSearch }) => {
    const styles = useStyles2(getStyles);
    const { value, counts } = model.useState();

    return (
      <Input
        value={value}
        onChange={(e) => model.onChange(e.currentTarget.value)}
        onKeyDown={model.handleKeyDown}
        placeholder="Search metrics (comma-separated regexes are supported)"
        prefix={<i className="fa fa-search" />}
        suffix={
          <>
            <Tag className={styles.resultsCount} name={`${counts.current}/${counts.total}`} colorIndex={9} />
            <IconButton name="times" variant="secondary" tooltip="Clear search" onClick={model.clear} />
          </>
        }
      />
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  resultsCount: css`
    margin-right: ${theme.spacing(1)};
    border-radius: 11px;
    padding: 2px 8px;
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.background.secondary};
  `,
});
