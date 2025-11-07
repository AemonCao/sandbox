<script setup lang="ts">
import { computed, ref } from 'vue'

// 广播包数据
const inputText = ref('')
const packets = ref<string[]>([])

// 解析结果接口
interface ParsedPacket {
  original: string
  type: string
  macAddress: string
  rssi: number
  content: string
  valid: boolean
  error?: string
}

// 解析单个广播包
function parsePacket(hexString: string): ParsedPacket {
  // 移除空格和换行符
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase()

  // 检查最小长度 (至少9字节)
  if (cleanHex.length < 18) {
    return {
      original: hexString,
      type: '',
      macAddress: '',
      rssi: 0,
      content: '',
      valid: false,
      error: '数据长度不足，至少需要9字节 (18个十六进制字符)',
    }
  }

  // 检查是否为有效的十六进制字符串
  if (!/^[0-9a-f]+$/i.test(cleanHex)) {
    return {
      original: hexString,
      type: '',
      macAddress: '',
      rssi: 0,
      content: '',
      valid: false,
      error: '包含无效的十六进制字符',
    }
  }

  try {
    // 解析各个部分
    const type = cleanHex.substring(0, 2)
    const macBytes = cleanHex.substring(2, 14)
    const rssiHex = cleanHex.substring(14, 16)
    const content = cleanHex.substring(16)

    // 格式化MAC地址
    const macAddress = macBytes.match(/.{2}/g)?.join(':').toUpperCase() || ''

    // 计算RSSI (有符号8位整数)
    let rssi = Number.parseInt(rssiHex, 16)
    if (rssi > 127) {
      rssi = rssi - 256
    }

    return {
      original: hexString,
      type,
      macAddress,
      rssi,
      content,
      valid: true,
    }
  }
  catch {
    return {
      original: hexString,
      type: '',
      macAddress: '',
      rssi: 0,
      content: '',
      valid: false,
      error: '解析过程中发生错误',
    }
  }
}

// 解析结果
const parsedResults = computed(() => {
  return packets.value.map(packet => parsePacket(packet))
})

// 添加广播包
function addPackets() {
  const lines = inputText.value.split('\n').filter(line => line.trim())

  lines.forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !packets.value.includes(trimmedLine)) {
      packets.value.push(trimmedLine)
    }
  })

  inputText.value = ''
}

// 删除广播包
function removePacket(index: number) {
  packets.value.splice(index, 1)
}

// 清空所有
function clearAll() {
  packets.value = []
  inputText.value = ''
}

// Advertising Type Code 代码表
const typeDescriptions: Record<string, string> = {
  0: 'Connectable undirected advertisement (可连接的无定向广播)',
  1: 'Connectable directed advertisement (可连接的定向广播)',
  2: 'Non-Connectable undirected advertisement (不可连接的无定向广播)',
  3: 'Scannable undirected advertisement (可扫描的无定向广播)',
  4: 'Scan Response (扫描响应)',
}

function getTypeDescription(type: string): string {
  // 将十六进制字符串转换为数字，然后查找对应的描述
  const typeCode = Number.parseInt(type, 16)
  return typeDescriptions[typeCode] || '未知类型'
}
</script>

