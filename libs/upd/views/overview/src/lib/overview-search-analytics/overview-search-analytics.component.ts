import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'upd-overview-search-analytics',
  templateUrl: './overview-search-analytics.component.html',
  styleUrls: ['./overview-search-analytics.component.css'],
})
export class OverviewSearchAnalyticsComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  gscImpressions$ = this.overviewService.impressions$;
  gscImpressionsPercentChange$ = this.overviewService.impressionsPercentChange$;

  gscCTR$ = this.overviewService.ctr$;
  gscCTRPercentChange$ = this.overviewService.ctrPercentChange$;

  gscAverage$ = this.overviewService.avgRank$;
  gscAveragePercentChange$ = this.overviewService.avgRankPercentChange$;

  CanSearchTerms = canSearchTerms;
  GSCSearchTerms$ = this.overviewService.top10GSC$;


  CanSearchTermsCols: ColumnConfig[] = [];
  GSCSearchTermsCols: ColumnConfig<GscSearchTermsRow>[] = [];

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.CanSearchTermsCols = [
        { field: 'Search terms', header: this.i18n.service.translate('search-terms', lang) },
        { field: 'Clicks', header: this.i18n.service.translate('clicks', lang) },
        { field: 'Comparison', header: this.i18n.service.translate('comparison', lang) }
      ];
      this.GSCSearchTermsCols = [
        { field: '_id', header: this.i18n.service.translate('search-terms', lang) },
        { field: 'clicks', header: this.i18n.service.translate('clicks', lang), pipe: 'number' },
        { field: 'percentChange', header: this.i18n.service.translate('comparison', lang), pipe: 'percent' },
        { field: 'impressions', header: this.i18n.service.translate('impressions', lang), pipe: 'number' },
        { field: 'ctr', header: this.i18n.service.translate('ctr', lang), pipe: 'percent' },
        {
          field: 'position',
          header: this.i18n.service.translate('position', lang),
          pipe: 'number',
          pipeParam: '1.0-2',
        }
      ];
    });
  }
}

interface GscSearchTermsRow {
  _id: string;
  clicks: number;
  percentChange: number;
  impressions: number;
  ctr: number;
  position: number;
}

