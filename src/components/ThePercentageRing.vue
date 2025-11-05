<script setup lang="ts">
interface Props {
  title: string
  value: number
  type: 'blue' | 'orange' | 'green'
}

defineProps<Props>()
</script>

<template>
  <div class="yesterday-overview-item" :class="[type]">
    <div>{{ title }}</div>
    <div id="yesterday-overview-use-count">
      {{ value }}%
    </div>
  </div>
</template>

<style scoped>
.yesterday-overview-item {
  height: 45px;
  width: 115px;
}

.yesterday-overview-item.blue {
  background: url('~/assets/images/blue-ring.png') round;
}

.yesterday-overview-item.orange {
  background: url('~/assets/images/orange-ring.png') round;
}

.yesterday-overview-item.green {
  background: url('~/assets/images/green-ring.png') round;
  width: 131px;
}

.yesterday-overview-item {
  display: grid;
  grid-auto-rows: 50% 50%;
}

.yesterday-overview-item > div:nth-child(1) {
  font-family: Source Han Sans CN;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  color: rgba(255, 255, 255, 1);
}

.yesterday-overview-item > div:nth-child(2) {
  font-family: PangMenZhengDao;
  font-size: 16px;
  font-weight: 400;
  line-height: 18.26px;
}

.yesterday-overview-item.blue > div:nth-child(2) {
  color: rgba(0, 254, 254, 1);
}

.yesterday-overview-item.orange > div:nth-child(2) {
  color: rgba(254, 143, 68, 1);
}

.yesterday-overview-item.green > div:nth-child(2) {
  color: rgba(0, 255, 0, 1);
}
</style>
