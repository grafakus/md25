import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
} from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataSourceVariable, RuntimeDataSource, sceneGraph, SceneObject } from '@grafana/scenes';
import { localeCompare } from '../helpers/localCompare';

export class LabelsDataSource extends RuntimeDataSource {
  static uid = 'grafana-prometheus-labels-datasource';

  constructor() {
    super('grafana-prometheus-labels-datasource', LabelsDataSource.uid);
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Labels',
          fields: [
            {
              name: null,
              type: FieldType.other,
              values: [],
              config: {},
            },
          ],
          length: 0,
        },
      ],
    };
  }

  async metricFindQuery(matcher: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const sceneObject = options.scopedVars?.__sceneObject?.valueOf() as SceneObject;

    const ds = await this.getPrometheusDataSource(sceneObject);

    if (!ds) {
      return [];
    }

    const response = await ds.languageProvider.fetchLabelsWithMatch(matcher);

    const labelOptions = Object.entries(response)
      .filter(([key]) => !key.startsWith('__'))
      .map(([key, value]) => ({ value: key, text: value || key }))
      .sort((a, b) => localeCompare(a.value as string, b.value as string));

    return [{ value: '', text: '(group by label)' }, ...labelOptions] as MetricFindValue[];
  }

  async getPrometheusDataSource(sceneObject: SceneObject): Promise<DataSourceApi | undefined> {
    try {
      const dsVariable = sceneGraph.getVariables(sceneObject).getByName('ds') as DataSourceVariable;
      const uid = (dsVariable?.state.value as string) ?? '';

      return await getDataSourceSrv().get({ uid });
    } catch (error) {
      console.error('Error getting Prometheus data source!');
      console.error(error);

      return undefined;
    }
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
