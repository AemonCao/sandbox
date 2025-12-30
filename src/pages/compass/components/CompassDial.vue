<script setup lang="ts">
interface Props {
  heading: number
}

const props = defineProps<Props>()

const directions = [
  { angle: 0, name: '北', abbr: 'N' },
  { angle: 90, name: '东', abbr: 'E' },
  { angle: 180, name: '南', abbr: 'S' },
  { angle: 270, name: '西', abbr: 'W' },
]

const rotation = ref(0)
const lastHeading = ref(0)

/**
 * 处理跨越0°的旋转，避免反转
 */
watch(() => props.heading, (newHeading) => {
  const diff = newHeading - lastHeading.value
  if (diff > 180) {
    rotation.value -= 360 - diff
  }
  else if (diff < -180) {
    rotation.value += 360 + diff
  }
  else {
    rotation.value -= diff
  }
  lastHeading.value = newHeading
}, { immediate: true })

/**
 * 获取当前方向名称
 */
const currentDirection = computed(() => {
  const normalized = ((props.heading % 360) + 360) % 360
  const closest = directions.reduce((prev, curr) => {
    const prevDiff = Math.min(
      Math.abs(prev.angle - normalized),
      360 - Math.abs(prev.angle - normalized),
    )
    const currDiff = Math.min(
      Math.abs(curr.angle - normalized),
      360 - Math.abs(curr.angle - normalized),
    )
    return currDiff < prevDiff ? curr : prev
  })
  return closest.name
})
</script>

<template>
  <div flex flex-col items-center justify-center>
    <div h-80 w-80 pointer-events-none relative>
      <svg viewBox="0 0 320 320" h-full w-full overflow-visible>
        <g
          :style="{ transform: `rotate(${rotation}deg)`, transformOrigin: '160px 160px' }"
          transition-transform duration-300 ease-out
        >
          <circle cx="160" cy="160" r="150" fill="none" stroke="#d1d5db" stroke-width="2" class="dark:stroke-[#333]" />
          <g v-for="i in 72" :key="i">
            <line
              :x1="160"
              :y1="i % 6 === 0 ? 15 : 20"
              :x2="160"
              :y2="i % 6 === 0 ? 30 : 25"
              stroke="#9ca3af"
              class="dark:stroke-[#666]"
              :stroke-width="i % 6 === 0 ? 2 : 1"
              :transform="`rotate(${i * 5} 160 160)`"
            />
          </g>
          <g v-for="dir in directions" :key="dir.angle">
            <text
              :x="160"
              :y="42"
              text-anchor="middle"
              dominant-baseline="middle"
              :fill="dir.angle === 0 ? '#ef4444' : '#1f2937'"
              class="dark:fill-white"
              font-size="16"
              font-weight="bold"
              :transform="`rotate(${dir.angle} 160 160)`"
            >
              <tspan :transform="`rotate(${-dir.angle} 160 42)`">
                {{ dir.abbr }}
              </tspan>
            </text>
          </g>
        </g>
        <g>
          <path
            d="M 160 80 L 150 100 L 160 60 L 170 100 Z"
            fill="#ef4444"
            stroke="#fff"
            stroke-width="2"
          />
        </g>
        <circle cx="160" cy="160" r="8" fill="#ef4444" stroke="#fff" stroke-width="2" />
      </svg>
    </div>
    <div mt-6 text-center>
      <div text-4xl text-gray-900 font-bold dark:text-white>
        {{ Math.round(heading) }}°
      </div>
      <div text-xl text-gray-600 mt-2 dark:text-gray-400>
        {{ currentDirection }}
      </div>
    </div>
  </div>
</template>
