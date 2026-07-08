import type { App } from 'vue';
import ECharts from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
} from 'echarts/components';

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
]);

export function registerEcharts(app: App) {
  app.component('VChart', ECharts);
}

export const chartTooltip = {
  backgroundColor: '#0f172a',
  borderColor: '#1e293b',
  borderRadius: 12,
  textStyle: { color: '#e2e8f0' },
};
