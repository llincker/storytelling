import {
  Component,
  OnInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
  ViewEncapsulation,
  AfterViewInit
} from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

import { Chart } from '../chart.class';

@Component({
  selector: 'app-sunburst-chart',
  templateUrl: './sunburst-chart.component.html',
  styleUrls: ['./sunburst-chart.component.scss']
})
export class SunburstChartComponent extends Chart {
  @ViewChild('chart') private chartContainer: ElementRef;
  private data: any;
  private curtain: any; //for animation
  private margin: any = { top: 20, bottom: 20, left: 20, right: 20 };
  private chart: any;
  private width: number;
  private height: number;
  private totalSize: number = 0; // Total size of all segments; we set this later, after loading the data.
  private colorScale: any;
  private depth: number;
  private b = {
    w: 55,
    h: 30,
    s: 3,
    t: 10, // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
    suppLineNb: 0 // Supplementary line breaks for breakcrumb sequence
  };
  private stringsLength: Array<number>; // Array of the strings size inside the trail
  private arc: any;
  private xScale: any;
  private yScale: any;
  private radius: any;
  private formatNumber: any;
  private chartOptions: any;
  private coloralternative: number;
  private colorDomain = ['#3498db', '#f39c12', '#27ae60', '#fa8231', '#9c88ff','#487eb0', '#079992', '#eb4d4b',
  '#7bc8a4', '#7f8c8d', '#ee5a24', '#74b9ff', '#a3cb38', '#b71540', '#fed330', '#8e44ad', '#34495e', '#bdc3c7'];

  constructor() {
    super();
  }

  ngAfterViewInit() {
    this.chartOptions = { ...this.configInput };
    d3.select('#SunburstComponent').remove();
    this.coloralternative = 0;
    setTimeout(() => {
      this.init();
    }, 500);
  }

  /**
   * Process json Data to Ngx-charts format
   * @param dataDims :  string[] Selected Dimentions
   * @param rawData : array<Object> Json data
   */
  public static convertData(dataDims: string[], rawData: any) {
    const hierarchy$ = depth => d => d[dataDims[0][depth]];
    const value$ = d => d[dataDims[1]];
    const depthDim = dataDims[0].length;
    
    const root = { name: _.head(dataDims[0]), children: [] };

    const level0 = _.chain(rawData)
      .groupBy(_.head(dataDims[0]))
      .flatMap(d => sum(d, 0, hierarchy$(0)))
      .value();

    function sum(d, depth, fetchId$) {
      let level = {
        name: fetchId$(d[0])
      };

      let upperLevel;

      depth += 1;
      if (depth < depthDim) {
        upperLevel = Object.assign({}, level, { children: [] });

        upperLevel.children = _.chain(d)
          .groupBy(dataDims[0][depth])
          .flatMap(d1 => sum(d1, depth, hierarchy$(depth)))
          .value();
      }

      if (upperLevel) {
        level = upperLevel;
      } else {
        level = Object.assign(level, { value: _.reduce(d, (total, el) => total + value$(el), 0) });
      }

      return level;
    }

    root.children = root.children.concat(level0);
    return root;
  }

  init() {
    if (this.configInput != null) {
      this.data = SunburstChartComponent.convertData(this.chartOptions.dataDims, this.dataInput);
    } else {
      this.data = this.dataInput;
    }
    this.depth = this.chartOptions.dataDims[0].length;
    this.drawChart();
    this.load();
  }

