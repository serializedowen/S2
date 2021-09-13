import SORT_DATA from '../../data/data-sort.json';
import { S2DataConfig } from '@/common/interface';
import { SpreadSheet } from '@/sheet-type';
import { PivotDataSet } from '@/data-set/pivot-data-set';
import { getIntersections, filterUndefined } from '@/utils/data-set-operate';

jest.mock('@/sheet-type');
jest.mock('@/facet/layout/node');
const MockSpreadSheet = SpreadSheet as any as jest.Mock<SpreadSheet>;

describe('Pivot Sort Test', () => {
  let dataSet: PivotDataSet;
  let dataCfg: S2DataConfig;

  beforeEach(() => {
    MockSpreadSheet.mockClear();
    dataSet = new PivotDataSet(new MockSpreadSheet());
  });

  const getColTest = (msg) => {
    test(`should get correct col ${msg || ''}`, () => {
      expect(dataSet?.getDimensionValues('type')).toEqual([
        '家具产品',
        '办公用品',
      ]);

      expect(
        dataSet?.getDimensionValues('sub_type', { type: '家具产品' }),
      ).toEqual(['办公装饰品', '餐桌']);

      expect(
        dataSet?.getDimensionValues('sub_type', { type: '办公用品' }),
      ).toEqual(['笔', '纸张']);
    });
  };

  const getRowTest = (msg) => {
    test(`should get correct row ${msg || ''}`, () => {
      expect(dataSet?.getDimensionValues('area')).toEqual(['中南', '东北']);

      expect(dataSet?.getDimensionValues('province', { area: '东北' })).toEqual(
        ['辽宁', '吉林'],
      );

      expect(
        dataSet?.getDimensionValues('city', {
          area: '东北',
          province: '辽宁',
        }),
      ).toEqual(['朝阳', '抚顺']);
    });
  };

  const getValueWhenInColTest = (msg) => {
    test(`should get correct values ${msg} and value in col`, () => {
      expect(
        dataSet?.getDimensionValues('$$extra$$', {
          sub_type: '办公装饰品',
          type: '家具产品',
        }),
      ).toEqual(['cost', 'price']);
    });
  };

  const getValueWhenInRowTest = (msg) => {
    test(`should get correct values ${msg} and value in row`, () => {
      expect(
        dataSet?.getDimensionValues('$$extra$$', {
          area: '中南',
          province: '广东',
          city: '广州',
        }),
      ).toEqual(['cost', 'price']);
    });
  };

  const getTestListWhenInCol = (msg) => {
    getColTest(msg);
    getRowTest(msg);
    getValueWhenInColTest(msg);
  };

  const getTestListWhenInRow = (msg) => {
    getColTest(msg);
    getRowTest(msg);
    getValueWhenInRowTest(msg);
  };

  const getTestListWhenInColByMeasure = (msg) => {
    test(`should get correct col data ${msg} and value in col`, () => {
      expect(dataSet?.getDimensionValues('type')).toEqual([
        '办公用品',
        '家具产品',
      ]);

      expect(
        dataSet?.getDimensionValues('sub_type', { type: '家具产品' }),
      ).toEqual(['办公装饰品', '餐桌']);

      expect(
        dataSet?.getDimensionValues('sub_type', { type: '办公用品' }),
      ).toEqual(['笔', '纸张']);
    });

    getValueWhenInColTest(msg);
  };

  const getTestListWhenInRowByMeasure = (msg) => {
    test(`should get correct row data ${msg} and value in row`, () => {
      expect(dataSet?.getDimensionValues('type')).toEqual([
        '办公用品',
        '家具产品',
      ]);

      expect(
        dataSet?.getDimensionValues('sub_type', { type: '家具产品' }),
      ).toEqual(['办公装饰品', '餐桌']);

      expect(
        dataSet?.getDimensionValues('sub_type', { type: '办公用品' }),
      ).toEqual(['笔', '纸张']);
    });

    getValueWhenInRowTest(msg);
  };

  const getDimensionSortTest = (valueInCols: boolean) => {
    describe('Test For Dimension Sort By Method', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            { sortFieldId: 'type', sortMethod: 'DESC' },
            { sortFieldId: 'sub_type', sortMethod: 'ASC' },
            { sortFieldId: 'area', sortMethod: 'DESC' },
            { sortFieldId: 'province', sortMethod: 'DESC' },
            { sortFieldId: 'city', sortMethod: 'ASC' },
            { sortFieldId: '$$extra$$', sortMethod: 'ASC' },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by method';
      if (valueInCols) {
        getTestListWhenInCol(msg);
      } else {
        getTestListWhenInRow(msg);
      }
    });

    describe('Test For Dimension Sort By List', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            { sortFieldId: 'type', sortBy: ['家具产品', '办公用品'] },
            // lack some data
            { sortFieldId: 'sub_type', sortBy: ['办公装饰品', '笔'] },
            // not in same province
            { sortFieldId: 'province', sortBy: ['辽宁', '吉林', '广东'] },
            {
              sortFieldId: 'city',
              sortBy: ['汕头', '广州', '朝阳', '抚顺', '白山', '丹东'],
            },
            { sortFieldId: 'area', sortBy: ['中南', '东北'] },
            { sortFieldId: '$$extra$$', sortBy: ['cost', 'price'] },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by list';
      if (valueInCols) {
        getTestListWhenInCol(msg);
      } else {
        getTestListWhenInRow(msg);
      }
    });

    describe('Test For Dimension Sort By List Have Query', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            { sortFieldId: 'type', sortBy: ['家具产品', '办公用品'] },
            {
              sortFieldId: 'sub_type',
              sortBy: ['办公装饰品', '餐桌'],
              query: { type: '家具产品' },
            },
            {
              sortFieldId: 'sub_type',
              sortBy: ['笔', '纸张'],
              query: { type: '办公用品' },
            },
            { sortFieldId: 'area', sortBy: ['中南', '东北'] },
            {
              sortFieldId: 'province',
              sortBy: ['辽宁', '吉林'],
              query: { area: '东北' },
            },
            {
              sortFieldId: 'city',
              sortBy: ['朝阳', '抚顺'],
              query: {
                area: '东北',
                province: '辽宁',
              },
            },
            { sortFieldId: '$$extra$$', sortBy: ['cost', 'price'] },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by list and have query';
      if (valueInCols) {
        getTestListWhenInCol(msg);
      } else {
        getTestListWhenInRow(msg);
      }
    });

    describe('Test For Dimension Sort By Measure (Row And Col)', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            {
              sortFieldId: 'city',
              sortMethod: 'ASC',
              sortByMeasure: 'cost',
              query: {
                type: '办公用品',
                sub_type: '纸张',
                $$extra$$: 'cost',
                area: '东北',
                province: '吉林',
              },
            },
            {
              sortFieldId: 'city',
              sortMethod: 'ASC',
              sortByMeasure: 'price',
              query: {
                type: '办公用品',
                sub_type: '笔',
                $$extra$$: 'price',
                area: '东北',
                province: '辽宁',
              },
            },
            {
              sortFieldId: 'city',
              sortMethod: 'ASC',
              sortByMeasure: 'price',
              query: {
                type: '办公用品',
                sub_type: '笔',
                $$extra$$: 'price',
                area: '中南',
                province: '广东',
              },
            },
            {
              sortFieldId: 'sub_type',
              sortMethod: 'DESC',
              sortByMeasure: 'price',
              query: {
                type: '办公用品',
                $$extra$$: 'price',
                area: '东北',
                province: '吉林',
                city: '白山',
              },
            },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by measure';
      if (valueInCols) {
        getTestListWhenInColByMeasure(msg);
      } else {
        getTestListWhenInRowByMeasure(msg);
      }
    });

    describe('Test For Dimension Sort By Measure If Lack Data and SortMethod is ASC', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            {
              sortFieldId: 'city',
              sortMethod: 'ASC',
              sortByMeasure: 'cost',
              query: {
                type: '办公用品',
                sub_type: '笔',
                $$extra$$: 'cost',
                area: '中南',
                province: '广东',
              },
            },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      test('should get correct row city when sort by measure if lack data', () => {
        expect(
          dataSet?.getDimensionValues('city', {
            area: '中南',
            province: '广东',
          }),
        ).toEqual(['广州', '汕头']);
      });
    });

    describe('Test For Dimension Sort By Measure Which Is TOTAL_VALUE', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            {
              sortFieldId: 'type',
              sortMethod: 'DESC',
              sortByMeasure: '$$total$$',
              query: {
                $$extra$$: 'price',
              },
            },
            {
              sortFieldId: 'sub_type',
              sortMethod: 'DESC',
              sortByMeasure: '$$total$$',
              query: {
                $$extra$$: 'cost',
                area: '东北',
                province: '吉林',
              },
            },
            {
              sortFieldId: 'area',
              sortMethod: 'ASC',
              sortByMeasure: '$$total$$',
              query: {
                $$extra$$: 'price',
              },
            },
            {
              sortFieldId: 'province',
              sortMethod: 'DESC',
              sortByMeasure: '$$total$$',
              query: {
                $$extra$$: 'cost',
              },
            },
            {
              sortFieldId: 'city',
              sortMethod: 'DESC',
              sortByMeasure: '$$total$$',
              query: {
                $$extra$$: 'cost',
              },
            },
            {
              sortFieldId: 'city',
              sortMethod: 'DESC',
              sortByMeasure: '$$total$$',
              query: {
                $$extra$$: 'cost',
                type: '办公用品',
              },
            },
          ],
          totalData: SORT_DATA.totalData,
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by measure which is $$total$$';
      if (valueInCols) {
        getColTest(msg);
        getRowTest(msg);
      }
    });

    describe('Test For Dimension Sort By SortFunc', () => {
      beforeEach(() => {
        const sortFunc = (params, isAsc = true) => {
          const { data } = params;
          return (data as string[])?.sort((a, b) =>
            isAsc ? a?.localeCompare(b) : b?.localeCompare(a),
          );
        };
        dataCfg = {
          ...dataCfg,
          sortParams: [
            {
              sortFieldId: 'type',
              sortFunc: (params) => sortFunc(params),
            },
            {
              sortFieldId: 'sub_type',
              sortFunc: (params) => sortFunc(params),
            },
            {
              sortFieldId: 'area',
              sortFunc: (params) => sortFunc(params, false),
            },
            {
              sortFieldId: 'province',
              sortFunc: (params) => sortFunc(params, false),
            },
            {
              sortFieldId: 'city',
              sortFunc: (params) => sortFunc(params),
            },
            {
              sortFieldId: '$$extra$$',
              sortFunc: (params) => sortFunc(params),
            },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by sortFunc';
      if (valueInCols) {
        getTestListWhenInColByMeasure(msg);
      } else {
        getTestListWhenInRowByMeasure(msg);
      }
    });

    describe('Test For Dimension Sort By Measure And SortFunc', () => {
      beforeEach(() => {
        dataCfg = {
          ...dataCfg,
          sortParams: [
            {
              sortFieldId: 'city',
              sortByMeasure: 'price',
              sortFunc: function (params) {
                const { data, sortByMeasure, sortFieldId } = params || {};
                return data
                  ?.sort((a, b) => b[sortByMeasure] - a[sortByMeasure])
                  ?.map((item) => item[sortFieldId]);
              },
              query: { type: '家具产品', sub_type: '餐桌', $$extra$$: 'price' },
            },
            {
              sortFieldId: 'sub_type',
              sortByMeasure: 'cost',
              sortFunc: function (params) {
                const { data, sortByMeasure, sortFieldId } = params || {};
                return data
                  ?.sort((a, b) => b[sortByMeasure] - a[sortByMeasure])
                  ?.map((item) => item[sortFieldId]);
              },
              query: { type: '东北', sub_type: '辽宁', city: '抚顺' },
            },
          ],
        };
        dataSet.setDataCfg(dataCfg);
      });
      const msg = 'when sort by measure and sortFunc';
      if (valueInCols) {
        getTestListWhenInColByMeasure(msg);
      } else {
        getTestListWhenInRowByMeasure(msg);
      }
    });
  };

  describe('Test For Value In Cols And Row Gird Hierarchy', () => {
    beforeEach(() => {
      dataCfg = {
        data: SORT_DATA.originData,
        meta: SORT_DATA.meta,
        totalData: SORT_DATA.totalData,
        fields: {
          ...SORT_DATA.fields,
          valueInCols: true,
        },
      };
      dataSet.setDataCfg(dataCfg);
    });

    getDimensionSortTest(true);
  });

  describe('Test For Value In Rows And Row Gird Hierarchy', () => {
    beforeEach(() => {
      dataCfg = {
        data: SORT_DATA.originData,
        meta: SORT_DATA.meta,
        totalData: SORT_DATA.totalData,
        fields: {
          ...SORT_DATA.fields,
          valueInCols: false,
        },
      };
      dataSet.setDataCfg(dataCfg);
    });
    getDimensionSortTest(false);
  });

  describe('Test For Row Tree Hierarchy', () => {
    beforeEach(() => {
      dataCfg = {
        ...dataCfg,
        sortParams: [
          { sortFieldId: 'type', sortMethod: 'DESC' },
          { sortFieldId: 'sub_type', sortMethod: 'ASC' },
          { sortFieldId: 'area', sortMethod: 'DESC' },
          { sortFieldId: 'province', sortMethod: 'DESC' },
          { sortFieldId: 'city', sortMethod: 'ASC' },
          { sortFieldId: '$$extra$$', sortMethod: 'ASC' },
        ],
      };
      dataSet.setDataCfg(dataCfg);
    });

    test('should get correct row when row is tree hierarchy', () => {
      const data1 = filterUndefined(
        getIntersections(
          [...(dataSet as PivotDataSet)?.sortedDimensionValues?.get('area')],
          ['东北', '中南'],
        ),
      );
      expect(data1).toEqual(['中南', '东北']);

      const data2 = filterUndefined(
        getIntersections(
          [
            ...(dataSet as PivotDataSet)?.sortedDimensionValues?.get(
              'province',
            ),
          ],
          ['吉林', '辽宁'],
        ),
      );
      expect(data2).toEqual(['辽宁', '吉林']);

      const data3 = filterUndefined(
        getIntersections(
          [...(dataSet as PivotDataSet)?.sortedDimensionValues?.get('city')],
          ['抚顺', '朝阳'],
        ),
      );
      expect(data3).toEqual(['朝阳', '抚顺']);
    });
  });
});