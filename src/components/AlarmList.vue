<script setup lang="ts">
import errorIcon from '~/assets/images/error.png'
import warringIcon from '~/assets/images/warring.png'

// 报警数据接口
interface AlarmItem {
  deviceId: string
  reason: string
  time: string
  status: '紧急' | '警告'
}

// 组件 props
interface Props {
  list?: AlarmItem[]
}

const { list } = withDefaults(defineProps<Props>(), {
  list: () => [],
})
</script>

<template>
  <div class="alarmList">
    <div v-for="(item, index) in list" :key="index" class="list">
      <div class="list_left">
        <div class="left_icon">
          <img :src="item.status === '警告' ? warringIcon : errorIcon" alt="">
        </div>
      </div>
      <div class="list_right">
        <div class="right_info">
          <p>设备编号:{{ item.deviceId }}</p>
          <p>报警原因:{{ item.reason }}</p>
          <p>报警时间:{{ item.time }}</p>
        </div>
        <div class="right_status">
          <div class="status" :class="item.status === '紧急' ? 'status-emergency' : 'status-warning'">
            {{ item.status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alarmList {
  width: 100%;
  height: 100%;
  padding: 16px 8px;
  box-sizing: border-box;
  color: #ffffff;
  overflow-y: auto;
  overflow-x: hidden;

  /* 隐藏滚动条但不影响滚动 */
  &::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
  }
  .list {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    .list_left {
      display: flex;
      .left_icon {
        width: 58px;
        height: 58px;
        flex-shrink: 0;
        img {
          width: 100%;
          height: 100%;
        }
      }
    }
    .list_right {
      width: 100%;
      display: flex;
      margin-left: 24px;
      .right_info {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-right: 6px;
        p {
          white-space: nowrap;
          margin-bottom: 8px;
          font-size: 12px;
        }
        p:first-child {
          font-weight: bold;
          font-size: 16px;
        }
        p:last-child {
          margin-bottom: 0;
        }
      }
      .right_status {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        .status {
          padding: 2px 12px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          min-width: 50px;
          text-align: center;
          overflow: hidden;
        }
        .status-emergency {
          background: linear-gradient(
            180deg,
            rgba(201, 129, 130, 0.8) 0%,
            rgba(161, 66, 65, 0.8) 20%,
            rgba(161, 66, 65, 0.8) 80%,
            rgba(200, 128, 127, 0.8) 100%
          );
          color: #fff;
          position: relative;
          border: none;
          box-shadow:
            0px 2px 4px 0px rgba(151, 61, 59, 1) inset,
            0px -2px 4px 0px rgba(152, 61, 61, 1) inset;

          &::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: 6px;
            background: linear-gradient(90deg, #c98182 0%, #a14241 48.9%, #c8807f 100%);
            z-index: -1;
          }
        }
        .status-warning {
          background: linear-gradient(
            180deg,
            rgba(201, 155, 129, 0.8) 0%,
            rgba(86, 59, 35, 0.8) 20%,
            rgba(86, 59, 35, 0.8) 80%,
            rgba(201, 155, 129, 0.8) 100%
          );
          position: relative;
          border: none;
          box-shadow:
            0px 2px 4px 0px rgba(151, 125, 59, 1) inset,
            0px -2px 4px 0px rgba(152, 116, 61, 1) inset;

          &::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: 6px;
            background: linear-gradient(90deg, #c99b81 0%, #f5f5f5 48.9%, #c99b81 100%);
            z-index: -1;
          }
        }
      }
    }
  }
}
</style>
