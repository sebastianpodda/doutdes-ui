import {Injectable} from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {IAppState} from '../../../shared/store/model';
import {DashboardData, IntervalDate, IntervalDateComparasion} from './filter.model';
import {ChartsCallsService} from '../../../shared/_services/charts_calls.service';
import {Observable} from 'rxjs';
import {DashboardCharts} from '../../../shared/_models/DashboardCharts';
import {AggregatedDataService} from '../../../shared/_services/aggregated-data.service';
import {D_TYPE, DS_TYPE} from '../../../shared/_models/Dashboard';
import {parseDate} from 'ngx-bootstrap';
import {until} from 'selenium-webdriver';
import elementIsSelected = until.elementIsSelected;
import * as moment from 'moment';
import {Chart} from '../../../shared/_models/Chart';
import {IG_CHART} from '../../../shared/_models/InstagramData';

export const FILTER_INIT = 'FILTER_INIT';
export const FILTER_UPDATE = 'FILTER_UPDATE';
export const FILTER_BY_DATA = 'FILTER_BY_DATA';
export const FILTER_RESET = 'FILTER_RESET';
export const FILTER_CLEAR = 'FILTER_CLEAR';
export const FILTER_REMOVE_CURRENT = 'FILTER_REMOVE_CURRENT';


@Injectable()
export class FilterActions {

  @select() filter: Observable<any>;

  currentDashboard: DashboardData;
  filteredDashboard: DashboardData;
  storedDashboards: DashboardData[];

  constructor(
    private Redux: NgRedux<IAppState>,
    private CCService: ChartsCallsService,
    private ADService: AggregatedDataService,
  ) {
    this.filter.subscribe(elements => {
      this.currentDashboard = elements['currentDashboard'];
      this.filteredDashboard = elements['filteredDashboard'];
      this.storedDashboards = elements['storedDashboards'];
    });
  }

  /**
   * It receives the original data and it stores them as they are
   * After this, it requires for the right format of the data and it stores this in the formatted data
   **/
  initData(initialData: DashboardData) {
    const currentDashboard = initialData || null;
    const filteredDashboard = initialData ? JSON.parse(JSON.stringify(initialData)) : null;
    let chart_id, index, dateInterval;
    // Given the original data, it retrieves the right format for the data
    if (filteredDashboard) {
      for (const i in filteredDashboard.data) {
        if (!filteredDashboard.data[i].error && filteredDashboard.data[i]['chartData'].length > 0) { // If there was not error during the retrieving of the chart data
          chart_id = filteredDashboard.data[i].chart_id;

          dateInterval = this.getIntervalDate(filteredDashboard.data[i].chartData, filteredDashboard.data[i].type);

          filteredDashboard.data[i].aggregated = this.ADService.getAggregatedData(filteredDashboard.data[i], dateInterval);
          filteredDashboard.data[i].chartData = this.CCService.formatChart(chart_id, filteredDashboard.data[i].chartData);
        } else {
          filteredDashboard.data[i].error = true;
        }
      }
      // It searches if the dashboard was already initialized. If it's not, then the dashboard will be stored
      index = this.storedDashboards ? this.storedDashboards.findIndex((el: DashboardData) => el.type === currentDashboard.type) : -1;

      if (index < 0) { // The dashboard was never been stored
        this.storedDashboards.push(JSON.parse(JSON.stringify(initialData)));
        index = this.storedDashboards.findIndex((el: DashboardData) => el.type === currentDashboard.type);
      } else {
        this.storedDashboards[index] = JSON.parse(JSON.stringify(initialData));
      }
    }

    this.Redux.dispatch({
      type: FILTER_INIT,
      currentDashboard: currentDashboard,
      filteredDashboard: filteredDashboard,
      storedDashboards: this.storedDashboards
    });
  }

