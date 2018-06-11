import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { Chart } from '../../chart.class';
import { formatLabel } from '@swimlane/ngx-charts/';
import { nest } from 'd3-collection';
import * as d3 from 'd3';

const defaultOptions = {};
@Component({
  selector: 'app-advanced-pie-chart',
  templateUrl: './advanced-pie-chart.component.html',
  styleUrls: ['./advanced-pie-chart.component.scss']
})
export class AdvancedPieChartComponent extends Chart implements OnInit, OnDestroy {
  data: Array<any> = [];
  @ViewChild('chart') private chartContainer: ElementRef;
  activated = false;
  chartOptions: any;
  private width: number;
  private height: number;
  private _setIntervalHandler: any;
  view: null;
  colorScheme = {
    name: 'pie',
    selectable: true,
    group: 'Ordinal',
    domain: ['#3498db', '#74b9ff', '#f39c12', '#fed330', '#27ae60', '#a3cb38', '#ee5a24', '#fa8231',
    '#8e44ad', '#9c88ff', '#079992', '#7bc8a4', '#b71540', '#eb4d4b', '#34495e', '#487eb0', '#7f8c8d', '#bdc3c7']
  };
  gradient = false;
  tooltipDisabled = false;

  // margin
  private margin: any = { top: 30, bottom: 20, left: 40, right: 40 };

  constructor() {
    super();
  }

  ngOnInit() {
    this.chartOptions = { ...defaultOptions, ...this.configInput };
  }
  ngAfterViewInit() {
    let element = this.chartContainer.nativeElement;
    // Set the config
    setTimeout(() => {
      d3
        .select(element)
        .select('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr(
          'viewBox',
          '0  ' + element.offsetHeight / 3 + ' ' + element.offsetWidth / 3 + ' ' + element.offsetHeight / 3
        );
      this.init();
      this.activated = true;
      this.lol();
    });
  }

  init() {
    if (this.configInput != null)
      this.data = AdvancedPieChartComponent.convertData(this.chartOptions.dataDims, this.dataInput);
    else this.data = this.dataInput;
  }

  public static convertData(dataDims: string[], rawData: any) {
    const key$ = d => d[dataDims[0]];
    const value$ = d => d3.sum(d, (s: any) => s[dataDims[1]]);

    return (<any>nest())
      .key(key$)
      .rollup(value$)
      .entries(rawData)
      .map(seriesPoints);

    function seriesPoints(d) {
      return {
        name: d.key,
        value: d.value
      };
    }
  }

  select(data) {
    console.log('Item clicked', data);
  }

  onLegendLabelClick(entry) {
    console.log('Legend clicked', entry);
  }

  ngOnDestroy() {
    clearTimeout(this._setIntervalHandler);
  }

  lol() {
    let element = this.chartContainer.nativeElement;
    let svg = d3.select(element);
      console.log(element)
    // // Merge enter and update selections; set position for all nodes and we calculate the size of the sequence
    // let translation = 0; // Translation of each polygon
    // let SequenceTotalSize = 0; // Total size of the trail
    // let line = 0; // Line breaks
    // entering.merge(trail).attr('transform', (d, i) => {
    //   if (i == 0) {
    //     translation = 0;
    //     SequenceTotalSize = thisClass.b.w + thisClass.stringsLength[0] + thisClass.b.t;
    //     return 'translate(' + translation + ', 0)';
    //   } else {
    //     if ((SequenceTotalSize + thisClass.b.w + thisClass.stringsLength[i]) > (0.9 * this.width - this.margin.left - this.margin.right)) {
    //       line ++;
    //       translation = 20;
    //       SequenceTotalSize = 20 + thisClass.b.w + thisClass.stringsLength[i] + thisClass.b.t;
    //       return 'translate(' + translation + ', ' + line * (thisClass.b.h + 5) + ')';
    //     } else {
    //       translation += i == 0 ? 0 : thisClass.b.w + thisClass.b.s + thisClass.stringsLength[i - 1];
    //       SequenceTotalSize += thisClass.b.w + thisClass.stringsLength[i] + thisClass.b.t;
    //       return 'translate(' + translation + ', ' + line * (thisClass.b.h + 5) + ')';
    //     }
    //   }
  }
}