  /**
   * Draw function for D3.js Bar chart
   */
  drawChart() {
    if (this.data === undefined) return;
    // Set size of the svg
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this.formatNumber = d3.format(',d');
    this.radius =
      Math.min(
        this.width - this.margin.left - this.margin.right,
        this.height - this.margin.top - this.margin.bottom - (this.b.suppLineNb * 30)
      ) /2;
    this.xScale = d3.scaleLinear().range([0, 2 * Math.PI]);
    this.yScale = d3.scaleSqrt().range([0, this.radius]);
    d3
      .select(element)
      .select('#sequence')
      .select('svg')
      .style('opacity', 0);

    this.b.suppLineNb = Math.floor(
      (this.chartOptions.dataDims[0].length * 2 * (this.b.w + this.b.t))
      / (0.75 * this.width - this.margin.left - this.margin.right)
    )
  
    let partition = d3.partition();

    this.arc = d3
      .arc()
      .startAngle((d: any) => {
        return Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x0)));
      })
      .endAngle((d: any) => {
        return Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x1)));
      })
      .innerRadius((d: any) => {
        return Math.max(0, this.yScale(d.y0));
      })
      .outerRadius((d: any) => {
        return Math.max(0, this.yScale(d.y1));
      });

    // Basic setup of page elements
    this.initializeBreadcrumbTrail(element, this.radius, this.margin, this.b.suppLineNb);

    this.chart = d3
      .select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 ' + this.width + ' ' + this.height)
      .attr('id', 'SunburstComponent')
      .append('g')
      .attr('id', 'container')
      .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');

    this.chart
      .append('svg:circle')
      .attr('r', this.radius)
      .style('opacity', 0);

    // Turn the data into a d3 hierarchy and calculate the sums.
    let root = d3
      .hierarchy(this.data)
      .sum((d: any) => d.value)
      .sort((a, b) => b.height - a.height || b.value - a.value);

    let nodes = partition(root).descendants();

    let path = this.chart
      .data([this.data])
      .selectAll('path')
      .data(nodes)
      .enter()
      .append('path')
      .attr('d', this.arc)
      .attr('fill-rule', 'evenodd')
      .style('stroke', '#FFFFFF')
      .style('fill', d => this.setColor(d))
      .style('opacity', 1)
      .on('mouseover', d => {
        if (d.depth !== 0) {
          return this.mouseover(d, this, element);
        } else {
          this.mouseleave(d, this, element);
        }
      })
      .on('click', d => this.zoom(d, this));

    // Add the mouseleave handler to the bounding circle.
    d3
      .select(element)
      .select('#container')
      .on('mouseleave', d => this.mouseleave(d, this, element));

    // Get total size of the tree = value of root node from partition.
    this.totalSize = path.datum().value;

    /* Add 'curtain' rectangle to hide entire graph */
    this.curtain = this.chart.style('opacity', 0);
  }
  
  // Basic setup of page elements.
  private initializeBreadcrumbTrail(element, radius, margin, suppSequenceLineNbr) {
    d3.select('#trail').remove();
    // Add the svg area.
    d3
      .select(element)
      .select('#sequence')
      .append('svg')
      .style('height', 60 + suppSequenceLineNbr * 30 + 'px')
      .attr('width', '100%')
      .attr('id', 'trail');

       // Place the breadcrumb trail lower
    d3
    .select(element)
    .select('#sequence')
    .select('svg')
    .attr('transform', d => 'translate(' + (this.width - this.margin.left - this.margin.right) / 4 + ',' + margin.top + ')');

    d3
      .select(element)
      .select('#explanation')
      .style('height', '90px')
      .style('width', '100%' )
      .attr('transform', d => 'translate(' + margin.left + ',' + (margin.top + 60 + (suppSequenceLineNbr * 30)) + ')');
  }

  // Fade all but the current sequence, and show it in the breadcrumb trail.
  private mouseover(d, thisClass, element) {
    let percentage = Number((100 * d.value / thisClass.totalSize).toPrecision(3));
    let value = thisClass.formatNumber(d.value);
    let percentageString = `${percentage}%`;

    if (percentage < 0.1) {
      percentageString = '< 0.1%';
    }

    // Update of the percentage of the explanation
    d3
      .select(element)
      .select('#percentage')
      .text(percentageString)
      .attr('top', '0');

    // Update of the percentage of the explanation
    d3
      .select(element)
      .select('#value')
      .text(value);

    let sequenceArray = d.ancestors().reverse();
    thisClass.updateBreadcrumbs(sequenceArray, percentageString, thisClass, element); // Update of the breadcrumb trail
    // Fade all the segments.
    thisClass.chart.selectAll('path').style('opacity', 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    thisClass.chart
      .selectAll('path')
      .filter(function(node) {
        return sequenceArray.indexOf(node) >= 0;
      })
      .style('opacity', 1);
  }

  // Update the breadcrumb trail to show the current sequence and percentage.
  private updateBreadcrumbs(nodeArray, percentageString, thisClass, element) {
    thisClass.stringsLength = [];

    // Data join; key function combines name and depth (= position in sequence).
    let trail = d3
      .select(element)
      .select('#trail')
      .selectAll('g')
      .data(nodeArray, (d: any) => d.data.name + d.depth);

    // Remove exiting nodes.
    trail.exit().remove();

    // Add breadcrumb and label for entering nodes.
    let entering = trail.enter().append('g');

    // Dynamic size ot trail
    // 1. We draw the text of each section of the trail
    entering
      .append('text')
      .attr('y', thisClass.b.h / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d.data.name;
      })
      .each(function(d) {
        let stringLength = (<SVGTextContentElement>this).getComputedTextLength();
        d3.select(this).attr('x', () => (thisClass.b.w + stringLength + thisClass.b.t) / 2);
      });

    // 2. We calculate the effective size ot these texts
    d3
      .select(element)
      .select('#trail')
      .selectAll('g')
      .select('text')
      .each(function(d) {
        let stringLength = (<SVGTextContentElement>this).getComputedTextLength();
        thisClass.stringsLength.push(stringLength);
      });

    // 3. We draw the polygons adapted to the text size
    entering
      .append('polygon')
      .attr('points', (d, i) => thisClass.breadcrumbPoints(d, i, this, thisClass, thisClass.stringsLength[i]))
      .style('fill', d => (d.depth === 0 ? '#BFBFBF' : d._color))
      .each(function() {
        // 4. We place polygons back of the texts
        let firstChild = (<Node>this).parentNode.firstChild;

        if (firstChild) {
          (<Node>this).parentNode.insertBefore(<Node>this, firstChild);
        }
      });

    // Merge enter and update selections; set position for all nodes and we calculate the size of the sequence
    let translation = 0; // Translation of each polygon
    let SequenceTotalSize = 0; // Total size of the trail
    let line = 0; // Line breaks
    entering.merge(trail).attr('transform', (d, i) => {
      if (i == 0) {
        translation = 0;
        SequenceTotalSize = thisClass.b.w + thisClass.stringsLength[0] + thisClass.b.t;
        return 'translate(' + translation + ', 0)';
      } else {
        if ((SequenceTotalSize + thisClass.b.w + thisClass.stringsLength[i]) > (0.9 * this.width - this.margin.left - this.margin.right)) {
          line ++;
          translation = 20;
          SequenceTotalSize = 20 + thisClass.b.w + thisClass.stringsLength[i] + thisClass.b.t;
          return 'translate(' + translation + ', ' + line * (thisClass.b.h + 5) + ')';
        } else {
          translation += i == 0 ? 0 : thisClass.b.w + thisClass.b.s + thisClass.stringsLength[i - 1];
          SequenceTotalSize += thisClass.b.w + thisClass.stringsLength[i] + thisClass.b.t;
          return 'translate(' + translation + ', ' + line * (thisClass.b.h + 5) + ')';
        }
      }
    });

    // Make the breadcrumb trail visible, if it's hidden.
    d3
      .select(element)
      .select('#trail')
      .style('visibility', '');

    // Make the explanation trail visible, if it's hidden.
    d3
      .select(element)
      .select('#explanation')
      .style('visibility', '');
  }

  // Generate a string that describes the points of a breadcrumb polygon.
  private breadcrumbPoints(d, i, node, thisClass, textLength) {
    let points = [];
    points.push('0,0');
    points.push(thisClass.b.w + textLength + ',0');
    points.push(thisClass.b.w + textLength + thisClass.b.t + ',' + thisClass.b.h / 2);
    points.push(thisClass.b.w + textLength + ',' + thisClass.b.h);
    points.push('0,' + thisClass.b.h);

    // For the leftmost breadcrumb we don't include 6th vertex
    if (i > 0) {
      points.push(thisClass.b.t + ',' + thisClass.b.h / 2);
    }

    return points.join(' ');
  }

  // Restore everything to full opacity when moving off the visualization.
  private mouseleave(d, thisClass, element) {
    // Hide the breadcrumb trail
    d3
      .select(element)
      .select('#trail')
      .style('visibility', 'hidden');

    // Hide explanation
    d3
      .select(element)
      .select('#explanation')
      .style('visibility', 'hidden');

    // Deactivate all segments during transition.
    thisClass.chart.selectAll('path').on('mouseover', null);

    // Transition each segment to full opacity and then reactivate it.
    thisClass.chart
      .selectAll('path')
      .transition()
      .duration(250)
      .style('opacity', 1)
      .on('end', function() {
        d3.select(this).on('mouseover', (d: any) => {
          if (d.depth !== 0) {
            return thisClass.mouseover(d, thisClass, element);
          } else {
            thisClass.mouseleave(d, thisClass, element);
          }
        });
      });
  }

  private setColor(d) {
    let color;

    switch (d.depth) {
      case 0: {
        color = 'transparent';
        break;
      }

      case 1: {
        color = this.colorDomain[this.coloralternative % this.colorDomain.length];
        d._color = color;
        this.coloralternative++;
        break;
      }

      default: {
        color = d3.rgb(d.parent._color).brighter(0.1 * d.depth);
        d._color = color;
        break;
      }
    }

    return color;
  }

  private zoom(d, thisClass) {
    thisClass.chart
      .transition()
      .duration(750)
      .tween('scale', function() {
        let xd = d3.interpolate(thisClass.xScale.domain(), [d.x0, d.x1]);
        let yd = d3.interpolate(thisClass.yScale.domain(), [d.y0, 1]);
        let yr = d3.interpolate(thisClass.yScale.range(), [d.y0 ? 20 : 0, thisClass.radius]);

        return t => {
          thisClass.xScale.domain(xd(t));
          thisClass.yScale.domain(yd(t)).range(yr(t));
        };
      })
      .selectAll('path')
      .attrTween('d', d => {
        return function() {
          return thisClass.arc(d);
        };
      });
  }

  load() {
    if (this.curtain === undefined) return;
    this.curtain
      .transition()
      .duration(2000)
      .style('opacity', 1);
  }

  ease() {
    if (this.curtain === undefined) return;
    this.curtain
      .transition()
      .duration(1000)
      .style('opacity', 0);
  }
}
