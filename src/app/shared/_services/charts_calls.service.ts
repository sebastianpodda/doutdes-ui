import {Injectable} from '@angular/core';
import {FacebookService} from './facebook.service';
import {Observable} from 'rxjs';
import {GoogleAnalyticsService} from './googleAnalytics.service';
import {parseDate} from 'ngx-bootstrap/chronos';
import {IntervalDate} from '../../features/dashboard/redux-filter/filter.model';
import {DashboardCharts} from '../_models/DashboardCharts';

@Injectable()
export class ChartsCallsService {

  constructor(private facebookService: FacebookService, private googleAnalyticsService: GoogleAnalyticsService) {
  }

  public static cutString(str, maxLength) {
    return str.length > maxLength ? str.substr(0, 30) + '...' : str;
  }

  public retrieveChartData(ID, pageID?, intervalDate?: IntervalDate): Observable<any> {
    switch (ID) {
      case 1:
        return this.facebookService.fbfancount(pageID);
      case 2:
        return this.facebookService.fbfancountry(pageID);
      case 3:
        return this.facebookService.fbpageimpressions(pageID);
      case 4:
        return this.googleAnalyticsService.gaPageViews(intervalDate);
      case 5:
        return this.googleAnalyticsService.gaSessions(intervalDate);
      case 6:
        return this.googleAnalyticsService.gaSources(intervalDate);
      case 7:
        return this.googleAnalyticsService.gaMostViews(intervalDate);
      case 8:
        return this.facebookService.fbfancountry(pageID);
      case 9:
        return this.googleAnalyticsService.gaSources(intervalDate);
      case 10:
        return this.googleAnalyticsService.gaBounceRate(intervalDate);
      case 11:
        return this.googleAnalyticsService.gaAvgSessionDuration(intervalDate);
      case 12:
        return this.googleAnalyticsService.gaBrowsers(intervalDate);
      case 13:
        return this.facebookService.fbpageviewstotal(pageID);
      case 14:
        return this.facebookService.fbfancity(pageID);

    }
  }

