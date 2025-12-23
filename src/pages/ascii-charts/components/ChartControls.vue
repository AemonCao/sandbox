<script setup lang="ts">
import type { BarStyle, BorderStyle, ChartConfig, ChartType, GridStyle, LegendOrientation, LegendPosition, PieLabelStyle } from '../composables/types'

const props = defineProps<{
  config: ChartConfig
  isMobile: boolean
  fontFamily: string
  customSize: { width: number, height: number } | null
}>()

const emit = defineEmits<{
  'update:type': [type: ChartType]
  'update:showAxis': [value: boolean]
  'update:showGrid': [value: boolean]
  'update:showHorizontalGrid': [value: boolean]
  'update:showVerticalGrid': [value: boolean]
  'update:gridStyle': [value: GridStyle]
  'update:barStyle': [value: BarStyle]
  'update:pieLabelStyle': [value: PieLabelStyle]
  'update:legendPosition': [value: LegendPosition]
  'update:legendOrientation': [value: LegendOrientation]
  'update:showBorder': [value: boolean]
  'update:borderStyle': [value: BorderStyle]
  'update:fontFamily': [value: string]
  'update:customSize': [width: number, height: number]
  'resetSize': []
  'randomize': []
}>()

const chartTypes: Array<{ value: ChartType, label: string }> = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'timeline', label: '时间轴' },
  { value: 'waterfall', label: '瀑布图' },
  { value: 'pie', label: '饼图' },
]

const fontOptions = [
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'Monaco, monospace', label: 'Monaco' },
  { value: 'SF Mono, monospace', label: 'SF Mono' },
  { value: 'Menlo, monospace', label: 'Menlo' },
  { value: 'Roboto Mono, monospace', label: 'Roboto Mono' },
  { value: 'Fira Code, monospace', label: 'Fira Code' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
  { value: 'Source Code Pro, monospace', label: 'Source Code Pro' },
  { value: 'IBM Plex Mono, monospace', label: 'IBM Plex Mono' },
]

const availableFonts = ref<Set<string>>(new Set())

/**
 * 检测字体是否可用
 */
