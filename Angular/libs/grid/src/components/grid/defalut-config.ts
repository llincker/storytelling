import { GridType } from 'angular-gridster2';

export default {
  gridType: <GridType>'fit',
  margin: 1,
  outerMargin: true,
  mobileBreakpoint: 640,
  minCols: 30,
  maxCols: 50,
  minRows: 30,
  maxRows: 50,
  maxItemCols: 100,
  minItemCols: 1,
  maxItemRows: 100,
  minItemRows: 1,
  maxItemArea: 2500,
  minItemArea: 1,
  defaultItemCols: 1,
  defaultItemRows: 1,
  fixedColWidth: 25,
  fixedRowHeight: 25,
  keepFixedHeightInMobile: false,
  keepFixedWidthInMobile: false,
  scrollSensitivity: 10,
  scrollSpeed: 20,
  enableEmptyCellDrop: false,
  enableEmptyCellDrag: false,
  emptyCellDragMaxCols: 50,
  emptyCellDragMaxRows: 50,
  swap: true,
  enableEmptyCellClick: true,
  enableEmptyCellContextMenu: true,
  disablePushOnDrag: false,
  disablePushOnResize: false,
  pushDirections: { north: true, east: true, south: true, west: true },
  pushResizeItems: false,
  disableWindowResize: false,
  disableWarnings: false,
  scrollToNewItems: false,
  pushItems: true
};