  filterData(dateInterval: IntervalDate) {
    const filteredDashboard = this.filterByDateInterval(dateInterval);
    this.Redux.dispatch({type: FILTER_BY_DATA, filteredDashboard: filteredDashboard});
  }

  /*
  filterDataComparasion(dateInterval: IntervalDateComparasion) {
    const filteredDashboard = this.filterByDateInterval(dateInterval);
    this.Redux.dispatch({type: FILTER_BY_DATA, filteredDashboard: filteredDashboard});
  }
  */

  updateChart(chart: DashboardCharts) {
    const index = this.currentDashboard.data.findIndex((chartToUpdate) => chartToUpdate.chart_id === chart.chart_id);
    const storedIndex = this.storedDashboards.findIndex((el: DashboardData) => el.type === this.currentDashboard.type);

    this.currentDashboard.data[index].title = chart.title;
    this.filteredDashboard.data[index].title = chart.title;
    this.storedDashboards[storedIndex].data[index].title = chart.title;

    this.Redux.dispatch({
      type: FILTER_UPDATE,
      currentDashboard: this.currentDashboard,
      filteredDashboard: this.filteredDashboard,
      storedDashboards: this.storedDashboards
    });

  }

  updateStylesChart(chart: DashboardCharts) {
    const index = this.currentDashboard.data.findIndex((chartToUpdate) => chartToUpdate.originalTitle === chart.title);
    const storedIndex = this.storedDashboards.findIndex((el: DashboardData) => el.type === this.currentDashboard.type);

    this.currentDashboard.data[index].chart_id = chart.chart_id;
    this.currentDashboard.data[index].format = chart.format;

    this.filteredDashboard.data[index].chart_id = chart.chart_id;
    this.filteredDashboard.data[index].format = chart.format;

    this.storedDashboards[storedIndex].data[index].chart_id = chart.chart_id;
    this.storedDashboards[storedIndex].data[index].format = chart.format;


    this.Redux.dispatch({
      type: FILTER_UPDATE,
      currentDashboard: this.currentDashboard,
      filteredDashboard: this.filteredDashboard,
      storedDashboards: this.storedDashboards
    });

  }

/*
  updateIntervalChart(chart: DashboardCharts) {
    const index = this.currentDashboard.data.findIndex((chartToUpdate) => chartToUpdate.chart_id === chart.chart_id);
    const storedIndex = this.storedDashboards.findIndex((el: DashboardData) => el.type === this.currentDashboard.type);

    this.currentDashboard.data[index].chartData = chart.chartData;
    this.filteredDashboard.data[index].chartData = chart.chartData;
    this.storedDashboards[storedIndex].data[index].chart = chart.title;

  }

 */

  updateChartPosition(arrayChart$: DashboardCharts, type: number) {
    const storedIndex = this.storedDashboards.findIndex((el: DashboardData) => el.type === type);

    for (let i = 0; i < this.currentDashboard.data.length; i++) {
      this.currentDashboard.data.find(el => el.chart_id === arrayChart$[i].chart_id).position = arrayChart$[i].position;
      this.filteredDashboard.data.find(el => el.chart_id === arrayChart$[i].chart_id).position = arrayChart$[i].position;
      this.storedDashboards[storedIndex].data.find(el => el.chart_id === arrayChart$[i].chart_id).position = arrayChart$[i].position;
    }

    this.sortDashboards(storedIndex);

    this.Redux.dispatch({
      type: FILTER_UPDATE,
      currentDashboard: this.currentDashboard,
      filteredDashboard: this.filteredDashboard,
      storedDashboards: this.storedDashboards
    });

  }

  sortDashboards(storedIndex: number) {
    this.currentDashboard.data = this.currentDashboard.data.sort((a: DashboardCharts, b: DashboardCharts) => a.position - b.position);
    this.filteredDashboard.data = this.filteredDashboard.data.sort((a: DashboardCharts, b: DashboardCharts) => a.position - b.position);
    if (storedIndex > 0) {
      this.storedDashboards[storedIndex].data = this.storedDashboards[storedIndex].data.sort((a: DashboardCharts, b: DashboardCharts) => a.position - b.position);
    }
  }