<template>
  <div p-4 min-h-screen from-gray-50 to-blue-50 bg-gradient-to-br>
    <div mb-6>
      <h1 text-3xl text-gray-800 font-bold text-center>
        蓝牙广播包解析器
      </h1>
      <p text-gray-600 mt-2 text-center>
        支持同时解析多个蓝牙广播包，支持批量输入
      </p>
    </div>

    <div mx-auto gap-6 grid grid-cols-1 max-w-7xl lg:grid-cols-2>
      <!-- 左侧输入区域 -->
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center>
          <div rounded bg-blue-500 h-6 w-2 />
          输入广播包数据
        </h2>

        <div mb-4>
          <label text-sm text-gray-700 font-medium mb-2 block>
            请输入广播包数据（每行一个，支持批量粘贴）
          </label>
          <textarea
            v-model="inputText"
            placeholder="示例：00aea273f4f8deaa0201061aff4c000215ab8190d5d11e4941acc442f30510b40827473bd4b5"
            text-sm font-mono px-3 py-2 border border-gray-300 rounded-md h-32 w-full resize-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500
            rows="6"
          />
        </div>

        <div flex gap-3>
          <button
            :disabled="!inputText.trim()"
            text-white px-4 py-2 rounded-md bg-blue-500 flex-1 transition-colors
            disabled:bg-gray-300 hover:bg-blue-600 disabled:cursor-not-allowed
            @click="addPackets"
          >
            添加广播包
          </button>
          <button
            :disabled="packets.length === 0"
            text-white px-4 py-2 rounded-md bg-red-500 flex-1 transition-colors
            disabled:bg-gray-300 hover:bg-red-600 disabled:cursor-not-allowed
            @click="clearAll"
          >
            清空所有
          </button>
        </div>

        <!-- 已添加的广播包列表 -->
        <div v-if="packets.length > 0" mt-6>
          <h3 text-sm text-gray-700 font-medium mb-3>
            已添加的广播包 ({{ packets.length }})
          </h3>
          <div border border-gray-200 rounded-md max-h-48 overflow-y-auto>
            <div
              v-for="(packet, index) in packets"
              :key="index"
              p-2 border-b border-gray-100 flex items-center justify-between last:border-b-0
              hover:bg-gray-50
            >
              <span text-xs text-gray-600 font-mono flex-1 truncate>
                {{ packet }}
              </span>
              <button
                class="text-sm text-red-500 ml-2 hover:text-red-700"
                @click="removePacket(index)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧解析结果区域 -->
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center>
          <div rounded bg-green-500 h-6 w-2 />
          解析结果
        </h2>

        <div v-if="parsedResults.length === 0" text-gray-500 py-12 text-center>
          <div text-6xl mb-4>
            📡
          </div>
          暂无解析结果，请在左侧输入广播包数据
        </div>

        <div v-else max-h-96 overflow-y-auto space-y-4>
          <div
            v-for="(result, index) in parsedResults"
            :key="index"
            class="p-4 border rounded-lg"
            :class="result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
          >
            <div mb-3 flex items-center justify-between>
              <h3 text-sm text-gray-700 font-semibold>
                广播包 #{{ index + 1 }}
              </h3>
              <span
                text-xs px-2 py-1 rounded-full
                :class="result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ result.valid ? '解析成功' : '解析失败' }}
              </span>
            </div>

            <div v-if="result.valid" space-y-2>
              <div text-sm gap-4 grid grid-cols-2>
                <div>
                  <span text-gray-600 font-medium>原始数据：</span>
                  <span text-xs text-gray-800 font-mono break-all>{{ result.original }}</span>
                </div>
                <div>
                  <span text-gray-600 font-medium>广播包类型：</span>
                  <span text-sm font-mono>{{ result.type.toUpperCase() }} ({{ getTypeDescription(result.type) }})</span>
                </div>
                <div>
                  <span text-gray-600 font-medium>MAC地址：</span>
                  <span text-sm text-blue-600 font-mono>{{ result.macAddress }}</span>
                </div>
                <div>
                  <span text-gray-600 font-medium>RSSI：</span>
                  <span
                    text-sm font-mono
                    :class="result.rssi < -70 ? 'text-red-600' : result.rssi < -60 ? 'text-yellow-600' : 'text-green-600'"
                  >
                    {{ result.rssi }} dBm
                  </span>
                </div>
              </div>

              <div v-if="result.content">
                <span text-sm text-gray-600 font-medium>广播包内容：</span>
                <div text-xs text-gray-800 font-mono mt-1 p-2 rounded bg-gray-100 break-all>
                  {{ result.content.toUpperCase() }}
                </div>
              </div>
            </div>

            <div v-else text-sm text-red-600>
              <div mb-2 flex gap-2 items-center>
                <span>❌</span>
                <span font-medium>解析错误</span>
              </div>
              <p text-red-500>
                {{ result.error }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 解析规则说明 -->
    <div mx-auto mt-8 max-w-7xl>
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center>
          <div rounded bg-purple-500 h-6 w-2 />
          解析规则说明
        </h2>

        <div overflow-x-auto>
          <table text-sm w-full border-collapse>
            <thead>
              <tr bg-gray-50>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  Bytes
                </th>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  说明
                </th>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  示例
                </th>
              </tr>
            </thead>
            <tbody>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  1
                </td>
                <td px-4 py-2 border border-gray-200>
                  广播包类型
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0 (Connectable undirected advertisement - 可连接的无定向广播)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  2-7
                </td>
                <td px-4 py-2 border border-gray-200>
                  BLE信标的MAC地址
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  d2:5f:2d:ab:2e:d0
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  8
                </td>
                <td px-4 py-2 border border-gray-200>
                  BLE信标的RSSI
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  ba (0xba - 256 = -70)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  9-
                </td>
                <td px-4 py-2 border border-gray-200>
                  BLE信标的广播包内容
                </td>
                <td text-xs font-mono px-4 py-2 border border-gray-200 max-w-xs break-all>
                  02 01 06 1a ff 4c 00 02 15 fd a5...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Advertising Type Code 参考表 -->
      <div mx-auto mt-8 max-w-7xl>
        <div p-6 rounded-lg bg-white shadow-lg>
          <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center>
            <div rounded bg-indigo-500 h-6 w-2 />
            Advertising Type Code 参考表
          </h2>

          <div overflow-x-auto>
            <table text-sm w-full border-collapse>
              <thead>
                <tr bg-gray-50>
                  <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                    Code
                  </th>
                  <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                    描述
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(description, code) in typeDescriptions"
                  :key="code"
                  hover:bg-gray-50
                >
                  <td font-mono px-4 py-2 border border-gray-200>
                    {{ code }}
                  </td>
                  <td px-4 py-2 border border-gray-200>
                    {{ description }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
  title: '蓝牙信标解析'
</route>
