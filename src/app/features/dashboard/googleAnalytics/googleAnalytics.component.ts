import {Component, OnDestroy, OnInit} from '@angular/core';
import {BreadcrumbActions} from '../../../core/breadcrumb/breadcrumb.actions';
import {Breadcrumb} from '../../../core/breadcrumb/Breadcrumb';
import {GoogleAnalyticsService} from '../../../shared/_services/googleAnalytics.service';
import {DashboardCharts} from '../../../shared/_models/DashboardCharts';
import {DashboardService} from '../../../shared/_services/dashboard.service';
import {ChartsCallsService} from '../../../shared/_services/charts_calls.service';
import {GlobalEventsManagerService} from '../../../shared/_services/global-event-manager.service';
import {FilterActions} from '../redux-filter/filter.actions';
import {select} from '@angular-redux/store';
import {forkJoin, Observable} from 'rxjs';
import {IntervalDate} from '../redux-filter/filter.model';
import {subDays} from 'date-fns';
import {ngxLoadingAnimationTypes} from 'ngx-loading';
import {Chart} from '../../../shared/_models/Chart';
import {AggregatedDataService} from '../../../shared/_services/aggregated-data.service';

const PrimaryWhite = '#ffffff';

@Component({
  selector: 'app-feature-dashboard-google',
  templateUrl: './googleAnalytics.component.html'
})

export class FeatureDashboardGoogleAnalyticsComponent implements OnInit, OnDestroy {

  public HARD_DASH_DATA = {
    dashboard_type: 2,
    dashboard_id: null
  };
  public FILTER_DAYS = {
    seven: 7,
    thirty: 30,
    ninety: 90
  };

  public chartArray$: Array<DashboardCharts> = [];

  public loading = false;
  public config = {
    animationType: ngxLoadingAnimationTypes.threeBounce,
    backdropBackgroundColour: 'rgba(0,0,0,0.1)',
    backdropBorderRadius: '4px',
    primaryColour: PrimaryWhite,
    secondaryColour: PrimaryWhite
  };

  @select() filter: Observable<any>;

  firstDateRange: Date;
  lastDateRange: Date;
  minDate: Date = new Date('2018-01-01');
  maxDate: Date = new Date();
  bsRangeValue: Date[];
  dateChoice: String = 'Last 30 days';

  constructor(
    private googleAnalyticsService: GoogleAnalyticsService,
    private breadcrumbActions: BreadcrumbActions,
    private dashboardService: DashboardService,
    private chartsCallService: ChartsCallsService,
    private globalEventService: GlobalEventsManagerService,
    private filterActions: FilterActions,
    private aggrDataService: AggregatedDataService,
  ) {
    this.globalEventService.removeFromDashboard.subscribe(values => {
      if (values[0] !== 0 && values[1] === this.HARD_DASH_DATA.dashboard_id) {
        this.filterActions.removeChart(values[0]);
        this.globalEventService.removeFromDashboard.next([0, 0]);
      }
    });
    this.globalEventService.addChartInDashboard.subscribe(chart => {
      if (chart && chart.dashboard_id === this.HARD_DASH_DATA.dashboard_id) {
        this.addChartToDashboard(chart);
        this.globalEventService.addChartInDashboard.next(null);
      }
    });
    this.globalEventService.updateChartInDashboard.subscribe(chart => {
      if (chart && chart.dashboard_id === this.HARD_DASH_DATA.dashboard_id) {
        const index = this.chartArray$.findIndex((chartToUpdate) => chartToUpdate.chart_id === chart.chart_id);
        this.filterActions.updateChart(index, chart.title);
      }
    });
    this.globalEventService.loadingScreen.subscribe(value => {
      this.loading = value;
    });

    this.firstDateRange = subDays(new Date(), 30); //this.minDate;
    this.lastDateRange = this.maxDate;
    //this.bsRangeValue = [this.firstDateRange, this.lastDateRange];
    this.bsRangeValue = [subDays(new Date(), 30), this.lastDateRange]; // Starts with Last 30 days

    this.filter.subscribe(elements => {
      if (elements['dataFiltered'] !== null) {
        this.chartArray$ = elements['dataFiltered'];
      }
    });
  }

