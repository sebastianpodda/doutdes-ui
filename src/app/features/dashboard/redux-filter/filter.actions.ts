/* Filter Actions */

import {Injectable} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {IAppState} from '../../../shared/store/model';
import {IntervalDate} from './filter.model';
import {ChartsCallsService} from '../../../shared/_services/charts_calls.service';
import {forkJoin, Observable} from 'rxjs';
import {DashboardCharts} from '../../../shared/_models/DashboardCharts';

export const FILTER_INIT = 'FILTER_INIT';
export const FILTER_RESET = 'FILTER_RESET';
export const FILTER_CLEAR = 'FILTER_CLEAR';
export const FILTER_BY_DATA = 'FILTER_BY_DATA';

@Injectable()
export class FilterActions {

  @select() filter: Observable<any>;
  originalData: any;

  constructor(
    private ngRedux: NgRedux<IAppState>,
    private chartCallService: ChartsCallsService,
  ) {
    this.filter.subscribe(elements => {
      this.originalData = elements['originalData'];
    });
  }

  initData(originalData, dateInterval: IntervalDate) {
    this.ngRedux.dispatch({type: FILTER_INIT, originalData: originalData, originalInterval: dateInterval});
  }

  filterData(dateInterval: IntervalDate) {

    const filteredData = this.filterByDate(JSON.stringify(this.originalData), dateInterval);
    this.ngRedux.dispatch({type: FILTER_BY_DATA, dataFiltered: filteredData, filterInterval: dateInterval});

  }

  clear() {
    this.ngRedux.dispatch({type: FILTER_CLEAR});
  }

  filterByDate(originalData, filterInterval: IntervalDate){

    let originalReceived = JSON.parse(originalData);
    let filtered = [];
    let observables: Observable<any>[] = [];
    let chartsToRetrieve: Array<DashboardCharts> = [];

    if (originalReceived) {
      originalReceived.forEach(chart => {

        if (chart['title'] !== 'Geomap') { // TODO Eliminare
          if (chart['Chart']['type'] == 2) {

            observables.push(this.chartCallService.getDataByChartId(chart['Chart']['id'], filterInterval));
            chartsToRetrieve.push(chart);

          } else {

            let header = [chart['chartData']['dataTable'].shift()];
            let newArray = [];

            chart['chartData']['dataTable'].forEach(element => newArray.push([new Date(element[0]), element[1]]));
            newArray = newArray.filter(element => element[0] >= filterInterval.dataStart && element[0] <= filterInterval.dataEnd);
            chart['chartData']['dataTable'] = header.concat(newArray);

            filtered.push(chart);
          }
        }
      });

      if(observables.length !== 0) {
        console.log('Devo filtrare ' + observables.length + ' grafici');

        forkJoin(observables)
          .subscribe(dataArray => {
            console.log(dataArray);

            for(let i=0;i<dataArray.length; i++){
              let newData = this.chartCallService.formatDataByChartId(chartsToRetrieve[i].chart_id ,dataArray[i]);

              chartsToRetrieve[i].chartData['dataTable'] = newData['dataTable'];
              filtered.push(chartsToRetrieve[i]);
            }
          });
      }
    }

    return filtered;
  }

}
