import { Type } from '@angular/core';

export interface ILineChartData {
  areaChart: boolean;
  detailComponent: Type<any>;
  dataPoints: any;
}