const canSearchTerms = [{"Search terms":"Arnage","Clicks":5545,"Comparison":0.8},
{"Search terms":"Cooper","Clicks":2381,"Comparison":0.5},
{"Search terms":"GS","Clicks":4183,"Comparison":0.32},
{"Search terms":"Acclaim","Clicks":6733,"Comparison":0.76},
{"Search terms":"Mustang","Clicks":2264,"Comparison":0.24},
{"Search terms":"Elise","Clicks":8141,"Comparison":0.38},
{"Search terms":"Tracker","Clicks":1753,"Comparison":0.66},
{"Search terms":"Amigo","Clicks":4032,"Comparison":0.74},
{"Search terms":"Savana 1500","Clicks":1989,"Comparison":0.35},
{"Search terms":"Forester","Clicks":2564,"Comparison":0.95},
{"Search terms":"Vandura G3500","Clicks":4552,"Comparison":0.98},
{"Search terms":"3 Series","Clicks":8877,"Comparison":0.95},
{"Search terms":"SLR McLaren","Clicks":4953,"Comparison":0.47},
{"Search terms":"Sunbird","Clicks":5354,"Comparison":0.6},
{"Search terms":"Frontier","Clicks":5755,"Comparison":0.36},
{"Search terms":"280ZX","Clicks":8360,"Comparison":0.99},
{"Search terms":"XJ Series","Clicks":4649,"Comparison":0.77},
{"Search terms":"GTI","Clicks":1255,"Comparison":0.15},
{"Search terms":"Fusion","Clicks":6990,"Comparison":0.23},
{"Search terms":"X5","Clicks":5501,"Comparison":0.67},
{"Search terms":"XLR","Clicks":2967,"Comparison":0.82},
{"Search terms":"CC","Clicks":9304,"Comparison":0.53},
{"Search terms":"Coachbuilder","Clicks":2221,"Comparison":0.46},
{"Search terms":"Express 3500","Clicks":1626,"Comparison":0.61},
{"Search terms":"Mariner","Clicks":6168,"Comparison":0.38},
{"Search terms":"Metro","Clicks":8123,"Comparison":0.09},
{"Search terms":"SL-Class","Clicks":1715,"Comparison":0.09},
{"Search terms":"Cressida","Clicks":5243,"Comparison":0.89},
{"Search terms":"Suburban 1500","Clicks":4671,"Comparison":0.55},
{"Search terms":"Bonneville","Clicks":8560,"Comparison":0.31},
{"Search terms":"E-Class","Clicks":1349,"Comparison":0.9},
{"Search terms":"Lancer Evolution","Clicks":3667,"Comparison":0.31},
{"Search terms":"Impala","Clicks":1511,"Comparison":0.24},
{"Search terms":"Marauder","Clicks":1578,"Comparison":0.93},
{"Search terms":"Chevette","Clicks":2541,"Comparison":0.11},
{"Search terms":"C-Class","Clicks":4962,"Comparison":0.61},
{"Search terms":"S10","Clicks":6068,"Comparison":0.37},
{"Search terms":"SL-Class","Clicks":6196,"Comparison":0.64},
{"Search terms":"i-290","Clicks":4279,"Comparison":0.27},
{"Search terms":"Sierra 3500","Clicks":7047,"Comparison":0.4},
{"Search terms":"H3T","Clicks":8617,"Comparison":0.93},
{"Search terms":"Lynx","Clicks":7328,"Comparison":0.84},
{"Search terms":"D350","Clicks":2162,"Comparison":0.34},
{"Search terms":"Familia","Clicks":3099,"Comparison":0.89},
{"Search terms":"C-Class","Clicks":4558,"Comparison":0.03},
{"Search terms":"Ram Van 2500","Clicks":9423,"Comparison":0.43},
{"Search terms":"Voyager","Clicks":7054,"Comparison":0.68},
{"Search terms":"Sierra 1500","Clicks":5013,"Comparison":0.37},
{"Search terms":"Tracer","Clicks":7606,"Comparison":0.85},
{"Search terms":"F150","Clicks":5361,"Comparison":0.26},
{"Search terms":"G","Clicks":2601,"Comparison":0.43},
{"Search terms":"612 Scaglietti","Clicks":9783,"Comparison":0.99},
{"Search terms":"V70","Clicks":6831,"Comparison":0.18},
{"Search terms":"G","Clicks":9840,"Comparison":0.73},
{"Search terms":"Mustang","Clicks":4408,"Comparison":0.81},
{"Search terms":"Land Cruiser","Clicks":7605,"Comparison":0.88},
{"Search terms":"Viper","Clicks":1616,"Comparison":0.0},
{"Search terms":"B-Series","Clicks":9532,"Comparison":0.88},
{"Search terms":"F450","Clicks":8527,"Comparison":0.36},
{"Search terms":"Grand Vitara","Clicks":7990,"Comparison":0.53},
{"Search terms":"Edge","Clicks":2251,"Comparison":0.17},
{"Search terms":"Legend","Clicks":5038,"Comparison":0.38},
{"Search terms":"Legacy","Clicks":8029,"Comparison":0.9},
{"Search terms":"Suburban 1500","Clicks":5169,"Comparison":0.68},
{"Search terms":"Element","Clicks":9780,"Comparison":0.65},
{"Search terms":"Golf","Clicks":3127,"Comparison":0.11},
{"Search terms":"TSX","Clicks":7007,"Comparison":0.79},
{"Search terms":"Navigator","Clicks":1973,"Comparison":0.85},
{"Search terms":"Focus","Clicks":1356,"Comparison":0.1},
{"Search terms":"626","Clicks":9975,"Comparison":0.03},
{"Search terms":"M3","Clicks":4676,"Comparison":0.77},
{"Search terms":"Sierra 3500","Clicks":9266,"Comparison":0.81},
{"Search terms":"Grand Marquis","Clicks":2728,"Comparison":0.66},
{"Search terms":"E-Series","Clicks":7708,"Comparison":0.65},
{"Search terms":"Camaro","Clicks":8670,"Comparison":0.8},
{"Search terms":"Ram","Clicks":3059,"Comparison":0.62},
{"Search terms":"Savana 3500","Clicks":2443,"Comparison":0.36},
{"Search terms":"Familia","Clicks":9343,"Comparison":0.96},
{"Search terms":"Ram 2500","Clicks":9295,"Comparison":0.03},
{"Search terms":"Avalanche 2500","Clicks":1016,"Comparison":0.54},
{"Search terms":"Century","Clicks":2506,"Comparison":0.08},
{"Search terms":"Freelander","Clicks":9467,"Comparison":0.0},
{"Search terms":"Rodeo","Clicks":6068,"Comparison":0.79},
{"Search terms":"Suburban 2500","Clicks":1292,"Comparison":0.42},
{"Search terms":"SLS-Class","Clicks":9902,"Comparison":0.48},
{"Search terms":"Tracker","Clicks":1613,"Comparison":0.16},
{"Search terms":"Insight","Clicks":3361,"Comparison":0.65},
{"Search terms":"MKT","Clicks":8875,"Comparison":0.43},
{"Search terms":"Jetta","Clicks":3165,"Comparison":0.52},
{"Search terms":"LaCrosse","Clicks":5036,"Comparison":0.57},
{"Search terms":"Countach","Clicks":7656,"Comparison":0.17},
{"Search terms":"VehiCROSS","Clicks":1233,"Comparison":0.51},
{"Search terms":"Ram Van 2500","Clicks":9884,"Comparison":0.45},
{"Search terms":"Explorer","Clicks":6208,"Comparison":0.4},
{"Search terms":"CL","Clicks":6904,"Comparison":0.38},
{"Search terms":"XF","Clicks":7626,"Comparison":0.05},
{"Search terms":"QX","Clicks":8214,"Comparison":0.89},
{"Search terms":"Savana 1500","Clicks":4200,"Comparison":0.73},
{"Search terms":"A6","Clicks":3301,"Comparison":0.17},
{"Search terms":"Grand Prix","Clicks":3290,"Comparison":0.02}]
