import { Group, IShape, Point, ShapeAttrs } from '@antv/g-canvas';
import { isEmpty, isEqual, max } from 'lodash';
import { HeaderCell } from './header-cell';
import {
  CellTypes,
  EXTRA_FIELD,
  KEY_GROUP_CORNER_RESIZE_AREA,
  S2Event,
} from '@/common/constant';
import { FormatResult, TextTheme, ResizeInfo } from '@/common/interface';
import { CornerHeaderConfig } from '@/facet/header/corner';
import { getTextPosition, getVerticalPosition } from '@/utils/cell/cell';
import {
  renderLine,
  renderRect,
  renderText,
  renderTreeIcon,
} from '@/utils/g-renders';
import { isIPhoneX } from '@/utils/is-mobile';
import { getEllipsisText, measureTextWidth } from '@/utils/text';

export class CornerCell extends HeaderCell {
  protected headerConfig: CornerHeaderConfig;

  protected textShapes: IShape[] = [];

  /* 角头 label 类型 */
  public cornerType: 'col' | 'row';

  public get cellType() {
    return CellTypes.CORNER_CELL;
  }

  public update() {}

  protected initCell() {
    super.initCell();
    this.textShapes = [];
    this.drawBackgroundShape();
    this.drawTreeIcon();
    this.drawCellText();
    this.drawActionIcons();
    this.drawBorderShape();
    this.drawResizeArea();
  }

  protected drawCellText() {
    const { label } = this.meta;

    if (isEqual(label, EXTRA_FIELD)) {
      // don't render extra node
      return;
    }

    const { x } = this.getContentArea();
    const { y, height } = this.getCellArea();

    const textStyle = this.getTextStyle();
    const { formattedValue } = this.getFormattedFieldValue();

    // 当为树状结构下需要计算文本前收起展开的icon占的位置

    const maxWidth = this.getMaxTextWidth();
    const text = getEllipsisText(formattedValue, maxWidth, textStyle);
    const ellipseIndex = text.indexOf('...');

    let firstLine = text;
    let secondLine = '';

    // 存在文字的省略号 & 展示为tree结构
    if (ellipseIndex !== -1 && this.spreadsheet.isHierarchyTreeType()) {
      // 剪裁到 ... 最有点的后1个像素位置
      const lastIndex = ellipseIndex + (isIPhoneX() ? 1 : 0);
      firstLine = formattedValue.substr(0, lastIndex);
      secondLine = formattedValue.slice(lastIndex);
      // 第二行重新计算...逻辑
      secondLine = getEllipsisText(secondLine, maxWidth, textStyle);
    }

    const { x: textX } = getTextPosition(
      {
        x: x + this.getTreeIconWidth(),
        y: y,
        width: maxWidth,
        height: height,
      },
      textStyle,
    );
    const textY = y + (isEmpty(secondLine) ? height / 2 : height / 4);
    // first line
    this.textShapes.push(
      renderText(
        this,
        [this.textShapes[0]],
        textX,
        textY,
        firstLine,
        textStyle,
      ),
    );

    // second line
    if (!isEmpty(secondLine)) {
      this.textShapes.push(
        renderText(
          this,
          [this.textShapes[1]],
          textX,
          y + height * 0.75,
          secondLine,
          textStyle,
        ),
      );
    }

    this.actualTextWidth = max([
      measureTextWidth(firstLine, textStyle),
      measureTextWidth(secondLine, textStyle),
    ]);
  }

  /**
   * 绘制折叠展开的icon
   */
  private drawTreeIcon() {
    if (!this.showTreeIcon() || this.meta.cornerType !== 'row') {
      return;
    }
    // 只有交叉表才有icon
    const { hierarchyCollapse } = this.headerConfig;

    const { size } = this.getStyle().icon;
    const { textBaseline, fill } = this.getTextStyle();
    const area = this.getContentArea();

    this.treeIcon = renderTreeIcon(
      this,
      {
        x: area.x,
        y: getVerticalPosition(area, textBaseline, size),
        width: size,
        height: size,
      },
      fill,
      hierarchyCollapse,
      () => {
        this.headerConfig.spreadsheet.store.set('scrollY', 0);
        this.headerConfig.spreadsheet.emit(
          S2Event.LAYOUT_TREE_ROWS_COLLAPSE_ALL,
          hierarchyCollapse,
        );
      },
    );
  }

  private drawBackgroundShape() {
    const { backgroundColorOpacity } = this.getStyle().cell;
    const attrs: ShapeAttrs = {
      ...this.getCellArea(),
      opacity: backgroundColorOpacity,
    };

    this.backgroundShape = renderRect(this, attrs);
  }

  /**
   * Render cell horizontalBorder border
   * @private
   */
  protected drawBorderShape() {
    if (this.meta.cornerType !== 'row') {
      return;
    }
    const { x, y, width } = this.getCellArea();
    const {
      horizontalBorderColor,
      horizontalBorderWidth,
      horizontalBorderColorOpacity,
    } = this.getStyle().cell;

    // horizontal border
    renderLine(
      this,
      {
        x1: x,
        y1: y,
        x2: x + width,
        y2: y,
      },
      {
        stroke: horizontalBorderColor,
        lineWidth: horizontalBorderWidth,
        opacity: horizontalBorderColorOpacity,
      },
    );
  }

  private drawResizeArea() {
    const prevResizeArea = this.spreadsheet.foregroundGroup.findById(
      KEY_GROUP_CORNER_RESIZE_AREA,
    );
    const resizeStyle = this.getStyle('resizeArea');
    const resizeArea = (prevResizeArea ||
      this.spreadsheet.foregroundGroup.addGroup({
        id: KEY_GROUP_CORNER_RESIZE_AREA,
      })) as Group;
    const { position } = this.headerConfig;
    const { x, y, width: cellWidth, height: cellHeight, field } = this.meta;
    resizeArea.addShape('rect', {
      attrs: {
        x: position.x + x + cellWidth - resizeStyle.size / 2,
        y: position.y + y,
        width: resizeStyle.size,
        height: cellHeight,
        fill: resizeStyle.background,
        fillOpacity: resizeStyle.backgroundOpacity,
        cursor: 'col-resize',
        appendInfo: {
          isResizeArea: true,
          class: 'resize-trigger',
          type: 'col',
          id: field,
          affect: 'field',
          offsetX: position.x + x,
          offsetY: position.y + y,
          width: cellWidth,
          height: cellHeight,
        } as ResizeInfo,
      },
    });
  }

  private showTreeIcon() {
    // 批量折叠或者展开的icon，只存在树状结构的第一个cell前
    return (
      this.headerConfig.spreadsheet.isHierarchyTreeType() &&
      this.headerConfig.spreadsheet.isPivotMode() &&
      this.meta?.x === 0
    );
  }

  private getTreeIconWidth() {
    const { size, margin } = this.getStyle().icon;
    return this.showTreeIcon() ? size + margin.right : 0;
  }

  protected getTextStyle(): TextTheme {
    const cornerTextStyle = this.getStyle().bolderText;
    return {
      ...cornerTextStyle,
      textAlign: this.spreadsheet.isHierarchyTreeType() ? 'left' : 'center',
      textBaseline: 'middle',
    };
  }

  protected getFormattedFieldValue(): FormatResult {
    return { formattedValue: this.meta.label, value: this.meta.label };
  }

  protected getMaxTextWidth(): number {
    const { width } = this.getContentArea();
    return width - this.getTreeIconWidth() - this.getActionIconsWidth();
  }

  protected getTextPosition(): Point {
    return {
      x: 0,
      y: 0,
    };
  }
}
