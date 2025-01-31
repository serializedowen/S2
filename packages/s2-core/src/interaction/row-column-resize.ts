import {
  Group,
  Event as CanvasEvent,
  IGroup,
  ShapeAttrs,
  IShape,
} from '@antv/g-canvas';
import { clone, isEmpty, throttle } from 'lodash';
import { BaseEvent, BaseEventImplement } from './base-interaction';
import {
  ResizeDetail,
  ResizeGuideLinePath,
  ResizeGuideLinePosition,
  ResizeInfo,
} from '@/common/interface/resize';
import { SpreadSheet } from '@/sheet-type';
import {
  InterceptType,
  MIN_CELL_HEIGHT,
  MIN_CELL_WIDTH,
  S2Event,
} from '@/common/constant';

export class RowColumnResize extends BaseEvent implements BaseEventImplement {
  private resizeArea: IGroup;

  private resizeGroup: IGroup;

  private container: IGroup;

  private resizeStartPosition: { offsetX?: number; offsetY?: number } = {};

  constructor(spreadsheet: SpreadSheet) {
    super(spreadsheet);
    this.container = this.spreadsheet.foregroundGroup;
  }

  public bindEvents() {
    this.bindMouseDown();
    this.bindMouseMove();
    this.bindMouseUp();
  }

  private initResizeGroup() {
    if (this.resizeGroup) {
      return;
    }
    this.resizeGroup = this.container.addGroup();

    const { width, height } = this.spreadsheet.options;
    const { guidLineColor, guidLineDash, size } = this.getResizeAreaTheme();
    const attrs: ShapeAttrs = {
      path: '',
      lineDash: [guidLineDash, guidLineDash],
      stroke: guidLineColor,
      strokeWidth: size,
    };
    // 起始参考线
    this.resizeGroup.addShape('path', { id: 'startGuideLine', attrs });
    // 结束参考线
    this.resizeGroup.addShape('path', { id: 'endGuideLine', attrs });
    // Resize 蒙层
    this.resizeGroup.addShape('rect', {
      id: 'resizeMask',
      attrs: {
        appendInfo: {
          isResizeArea: true,
        },
        x: 0,
        y: 0,
        width,
        height,
        fill: 'transparent',
      },
    });
  }

  private getResizeAreaTheme() {
    return this.spreadsheet.theme.resizeArea;
  }

  private setResizeArea(target: IGroup) {
    this.resizeArea = target;
  }

  private updateResizeGuideLinePosition(
    event: MouseEvent,
    resizeInfo: ResizeInfo,
  ) {
    const resizeShapes = this.resizeGroup.get('children');
    if (isEmpty(resizeShapes)) {
      return;
    }

    const { width: canvasWidth, height: canvasHeight } =
      this.spreadsheet.options;
    const [startResizeGuideLineShape, endResizeGuideLineShape] = resizeShapes;
    const { type: cellType, offsetX, offsetY, width, height } = resizeInfo;

    endResizeGuideLineShape.attr('cursor', `${cellType}-resize`);

    if (cellType === 'col') {
      startResizeGuideLineShape.attr('path', [
        ['M', offsetX, offsetY],
        ['L', offsetX, canvasHeight],
      ]);
      endResizeGuideLineShape.attr('path', [
        ['M', offsetX + width, offsetY],
        ['L', offsetX + width, canvasHeight],
      ]);
      this.resizeStartPosition.offsetX = event.offsetX;
      return;
    }

    startResizeGuideLineShape.attr('path', [
      ['M', offsetX, offsetY],
      ['L', canvasWidth, offsetY],
    ]);
    endResizeGuideLineShape.attr('path', [
      ['M', offsetX, offsetY + height],
      ['L', canvasWidth, offsetY + height],
    ]);
    this.resizeStartPosition.offsetY = event.offsetY;
  }

  private bindMouseDown() {
    this.spreadsheet.on(S2Event.LAYOUT_RESIZE_MOUSE_DOWN, (event) => {
      const shape = event.target as IGroup;
      const resizeInfo: ResizeInfo = shape?.attr('appendInfo');
      const originalEvent = event.originalEvent as MouseEvent;

      if (!resizeInfo?.isResizeArea) {
        return;
      }

      this.spreadsheet.interaction.addIntercepts([InterceptType.RESIZE]);
      this.setResizeArea(shape);
      this.showResizeGroup();
      this.updateResizeGuideLinePosition(originalEvent, resizeInfo);

      const header = this.getHeaderGroup();
      this.resizeGroup.move(header.get('x'), header.get('y'));
    });
  }

  private bindMouseMove() {
    this.spreadsheet.on(S2Event.LAYOUT_RESIZE_MOUSE_MOVE, (event) => {
      throttle(this.resizeMouseMove, 33)(event);
    });
  }

  // 将 SVG 的 path 转成更可读的坐标对象
  private getResizeGuideLinePosition(): ResizeGuideLinePosition {
    const [startGuideLineShape, endGuideLineShape] =
      this.resizeGroup.getChildren() || [];
    const startGuideLinePath: ResizeGuideLinePath[] =
      startGuideLineShape?.attr('path') || [];
    const endGuideLinePath: ResizeGuideLinePath[] =
      endGuideLineShape?.attr('path') || [];

    const [, startX = 0, startY = 0] = startGuideLinePath[0] || [];
    const [, endX = 0, endY = 0] = endGuideLinePath[0] || [];

    return {
      start: {
        x: startX,
        y: startY,
      },
      end: {
        x: endX,
        y: endY,
      },
    };
  }