async function checkFontAvailability(fontFamily: string) {
  try {
    const font = fontFamily.split(',')[0].trim().replace(/['"]/g, '')
    await document.fonts.load(`12px "${font}"`)
    return document.fonts.check(`12px "${font}"`)
  }
  catch {
    return false
  }
}

/**
 * 检测所有字体
 */
onMounted(async () => {
  for (const font of fontOptions) {
    const isAvailable = await checkFontAvailability(font.value)
    if (isAvailable) {
      availableFonts.value.add(font.value)
    }
  }
})

type GridThickness = 'thin' | 'thick'
type GridDensity = 'medium' | 'dense' | 'solid'

const gridThicknessOptions: Array<{ value: GridThickness, label: string }> = [
  { value: 'thin', label: '细 (┄┈─)' },
  { value: 'thick', label: '粗 (┅┉━)' },
]

const gridDensityOptions: Array<{ value: GridDensity, label: string }> = [
  { value: 'medium', label: '中等 (┄┅)' },
  { value: 'dense', label: '密集 (┈┉)' },
  { value: 'solid', label: '实线 (─━)' },
]

/**
 * 从 GridStyle 解析出粗细和密度
 */
function parseGridStyle(style: GridStyle): { thickness: GridThickness, density: GridDensity } {
  const [thickness, density] = style.split('-') as [GridThickness, GridDensity]
  return { thickness, density }
}

/**
 * 组合粗细和密度为 GridStyle
 */
function combineGridStyle(thickness: GridThickness, density: GridDensity): GridStyle {
  return `${thickness}-${density}` as GridStyle
}

const currentGridStyle = computed(() => parseGridStyle(props.config.style.gridStyle || 'thin-medium'))

function updateGridThickness(thickness: GridThickness) {
  const newStyle = combineGridStyle(thickness, currentGridStyle.value.density)
  emit('update:gridStyle', newStyle)
}

function updateGridDensity(density: GridDensity) {
  const newStyle = combineGridStyle(currentGridStyle.value.thickness, density)
  emit('update:gridStyle', newStyle)
}

const barStyleOptions: Array<{ value: BarStyle, label: string }> = [
  { value: 'solid', label: '实心 (█)' },
  { value: 'shadow', label: '阴影 (▓)' },
  { value: 'hollow', label: '空心 (░)' },
  { value: 'bold-hollow', label: '粗边空心 (▒)' },
  { value: 'double-line', label: '双横线 (║)' },
  { value: 'rounded', label: '圆角 (▐)' },
]

const pieLabelStyleOptions: Array<{ value: PieLabelStyle, label: string }> = [
  { value: 'none', label: '无标签' },
  { value: 'center', label: '中心标签' },
  { value: 'line', label: '指示线' },
]

const legendPositionOptions: Array<{ value: LegendPosition, label: string }> = [
  { value: 'top', label: '上' },
  { value: 'bottom', label: '下' },
  { value: 'left', label: '左' },
  { value: 'right', label: '右' },
]

const legendOrientationOptions: Array<{ value: LegendOrientation, label: string }> = [
  { value: 'horizontal', label: '横向' },
  { value: 'vertical', label: '纵向' },
]

const borderStyleOptions: Array<{ value: BorderStyle, label: string }> = [
  { value: 'thin', label: '细线 (─│)' },
  { value: 'thick', label: '粗线 (━┃)' },
  { value: 'double', label: '双线 (═║)' },
  { value: 'rounded', label: '圆角 (╭╮)' },
]

const localWidth = ref(props.config.style.width)
const localHeight = ref(props.config.style.height)

watch(() => props.config.style.width, (val) => {
  localWidth.value = val
})
watch(() => props.config.style.height, (val) => {
  localHeight.value = val
})
</script>

<template>
  <div
    p-4 rounded-lg bg-white shadow-lg space-y-4 md:p-6 dark:bg-gray-800
  >
    <h2 text-lg font-bold mb-4 md:text-xl>
      图表配置
    </h2>

    <!-- 图表类型选择 -->
    <div>
      <label text-sm font-medium mb-2 block>图表类型</label>
      <NRadioGroup
        :value="config.type"
        @update:value="emit('update:type', $event)"
      >
        <NSpace>
          <NRadio
            v-for="item in chartTypes"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <!-- 字体选择 -->
    <div>
      <label text-sm font-medium mb-2 block>字体</label>
      <NRadioGroup
        :value="fontFamily"
        @update:value="emit('update:fontFamily', $event)"
      >
        <NSpace>
          <NRadio
            v-for="item in fontOptions"
            :key="item.value"
            :value="item.value"
            :disabled="!availableFonts.has(item.value)"
          >
            {{ item.label }}
            <span v-if="!availableFonts.has(item.value)" text-xs text-gray-400 ml-1>(不可用)</span>
          </NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <!-- 柱状图样式 -->
    <div v-if="config.type === 'bar'">
      <label text-sm font-medium mb-2 block>柱子样式</label>
      <NRadioGroup
        :value="(config.data as any).barStyle || 'solid'"
        @update:value="emit('update:barStyle', $event)"
      >
        <NSpace vertical>
          <NRadio
            v-for="item in barStyleOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <!-- 饼图标签样式 -->
    <div v-if="config.type === 'pie'">
      <label text-sm font-medium mb-2 block>标签样式</label>
      <NRadioGroup
        :value="(config.data as any).labelStyle || 'none'"
        @update:value="emit('update:pieLabelStyle', $event)"
      >
        <NSpace vertical>
          <NRadio
            v-for="item in pieLabelStyleOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <!-- 饼图图例配置 -->
    <div v-if="config.type === 'pie'">
      <label text-sm font-medium mb-2 block>图例位置</label>
      <NRadioGroup
        :value="(config.data as any).legendPosition || 'bottom'"
        @update:value="emit('update:legendPosition', $event)"
      >
        <NSpace>
          <NRadio
            v-for="item in legendPositionOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </NRadio>
        </NSpace>
      </NRadioGroup>

      <label text-sm font-medium mb-2 mt-3 block>图例方向</label>
      <NRadioGroup
        :value="(config.data as any).legendOrientation || 'vertical'"
        @update:value="emit('update:legendOrientation', $event)"
      >
        <NSpace>
          <NRadio
            v-for="item in legendOrientationOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </NRadio>
        </NSpace>
      </NRadioGroup>
    </div>

    <!-- 显示选项 -->
    <div v-if="config.type === 'line' || config.type === 'bar'" space-y-2>
      <NCheckbox
        :checked="config.style.showAxis"
        @update:checked="emit('update:showAxis', $event)"
      >
        显示坐标轴
      </NCheckbox>

      <NCheckbox
        :checked="config.style.showGrid"
        @update:checked="emit('update:showGrid', $event)"
      >
        显示网格
      </NCheckbox>

      <div v-if="config.style.showGrid" ml-6 space-y-2>
        <NCheckbox
          :checked="config.style.showHorizontalGrid"
          @update:checked="emit('update:showHorizontalGrid', $event)"
        >
          横向网格
        </NCheckbox>

        <NCheckbox
          v-if="config.type === 'line'"
          :checked="config.style.showVerticalGrid"
          @update:checked="emit('update:showVerticalGrid', $event)"
        >
          纵向网格
        </NCheckbox>

        <div mt-2>
          <label text-xs font-medium mb-1 block>网格粗细</label>
          <NRadioGroup
            :value="currentGridStyle.thickness"
            @update:value="updateGridThickness"
          >
            <NSpace>
              <NRadio
                v-for="item in gridThicknessOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </div>

        <div mt-2>
          <label text-xs font-medium mb-1 block>网格密度</label>
          <NRadioGroup
            :value="currentGridStyle.density"
            @update:value="updateGridDensity"
          >
            <NSpace>
              <NRadio
                v-for="item in gridDensityOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </div>
      </div>
    </div>

    <!-- 边框配置 -->
    <div space-y-2>
      <NCheckbox
        :checked="config.style.showBorder || false"
        @update:checked="emit('update:showBorder', $event)"
      >
        显示外框
      </NCheckbox>

      <div v-if="config.style.showBorder" ml-6>
        <label text-xs font-medium mb-1 block>外框样式</label>
        <NRadioGroup
          :value="config.style.borderStyle || 'thin'"
          @update:value="emit('update:borderStyle', $event)"
        >
          <NSpace vertical>
            <NRadio
              v-for="item in borderStyleOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
      </div>
    </div>

    <!-- 随机数据按钮 -->
    <NButton
      type="primary"
      block
      @click="emit('randomize')"
    >
      随机生成数据
    </NButton>

    <!-- 尺寸信息 -->
    <div
      text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:text-gray-400 dark:border-gray-700
    >
      <div mb-2 flex items-center justify-between>
        <label text-sm font-medium>图表尺寸</label>
        <NButton
          v-if="customSize"
          size="tiny"
          @click="emit('resetSize')"
        >
          重置
        </NButton>
      </div>
      <div space-y-2>
        <div>
          <label text-xs mb-1 block>宽度: {{ localWidth }} 字符</label>
          <NSlider
            v-model:value="localWidth"
            :min="30"
            :max="150"
            :step="5"
            @update:value="emit('update:customSize', localWidth, localHeight)"
          />
        </div>
        <div>
          <label text-xs mb-1 block>高度: {{ localHeight }} 行</label>
          <NSlider
            v-model:value="localHeight"
            :min="15"
            :max="50"
            :step="5"
            @update:value="emit('update:customSize', localWidth, localHeight)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
