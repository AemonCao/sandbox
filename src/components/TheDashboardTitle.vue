<script setup lang="ts">
import { useDateFormat, useNow } from '@vueuse/core'
import dashboardTitleImage from '~/assets/images/dashboard-title-bg.png'
import homeIconImage from '~/assets/images/home.png'

interface Props {
  /**
   * 仪表板标题
   * @default '数字孪生平台'
   */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '数字孪生平台',
})

const emit = defineEmits<{
  iconClick: []
}>()

function handleIconClick() {
  // 如果父组件监听了 iconClick 事件，则触发该事件
  emit('iconClick')
}

const weekFormatted = useDateFormat(useNow(), 'ddd')
const dateFormatted = useDateFormat(useNow(), 'YYYY-MM-DD')
const timeFormatted = useDateFormat(useNow(), 'HH:mm:ss')
</script>

<template>
  <div
    text="white center"
    h-screen w-screen pointer-events-none
    left-0 top-0 absolute
    :style="{
      borderImageRepeat: 'repeat',
      borderImageSlice: '216 90 0 90',
      borderImageSource: `url(${dashboardTitleImage})`,
      borderImageWidth: '108px',
    }"
  >
    <div flex items-center justify-between>
      <div text-center w-100px>
        <div
          class="font-['microsoft_yahei']"
          text-11.22px leading-14.81px font-400
        >
          阴转多云
        </div>
        <div
          class="font-['Oswald'] text-shadow-[0_0_12.47px_#105ed9]"
          text-11.22px leading-16.63px font-bold
        >
          10~26°C
        </div>
      </div>
      <div>
        <div
          class="font-['ALiMaMaShuHeiTi'] text-shadow-[0_1.12px_1.68px_rgba(23,236,255,0.5)]"
          text-35.07px leading-58.16px tracking-14px font-black text-center pointer-events-auto
        >
          {{ props.title }}
        </div>
        <img
          class="left-[calc(50%-11px)]"
          h-22px w-22px cursor-pointer pointer-events-auto top-70px fixed
          :src="homeIconImage"
          @click="handleIconClick"
        >
      </div>
      <div
        class="text-shadow-[0_0_12.47px_#105ed9]"
        font-acme font-400 text-center flex flex-row w-100px items-center justify-center
      >
        <div text-11.22px lh-14.21px w-20px>
          {{ weekFormatted }}
        </div>
        <div>
          <div text-8.42px lh-10.66px>
            {{ dateFormatted }}
          </div>
          <div text-11.22px lh-14.21px tracking-0.561163px>
            {{ timeFormatted }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