  private getColCellResizeDetail(): ResizeDetail {
    const { start, end } = this.getResizeGuideLinePosition();
    const width = Math.floor(end.x - start.x);
    const resizeInfo = this.getResizeInfo();

    switch (resizeInfo.affect) {
      case 'field':
        return {
          eventType: S2Event.LAYOUT_RESIZE_ROW_WIDTH,
          style: {
            rowCfg: {
              widthByField: {
                [resizeInfo.id]: width,
              },
            },
          },
        };
      case 'tree':
        return {
          eventType: S2Event.LAYOUT_RESIZE_TREE_WIDTH,
          style: {
            rowCfg: {
              treeRowsWidth: width,
            },
          },
        };
      case 'cell':
        return {
          eventType: S2Event.LAYOUT_RESIZE_COL_WIDTH,
          style: {
            colCfg: {
              widthByFieldValue: {
                [resizeInfo.caption]: width,
              },
            },
          },
        };
      default:
        return null;
    }
  }

  private getRowCellResizeDetail(): ResizeDetail {
    const { padding: rowCellPadding } = this.spreadsheet.theme.rowCell.cell;
    const { start, end } = this.getResizeGuideLinePosition();
    const baseHeight = Math.floor(end.y - start.y);
    const height = baseHeight - rowCellPadding.top - rowCellPadding.bottom;
    const resizeInfo = this.getResizeInfo();

    switch (resizeInfo.affect) {
      case 'field':
        return {
          eventType: S2Event.LAYOUT_RESIZE_COL_HEIGHT,
          style: {
            colCfg: {
              heightByField: {
                [resizeInfo.id]: baseHeight,
              },
            },
          },
        };
      case 'cell':
      case 'tree':
        return {
          eventType: S2Event.LAYOUT_RESIZE_ROW_HEIGHT,
          style: {
            cellCfg: {
              height,
            },
          },
        };
      default:
        return null;
    }
  }

  private getCellResizeDetail() {
    const resizeInfo = this.getResizeInfo();

    if (resizeInfo.type === 'col') {
      return this.getColCellResizeDetail();
    }
    return this.getRowCellResizeDetail();
  }

  private showResizeGroup() {
    this.initResizeGroup();
    this.resizeGroup.set('visible', true);
  }

  private hideResizeGroup() {
    this.resizeGroup.set('visible', false);
  }

  private bindMouseUp() {
    this.spreadsheet.on(S2Event.LAYOUT_RESIZE_MOUSE_UP, () => {
      if (!this.resizeGroup) {
        return;
      }

      this.hideResizeGroup();
      if (isEmpty(this.resizeGroup.getChildren())) {
        return;
      }
      this.renderByResize();
    });
  }

  private resizeMouseMove = (event: CanvasEvent) => {
    if (!this.resizeGroup?.get('visible')) {
      return;
    }
    event.preventDefault();
    const originalEvent = event.originalEvent as MouseEvent;
    const resizeInfo = this.getResizeInfo();
    const resizeShapes = this.resizeGroup.get('children') as IShape[];

    if (isEmpty(resizeShapes)) {
      return;
    }

    // resize 拖拽过程中, 将 tooltip 设置为鼠标穿透, 避免造成干扰
    this.spreadsheet.tooltip.disablePointerEvent();

    const [, cellEndBorder] = resizeShapes;
    const [guideLineStart, guideLineEnd]: ResizeGuideLinePath[] = clone(
      cellEndBorder.attr('path'),
    );

    // 下面的神仙代码我改不动了
    if (resizeInfo.type === 'col') {
      // 横向移动
      let offset = originalEvent.offsetX - this.resizeStartPosition.offsetX;
      if (guideLineStart[1] + offset - resizeInfo.offsetX < MIN_CELL_WIDTH) {
        // 禁止拖到最小宽度
        this.resizeStartPosition.offsetX = resizeInfo.offsetX + MIN_CELL_WIDTH;
        offset = resizeInfo.offsetX + MIN_CELL_WIDTH - guideLineStart[1];
      } else {
        this.resizeStartPosition.offsetX = originalEvent.offsetX;
      }
      guideLineStart[1] += offset;
      guideLineEnd[1] += offset;
      this.resizeArea.attr({
        x: this.resizeArea.attr('x') + offset,
      });
    } else {
      const guideLineStartY = guideLineStart[2];
      let offsetY = originalEvent.offsetY - this.resizeStartPosition.offsetY;
      if (guideLineStartY + offsetY - resizeInfo.offsetY < MIN_CELL_HEIGHT) {
        this.resizeStartPosition.offsetY = resizeInfo.offsetY + MIN_CELL_HEIGHT;
        offsetY = resizeInfo.offsetY + MIN_CELL_HEIGHT - guideLineStartY;
      } else {
        this.resizeStartPosition.offsetY = originalEvent.offsetY;
      }
      guideLineStart[2] += offsetY;
      guideLineEnd[2] += offsetY;
      this.resizeArea.attr({
        y: this.resizeArea.attr('y') + offsetY,
      });
    }
    cellEndBorder.attr('path', [guideLineStart, guideLineEnd]);
  };

  private renderByResize() {
    const resizeInfo = this.getResizeInfo();
    const { style, eventType: resizeEventType } =
      this.getCellResizeDetail() || {};

    const resizeDetail = {
      info: resizeInfo,
      style,
    };
    this.spreadsheet.emit(S2Event.LAYOUT_RESIZE, resizeDetail);
    this.spreadsheet.emit(resizeEventType, resizeDetail);
    this.spreadsheet.setOptions({ style });
    this.render();
  }

  private getResizeInfo(): ResizeInfo {
    return this.resizeArea?.attr('appendInfo');
  }

  private getHeaderGroup(): Group {
    return this.resizeArea?.get('parent').get('parent');
  }

  private render() {
    this.resizeStartPosition = {};
    this.resizeArea = null;
    this.resizeGroup = null;
    this.spreadsheet.render(false);
  }
}
