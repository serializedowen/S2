import ReactDOM from 'react-dom';
import React from 'react';
import { Switch, Button } from 'antd';
import { forEach } from 'lodash';
import { act } from 'react-dom/test-utils';
import {
  mockTabularDataCfg,
  mockTabularOptions,
} from 'tests/data/tabular-data';
import { getContainer } from 'tests/util/helpers';
import {
  data as mockData,
  totalData,
  meta,
} from 'tests/data/mock-dataset.json';
import { CustomTooltip } from './custom/custom-tooltip';
import { mergeCells } from '@/utils/interaction/merge-cells';
import 'antd/dist/antd.min.css';
import {
  S2DataConfig,
  S2Options,
  SheetComponent,
  PivotSheet,
  SheetType,
  DEFAULT_STYLE,
} from '@/index';

const data = mockData.map((row) => {
  row['profit-tongbi'] = 0.2233;
  row['profit-huanbi'] = -0.4411;
  row['count-tongbi'] = 0.1234;
  row['count-huanbi'] = -0.4321;
  return row;
});

const getSpreadSheet = (
  dom: string | HTMLElement,
  dataCfg: S2DataConfig,
  options: S2Options,
) => {
  return new PivotSheet(dom, dataCfg, options);
};

const baseDataCfg: S2DataConfig = {
  fields: {
    // rows has value
    rows: ['province', 'city'],
    columns: ['type', 'sub_type'],
    values: ['number'],
    valueInCols: true,
  },
  data,
  meta,
  totalData,
} as S2DataConfig;

const baseOptions = {
  debug: false,
  width: 600,
  height: 480,
  hierarchyType: 'grid',
  hierarchyCollapse: false,
  showSeriesNumber: true,
  freezeRowHeader: false,
  valueInCols: true,
  conditions: {
    text: [],
    interval: [],
    background: [],
    icon: [],
  },
  style: DEFAULT_STYLE,
  mergedCellsInfo: [
    [
      { colIndex: 1, rowIndex: 6 },
      { colIndex: 1, rowIndex: 7, showText: true },
      { colIndex: 2, rowIndex: 6 },
      { colIndex: 2, rowIndex: 7 },
      { colIndex: 3, rowIndex: 6 },
      { colIndex: 3, rowIndex: 7 },
    ],
  ],
  tooltip: {
    renderTooltip: (spreadsheet) => {
      return new CustomTooltip(spreadsheet);
    },
  },
} as S2Options;

const tabularOptions = {
  ...mockTabularOptions,
  mergedCellsInfo: [
    [
      { colIndex: 0, rowIndex: 0 },
      { colIndex: 0, rowIndex: 1, showText: true },
    ],
  ],
} as S2Options;

const getDataCfg = (sheetType: SheetType) => {
  switch (sheetType) {
    case 'tabular':
      return mockTabularDataCfg;
    case 'pivot':
    default:
      return baseDataCfg;
  }
};

const getOptions = (sheetType: SheetType) => {
  switch (sheetType) {
    case 'tabular':
      return tabularOptions;
    case 'pivot':
    default:
      return baseOptions;
  }
};

function MainLayout() {
  const [sheetType, setSheetType] = React.useState<SheetType>('pivot');
  const [options, setOptions] = React.useState<S2Options>(getOptions('pivot'));
  const [dataCfg, setDataCfg] = React.useState<S2DataConfig>(
    getDataCfg('pivot'),
  );

  let sheet;
  let mergedCellsInfo = [];

  const dataCellTooltip = (
    <div>
      <Button
        onClick={() => {
          mergeCells(sheet, mergedCellsInfo);
        }}
      >
        合并单元格
      </Button>
    </div>
  );

  const mergedCellsTooltip = <div>合并后的tooltip</div>;

  const onDataCellMouseUp = (value) => {
    sheet = value?.viewMeta?.spreadsheet;
    const cells = sheet.interaction.getActiveCells();
    mergedCellsInfo = [];
    forEach(cells, (cell) => {
      mergedCellsInfo.push({
        colIndex: cell?.meta?.colIndex,
        rowIndex: cell?.meta?.rowIndex,
      });
    });
    sheet.tooltip.show({
      position: { x: value.event.clientX, y: value.event.clientY },
      element: dataCellTooltip,
    });
  };

  const onMergedCellsClick = (value) => {
    sheet = value?.target?.cells[0].spreadsheet;
    sheet.tooltip.show({
      position: { x: value.event.clientX, y: value.event.clientY },
      element: mergedCellsTooltip,
    });
  };

  const onCheckChanged = (checked) => {
    const type = checked ? 'pivot' : 'tabular';
    setSheetType(type);
    setDataCfg(getDataCfg(type));
    setOptions(getOptions(type));
  };

  return (
    <div>
      <div style={{ display: 'inline-block' }}>
        <Switch
          checkedChildren="base"
          unCheckedChildren="tabular"
          defaultChecked={true}
          onChange={onCheckChanged}
          style={{ marginRight: 10 }}
        />
      </div>
      <SheetComponent
        sheetType={sheetType}
        dataCfg={dataCfg}
        adaptive={false}
        options={options}
        spreadsheet={getSpreadSheet}
        onDataCellMouseUp={onDataCellMouseUp}
        onMergedCellsClick={onMergedCellsClick}
      />
    </div>
  );
}

describe('spreadsheet normal spec', () => {
  test('demo', () => {
    expect(1).toBe(1);
  });

  act(() => {
    ReactDOM.render(<MainLayout />, getContainer());
  });
});
