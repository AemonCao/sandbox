<script setup lang="ts">
import chat01 from '~/assets/images/chat_01.png'
import contentbg from '~/assets/images/content_bg.png'
import gdglbgIcon from '~/assets/images/gdgl_bg.png'
import gdglIcon from '~/assets/images/gdgl_icon.png'
import gdgljtIcon from '~/assets/images/gdgl_jt.png'
import left from '~/assets/images/left.png'
import right from '~/assets/images/right.png'

import AlarmList from '~/components/AlarmList.vue'
import Equipment from '~/components/Equipment.vue'
import TheDashboardTitle from '~/components/TheDashboardTitle.vue'
import TheMainBoard from '~/components/TheMainBoard.vue'

function handleDashboardIconClick() {
}

// 轮播组件引用
const carouselRef = ref()

// 轮播切换方法
function prevSlide() {
  carouselRef.value?.prev()
}

function nextSlide() {
  carouselRef.value?.next()
}

// 中间模块数据
const centerModules = [
  { title: '机电子系统监测' },
  { title: '系统报警管理' },
  { title: '联动控制系统' },
  { title: '设备使用率' },
]

// 报警数据列表
const alarmList = [
  {
    deviceId: '866374062615457',
    reason: '设备无法正常运行',
    time: '2025.11.02 10:15:21',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615458',
    reason: '温度传感器异常',
    time: '2025.11.02 10:12:30',
    status: '警告' as const,
  },
  {
    deviceId: '866374062615459',
    reason: '电压波动过大',
    time: '2025.11.02 10:08:45',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615460',
    reason: '网络连接中断',
    time: '2025.11.02 10:05:12',
    status: '警告' as const,
  },
  {
    deviceId: '866374062615461',
    reason: '设备运行超时',
    time: '2025.11.02 10:01:33',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615462',
    reason: '湿度异常升高',
    time: '2025.11.02 09:58:15',
    status: '警告' as const,
  },
  {
    deviceId: '866374062615463',
    reason: '电源模块故障',
    time: '2025.11.02 09:55:42',
    status: '紧急' as const,
  },
  {
    deviceId: '866374062615464',
    reason: '通信信号弱',
    time: '2025.11.02 09:52:27',
    status: '警告' as const,
  },
]

// 3D饼图数据
const pieData = [
  { name: '在线', value: 80 },
  { name: '离线', value: 42 },
  { name: '故障', value: 15 },
]

// 设备数据
const equipmentData = [
  { label: '楼控系统', value: 600, percentage: 75, color: '#17D1FC' },
  { label: '净化空调系统', value: 573, percentage: 65, color: '#F1AB3E' },
  { label: '变配电系统', value: 467, percentage: 55, color: '#A4B2FB' },
  { label: '公共照明系统', value: 367, percentage: 45, color: '#17FA47' },
  { label: '电梯系统', value: 345, percentage: 35, color: '#A4D7FB' },
]

// 设备总数
const equipmentTotal = computed(() => {
  return equipmentData.reduce((total, item) => total + item.value, 0)
})
</script>

