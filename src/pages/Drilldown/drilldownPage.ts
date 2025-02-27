import { SceneAppPage } from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { drilldownScene } from './drilldownScene';

export const drilldownPage = new SceneAppPage({
  title: '🧪 Metrics Drilldown Experiments 🧪',
  url: prefixRoute(ROUTES.Drilldown),
  getScene: drilldownScene,
});