  public formatChart(ID, data) {
    let formattedData;
    let header;
    let type;
    const chartArray = [];
    const impressChartArray = [];
    let paddingRows = 0;
    let arr = [];

    switch (ID) {
      case 1:

        header = [['Date', 'Number of fans']];

        // Push data pairs in the Chart array
        for (let i = 0; i < data.length; i++) {

          // if (i % 10 === 0) { // Data are greedy sampled by 10 units
          chartArray.push([new Date(data[i].end_time), data[i].value]); // [data[i].end_time, data[i].value]);
          // }
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(chartArray),
          chartClass: 1,
          options: {
            chartArea: {left: 30, right: 0, height: 280, top: 0},
            legend: {position: 'none'},
            curveType: 'function',
            height: 310,
            explorer: {},
            colors: ['#63c2de'],
            areaOpacity: 0.4
          }
        };

        break; // Fb Fan Count
      case 2:
        header = [['Country', 'Popularity']];

        arr = Object.keys(data[data.length - 1].value).map(function (k) {
          return [k, data[data.length - 1].value[k]];
        });

        formattedData = {
          chartType: 'GeoChart',
          dataTable: header.concat(arr),
          chartClass: 2,
          options: {
            region: 'world',
            colors: ['#63c2de'],
            colorAxis: {colors: ['#9EDEEF', '#63c2de']},
            backgroundColor: '#fff',
            datalessRegionColor: '#eee',
            defaultColor: '#333',
            height: '300'
          }
        };
        break; // Geo Map
      case 3:
        header = [['Date', 'Impressions']];

        for (let i = 0; i < data.length; i++) {
          impressChartArray.push([new Date(data[i].end_time), data[i].value]);
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(impressChartArray),
          chartClass: 3,
          options: {
            chartArea: {left: 40, right: 0, height: 280, top: 0},
            legend: {position: 'none'},
            format: 'decimal',
            curveType: 'function',
            height: 310,
            explorer: {},
            colors: ['#63c2de'],
            areaOpacity: 0.4
          }
        };
        break; // Page Impressions
      case 4:
        header = [['Date', 'Impressions']];
        // Push data pairs in the Chart array

        // console.log(data);

        for (let i = 0; i < data.length; i++) {
          chartArray.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(chartArray),
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 190, top: 0},
            legend: {position: 'none'},
            height: 210,
            hAxis: {gridlines: {color: '#eaeaea', count: -1}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}},
            colors: ['#FFA647'],
            areaOpacity: 0.4
          }
        };
        break; // Google PageViews
      case 5:
        header = [['Date', 'Sessions']];
        // Push data pairs in the Chart array
        for (let i = 0; i < data.length; i++) {
          chartArray.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(chartArray),
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 290, top: 0},
            legend: {position: 'none'},
            hAxis: {gridlines: {color: '#eaeaea', count: -1}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}, minValue: 0},
            height: 310,
            colors: ['#FFA647'],
            areaOpacity: 0.4
          }
        };
        break; // Google Sessions
      case 6: // google pie begin
        header = [['Type', 'Date', 'Number']];

        for (let i = 0; i < data.length; i++) {
          chartArray.push([data[i][0] === '(none)' ? 'unknown' : data[i][0], parseDate(data[i][1]), parseInt(data[i][2], 10)]);
        }

        formattedData = {
          chartType: 'PieChart',
          dataTable: header.concat(chartArray),
          chartClass: 6,
          options: {
            chartArea: {left: 30, right: 0, height: 290, top: 0},
            legend: {position: 'none'},
            height: 310,
            is3D: false,
            pieSliceText: 'label',
            pieSliceTextStyle: {fontSize: 16, color: '#222'},
            colors: ['#FFAF60', '#FFBD7F', '#FFCB9B', '#FFD7B5', '#FFE2CC'],
            areaOpacity: 0.4
          }
        };
        break; // Google pie end
      case 7:
        header = [['Website', 'Date', 'Views']];

        for (let i = 0; i < data.length; i++) {
          chartArray.push([ChartsCallsService.cutString(data[i][0], 30), parseDate(data[i][1]), parseInt(data[i][2], 10)]);
        }

        formattedData = {
          chartType: 'Table',
          dataTable: header.concat(chartArray),
          chartClass: 7,
          options: {
            alternatingRowStyle: true,
            allowHtml: true,
            sort: 'enable',
            sortAscending: false,
            sortColumn: 1,
            pageSize: 10,
            height: '100%',
            width: '100%'
          }
        };
        break; // Google List Refferal
      case 8:
        header = [['Country', 'Popularity']];
        // Push data pairs in the Chart array
        const arrPie = Object.keys(data[data.length - 1].value).map(function (k) {
          return [k, data[data.length - 1].value[k]];
        });
        formattedData = {
          chartType: 'PieChart',
          dataTable: header.concat(arrPie),
          chartClass: 8,
          options: {
            chartArea: {left: 0, right: 0, height: 290, top: 0},
            legend: {position: 'none'},
            sliceVisibilityThreshold: 0.05,
            height: 310,
            // is3D: true,
            colors: ['#63c2de'],
            pieSliceText: 'label',
            pieSliceTextStyle: {fontSize: 13, color: 'black'},
            pieHole: 0.1,
            slices: [{color: '#003f5c'}, {color: '#2f4b7c'}, {color: '#665191'}, {color: '#a05195'}],
            areaOpacity: 0.4
          }
        };
        break; // Fan Country Pie
      case 9:
        header = [['Type', 'Date', 'Number']];

        for (let i = 0; i < data.length; i++) {
          chartArray.push([data[i][0] === '(none)' ? 'unknown' : data[i][0], parseDate(data[i][1]), parseInt(data[i][2], 10)]);
        }
        formattedData = {
          chartType: 'ColumnChart',
          dataTable: header.concat(chartArray),
          chartClass: 9,
          options: {
            chartArea: {left: 0, right: 0, height: 290, top: 0},
            legend: {position: 'none'},
            height: 310,
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}},
            colors: ['#FFC993'],
            areaOpacity: 0.4
          }
        };
        break; // Google Sources Column Chart
      case 10:
        type = 'ga_bounce';
        header = [['Date', 'Bounce rate']];
        // Push data pairs in the Chart array

        /*
        let sum = 0.;
        highest = 0;
        lowest = 1;
        // console.log(data);
        **/

        for (let i = 0; i < data.length; i++) {
          const value = parseInt(data[i][1], 10) / 100.;
          //sum += value;
          //highest = value > highest ? value : highest;
          //lowest = value < lowest ? value : lowest;

          chartArray.push([parseDate(data[i][0]), value]);
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(chartArray),
          chartClass: 10,
          options: {
            chartArea: {left: 0, right: 0, height: 190, top: 0},
            legend: {position: 'none'},
            hAxis: {
              gridlines: {color: '#eaeaea', count: -1},
              textStyle: {color: '#666', fontSize: 12, fontName: 'Roboto'},
              minTextSpacing: 15
            },
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              textPosition: 'in',
              textStyle: {color: '#999'},
              minValue: 0,
              format: 'percent'
            },
            height: 210,
            explorer: {},
            colors: ['#FFA647'],
            areaOpacity: 0.4
          }
        };

        //average = sum / data.length;

        break; // Google BounceRate
      case 11:
        header = [['Date', 'Time (s)']];
        // Push data pairs in the Chart array

        // console.log(data);

        for (let i = 0; i < data.length; i++) {
          chartArray.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(chartArray),
          chartClass: 11,
          options: {
            chartArea: {left: 0, right: 0, height: 190, top: 0},
            legend: {position: 'none'},
            curveType: 'function',
            hAxis: {gridlines: {color: '#eaeaea', count: -1}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}, minValue: 0},
            height: 210,
            explorer: {},
            colors: ['#FFA647'],
            areaOpacity: 0.4
          }
        };
        break; // Google Average Session Duration
      case 12:
        header = [['Browser', 'Date', 'Sessions']];

        for (let i = 0; i < data.length; i++) {
          chartArray.push([ChartsCallsService.cutString(data[i][0], 30), parseDate(data[i][1]), parseInt(data[i][2], 10)]);
        }

        formattedData = {
          chartType: 'Table',
          dataTable: header.concat(chartArray),
          chartClass: 12,
          options: {
            alternatingRowStyle: true,
            sortAscending: false,
            sortColumn: 1,
            pageSize: 10,
            height: '100%',
            width: '100%'
          }
        };
        break; // Google list sessions per browser
      case 13:

        header = [['Date', 'Views']];
        // Push data pairs in the Chart array
        for (let i = 0; i < data.length; i++) {
          chartArray.push([new Date(data[i].end_time), data[i].value]);
        }

        formattedData = {
          chartType: 'AreaChart',
          dataTable: header.concat(chartArray),
          chartClass: 13,
          options: {
            chartArea: {left: 30, right: 0, height: 280, top: 0},
            legend: {position: 'none'},
            curveType: 'function',
            height: 310,
            explorer: {},
            colors: ['#63c2de'],
            areaOpacity: 0.4
          }
        };
        break; // Facebook Page Views
      case 14:
        header = [['City', 'Fans']];

        arr = Object.keys(data[data.length - 1].value).map(function (k) {
          return [ChartsCallsService.cutString(k, 30), data[data.length - 1].value[k]];
        });

        paddingRows = arr.length % 10 ? 10 - (arr.length % 10) : 0;

        for (let i = 0; i < paddingRows; i++) {
          arr.push(['', null]);
        }

        formattedData = {
          chartType: 'Table',
          dataTable: header.concat(arr),
          chartClass: 14,
          options: {
            alternatingRowStyle: true,
            sortAscending: false,
            sortColumn: 1,
            pageSize: 10,
            height: '100%',
            width: '100%'
          }
        };
        break; // Facebook Fan City
    }

    return formattedData;
  }

  containsGeoData(chart: DashboardCharts) {

    const dataTable = chart.chartData.dataTable;

    if (dataTable) {
      const metric = dataTable[0][0];

      return metric.includes('Country') || metric.includes('City');
    }

    return false;
  }
}