  loadDashboard() {

    const observables: Observable<any>[] = [];
    const chartsToShow: Array<DashboardCharts> = [];
    const chartsClone: Array<DashboardCharts> = [];

    this.dashboardService.getDashboardByType(this.HARD_DASH_DATA.dashboard_type)
      .subscribe(dashCharts => {

        if (dashCharts['dashboard_id']) {
          this.HARD_DASH_DATA.dashboard_id = dashCharts['dashboard_id'];
        } else {
          this.HARD_DASH_DATA.dashboard_id = dashCharts[0].dashboard_id;
        }

        if(dashCharts instanceof Array) { // Se vero, ci sono dei grafici nella dashboard, altrimenti è vuota

          const dateInterval: IntervalDate = {
            dataStart: this.firstDateRange,
            dataEnd: this.lastDateRange
          };

          // Right data
          dashCharts.forEach(chart => observables.push(this.chartsCallService.retrieveChartData(chart.chart_id, dateInterval)));

          forkJoin(observables)
            .subscribe(dataArray => {
              for (let i = 0; i < dataArray.length; i++) {

                let chartToPush: DashboardCharts = dashCharts[i];
                let cloneChart: DashboardCharts;

                if (!dataArray[i]['status']) { // Se la chiamata non rende errori

                  const formatted = this.chartsCallService.formatChart(dashCharts[i].chart_id, dataArray[i]);

                  chartToPush.chartData = formatted.data;
                  chartToPush.color = chartToPush.chartData.chartType === 'Table' ? null : chartToPush.chartData.options.colors[0];
                  chartToPush.error = false;
                  chartToPush.aggregated = this.aggrDataService.getAggregatedData(dataArray[i], dashCharts[i].chart_id);
                } else {

                  chartToPush.error = true;

                  console.log('google analytics component ts:');
                  console.log(dataArray[i]);
                }
                cloneChart = this.createClone(chartToPush);

                chartsToShow.push(chartToPush);
                chartsClone.push(cloneChart);
              }
              this.globalEventService.loadingScreen.next(false);
            });

          this.filterActions.initData(chartsToShow, chartsClone, dateInterval);
          this.globalEventService.updateChartList.next(true);
        } else {
          this.globalEventService.loadingScreen.next(false);
        }

      }, error1 => {
        console.log('Error querying the charts');
        console.log(error1);
      });
  }

  addChartToDashboard(dashChart: DashboardCharts) {
    const chartToPush: DashboardCharts = dashChart;
    const innerChart: Chart = {
      ID: dashChart.chart_id,
      format: dashChart.format,
      type: dashChart.type, // GoogleAnalytics
      title: dashChart.title
    };

    const intervalDate: IntervalDate = {
      dataStart: this.bsRangeValue[0],
      dataEnd: this.bsRangeValue[1]
    };

    this.chartsCallService.retrieveChartData(dashChart.chart_id, intervalDate)
      .subscribe(data => {

        if (!data['status']) { // Se la chiamata non rende errori

          const formatted = this.chartsCallService.formatChart(dashChart.chart_id, data);

          chartToPush.Chart = innerChart;
          chartToPush.chartData = formatted.data;
          chartToPush.color = chartToPush.chartData.chartType === 'Table' ? null : chartToPush.chartData.options.colors[0];
          chartToPush.error = false;
        } else {
          chartToPush.error = true;
          console.log('Errore recuperando dati per ' + dashChart);
        }

        this.filterActions.addChart(chartToPush);
      }, error1 => {
        console.log('Error querying the Chart');
        console.log(error1);
      });
  }

  onValueChange(value): void {
    if (value) {
      const dateInterval: IntervalDate = {
        dataStart: value[0],
        dataEnd: value[1].setHours(23, 59, 59, 999)
      };
      this.globalEventService.loadingScreen.next(true);
      this.filterActions.filterData(dateInterval);
    }
  }

  changeData(days: number) {
    this.bsRangeValue = [subDays(new Date(), days), this.lastDateRange];

    switch (days) {
      case this.FILTER_DAYS.seven:
        this.dateChoice = 'Last 7 days';
        break;
      case this.FILTER_DAYS.thirty:
        this.dateChoice = 'Last 30 days';
        break;
      case this.FILTER_DAYS.ninety:
        this.dateChoice = 'Last 90 days';
        break;
      default:
        this.dateChoice = 'Custom';
        break;
    }
  }

  createClone(chart: DashboardCharts): DashboardCharts {
    const cloneChart = JSON.parse(JSON.stringify(chart)); // Conversione e parsing con JSON per perdere la referenza

    // Se esiste il campo Date nel JSON, creare data a partire dalla stringa (serve per le label)
    if (cloneChart.chartData['dataTable'][0][0] === 'Date') {
      const header = [cloneChart['chartData']['dataTable'].shift()];

      cloneChart.chartData['dataTable'] = cloneChart.chartData['dataTable'].map(el => [new Date(el[0]), el[1]]);
      cloneChart['chartData']['dataTable'] = header.concat(cloneChart.chartData['dataTable']);
    }

    return cloneChart;
  }

  addBreadcrumb() {
    const bread = [] as Breadcrumb[];

    bread.push(new Breadcrumb('Home', '/'));
    bread.push(new Breadcrumb('Dashboard', '/dashboard/'));
    bread.push(new Breadcrumb('Website', '/dashboard/google/'));

    this.breadcrumbActions.updateBreadcrumb(bread);
  }

  removeBreadcrumb() {
    this.breadcrumbActions.deleteBreadcrumb();
  }

  ngOnInit(): void {
    this.addBreadcrumb();
    this.loadDashboard();
  }

  ngOnDestroy() {
    this.removeBreadcrumb();
    this.filterActions.clear();
  }
}