  addChart(chart: DashboardCharts) {
    const index = this.storedDashboards.findIndex((el: DashboardData) => el.type === this.currentDashboard.type);
    const filteredChart = JSON.parse(JSON.stringify(chart));
    filteredChart.chartData = this.CCService.formatChart(filteredChart.chart_id, filteredChart.chartData);
    this.currentDashboard.data.push(chart);
    this.filteredDashboard.data.push(filteredChart);

    if (index < 0) { // The dashboard was never been stored
      this.storedDashboards.push(JSON.parse(JSON.stringify(this.currentDashboard)));
    } else {
      this.storedDashboards[index] = JSON.parse(JSON.stringify(this.currentDashboard));
    }

    this.Redux.dispatch({
      type: FILTER_UPDATE,
      currentDashboard: this.currentDashboard,
      filteredDashboard: this.filteredDashboard,
      storedDashboards: this.storedDashboards
    });
  }

  removeChart(id: number) {
    const index = this.storedDashboards.findIndex((el: DashboardData) => el.type === this.currentDashboard.type);

    this.currentDashboard.data = this.currentDashboard.data.filter((chart) => chart.chart_id !== id);
    this.filteredDashboard.data = this.filteredDashboard.data.filter((chart) => chart.chart_id !== id);

    this.storedDashboards[index] = JSON.parse(JSON.stringify(this.currentDashboard));

    this.Redux.dispatch({
      type: FILTER_UPDATE,
      currentDashboard: this.currentDashboard,
      filteredDashboard: this.filteredDashboard,
      storedDashboards: this.storedDashboards
    });
  }

  removeCurrent() {
    this.Redux.dispatch({type: FILTER_REMOVE_CURRENT});
  }

  filterByDateInterval(filterInterval: IntervalDate) {
    const dashToFilter: DashboardData = JSON.parse(JSON.stringify(this.currentDashboard)); // Looses the reference to original data
    const filtered = [];
    let chart;
    if (dashToFilter) {
      for (let i = 0; i < dashToFilter.data.length; i++) {
        chart = dashToFilter.data[i];

        // If the type of the chart is known
        if (DS_TYPE.hasOwnProperty(chart.type)) {
          if (!chart.error) {
            switch (chart.type) {
              case D_TYPE.GA:
                if (chart.chart_id !== 121) {
                  chart.chartData = chart.chartData.filter(el => parseDate(el[0]).getTime() >= filterInterval.first.getTime() && parseDate(el[0]).getTime() <= filterInterval.last.getTime());
                }
                break;
              case D_TYPE.YT:
                chart.chartData = chart.chartData.filter(el => parseDate(el.date).getTime() >= filterInterval.first.getTime() && parseDate(el.date).getTime() <= filterInterval.last.getTime());
                break;
              case D_TYPE.FBM:
                chart.chartData = chart.chartData.filter(el => parseDate(el.date_stop).getTime() >= filterInterval.first.getTime() && parseDate(el.date_stop).getTime() <= filterInterval.last.getTime());
                break;
              case D_TYPE.IG:
                if (chart.metric === 'lost_followers') {
                  chart.chartData[0]['business'] = chart.chartData[0]['business'].filter( el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last);
                  chart.chartData[1]['follower_count'] = chart.chartData[1]['follower_count'].filter( el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last);
                }
                chart.chartData = chart.metric === 'online_followers'
                  ? chart.chartData.filter( el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last)
                  : ((chart.metric === 'follower_count' && chart.chart_id === 108) || chart.period === 'lifetime')
                    ? chart.chartData
                    : chart.metric === 'lost_followers'
                      ? chart.chartData
                      : chart.chartData.filter( el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last);


                /***
                chart.chartData = chart.metric ===
                'online_followers' ? chart.chartData.filter(
                  el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last) :
                  chart.period !== 'lifetime' && chart.metric !== 'lost_followers'
                    ? chart.chartData.filter(
                    el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last)
                    : chart.chartData;
                 ***/

                if (chart.metric === 'audience_city' || chart.metric === 'audience_gender_age') {
                  chart.chartData = chart.chartData.filter(
                    el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last);
                }
                break;
              default:
                chart.chartData = chart.chartData.filter(el => (moment(el.end_time).toDate()) >= filterInterval.first && (moment(el.end_time).toDate()) <= filterInterval.last);
                break;
            }
            /* YT chart has "date", not [0], so a switch instead of the old method was required
                        chart.chartData = chart.type === D_TYPE.GA || chart.type === D_TYPE.YT
                          ? chart.chartData.filter(el => parseDate(el[0]).getTime() >= filterInterval.first.getTime() && parseDate(el[0]).getTime() <= filterInterval.last.getTime())
                          : chart.chartData.filter(el => (new Date(el.end_time)) >= filterInterval.first && (new Date(el.end_time)) <= filterInterval.last);
            */

            chart.chartData = this.CCService.formatChart(chart.chart_id, chart.chartData);
            chart.aggregated = this.ADService.getAggregatedData(this.currentDashboard.data[i], filterInterval);
          }
          filtered.push(chart);
        } else {
          console.error('Error in FILTER_ACTIONS. A chart of unknown type (' + chart.type + ') was found, filter action skipped.');
          console.error('MORE DETAILS (unfiltered data in input):');
          console.error(chart);
        }
      }

      dashToFilter.data = filtered;
    }
    // else {
    // console.warn('Error in FILTER_ACTIONS. No unfiltered data found.');
    // console.warn(dashToFilter);
    // }

    return dashToFilter;
  }

