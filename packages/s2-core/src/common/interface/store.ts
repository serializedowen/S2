import { BBox, Group } from '@antv/g-canvas';
import { InteractionStateInfo, SortParam } from '../interface';
import { ValueRanges } from './condition';
import { S2DataConfig } from './s2DataConfig';
import { Node } from '@/facet/layout/node';
import { PartDrillDownFieldInLevel } from '@/components/sheets/interface';

export interface Selected {
  type:
    | 'cell'
    | 'row'
    | 'brush'
    | 'col'
    | 'column'
    | 'row&col'
    | 'column-multiple';
  // [ 10, 5 ], [ [ 2, 5 ], [ 4, 8 ] ];
  indexes: [number | number[], number | number[]];
}

export interface ReachedBorderId {
  rowId?: string;
  colId?: string;
}

export interface HiddenColumnsInfo {
  // 当前显示的兄弟节点之前所隐藏的节点
  hideColumnNodes: Node[];
  // 当前隐藏列所对应展示展开按钮的兄弟节点
  displaySiblingNode: Node;
}

/**
 * All stored keys need type define here
 */
export interface StoreKey {
  // horizontal scroll bar scroll x offset
  scrollX: number;
  // vertical scroll bar scroll y offset
  scrollY: number;
  // row header scroll bar scroll x offset
  hRowScrollX: number;
  // column cell click sort params
  sortParam: SortParam;
  // last reached border node id
  lastReachedBorderId: ReachedBorderId;
  // 下钻节点id和对应生成的 path寻址路径
  drillDownIdPathMap: Map<string, number[][]>;
  // 当前下钻节点
  drillDownNode: Node;
  // 下钻数据的个数控制
  drillItemsNum: number;
  drillDownFieldInLevel: PartDrillDownFieldInLevel[];

  // interaction state
  interactionStateInfo: InteractionStateInfo;

  originalDataCfg: S2DataConfig;

  panelBBox: BBox;
  // resize area group
  activeResizeArea: Group;
  // interval condition
  valueRanges: ValueRanges;
  // 初次渲染时的列头节点
  initColumnNodes: Node[];
  /**
   * 隐藏列详情
   *  | a, b, [c,d 隐藏] [icon e ] , [f 隐藏], [icon g]   |
   */
  hiddenColumnsDetail: HiddenColumnsInfo[];
  // 上一次渲染的列头配置
  lastRenderedColumnFields: string[];

  [key: string]: unknown;
}
