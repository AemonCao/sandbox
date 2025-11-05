<script setup lang="ts" name="TheWorkOrderItem">
import deviceIconImage from '~/assets/images/device-icon.png'

interface Props {
  workOrderNumber: string
  repairDepartment: string
  repairTime: string
  personInCharge: string
  status: string
}

defineProps<Props>()
</script>

<template>
  <div class="people-info-device-info-item">
    <img :src="deviceIconImage" height="55" width="100">
    <div class="device-name">
      工单号：{{ workOrderNumber }}
    </div>
    <div class="device-prop">
      <div>报告科室：</div>
      <div>{{ repairDepartment }}</div>
    </div>
    <div class="device-prop">
      <div>报告时间：</div>
      <div>{{ repairTime }}</div>
    </div>
    <div class="device-prop">
      <div>负责人</div>
      <div>{{ personInCharge }}</div>
    </div>
    <div class="button-group">
      <div class="button">
        {{ status }}
      </div>
      <!-- <div class="button">
        绑定
      </div> -->
    </div>
  </div>
</template>

<style scoped>
.people-info-device-info-item {
  background-image: url('~/assets/images/device-bg.png');
  background-repeat: round;
  height: 280px;
  width: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 30px 18px 11px 13px;
  box-sizing: border-box;
  color: white;
}

.people-info-device-info-item .device-name {
  font-size: 16px;
  font-weight: 400;
}

.people-info-device-info-item .device-prop {
  background-image: url('~/assets/images/device-prop-bg.png');
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 4px 12px;
  width: 100%;
  box-sizing: border-box;
}

.people-info-device-info-item .device-prop > div:nth-child(1) {
  font-size: 14px;
}

.people-info-device-info-item .device-prop > div:nth-child(1) {
  font-size: 16px;
}

.people-info-device-info-item .button-group {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.people-info-device-info-item .button-group .button {
  font-size: 14px;
  background-color: rgba(63, 158, 246, 1);
  padding: 6px 10px 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