  addMetric = (oldChart: DashboardCharts, newMetric: Chart) => {
    console.warn('old', oldChart);
    console.warn('new', newMetric);

  };

  clear() {
    this.Redux.dispatch({type: FILTER_CLEAR});
  }

  clearDashboard(dashboard_type: number) {

    this.storedDashboards = this.storedDashboards.filter((el: DashboardData) => el.type !== dashboard_type);

    this.currentDashboard.data = [];
    this.filteredDashboard.data = [];

    this.Redux.dispatch({
      type: FILTER_UPDATE,
      storedDashboards: this.storedDashboards,
      currentDashboard: this.currentDashboard,
      filteredDashboard: this.filteredDashboard,
    });
  }

  // This method is been called if and only if a dashboard was already stored on the variable model called storedDashboards
  loadStoredDashboard(dashboard_type: number) {
    const index = this.storedDashboards.findIndex((el: DashboardData) => el.type === dashboard_type);

    if (index >= 0) {
      this.initData(this.storedDashboards[index]);
    } else {
      console.error('ERROR: no dashboards stored found with type ' + dashboard_type);
    }
  }

  removedStoredDashboard(dashboard_type: number) {
    const index = this.storedDashboards.findIndex((el: DashboardData) => el.type === D_TYPE.CUSTOM);

    this.storedDashboards = this.storedDashboards.filter((el: DashboardData) => el.type === dashboard_type);

    if (index >= 0 && this.storedDashboards[index]) {
      this.storedDashboards[index].data = this.storedDashboards[index].data.filter(chart => chart.type === dashboard_type);
    }
  }

  getIntervalDate(data, type): IntervalDate {
    return (type === D_TYPE.GA || type === D_TYPE.YT) ? {first: parseDate(data[0][0]), last: parseDate(data[data.length - 1][0])}
          : (type === D_TYPE.FBM) ? {first: new Date(data[0].date_start), last: new Date(data[0].date_stop)}
          : {first: new Date(data[0]['end_time']), last: new Date (data[data.length - 1]['end_time'])};
  }
}
