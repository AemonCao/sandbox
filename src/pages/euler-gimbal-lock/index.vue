<script setup lang="ts">
import type { EulerAnglesState, PresetOption, SceneTheme } from './composables/types'
import { NAlert, NButton, NCard, NDivider, NDrawer, NDrawerContent, NSlider, NTag } from 'naive-ui'
import AxisDiagnosticCanvas from '~/components/euler-gimbal-lock/AxisDiagnosticCanvas.vue'
import GimbalSceneCanvas from '~/components/euler-gimbal-lock/GimbalSceneCanvas.vue'
import { computeAxisAlignment, computeGimbalStatus } from './composables/gimbalMath'

const isMobile = useMediaQuery('(max-width: 767px)')
const drawerVisible = ref(false)

const angles = reactive<EulerAnglesState>({
  yaw: 30,
  pitch: 18,
  roll: -20,
})

const presets: PresetOption[] = [
  {
    key: 'default',
    label: '默认姿态',
    description: '三个旋转轴保持明显分离，适合观察云台分层。',
    angles: { yaw: 30, pitch: 18, roll: -20 },
  },
  {
    key: 'warning',
    label: '接近死锁',
    description: '把 pitch 推到 82°，观察 yaw 轴与 roll 轴快速趋同。',
    angles: { yaw: 30, pitch: 82, roll: 25 },
  },
  {
    key: 'locked',
    label: '进入死锁',
    description: '把 pitch 推到 90°，此时 yaw 与 roll 变成同一个自由度。',
    angles: { yaw: 30, pitch: 90, roll: 25 },
  },
]

const status = computed(() => computeGimbalStatus(angles))
const axisAlignment = computed(() => computeAxisAlignment(angles))
const alignmentPercent = computed(() => Math.round(status.value.alignment * 100))

const sceneTheme = computed<SceneTheme>(() => {
  if (isDark.value) {
    return {
      background: '#08111f',
      panelOverlay: 'rgba(8, 17, 31, 0.84)',
      gridPrimary: '#294266',
      gridSecondary: '#18263f',
      payload: '#7dd3fc',
      payloadAccent: '#fb923c',
      ringYaw: '#60a5fa',
      ringPitch: '#2dd4bf',
      ringRoll: '#fbbf24',
      lineYaw: '#93c5fd',
      linePitch: '#5eead4',
      lineRoll: '#fdba74',
      warning: '#fb923c',
      locked: '#f87171',
      neutral: '#64748b',
    }
  }

  return {
    background: '#f8fbff',
    panelOverlay: 'rgba(248, 251, 255, 0.86)',
    gridPrimary: '#c9d8f2',
    gridSecondary: '#e6eef9',
    payload: '#2563eb',
    payloadAccent: '#f97316',
    ringYaw: '#2563eb',
    ringPitch: '#0f766e',
    ringRoll: '#ea580c',
    lineYaw: '#2563eb',
    linePitch: '#0f766e',
    lineRoll: '#ea580c',
    warning: '#ea580c',
    locked: '#dc2626',
    neutral: '#94a3b8',
  }
})

const statusClass = computed(() => {
  if (status.value.severity === 'locked')
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200'
  if (status.value.severity === 'warning')
    return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-200'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200'
})

function applyPreset(preset: PresetOption) {
  angles.yaw = preset.angles.yaw
  angles.pitch = preset.angles.pitch
  angles.roll = preset.angles.roll
  drawerVisible.value = false
}

function resetAngles() {
  applyPreset(presets[0])
}

function angleLabel(value: number) {
  return `${value.toFixed(0)}°`
}
</script>

