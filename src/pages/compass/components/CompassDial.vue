<script setup lang="ts">
interface Props {
  heading: number
}

const props = defineProps<Props>()

const directions = [
  { angle: 0, name: '北', abbr: 'N' },
  { angle: 45, name: '东北', abbr: 'NE' },
  { angle: 90, name: '东', abbr: 'E' },
  { angle: 135, name: '东南', abbr: 'SE' },
  { angle: 180, name: '南', abbr: 'S' },
  { angle: 225, name: '西南', abbr: 'SW' },
  { angle: 270, name: '西', abbr: 'W' },
  { angle: 315, name: '西北', abbr: 'NW' },
]

/**
 * 获取当前方向名称
 */
const currentDirection = computed(() => {
  const normalized = ((props.heading % 360) + 360) % 360
  const closest = directions.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.angle - normalized)
    const currDiff = Math.abs(curr.angle - normalized)
    return currDiff < prevDiff ? curr : prev
  })
  return closest.name
})
</script>

<template>
  <div flex flex-col items-center justify-center>
    <div h-80 w-80 relative>
      <svg viewBox="0 0 320 320" h-full w-full>
        <g
          :style="{ transform: `rotate(${-heading}deg)`, transformOrigin: '160px 160px' }"
          transition-transform duration-300 ease-out
        >
          <circle cx="160" cy="160" r="150" fill="none" stroke="#333" stroke-width="2" />

          <g v-for="i in 72" :key="i">
            <line
              :x1="160"
              :y1="i % 6 === 0 ? 15 : 20"
              :x2="160"
              :y2="i % 6 === 0 ? 30 : 25"
              stroke="#666"
              :stroke-width="i % 6 === 0 ? 2 : 1"
              :transform="`rotate(${i * 5} 160 160)`"
            />
          </g>

          <g v-for="dir in directions" :key="dir.angle">
            <text
              :x="160"
              :y="50"
              text-anchor="middle"
              :fill="dir.angle === 0 ? '#ef4444' : '#fff'"
              font-size="24"
              font-weight="bold"
              :transform="`rotate(${dir.angle} 160 160)`"
            >
              <tspan :transform="`rotate(${-dir.angle} 160 50)`">
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
      <div text-6xl text-white font-bold>
        {{ Math.round(heading) }}°
      </div>
      <div text-2xl text-gray-400 mt-2>
        {{ currentDirection }}
      </div>
    </div>
  </div>
</template>
