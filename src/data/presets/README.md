# 预设场景模板

这个目录包含了 iBeacon 模拟器的预设场景模板，已从 Vue 组件中抽离为独立的 JSON 文件以提高可维护性。

## 文件结构

- `hospital.json` - 医院环境预设
- `office.json` - 办公室环境预设
- `warehouse.json` - 仓库环境预设
- `index.ts` - 导出所有预设的 TypeScript 文件

## 预设场景格式

每个预设场景包含以下结构：

```json
{
  "name": "场景名称",
  "description": "场景描述",
  "beacons": [
    {
      "id": 1,
      "type": "beacon",
      "x": 100,
      "y": 100,
      "z": 3,
      "txPower": -59
    }
  ],
  "clients": [
    {
      "id": 1,
      "type": "client",
      "x": 200,
      "y": 200,
      "z": 0.8
    }
  ],
  "settings": {
    "scale": 50,
    "beaconHeight": 3,
    "clientHeight": 0.8,
    "beaconN": 2.5,
    "clientRssiThreshold": -85,
    "showCoverageArea": false,
    "coverageStep": 10
  }
}
```

## 使用方法

在 Vue 组件中通过以下方式导入和使用：

```typescript
import { presetScenes } from '~/data/presets'
import { usePresetScenes } from './composables/usePresetScenes'

const { loadPresetScene } = usePresetScenes()

// 加载预设场景
loadPresetScene('hospital')
```

## 添加新预设

1. 创建新的 JSON 文件（如 `factory.json`）
2. 按照上述格式定义场景数据
3. 在 `index.ts` 中导入并导出新预设
4. 在组件中即可使用新的预设场景