<template>
  <TheDashboardTitle
    title="建筑设备监控管理"
    @icon-click="handleDashboardIconClick"
  />
  <div h-screen flex="~ col">
    <div h-105px />
    <div p-4 flex-1 gap-4 grid grid-cols-5 grid-rows-2 style="height: 100vh;overflow: hidden;box-sizing: border-box;">
      <!-- 左上模块 -->
      <div col-span-1 row-span-1>
        <TheMainBoard title="机电子系统监测">
          <Equipment
            :total="equipmentTotal"
            :equipment-list="equipmentData"
          />
        </TheMainBoard>
      </div>
      <!-- 中间模块 -->
      <div col-span-3 row-span-2>
        <TheMainBoard :show-title="false">
          <div class="center_main">
            <div class="center_main_top">
              <p
                v-for="item in centerModules"
                :key="item.title"
                :style="{ '--bg-image': `url(${gdglbgIcon})` }"
              >
                <img class="icon" :src="gdglIcon" alt="">
                <span>{{ item.title }}</span>
                <img class="jt_icon" :src="gdgljtIcon" alt="">
              </p>
            </div>
            <div class="center_main_content">
              <div class="total">
                <div class="border" />
                <div class="content">
                  <div class="label">
                    设备总数
                  </div>
                  <div class="value">
                    <n-number-animation show-separator :from="0" :to="2352" :precision="0" separator />
                  </div>
                </div>
              </div>

              <div class="online">
                <div class="border" />
                <div class="content">
                  <div class="label">
                    在线设备数
                  </div>
                  <div class="value">
                    <n-number-animation show-separator :from="0" :to="2187" :precision="0" separator />
                  </div>
                </div>
              </div>

              <div class="online-rate">
                <div class="border" />
                <div class="content">
                  <div class="label">
                    在线率
                  </div>
                  <div class="value">
                    <n-number-animation :from="0" :to="93" :precision="0" />%
                  </div>
                </div>
              </div>

              <div class="operational">
                <div class="border" />
                <div class="content">
                  <div class="label">
                    运行设备数
                  </div>
                  <div class="value">
                    <n-number-animation show-separator :from="0" :to="2050" :precision="0" separator />
                  </div>
                </div>
              </div>

              <div class="aramls-total">
                <div class="border" />
                <div class="content">
                  <div class="label">
                    报警总数
                  </div>
                  <div class="value">
                    <n-number-animation show-separator :from="0" :to="156" :precision="0" separator />
                  </div>
                </div>
              </div>

              <div class="aramls-processed">
                <div class="border" />
                <div class="content">
                  <div class="label">
                    已处理报警数
                  </div>
                  <div class="value">
                    <n-number-animation show-separator :from="0" :to="142" :precision="0" separator />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TheMainBoard>
      </div>
      <!-- 右上模块 -->
      <div col-span-1 row-span-1>
        <TheMainBoard title="联动控制系统">
          <div class="control-system">
            <div v-for="(item, index) in 4" :key="index" class="control-item" :style="{ backgroundImage: `url(${contentbg})` }">
              <div class="title">
                {{ index === 0 ? '楼控系统' : index === 1 ? '净化空调系统' : index === 2 ? '变配电系统' : '电梯系统' }}
              </div>
              <div class="first">
                <div class="value">
                  <span>{{ index === 0 ? '600' : index === 1 ? '573' : index === 2 ? '467' : '345' }}</span>台
                </div>
                <div class="label">
                  设备总数
                </div>
              </div>
              <div class="second">
                <div class="value">
                  <span>{{ index === 0 ? '558' : index === 1 ? '533' : index === 2 ? '434' : '321' }}</span>台
                </div>
                <div class="label">
                  设备在线
                </div>
              </div>
              <div class="third">
                <div class="value">
                  <span>{{ index === 0 ? '42' : index === 1 ? '40' : index === 2 ? '33' : '24' }}</span>台
                </div>
                <div class="label">
                  设备离线
                </div>
              </div>
            </div>
          </div>
        </TheMainBoard>
      </div>
      <!-- 左下模块 -->
      <div col-span-1 row-span-1>
        <TheMainBoard title="系统报警管理">
          <AlarmList :list="alarmList" />
        </TheMainBoard>
      </div>
      <!-- 右下模块 -->
      <div col-span-1 row-span-1>
        <TheMainBoard title="设备使用率">
          <div class="rate">
            <div class="tips" text-white p-4>
              设备近30天使用情况  设备总数:{{ equipmentTotal }}台
            </div>
            <div class="tips_content">
              <div class="charts">
                <Pie3DChart :data="pieData" />
              </div>
            </div>

            <div class="tips" text-white p-4>
              设备近30天使用情况
            </div>
            <div class="tips_content">
              <div class="left" :style="{ backgroundImage: `url(${chat01})` }">
                <div class="carousel-container">
                  <div class="carousel-btn prev-btn" @click="prevSlide">
                    <img :src="left" alt="上一页" width="28" height="46">
                  </div>
                  <n-carousel
                    ref="carouselRef"
                    autoplay
                    :interval="3000"
                    :show-arrow="false"
                    :show-dots="false"
                  >
                    <n-carousel-item>
                      <div class="carousel-item">
                        <div class="percentage">
                          85%
                        </div>
                        <div class="label">
                          设备使用率
                        </div>
                      </div>
                    </n-carousel-item>
                    <n-carousel-item>
                      <div class="carousel-item">
                        <div class="percentage">
                          92%
                        </div>
                        <div class="label">
                          在线率
                        </div>
                      </div>
                    </n-carousel-item>
                    <n-carousel-item>
                      <div class="carousel-item">
                        <div class="percentage">
                          78%
                        </div>
                        <div class="label">
                          运行效率
                        </div>
                      </div>
                    </n-carousel-item>
                    <n-carousel-item>
                      <div class="carousel-item">
                        <div class="percentage">
                          65%
                        </div>
                        <div class="label">
                          维护完成率
                        </div>
                      </div>
                    </n-carousel-item>
                  </n-carousel>
                  <div class="carousel-btn next-btn" @click="nextSlide">
                    <img :src="right" alt="下一页" width="28" height="46">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TheMainBoard>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.center_main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .center_main_top {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 56px;
    p {
      margin: 0 12px;
      padding: 0;
      color: #ffffff;
      font-size: 14px;
      width: 167px;
      height: 55px;
      background-size: 100%;
      background-repeat: no-repeat;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      span {
        padding: 0 4px;
        box-sizing: border-box;
      }
    }
    p::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: var(--bg-image);
      background-size: 100%;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.5; /* 背景图片透明度 */
      z-index: -1;
    }
    .icon {
      width: 24px;
      height: 24px;
    }
    .jt_icon {
      width: 20px;
      height: 14px;
    }
    img {
      width: 100%;
      height: 100%;
    }
  }
  .center_main_content {
    width: 746px;
    height: 746px;
    background-image: url('~/assets/images/chat_03.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    margin: 8px;
    border-radius: 8px;
    align-self: center;
    position: relative;
    .total,
    .online,
    .online-rate,
    .operational,
    .aramls-total,
    .aramls-processed {
      position: absolute;
      width: 133px;
      height: 133px;
      .border {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          151deg,
          rgba(255, 255, 255, 1),
          rgba(90, 143, 203, 1),
          rgba(85, 154, 211, 1),
          rgba(255, 255, 255, 1)
        );
        border-radius: 50%;
        z-index: 1;
      }
      .content {
        position: absolute;
        top: 3px;
        left: 3px;
        width: calc(100% - 6px);
        height: calc(100% - 6px);
        background: linear-gradient(151deg, #040b19 0%, #02133d 23%, #175ec7 100%);
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2;
        .label {
          font-family: AlimamaShuHeiTi, AlimamaShuHeiTi;
          font-weight: bold;
          font-size: 17px;
          color: #ffffff;
          line-height: 21px;
          letter-spacing: 2px;
          text-align: right;
          font-style: normal;
        }
        .value {
          font-family: DingTalk, DingTalk;
          font-weight: normal;
          font-size: 30px;
          color: #ffffff;
          line-height: 36px;
          letter-spacing: 2px;
          text-align: center;
          font-style: normal;
        }
      }
    }
    .total {
      top: 0;
      left: 50%;
      transform: translate(-50%, 0);
    }
    .online {
      top: 25%;
      left: 0;
      transform: translate(0, -50%);
    }
    .online-rate {
      top: 25%;
      right: 0;
      transform: translate(0, -50%);
    }
    .operational {
      top: 75%;
      left: 0;
      transform: translate(0, -50%);
    }
    .aramls-total {
      top: 75%;
      right: 0;
      transform: translate(0, -50%);
    }
    .aramls-processed {
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 0);
    }
  }
}

