<script setup lang="ts">
interface EquipmentItem {
  label: string
  value: number
  percentage: number
  color: string
}

interface Props {
  total?: number
  equipmentList?: EquipmentItem[]
}

const props = defineProps<Props>()
</script>

<template>
  <div class="equipment-container">
    <div class="title">
      <div class="title_txt">
        {{ props.total || 0 }} <span>台</span>
      </div>
    </div>
    <div class="equipment-list">
      <div
        v-for="item in props.equipmentList || []"
        :key="item.label"
        class="item"
      >
        <div class="label">
          {{ item.label }}
        </div>
        <div class="value">
          {{ item.value }}
        </div>
        <div class="progress">
          <n-progress
            type="line"
            :percentage="item.percentage"
            :height="6"
            :border-radius="3"
            processing
            :show-indicator="false"
            :color="{ stops: ['#094572', item.color] }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.equipment-container {
  width: 100%;
  height: 100%;
  .title {
    width: 100%;
    height: 43px;
    background-image: url('~/assets/images/device-count.png');
    background-size: 100%;
    background-repeat: no-repeat;
    background-position: center;
    position: relative;
    margin: 20px 0;
    .title_txt {
      position: absolute;
      right: 4%;
      top: 50%;
      transform: translate(0, -50%);
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
      display: flex;
      align-items: center;
      span {
        font-size: 14px;
      }
    }
  }
  .equipment-list {
    width: 100%;
    height: calc(100% - 63px);
    overflow-y: auto;
    .item {
      width: 100%;
      height: 42px;
      margin-bottom: 16px;
      background-image: url('~/assets/images/device-count-item.png');
      background-size: 100%;
      background-repeat: no-repeat;
      background-position: center;
      position: relative;
      color: #ffffff;
      .label {
        position: absolute;
        top: 0;
        left: 54px;
        font-size: 12px;
      }
      .value {
        position: absolute;
        bottom: 0;
        right: 8px;
        font-size: 16px;
        font-weight: bold;
      }
      .progress {
        width: 274px;
        height: 6px;
        position: absolute;
        bottom: 10px;
        left: 46px;
        font-size: 12px;
        // :deep(.n-progress-graph-line-fill) {
        //   background: linear-gradient(90deg, #094572 0%, #17d1fc 100%) !important;
        // }
        :deep(.n-progress-graph-line-rail) {
          background: linear-gradient(90deg, #0e5084 0%, #11568d 100%) !important;
        }
      }
    }
  }
}
</style>
