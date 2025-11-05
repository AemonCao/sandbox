<script setup lang="ts">
import workOrderItemFixImage from '~/assets/images/work-order-item-fix.png'
import workOrderItemTitlePrefixImage from '~/assets/images/work-order-item-title-prefix.png'

interface Props {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

defineProps<Props>()
</script>

<template>
  <div flex="~ row" gap-5px items-center justify-center>
    <img
      :src="workOrderItemFixImage"
      h-90px
      alt="工单维修图标"
    >
    <div flex="~ col" text-white w-auto>
      <div
        class="bg-[linear-gradient(90deg,rgba(61,138,255,0.6)_0%,rgba(61,138,255,0)_85.06%)]"
        flex="~ row"
        py-10px pl-40px items-center justify-between
        relative
      >
        <img
          :src="workOrderItemTitlePrefixImage"
          left-1px top-3px absolute
          alt="工单标题前缀"
        >
        <span text-16px flex gap-1 w-full>
          <span font-900 whitespace-nowrap text-ellipsis overflow-hidden>{{ topLeft }}</span>
          <span whitespace-nowrap text-ellipsis overflow-hidden>{{ topRight }}</span>
        </span>
        <slot name="headerExtra">
          <div p="x-10px y-3px" text-10px rounded-sm bg-hex-3f9ef6>
            点击派单
          </div>
        </slot>
      </div>
      <div
        class="bg-[linear-gradient(0deg,rgba(82,151,255,0.055)_0%,rgba(4,23,51,0)_100%)]"
        text-16px py-10px flex gap-5px justify-between
      >
        <span whitespace-nowrap text-ellipsis overflow-hidden>{{ bottomLeft }}</span>
        <span whitespace-nowrap text-ellipsis overflow-hidden>{{ bottomRight }}</span>
      </div>
    </div>
    <img
      :src="workOrderItemFixImage"
      h-90px
      scale-x--100 object-contain
      alt="工单维修图标"
    >
  </div>
</template>

<style scoped>
</style>