<template>
  <div
    class="p-4 min-h-full transition-colors duration-300 from-slate-50 to-orange-50 via-sky-50 bg-gradient-to-br md:p-6 dark:from-slate-950 dark:to-slate-950 dark:via-slate-900"
  >
    <div class="mx-auto flex flex-col gap-4 max-w-7xl md:gap-6">
      <section
        class="p-5 border border-white/70 rounded-3xl bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] overflow-hidden backdrop-blur md:p-7 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-[0_18px_60px_rgba(2,6,23,0.45)]"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-xs text-sky-600 tracking-[0.32em] font-semibold uppercase dark:text-sky-300">
              Three.js / 欧拉角 / 教学演示
            </p>
            <h1 class="text-3xl text-slate-900 leading-tight font-black mt-2 md:text-5xl dark:text-white">
              欧拉角万向死锁演示台
            </h1>
            <p class="text-sm text-slate-600 leading-7 mt-3 max-w-2xl md:text-base dark:text-slate-300">
              主场景展示三层云台如何依次承接 yaw / pitch / roll，右侧诊断场景专门观察 yaw 轴与内层 roll 轴的重合过程。
              当 pitch 接近 ±90° 时，这两个轴会趋于同向，你会直接看到一个自由度被压扁。
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <NTag round :bordered="false" type="info">
              欧拉顺序：{{ 'YXZ' }}
            </NTag>
            <NTag round :bordered="false" type="warning">
              锁死点：pitch ≈ ±90°
            </NTag>
            <NTag round :bordered="false" :type="status.severity === 'locked' ? 'error' : status.severity === 'warning' ? 'warning' : 'success'">
              当前状态：{{ status.title }}
            </NTag>
          </div>
        </div>
      </section>

      <section
        :class="statusClass"
        class="p-4 border rounded-3xl shadow-sm transition-colors duration-300 md:p-5"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-bold md:text-xl">
              {{ status.title }}
            </h2>
            <p class="text-sm leading-6 mt-2 md:text-base">
              {{ status.summary }}
            </p>
            <p class="text-xs leading-6 mt-2 opacity-85 md:text-sm">
              {{ status.detail }}
            </p>
          </div>

          <div class="text-sm gap-3 grid min-w-[280px] md:grid-cols-2">
            <div class="p-3 rounded-2xl bg-white/65 dark:bg-black/20">
              <div class="text-xs opacity-70">
                pitch 到锁死点
              </div>
              <div class="text-2xl font-bold mt-1">
                {{ status.pitchDistanceDeg.toFixed(1) }}°
              </div>
            </div>
            <div class="p-3 rounded-2xl bg-white/65 dark:bg-black/20">
              <div class="text-xs opacity-70">
                yaw / roll 轴夹角
              </div>
              <div class="text-2xl font-bold mt-1">
                {{ status.axisAngleDeg.toFixed(1) }}°
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="gap-4 grid md:gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside v-if="!isMobile" class="flex flex-col gap-4">
          <NCard size="large" :bordered="false" embedded>
            <template #header>
              角度控制
            </template>

            <div class="flex flex-col gap-5">
              <div>
                <div class="text-sm text-slate-700 font-medium mb-2 flex items-center justify-between dark:text-slate-200">
                  <span>Yaw</span>
                  <span class="font-mono">{{ angleLabel(angles.yaw) }}</span>
                </div>
                <NSlider v-model:value="angles.yaw" :min="-180" :max="180" :step="1" />
              </div>

              <div>
                <div class="text-sm text-slate-700 font-medium mb-2 flex items-center justify-between dark:text-slate-200">
                  <span>Pitch</span>
                  <span class="font-mono">{{ angleLabel(angles.pitch) }}</span>
                </div>
                <NSlider v-model:value="angles.pitch" :min="-120" :max="120" :step="1" />
              </div>

              <div>
                <div class="text-sm text-slate-700 font-medium mb-2 flex items-center justify-between dark:text-slate-200">
                  <span>Roll</span>
                  <span class="font-mono">{{ angleLabel(angles.roll) }}</span>
                </div>
                <NSlider v-model:value="angles.roll" :min="-180" :max="180" :step="1" />
              </div>

              <div class="flex flex-wrap gap-2">
                <NButton strong secondary type="primary" @click="resetAngles">
                  重置角度
                </NButton>
                <NButton
                  v-for="preset in presets"
                  :key="preset.key"
                  tertiary
                  type="default"
                  @click="applyPreset(preset)"
                >
                  {{ preset.label }}
                </NButton>
              </div>
            </div>

            <NDivider />

            <div class="text-sm text-slate-600 leading-6 flex flex-col gap-3 dark:text-slate-300">
              <div
                v-for="preset in presets"
                :key="`${preset.key}-desc`"
                class="p-3 border border-slate-200 rounded-2xl dark:border-slate-800"
              >
                <div class="text-sm text-slate-800 font-semibold dark:text-slate-100">
                  {{ preset.label }}
                </div>
                <div class="text-xs mt-1 opacity-80">
                  {{ preset.description }}
                </div>
              </div>
            </div>
          </NCard>

          <NCard size="large" :bordered="false" embedded>
            <template #header>
              轴重合诊断
            </template>

            <div class="text-sm text-slate-600 flex flex-col gap-3 dark:text-slate-300">
              <div class="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/70">
                <div class="text-xs opacity-70">
                  轴重合度
                </div>
                <div class="mt-2 flex items-end justify-between">
                  <span class="text-3xl text-slate-900 font-black dark:text-white">
                    {{ alignmentPercent }}%
                  </span>
                  <span class="text-xs font-mono">
                    angle {{ axisAlignment.angleDeg.toFixed(1) }}°
                  </span>
                </div>
                <div class="mt-3 rounded-full bg-slate-200 h-2 overflow-hidden dark:bg-slate-700">
                  <div
                    class="rounded-full h-full transition-all duration-300"
                    :style="{
                      width: `${alignmentPercent}%`,
                      background: status.severity === 'locked'
                        ? 'linear-gradient(90deg, #f87171, #dc2626)'
                        : status.severity === 'warning'
                          ? 'linear-gradient(90deg, #fb923c, #ea580c)'
                          : 'linear-gradient(90deg, #2dd4bf, #0f766e)',
                    }"
                  />
                </div>
              </div>

              <ul class="text-sm leading-7 pl-4">
                <li>外层 yaw 轴固定为世界 Y 轴。</li>
                <li>内层 roll 轴会随着 yaw 与 pitch 共同转动。</li>
                <li>当 pitch 趋近 ±90° 时，roll 轴会贴到 yaw 轴上。</li>
              </ul>
            </div>
          </NCard>
        </aside>

        <main class="flex flex-col gap-4 md:gap-6">
          <div v-if="isMobile" class="flex gap-3 items-center justify-between">
            <div>
              <div class="text-sm text-slate-900 font-semibold dark:text-white">
                手机端控制区
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400">
                保持画布优先，参数收进底部面板。
              </div>
            </div>
            <NButton strong type="primary" @click="drawerVisible = true">
              调整角度
            </NButton>
          </div>

          <div class="gap-4 grid md:gap-6 lg:grid-cols-2">
            <NCard size="large" :bordered="false" embedded content-style="padding: 0;">
              <template #header>
                主场景：三层云台
              </template>
              <template #header-extra>
                <span class="text-xs text-slate-500 dark:text-slate-400">拖拽旋转 / 双指缩放</span>
              </template>

              <div class="h-[360px] lg:h-[460px] sm:h-[420px]">
                <GimbalSceneCanvas :angles="angles" :status="status" :theme="sceneTheme" />
              </div>

              <div
                class="text-sm text-slate-600 leading-6 p-4 border-t border-slate-200 bg-white/70 dark:text-slate-300 dark:border-slate-800 dark:bg-slate-900/65"
              >
                蓝色为 yaw，青绿色为 pitch，橙色为 roll。进入锁死区后，外层与内层轴会被同色高亮，提示它们已经共享自由度。
              </div>
            </NCard>

            <NCard size="large" :bordered="false" embedded content-style="padding: 0;">
              <template #header>
                副场景：轴重合诊断
              </template>
              <template #header-extra>
                <span class="text-xs text-slate-500 dark:text-slate-400">观察轴向而非模型外形</span>
              </template>

              <div class="h-[360px] lg:h-[460px] sm:h-[420px]">
                <AxisDiagnosticCanvas :angles="angles" :status="status" :theme="sceneTheme" />
              </div>

              <div
                class="text-sm text-slate-600 leading-6 p-4 border-t border-slate-200 bg-white/70 dark:text-slate-300 dark:border-slate-800 dark:bg-slate-900/65"
              >
                蓝色箭头是外层 yaw 轴，橙色箭头是内层 roll 轴。它们越平行，欧拉角控制就越接近退化。
              </div>
            </NCard>
          </div>

          <NAlert title="为什么会锁死？" type="info" :show-icon="false">
            欧拉角是按顺序在局部轴上叠加旋转。对本页使用的 <strong>YXZ</strong> 顺序来说，pitch 到达 ±90° 后，
            yaw 和 roll 会围绕几乎同一根轴工作，于是原本三个独立自由度塌成了两个。
          </NAlert>
        </main>
      </div>
    </div>

    <NDrawer v-model:show="drawerVisible" placement="bottom" :height="540">
      <NDrawerContent title="角度控制" closable>
        <div class="pb-4 flex flex-col gap-5">
          <div>
            <div class="text-sm text-slate-700 font-medium mb-2 flex items-center justify-between dark:text-slate-200">
              <span>Yaw</span>
              <span class="font-mono">{{ angleLabel(angles.yaw) }}</span>
            </div>
            <NSlider v-model:value="angles.yaw" :min="-180" :max="180" :step="1" />
          </div>

          <div>
            <div class="text-sm text-slate-700 font-medium mb-2 flex items-center justify-between dark:text-slate-200">
              <span>Pitch</span>
              <span class="font-mono">{{ angleLabel(angles.pitch) }}</span>
            </div>
            <NSlider v-model:value="angles.pitch" :min="-120" :max="120" :step="1" />
          </div>

          <div>
            <div class="text-sm text-slate-700 font-medium mb-2 flex items-center justify-between dark:text-slate-200">
              <span>Roll</span>
              <span class="font-mono">{{ angleLabel(angles.roll) }}</span>
            </div>
            <NSlider v-model:value="angles.roll" :min="-180" :max="180" :step="1" />
          </div>

          <div class="flex flex-wrap gap-2">
            <NButton strong secondary type="primary" @click="resetAngles">
              重置角度
            </NButton>
            <NButton
              v-for="preset in presets"
              :key="`${preset.key}-mobile`"
              tertiary
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </NButton>
          </div>

          <div class="text-sm text-slate-600 leading-6 p-4 rounded-2xl bg-slate-100 dark:text-slate-300 dark:bg-slate-800">
            <div class="text-sm text-slate-900 font-semibold dark:text-white">
              当前诊断
            </div>
            <div class="mt-2">
              轴重合度 {{ alignmentPercent }}%，yaw / roll 轴夹角 {{ axisAlignment.angleDeg.toFixed(1) }}°。
            </div>
            <div class="mt-2">
              {{ status.summary }}
            </div>
          </div>
        </div>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '欧拉角万向死锁'
  description: '使用 Three.js 可视化欧拉角在 pitch 接近 ±90° 时出现的万向死锁与轴重合过程'
  tags: ['Three.js', '3D', '数学', '教学演示']
</route>