.control-system {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 168px 168px;
  gap: 8px;
  justify-content: center;
  align-content: center;
  .title {
    position: absolute;
    top: 50%;
    left: 14px;
    transform: translateY(-50%);
    font-size: 12px;
    font-weight: bold;
    color: #ffffff;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    letter-spacing: 4px;
    white-space: nowrap;
  }
  .control-item {
    width: 183px;
    height: 168px;
    background-size: 100%;
    background-repeat: no-repeat;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    position: relative;
    .first,
    .second,
    .third {
      font-family: 'font-family: AlimamaShuHeiTi, AlimamaShuHeiTi';
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      .value {
        font-size: 12px;
        display: flex;
        align-items: center;
        margin-bottom: -6px;
        span {
          font-size: 16px;
          color: #00fffe;
          padding-right: 4px;
          font-weight: bold;
        }
      }
      .label {
        font-size: 12px;
        font-weight: bold;
      }
    }
    .first {
      top: 0;
      left: 55%;
      transform: translateX(-50%);
    }
    .second {
      top: 35%;
      left: 55%;
      transform: translateX(-50%);
    }
    .third {
      bottom: 5%;
      left: 55%;
      transform: translateX(-50%);
    }
  }
}

.rate {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
  .tips {
    width: 100%;
    white-space: nowrap;
    font-weight: bold;
  }
  .tips_content {
    width: 100%;
    height: 168px;
    display: flex;
    .charts {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .left {
      width: 225px;
      height: 100%;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      position: relative;
      .carousel-container {
        width: 180px;
        height: 100%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        .carousel-btn {
          cursor: pointer;
          z-index: 10;
          transition: opacity 0.3s;
          &:hover {
            opacity: 0.8;
          }
        }
        .prev-btn {
          position: absolute;
          left: -40px;
        }
        .next-btn {
          position: absolute;
          right: -40px;
        }
        .carousel-item {
          text-align: center;
          color: #ffffff;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          .percentage {
            font-size: 46px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
            font-family: DingTalk, DingTalk;
          }
          .label {
            font-size: 20px;
            font-weight: bold;
            font-family: AlimamaShuHeiTi, AlimamaShuHeiTi;
          }
        }
      }
    }
    .right {
      width: calc(100% - 225px);
      height: 100%;
      color: #ffffff;
      .item {
        width: 100%;
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        .point {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .point.online {
          background-color: #209fed;
        }
        .point.offline {
          background-color: #ff6b6b;
        }
        .point.fault {
          background-color: #ffa726;
        }
        .label {
          margin-left: 16px;
          margin-right: 24px;
        }
      }
    }
  }
}
</style>

<route lang="yaml">
meta:
  layout: 'default'
  menu:
    title: '建筑设备监控管理'
</route>
