import {Injectable} from '@angular/core';
import {FacebookService} from './facebook.service';
import {InstagramService} from './instagram.service';
import {Observable, of} from 'rxjs';
import {GoogleAnalyticsService} from './googleAnalytics.service';
import {parseDate} from 'ngx-bootstrap/chronos';
import {IntervalDate} from '../../features/dashboard/redux-filter/filter.model';
import {D_TYPE} from '../_models/Dashboard';
import {GA_CHART} from '../_models/GoogleData';
import {FB_CHART} from '../_models/FacebookData';
import {IG_CHART} from '../_models/InstagramData';
import * as moment from 'moment';
import _date = moment.unitOfTime._date;

@Injectable()
export class ChartsCallsService {

  constructor(
    private facebookService: FacebookService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private instagramService: InstagramService) {
  }

  public static cutString(str, maxLength) {
    if (str) {
      return str.length > maxLength ? str.substr(0, maxLength) + '...' : str;
    }
    return '...';
  }

  public retrieveChartData(ID, pageID?): Observable<any> {

    if (Object.values(FB_CHART).includes(ID)) {
      return this.facebookService.getData(ID, pageID);
    }

    else if (Object.values(IG_CHART).includes(ID)) {
      return this.instagramService.getData(ID, pageID);
    }

    else if (Object.values(GA_CHART).includes(ID)) {
      return this.googleAnalyticsService.getData(ID);
    }

    else {
      throw new Error('chartCallService.retrieveChartData -> ID doesn\'t exist');
    }
  }

