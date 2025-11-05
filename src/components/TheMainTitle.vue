<script setup lang="ts">
import prefixImage from '~/assets/images/main-title-prefix.png'
import suffixImage from '~/assets/images/main-title-suffix.png'

interface Props {
  /**
   * 主标题
   * @default '一级标题'
   */
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '一级标题',
})
</script>

<template>
  <div
    class="bg-[linear-gradient(180deg,rgba(43,85,167,0.03)_0%,rgba(7,118,221,0.29)_100%)]"
    rounded="bl-15px tr-15px"
    text="20px white"
    leading-22.82px font-normal ml-5px px-5px flex h-32px w-auto italic items-center box-border relative
  >
    <img
      :src="prefixImage"
      h-18.94px w-14.70px
      left--4.7px top-4.24px absolute
    >
    <span
      class="font-['PangMenZhengDao']"
      pl-20px style="color: linear-gradient(180deg, #FFFFFF 17.47%, #4897D1 99.87%);"
    >{{ props.title }}</span>
    <img
      :src="suffixImage"
      h-6.35px w-23.7px
      right-9.15px top-14.5px absolute
    >
  </div>
</template>

<style scoped>
</style>
