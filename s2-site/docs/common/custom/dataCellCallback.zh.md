---
title: 自定义单元格
order: 2
---

## DataCellCallback1

```js
DataCellCallback = (viewMeta: ViewMeta, s2: Spreadsheet) => G.Group;
```

功能描述：自定义数值单元格，[ViewMeta](#viewmeta)

`markdown:docs/common/view-meta.zh.md`

`markdown:docs/common/custom/cellCallBack.zh.md`

## CornerHeaderCallback

```js
CornerHeaderCallback = (parent: S2CellType, spreadsheet: SpreadSheet, ...restOptions: unknown[]) => void;
```

功能描述：自定义角头

| 参数 | 类型 | 必选  | 默认值 | 功能描述 |
| --- | --- | :-:  | --- | --- |
| parent | [S2CellType](#s2celltype) | ✓ |  |   父级单元格 |
| spreadsheet | [SpreadSheet](#spreadsheet) | ✓   |  | 表类实例，可以访问任意的配置信息 |
| restOptions | `unknown[]` |  |  |   不定参数，传递额外的信息 |