  public initFormatting(ID, data) {
    let header;
    let chartData = [];
    let keys = [];
    let indexFound;
    let other;
    let paddingRows = 0;
    let interval;
    let temp, index;

    // console.warn('ID: ' + ID + ' - ', data);

    switch (ID) {
      case FB_CHART.FANS_DAY:
        header = [['Data', 'Numero fan']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break;  // FB Fan Count
      case FB_CHART.FANS_COUNTRY_GEOMAP:
        header = [['Paese', 'Numero fan']];

        if (data.length > 0) {
          chartData = Object.keys(data[data.length - 1].value).map(function (k) {
            return [k, data[data.length - 1].value[k]];
          });
        }
        break;  // Geo Map
      case FB_CHART.IMPRESSIONS:
        header = [['Data', 'Visualizzazioni']];
        for (let i = 0; i < data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break;  // Page Impressions
      case FB_CHART.FANS_COUNTRY_PIE:
        header = [['Paese', 'Numero fan']];

        // Push data pairs in the Chart array
        chartData = Object.keys(data[data.length - 1].value).map(function (k) {
          return [k, data[data.length - 1].value[k]];
        });

        break;  // Fan Country Pie
      case FB_CHART.PAGE_VIEWS:
        header = [['Data', 'Visualizzazioni']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // Facebook Page Views
      case FB_CHART.FANS_CITY:
        header = [['Città', 'Numero fan']];

        chartData = Object.keys(data[data.length - 1].value).map(function (k) {
          return [ChartsCallsService.cutString(k, 30), data[data.length - 1].value[k]];
        });

        chartData.sort(function (obj1, obj2) {
          return obj2[1] > obj1[1] ? 1 : ((obj1[1] > obj2[1]) ? -1 : 0);
        });
        paddingRows = chartData.length % 9 ? 9 - (chartData.length % 9) : 0;
        break; // Facebook Fan City
      case FB_CHART.ENGAGED_USERS:
        header = [['Data', 'Interazioni']];
        for (let i = 0; i < data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // Facebook Interazioni Totali
      case FB_CHART.PAGE_CONSUMPTION:
        header = [['Data', 'Click']];

        for (let i = 0; i< data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // Facebook Click sui contenuti
      case FB_CHART.PAGE_PLACES_CHECKIN:
        header = [['Data', 'Condivisioni']];

        for(let i=0; i< data.length; i++){
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // Facebook Condivisione del luogo
      case FB_CHART.NEGATIVE_FEEDBACK:
        header = [['Data', 'Feedback negativi']];

        for(let i=0; i< data.length; i++){
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // Facebook Feedback negativi
      case FB_CHART.ONLINE_FANS:
        header = [['Data', 'Fans online']];

        for (let i=0; i<data.length; i++){
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }

        break; // Facebook Fan online giornalieri
      case FB_CHART.FANS_ADD:
        header = [['Data','Nuovi fan']];

        for(let i=0; i < data.length; i++){
          chartData.push([new Date (data[i].end_time), data[i].value]);
        }

        break; // Facebook Nuovi fan
      case FB_CHART.FANS_REMOVES:
        header = [['Data','Fans persi']];

        for(let i=0; i<data.length; i++) {
          chartData.push([new Date (data[i].end_time), data[i].value]);
        }
        break; // Facebook Fans cancellati
      case FB_CHART.IMPRESSIONS_PAID:
        header = [['Data','Visualizzazioni di inserzioni']];

        for(let i=0; i<data.length; i++) {

          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // Facebbok Visualizzazioni di inserzioni

      case GA_CHART.IMPRESSIONS_DAY:
        header = [['Data', 'Visualizzazioni']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }
        break;  // Google PageViews (impressions by day)
      case GA_CHART.SESSION_DAY:
        header = [['Data', 'Sessioni']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }
        break;  // Google Sessionsd
      case GA_CHART.SOURCES_PIE:
        /** Data array is constructed as follows:
         * 0 - date
         * 1 - page
         * 2 - value
         **/
        header = [['Sorgente', 'Numero']];

        for (let i = 0; i < data.length; i++) {
          indexFound = keys.findIndex(el => el === data[i][1]);

          if (indexFound >= 0) {
            chartData[indexFound][1] += parseInt(data[i][2], 10);
          } else {
            keys.push(data[i][1]);
            chartData.push([data[i][1] === '(none)' ? 'unknown' : data[i][1], parseInt(data[i][2], 10)]);
          }
        }

        break;  // Google Sources Pie
      case GA_CHART.MOST_VISITED_PAGES:
        /** Data array is constructed as follows:
         * 0 - date
         * 1 - page
         * 2 - value
         **/
        header = [['Pagina', 'Visite']];

        for (let i = 0; i < data.length; i++) {
          indexFound = keys.findIndex(el => el === data[i][1]);

          if (indexFound >= 0) {
            chartData[indexFound][1] += parseInt(data[i][2], 10);
          } else {
            keys.push(data[i][1]);
            chartData.push([ChartsCallsService.cutString(data[i][1], 10), parseInt(data[i][2], 10)]);
          }
        }

        chartData.sort(function (obj1, obj2) {
          return obj2[1] > obj1[1] ? 1 : ((obj1[1] > obj2[1]) ? -1 : 0);
        });
        paddingRows = chartData.length % 9 ? 9 - (chartData.length % 9) : 0;

        for (let i = 0; i < paddingRows; i++) {
          chartData.push(['', null]);
        }
        break;  // Google List Referral
      case GA_CHART.SOURCES_COLUMNS:
        /** Data array is constructed as follows:
         * 0 - date
         * 1 - page
         * 2 - value
         **/

        header = [['Tipo', 'Numero']];

        for (let i = 0; i < data.length; i++) {
          indexFound = keys.findIndex(el => el === data[i][1]);

          if (indexFound >= 0) {
            chartData[indexFound][1] += parseInt(data[i][2], 10);
          } else {
            keys.push(data[i][1]);
            chartData.push([data[i][1] === '(none)' ? 'unknown' : data[i][1], parseInt(data[i][2], 10)]);
          }
        }
        break;  // Google Sources Column Chart
      case GA_CHART.BOUNCE_RATE:
        header = [['Date', 'Bounce rate']];

        for (let i = 0; i < data.length; i++) {
          const value = parseInt(data[i][1], 10) / 100.;
          chartData.push([parseDate(data[i][0]), value]);
        }
        break; // Google Bounce Rate
      case GA_CHART.AVG_SESS_DURATION:
        header = [['Data', 'Durata (s)']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }
        break; // Google Average Session Duration
      case GA_CHART.BROWSER_SESSION:
        /** Data array is constructed as follows:
         * 0 - date
         * 1 - browser
         * 2 - value
         **/

        header = [['Browser', 'Sessioni']];

        for (let i = 0; i < data.length; i++) {
          indexFound = keys.findIndex(el => el === data[i][1]);

          if (indexFound >= 0) {
            chartData[indexFound][1] += parseInt(data[i][2], 10);
          } else {
            keys.push(data[i][1]);
            chartData.push([ChartsCallsService.cutString(data[i][1], 30), parseInt(data[i][2], 10)]);
          }
        }

        chartData.sort(function (obj1, obj2) {
          return obj2[1] > obj1[1] ? 1 : ((obj1[1] > obj2[1]) ? -1 : 0);
        });

        paddingRows = chartData.length % 9 ? 9 - (chartData.length % 9) : 0;

        for (let i = 0; i < paddingRows; i++) {
          chartData.push(['', null]);
        }
        break; // Google list Session per Browser
      case GA_CHART.NEW_USERS:
        header = [['Data', 'Nuovi utenti']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([parseDate(data[i][0]), parseInt(data[i][1], 10)]);
        }
        break;//GA New Users
      case GA_CHART.MOBILE_DEVICES:
        header = [['Dispositivo', 'Sessioni']];

        for (let i = 0; i < data.length; i++) {
          indexFound = keys.findIndex(el => el === data[i][1]);

          if (indexFound >= 0) {
            chartData[indexFound][1] += parseInt(data[i][2], 10);
          } else {
            keys.push(data[i][1]);
            chartData.push([ChartsCallsService.cutString(data[i][1], 30), parseInt(data[i][2], 10)]);
          }
        }

        chartData.sort(function (obj1, obj2) {
          return obj2[1] > obj1[1] ? 1 : ((obj1[1] > obj2[1]) ? -1 : 0);
        });

        paddingRows = chartData.length % 9 ? 9 - (chartData.length % 9) : 0;

        for (let i = 0; i < paddingRows; i++) {
          chartData.push(['', null]);
        }
        break; // GA List mobile devices per sessions
      case GA_CHART.PERCENT_NEW_SESSION:
        header = [['Utenti di ritorno', 'Nuovi utenti']];
        let avg = 0;
        for (let i = 0; i < data.length; i++) {
          avg += parseFloat(data[i][1]);
        }

        avg /= data.length;

        chartData.push(['Nuovi', avg]);
        chartData.push(['Di ritorno', 100 - avg]);
        break;  // Google New Users vs Return users
      case GA_CHART.PAGE_LOAD_TIME:
        header = [['Pagina', 'Tempo medio (s)']];
        let tmpArray = [];
        for (let i = 0; i < data.length; i++) {
          indexFound = keys.findIndex(el => el === data[i][1]);
          if (indexFound >= 0) {
            chartData[indexFound][1] += parseFloat(data[i][2]);
            (tmpArray[indexFound][1])++;
          } else {
            keys.push(data[i][1]);
            chartData.push([ChartsCallsService.cutString(data[i][1], 12), parseFloat(data[i][2])]);
            tmpArray.push([ChartsCallsService.cutString(data[i][1], 12), 1]);
          }
        }

        // Calculating average
        for (let i = 0; i < chartData.length; i++) {
          chartData[i][1] /= (tmpArray[i][1] * 1000);
        }

        break;

      case IG_CHART.AUD_CITY:
        header = [['Città', 'Popolarità']];
        if (data.length > 0) {
          chartData = Object.keys(data[data.length - 1].value).map(function (k) {
            return [ChartsCallsService.cutString(k, 30), data[data.length - 1].value[k]];
          });

          paddingRows = chartData.length % 11 ? 11 - (chartData.length % 11) : 0;

          for (let i = 0; i < paddingRows; i++) {
            chartData.push(['', null]);
          }
        }
        break; // IG Audience City
      case IG_CHART.AUD_COUNTRY:
        header = [['Paese', 'Popolarità']];
        if (data.length > 0) {
          chartData = Object.keys(data[data.length - 1].value).map(function (k) {
            return [k, data[data.length - 1].value[k]];
          });
        }
        break; // IG Audience Country
      case IG_CHART.AUD_GENDER_AGE:
        header = [['Età', 'Maschio', 'Femmina']];

        let gender_data = data[0] ? Object.keys(data[0]['value']) : null;

        if (gender_data && gender_data.length > 0) {
          keys = Object.keys(data[0]['value']); // getting all the gender/age data

          let subIndex = (keys[0].indexOf('.') !== -1) ? 2 : 1;

          // putting a unique entry in chartArray for every existent age range
          for (let i = 0; i < keys.length; i++) {
            index = 0;
            if (!(chartData.find(e => e[0] === (keys[i].substr(subIndex, keys[i].length))))) {
              chartData.push([keys[i].substr(subIndex, keys[i].length), 0, 0]);
              index = (chartData.length - 1);
            } else {
              index = chartData.findIndex(e => e[0] === (keys[i].substr(subIndex, keys[i].length)));
            }
            // and collecting data
            (keys[i].substr(0, 1) === 'M') ? chartData[index][1] = parseInt(data[0]['value'][keys[i]], 10) : chartData[index][2] = parseInt(data[0]['value'][keys[i]], 10);
          }
          chartData = chartData.sort();
        }
        break; // IG Audience Gender/Age
      case IG_CHART.AUD_LOCALE:
        header = [['Paese', 'Numero']]; /// TODO: fix containsGeoData to use header != 'Country'

        if (data.length > 0) {
          keys = Object.keys(data[0]['value']); // getting all the gender/age data

          // putting a unique entry in chartArray for every existent age range
          for (let i = 0; i < keys.length; i++) {
            chartData.push([keys[i], parseInt(data[0]['value'][keys[i]], 10)]);
          }
          chartData.sort(function (obj1, obj2) {
            // Ascending: first age less than the previous
            return -(obj1[1] - obj2[1]);
          });

          other = [['Altro', 0]];
          chartData.slice(4, chartData.length).forEach(el => {
            other[0][1] += el[1];
          });
          chartData = chartData.slice(0, 4).concat(other);
        }

        break; // IG Audience Locale
      case IG_CHART.ONLINE_FOLLOWERS:

        interval = 3; // Interval of hours to show
        header = [['Follower online', 'Min', 'Media', 'Max']];

        console.log(data);

        for (let i = 0; i < data.length; i++)
          keys.push(data[i]['value']);

        for (let i = 0; i < 24; i += interval) {
          // MIN | AVG | MAX
          chartData.push([i + '-' + (i + interval), Number.MAX_SAFE_INTEGER, 0, 0]);
        }

        // putting a unique entry in chartData for every existent age range
        for (let day = 0; day < keys.length; day++) {

          let limit = keys[day] ? Object.keys(keys[day]).length : 0;

          for (let h_interval = 0; h_interval < limit; h_interval += interval) {
            temp = 0;
            index = 0;
            for (let hour = h_interval; hour < (h_interval + interval); hour++) {
              temp += isNaN(parseInt(keys[day][hour], 10)) ? 0 : parseInt(keys[day][hour]);
              index = (hour + 1) / interval;
            }

            chartData[index - 1][2] += temp;

            if (temp < chartData[index - 1][1]) {
              chartData[index - 1][1] = temp;
            }

            if (temp > chartData[index - 1][3]) {
              chartData[index - 1][3] = temp;
            }
          }
        }


        for (let i = 0; i < JSON.parse(JSON.stringify(chartData)).length; i++) {
          chartData[i][2] /= keys.length;
          chartData[i][1] = chartData[i][1] === Number.MAX_SAFE_INTEGER ? 0 : chartData[i][1];
        }

        break; // IG Online followers
      case IG_CHART.IMPRESSIONS:
        header = [['Data', 'Visualizzazioni']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // IG Impressions by day
      case IG_CHART.REACH:
        header = [['Data', 'Utenti raggiunti']];

        for (let i = 0; i < data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // IG Reach
      case IG_CHART.ACTION_PERFORMED:
        header = [['Tipo', 'Numero']];
        let map = new Map();
        //group by click type
        for (let i = 0; i < data.length; i++) {
          map.has(data[i]['metric']) ? map.set(data[i]['metric'], parseInt(map.get(data[i]['metric']) + data[i]['value'], 10)) : map.set(data[i]['metric'], parseInt(data[i]['value'], 10));
          //let fakeVal = 25;
          //map.has(data[i]['metric']) ? map.set(data[i]['metric'], parseInt(fakeVal, 10)) : map.set(data[i]['metric'], parseInt(fakeVal, 10));

        }
        let empty = true;
        map.forEach((value: boolean, key: string) => {
          if (parseInt(map.get(key), 10) != 0) {
            empty = false;
          }
        });

        if (empty) {
          map = new Map();
          map.set('Nessun dato', 100);//parseInt(100, 10));
          map.set('empty', true);

        }
        map.forEach((value: boolean, key: string) => {
          chartData.push([key.replace(new RegExp('_', 'g'), ' ').replace(new RegExp('clicks', 'g'), ' '), map.get(key)]); //removing all the underscores
        });
        break;// IG composed clicks
      case IG_CHART.FOLLOWER_COUNT:
        header = [['Data','Utenti raggiunti']];

        for (let i = 0; i< data.length; i++) {
          chartData.push([new Date(data[i].end_time), data[i].value]);
        }
        break; // IG FollowerCount
    }

    return chartData.length > 0 ? header.concat(chartData) : [];
  }

  public formatChart(ID, data) {
    let formattedData;
    let type;

    data = this.initFormatting(ID, data);

    switch (ID) {
      case FB_CHART.FANS_DAY:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#8cd0bd'],
            areaOpacity: 0.1
          }
        };

        break;  // Fb Fan Count
      case FB_CHART.FANS_COUNTRY_GEOMAP:
        formattedData = {
          chartType: 'GeoChart',
          dataTable: data,
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
        break;  // Geo Map
      case FB_CHART.IMPRESSIONS:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),

              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#63c2de'],
            areaOpacity: 0.1
          }
        };

        break;  // Page Impressions
      case FB_CHART.PAGE_VIEWS:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#9c8372'],
            areaOpacity: 0.1
          }
        };
        break; // Facebook Page Views
      case FB_CHART.FANS_CITY:
        formattedData = {
          chartType: 'Table',
          dataTable: data,
          chartClass: 14,
          options: {
            cssClassNames: {
              'headerRow': 'border m-3 headercellbg',
              'tableRow': 'bg-light',
              'oddTableRow': 'bg-white',
              'selectedTableRow': '',
              'hoverTableRow': '',
              'headerCell': 'border-0 py-2 pl-2',
              'tableCell': 'border-0 py-1 pl-2',
              'rowNumberCell': 'underline-blue-font'
            },
            alternatingRowStyle: true,
            allowHtml: true,
            sort: 'disable',
            sortColumn: 1,
            pageSize: 9,
            height: '100%',
            width: '100%'
          }
        };
        break; // Facebook Fan City
      case FB_CHART.FANS_COUNTRY_PIE:

        formattedData = {
          chartType: 'PieChart',
          dataTable: data,
          chartClass: 8,
          options: {
            chartArea: {left: 100, right: 0, height: 290, top: 20},
            legend: {position: 'right'},
            height: 310,
            sliceVisibilityThreshold: 0.05,
            is3D: false,
            pieHole: 0.55,
            pieSliceText: 'percentage',
            pieSliceTextStyle: {fontSize: 12, color: 'white'},
            colors: ['#58A5BC', '#3F9AA2', '#F1C85B', '#D9C9B6'],
            areaOpacity: 0.2
          }
        };
        break;  // Fan Country Pie
      case FB_CHART.ENGAGED_USERS:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#8cd0bd'],
            areaOpacity: 0.1
          }
        };

        break;  // Fb Interazioni Totali
      case FB_CHART.PAGE_CONSUMPTION:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#8a74e1'],
            areaOpacity: 0.1
          }
        };
        break; // Fb Click sui contenuti
      case FB_CHART.PAGE_PLACES_CHECKIN:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['f26767'],
            areaOpacity: 0.1
          }
        };
        break; // Fb Condivisione del luogo
      case FB_CHART.NEGATIVE_FEEDBACK:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              grindLines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#f998e3'],
            areaOpacity: 0.1
          }
        };
        break; // Fb Feedback negativi
      case FB_CHART.ONLINE_FANS:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              grindLines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#259526'],
            areaOpacity: 0.1
          }
        };

        break; // Fb Fan online giornalieri
      case FB_CHART.FANS_ADD:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              grindLines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#5befeb'],
            areaOpacity: 0.1
          }
        };

        break; // Fb Nuovi fan
      case FB_CHART.FANS_REMOVES:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {grindLines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              grindLines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#443fe9'],
            areaOpacity: 0.1
          }
        };

        break; //Fb Fan cancellati
      case FB_CHART.IMPRESSIONS_PAID:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {grindLines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              grindLines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.FB, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#1ee503'],
            areaOpacity: 0.1
          }
        };
        break;  // Fb Visualizzazioni di inserzioni

      case GA_CHART.IMPRESSIONS_DAY:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 210, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 230,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.GA, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#FFA647'],
            areaOpacity: 0.1
          }
        };
        break;  // Google PageViews (impressions by day)
      case GA_CHART.SESSION_DAY:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 210, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 230,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.GA, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#01B8AA'],
            areaOpacity: 0.05
          }
        };
        break;  // Google Sessions
      case GA_CHART.SOURCES_PIE:
        formattedData = {
          chartType: 'PieChart',
          dataTable: data,
          chartClass: 6,
          options: {
            chartArea: {left: 100, right: 0, height: 290, top: 20},
            legend: {position: 'right'},
            height: 310,
            is3D: false,
            pieHole: 0.55,
            pieSliceText: 'percentage',
            pieSliceTextStyle: {fontSize: 12, color: 'white'},
            colors: ['#A790A5', '#875C74', '#AFD0BE', '#54414E'],
            areaOpacity: 0.2
          }
        };
        break;  // Google Sources Pie
      case GA_CHART.MOST_VISITED_PAGES:
        formattedData = {
          chartType: 'Table',
          dataTable: data,
          chartClass: 7,
          options: {
            cssClassNames: {
              'headerRow': 'border m-3 headercellbg',
              'tableRow': 'bg-light',
              'oddTableRow': 'bg-white',
              'selectedTableRow': '',
              'hoverTableRow': '',
              'headerCell': 'border-0 py-2 pl-2',
              'tableCell': 'border-0 py-1 pl-2',
              'rowNumberCell': 'underline-blue-font'
            },
            alternatingRowStyle: true,
            allowHtml: true,
            sort: 'disable',
            sortAscending: false,
            sortColumn: 1,
            pageSize: 9,
            height: '100%',
            width: '100%'
          }
        };
        break;  // Google List Referral
      case GA_CHART.SOURCES_COLUMNS:

        formattedData = {
          chartType: 'ColumnChart',
          dataTable: data,
          chartClass: 9,
          options: {
            chartArea: {left: 0, right: 0, height: 310, top: 0},
            legend: {position: 'none'},
            height: 330,
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#ffdda4'],
            bar: {groupWidth: '70%'},
            areaOpacity: 0.3
          }
        };
        break;  // Google Sources Column Chart
      case GA_CHART.BOUNCE_RATE:
        type = 'ga_bounce';

        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 10,
          options: {
            chartArea: {left: 0, right: 0, height: 210, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 230,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.GA, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#dd738a'],
            areaOpacity: 0.05
          }
        };

        //average = sum / data.length;

        break; // Google BounceRate
      case GA_CHART.AVG_SESS_DURATION:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 212, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 230,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.GA, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#52b4de'],
            areaOpacity: 0.05
          }
        };
        break; // Google Average Session Duration
      case GA_CHART.BROWSER_SESSION:

        formattedData = {
          chartType: 'Table',
          dataTable: data,
          chartClass: 12,
          options: {
            cssClassNames: {
              'headerRow': 'border m-3 headercellbg',
              'tableRow': 'bg-light',
              'oddTableRow': 'bg-white',
              'selectedTableRow': '',
              'hoverTableRow': '',
              'headerCell': 'border-0 py-2 pl-2',
              'tableCell': 'border-0 py-1 pl-2',
              'rowNumberCell': 'underline-blue-font'
            },
            alternatingRowStyle: true,
            sortAscending: false,
            sort: 'disable',
            sortColumn: 1,
            pageSize: 9,
            height: '100%',
            width: '100%'
          }
        };
        break; // Google list sessions per browser
      case GA_CHART.NEW_USERS:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 210, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 230,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#666', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: this.getMinChartStep(D_TYPE.GA, data, 0.8),
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#ffc423'],
            areaOpacity: 0.1
          }
        };
        break;// GA new users
      case GA_CHART.MOBILE_DEVICES:
        formattedData = {
          chartType: 'Table',
          dataTable: data,
          chartClass: 7,
          options: {
            cssClassNames: {
              'headerRow': 'border m-3 headercellbg',
              'tableRow': 'bg-light',
              'oddTableRow': 'bg-white',
              'selectedTableRow': '',
              'hoverTableRow': '',
              'headerCell': 'border-0 py-2 pl-2',
              'tableCell': 'border-0 py-1 pl-2',
              'rowNumberCell': 'underline-blue-font'
            },
            alternatingRowStyle: true,
            allowHtml: true,
            sort: 'disable',
            sortAscending: true,
            sortColumn: 1,
            pageSize: 9,
            height: '100%',
            width: '100%'
          }
        };
        break;// GA mobile devices per session
      case GA_CHART.PERCENT_NEW_SESSION:
        formattedData = {
          chartType: 'PieChart',
          dataTable: data,
          chartClass: 6,
          options: {
            chartArea: {left: 100, right: 0, height: 290, top: 20},
            legend: {position: 'right'},
            height: 310,
            is3D: false,
            pieHole: 0.55,
            pieSliceText: 'percentage',
            pieSliceTextStyle: {fontSize: 12, color: 'white'},
            colors: ['#fd8f8d', '#c96565'],
            areaOpacity: 0.2
          }
        };
        break;  // Google New Users vs Returning
      case GA_CHART.PAGE_LOAD_TIME:
        formattedData = {
          chartType: 'BarChart',
          dataTable: data,
          chartClass: 9,
          options: {
            chartArea: {left: 0, right: 0, height: 310, top: 0},
            legend: {position: 'none'},
            height: 330,
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              textPosition: 'in',
              textStyle: {color: '#000'}
            },
            colors: ['#A0D8C5'],
            bar: {groupWidth: '70%'},
            areaOpacity: 0.3
          }
        };
        break;  // Google Sources Column Chart

      case IG_CHART.AUD_CITY:
        formattedData = {
          chartType: 'Table',
          dataTable: data,
          chartClass: 15,
          options: {
            cssClassNames: {
              'headerRow': 'border m-3 headercellbg',
              'tableRow': 'bg-light',
              'oddTableRow': 'bg-white',
              'selectedTableRow': '',
              'hoverTableRow': '',
              'headerCell': 'border-0 py-2 pl-2',
              'tableCell': 'border-0 py-1 pl-2',
              'rowNumberCell': 'underline-blue-font'
            },
            alternatingRowStyle: true,
            allowHtml: true,
            sort: 'disable',
            sortAscending: true,
            sortColumn: 1,
            pageSize: 9,
            height: '100%',
            width: '100%'
          }
        };

        break; // IG Audience City
      case IG_CHART.AUD_COUNTRY:
        formattedData = {
          chartType: 'GeoChart',
          dataTable: data,
          chartClass: 2,
          options: {
            region: 'world',
            colors: ['#ff00a7'],
            colorAxis: {colors: ['#ff96db', '#ff00a7']},
            backgroundColor: '#fff',
            datalessRegionColor: '#eee',
            defaultColor: '#333',
            height: '300',
          }
        };
        break; // IG Audience Country
      case IG_CHART.AUD_GENDER_AGE:
        formattedData = {
          chartType: 'ColumnChart',
          dataTable: data,
          chartClass: 9,
          options: {
            chartArea: {left: 0, right: 0, height: 290, top: 0},
            legend: {position: 'none'},
            height: 310,
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}},
            colors: ['#388aff', '#ff96db'],
            areaOpacity: 0.4,
          }
        };
        break; // IG Audience Gender/Age
      case IG_CHART.AUD_LOCALE:
        formattedData = {
          chartType: 'ColumnChart',
          dataTable: data,
          chartClass: 9,
          options: {
            chartArea: {left: 0, right: 0, height: 290, top: 0},
            legend: {position: 'none'},
            height: 310,
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}},
            colors: ['#ff96db'],
            areaOpacity: 0.4,
          }
        };
        break; // IG Audience Locale
      case IG_CHART.ONLINE_FOLLOWERS:
        formattedData = {
          chartType: 'ColumnChart',
          dataTable: data,
          chartClass: 9,
          options: {
            chartArea: {left: 0, right: 0, height: 290, top: 0},
            height: 310,
            vAxis: {gridlines: {color: '#eaeaea', count: 5}, textPosition: 'in', textStyle: {color: '#999'}},
            colors: ['#FFCDEE', '#FF88E1', '#F33DFF'],
            areaOpacity: 0.4,
            legend: {position: 'top', maxLines: 3},
            bar: {groupWidth: '75%'},
            isStacked: true,
          }
        };
        break; // IG Online followers
      case IG_CHART.IMPRESSIONS:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: 0,
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#ff96db'],
            areaOpacity: 0.1
          }
        };
        break; // IG Impressions by day
      case IG_CHART.REACH:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: {gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: 0,
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#ff96db'],
            areaOpacity: 0.1
          }
        };
        break; // IG Reach
      case IG_CHART.ACTION_PERFORMED:
        formattedData = {
          chartType: 'PieChart',
          dataTable: data,
          chartClass: 6,
          options: {
            chartArea: {left: 100, right: 0, height: 290, top: 20},
            legend: {position: 'right'},
            height: 310,
            sliceVisibilityThreshold: 0.05,
            is3D: false,
            pieHole: 0.55,
            pieSliceText: 'percentage',
            pieSliceTextStyle: {fontSize: 12, color: 'white'},
            colors: ['#58A5BC', '#3F9AA2', '#F1C85B', '#D9C9B6'],
            areaOpacity: 0.2
          }
        };
        if (data.filter(e => e[1] === true).length == 0) {
          formattedData.options.colors = ['#BC16FF', '#FF5AF5', '#FF7DF9', '#FFABF7'];
          formattedData.dataTable = data;
        } else {
          formattedData.options.colors = ['#D3D3D3'];
          formattedData.dataTable = data.slice(0, 2);
        }
        break; // IG clicks pie
      case IG_CHART.FOLLOWER_COUNT:
        formattedData = {
          chartType: 'AreaChart',
          dataTable: data,
          chartClass: 5,
          options: {
            chartArea: {left: 0, right: 0, height: 192, top: 0},
            legend: {position: 'none'},
            lineWidth: data.length > 15 ? (data.length > 40 ? 2 : 3) : 4,
            height: 210,
            pointSize: data.length > 15 ? 0 : 7,
            pointShape: 'circle',
            hAxis: { gridlines: {color: 'transparent'}, textStyle: {color: '#999', fontName: 'Roboto'}, minTextSpacing: 15},
            vAxis: {
              gridlines: {color: '#eaeaea', count: 5},
              minorGridlines: {color: 'transparent'},
              minValue: 0,
              textPosition: 'in',
              textStyle: {color: '#999'}
            },
            colors: ['#ff96bd'],
            areaOpacity: 0.1
          }
        };
        break; // IG Follower count
    }

    return formattedData;
  }

  private getMinChartStep(type, data, perc = 0.8) {
    let min, length;

    data = data.slice(1);

    switch (type) {
      case D_TYPE.FB:
      case D_TYPE.IG:
        min = (data.reduce((p, c) => (p[1] < c[1] ? p[1] : c[1]))) * perc;
        break;
      case D_TYPE.GA:
      case D_TYPE.YT:
        length = data[0].length;
        min = data.reduce((p, c) => p[length - 1] < c[length - 1] ? p[length - 1] : c[length - 1]) * perc;
        break;
    }

    return min;
  }

  public retrieveMiniChartData(serviceID: number, pageIDs?, intervalDate?: IntervalDate, permissions?) {
    let observables: Observable<any>[] = [], pageID;

    switch (serviceID) {
      case D_TYPE.FB:
        pageID = pageIDs[D_TYPE.FB];
        observables.push(this.facebookService.getData(FB_CHART.FANS_DAY, pageID));
        observables.push(this.facebookService.fbposts(pageID));
        observables.push(this.facebookService.fbpagereactions(pageID));
        observables.push(this.facebookService.getData(FB_CHART.IMPRESSIONS, pageID));
        break;
      case D_TYPE.GA:
        observables.push(this.googleAnalyticsService.gaUsers());
        observables.push(this.googleAnalyticsService.getData(GA_CHART.SESSION_DAY));
        observables.push(this.googleAnalyticsService.getData(GA_CHART.BOUNCE_RATE));
        observables.push(this.googleAnalyticsService.getData(GA_CHART.AVG_SESS_DURATION));
        break;
      case D_TYPE.IG:
        pageID = pageIDs[D_TYPE.IG];
        observables.push(this.instagramService.getBusinessInfo(pageID));
        observables.push(this.instagramService.getMedia(pageID));
        observables.push(this.instagramService.getData(IG_CHART.PROFILE_VIEWS, pageID));
        observables.push(this.instagramService.getData(IG_CHART.IMPRESSIONS, pageID));
        break;
      case D_TYPE.YT:
        break;
      case D_TYPE.CUSTOM:
        observables.push(permissions[D_TYPE.GA] ? this.googleAnalyticsService.gaUsers() : of({}));
        observables.push(permissions[D_TYPE.FB] && pageIDs[D_TYPE.FB] !== null ? this.facebookService.getData(FB_CHART.FANS_DAY, pageIDs[D_TYPE.FB]) : of({}));
        observables.push(permissions[D_TYPE.IG] && pageIDs[D_TYPE.IG] !== null ? this.instagramService.getBusinessInfo(pageIDs[D_TYPE.IG]) : of({}));
        break;
      default:
        throw new Error('retrieveMiniChartData -> Service ID ' + serviceID + ' not found');
    }

    return observables;
  }

  public formatMiniChartData(data: Array<any>, d_type: number, measure: string, intervalDate?: IntervalDate) {
    let result;

    switch (d_type) {
      case D_TYPE.GA:
        result = this.getGoogleMiniValue(measure, data);
        break;
      case D_TYPE.FB:
        result = this.getFacebookMiniValue(measure, data, intervalDate);
        break;
      case D_TYPE.IG:
        result = this.getInstagramMiniValue(measure, data, intervalDate);
        break;
      case D_TYPE.CUSTOM:
        result = this.getCustomMiniValue(measure, data, intervalDate);
    }

    return result;
  }

  private getGoogleMiniValue(measure, data) {
    //let date = new Date(null);
    let value, sum = 0, avg, perc, step;
    let date = new Date(), y = date.getFullYear(), m = date.getMonth();

    const intervalDate: IntervalDate = {
      first: new Date(y, m - 1, 1),
      last: new Date(new Date(y, m, 0).setHours(23, 59, 59, 999))
    };

    data = data.filter(el => parseDate(el[0]).getTime() >= intervalDate.first.getTime() && parseDate(el[0]).getTime() <= intervalDate.last.getTime());

    for (const i in data) {
      sum += parseInt(data[i][1]);
    }

    avg = (sum / data.length).toFixed(2);

    switch (measure) {
      case 'bounce-rate':
        value = avg;
        step = this.searchStep(value, measure);
        perc = value;
        break;

      case 'time':
        date = new Date(null);
        date.setSeconds(parseInt(avg)); // specify value for SECONDS here
        value = date.toISOString().substr(11, 8);
        step = this.searchStep(avg, measure);

        perc = parseInt(avg) / step * 100;

        date.setSeconds(step);
        step = date.toISOString().substr(11, 8);
        break;

      default:
        value = sum;
        step = this.searchStep(value);
        perc = value / step * 100;
        break;
    }

    return {value, perc, step};
  }

  private getFacebookMiniValue(measure, data, intervalDate) {
    let value, perc, sum = 0, avg, max, aux, step;

    switch (measure) {
      case 'post-sum':
        data['data'] = data['data'].filter(el => (new Date(el['created_time'])) >= intervalDate.first && (new Date(el['created_time'])) <= intervalDate.last);
        value = data['data'].length;

        break; // The value is the number of post of the previous month, the perc is calculated considering the last 100 posts
      case 'count':
        data = data.filter(el => (new Date(el.end_time)) >= intervalDate.first && (new Date(el.end_time)) <= intervalDate.last);
        value = data[data.length - 1].value;

        break; // The value is the last fan count, the perc is the value divided for the max fan count had in the last 2 years
      case 'reactions':
        data = data.filter(el => (new Date(el.end_time)) >= intervalDate.first && (new Date(el.end_time)) <= intervalDate.last);
        max = [];

        for (const i in data) {
          aux = 0;
          if (data[i]['value']) {
            aux += data[i]['value']['like'] || 0;
            aux += data[i]['value']['love'] || 0;
            aux += data[i]['value']['haha'] || 0;
            aux += data[i]['value']['wow'] || 0;
            aux += data[i]['value']['sorry'] || 0;
            aux += data[i]['value']['anger'] || 0;
          }
          sum += aux;
          max.push(aux);
        }

        avg = sum / data.length;
        value = sum;

        break; // The value is the sum of all the reactions of the previous month, the perc is calculated dividing the average reactions for the max value
      default:
        data = data.filter(el => (new Date(el.end_time)) >= intervalDate.first && (new Date(el.end_time)) <= intervalDate.last);
        value = data[data.length - 1].value;

        break; // default take the last value as the good one, the perc is calculated dividing the avg for the max value
    }

    step = this.searchStep(value);
    perc = value / step * 100;

    return {value, perc, step};
  }

  private getInstagramMiniValue(measure, data, intervalDate) {
    let value, perc, sum = 0, avg, max, aux, step;

    switch (measure) {
      case 'count':
        value = data['followers_count'];
        break; // The value is the last fan count, the perc is the value divided for the max fan count had in the last 2 years
      default:
        data = data.filter(el => (new Date(el.end_time)) >= intervalDate.first && (new Date(el.end_time)) <= intervalDate.last);
        for (const i in data) {
          sum += data[i].value;
        }

        // avg = sum / data.length;
        value = sum;

        break; // The value is the sum of all the reactions of the previous month, the perc is calculated dividing the average reactions for the max value
    }

    step = this.searchStep(value);
    perc = value / step * 100;

    return {value, perc, step};
  }

  private getCustomMiniValue(measure, data, intervalDate) {
    let value, perc, step;

    switch (measure) {
      case 'fb-fan-count':
        data = data.filter(el => (new Date(el.end_time)) >= intervalDate.first && (new Date(el.end_time)) <= intervalDate.last);
        value = data[data.length - 1].value;
        break;
      case 'ig-follower':
        value = data['followers_count'];
        break;
      case 'ga-tot-user':
        value = 0;
        data = data.filter(el => parseDate(el[0]).getTime() >= intervalDate.first.getTime() && parseDate(el[0]).getTime() <= intervalDate.last.getTime());
        for (const i in data) {
          value += parseInt(data[i][1]);
        }
        break;
      case 'yt-subscribers': // TODO edit
        value = 0;
        break;
    }

    step = this.searchStep(value);
    perc = value / step * 100;

    return {value, perc, step};
  }

  private searchStep(value, measure?) {
    const nextStep = [10, 25, 50, 250, 1000, 5000, 10000, 50000, 100000];
    let step;
    let done = false;
    let i = 0;

    if (measure === 'bounce-rate') {
      step = (value - (value % 10)).toFixed(2) + '%';
      done = true;
    }

    if (measure === 'time') {
      step = (value - (value % 60)) + 60;
      done = true;
    }

    if (!done && value < nextStep[0]) {
      step = nextStep[0];
      done = true;
    }

    if (!done && value > nextStep[nextStep.length - 1]) {
      step = nextStep[nextStep.length - 1];
      done = true;
    }

    while (!done && value > nextStep[i]) {
      step = nextStep[i + 1];
      i++;
    }

    return step;
  }
}
