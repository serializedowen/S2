import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { getContainer } from 'tests/util/helpers';
import { Switcher } from '@/components/switcher';
import { SwitcherFields, SwitcherItem } from '@/components/switcher/interface';
import 'antd/dist/antd.min.css';

const mockRows: SwitcherItem[] = [
  { id: 'area', displayName: '区域' },
  { id: 'province', displayName: '省' },
  { id: 'city', displayName: '城市' },
];

const mockCols: SwitcherItem[] = [
  { id: 'county1', displayName: '一县' },
  { id: 'county2', displayName: '二县' },
  { id: 'county3', displayName: '三县' },
  { id: 'county4', displayName: '四县' },
  { id: 'county5', displayName: '五县' },
];

const mockValues: SwitcherItem[] = [
  {
    id: 'price',
    displayName: '价格',
    checked: true,
    children: [
      { id: 'price-rc', displayName: '环比' },
      { id: 'price-ac', displayName: '同比' },
    ],
  },
  {
    id: 'cost',
    displayName: '成本',
    children: [
      { id: 'cost-rc', displayName: '环比' },
      { id: 'cost-ac', displayName: '同比' },
    ],
  },
  { id: 'count', displayName: '数量' },
  { id: 'rank', displayName: '等级' },
];

function MainLayout() {
  const fields: SwitcherFields = {
    rows: {
      items: mockRows,
    },
    columns: {
      items: mockCols,
    },
    values: {
      selectable: true,
      expandable: true,
      items: mockValues,
    },
  };
  return (
    <div>
      <div style={{ margin: '10px' }}>
        <Switcher
          {...fields}
          onSubmit={(result) => {
            // eslint-disable-next-line no-console
            console.log('result: ', result);
          }}
        />
      </div>
    </div>
  );
}

describe('Dimension Switch Test', () => {
  test('demo', () => {
    expect(1).toBe(1);
  });

  act(() => {
    ReactDOM.render(<MainLayout />, getContainer());
  });
});
