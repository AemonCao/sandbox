<script setup lang="ts">
import { computed, ref } from 'vue'

// 广播包数据
const inputText = ref('')
const packets = ref<string[]>([])

// AD结构接口
interface ADStructure {
  length: number
  type: string
  data: string
  description: string
}

// 广播包内容解析结果接口
interface ParsedContent {
  // AD结构列表
  adStructures: ADStructure[]

  // Flags AD结构 (AD Struct 1)
  flags: {
    length: number
    type: string
    data: string
    description: string
    supportsLEOnlyDiscoverable: boolean
    supportsGeneralDiscoverable: boolean
    supportsBR_EDRNotSupported: boolean
    supportsLEAndBR_EDRController: boolean
    supportsLEAndBR_EDRHost: boolean
  }

  // iBeacon AD结构 (AD Struct 2)
  iBeacon: {
    length: number
    type: string
    companyId: string
    subtype: string
    iBeaconType: string
    proximityUUID: string
    major: string
    minor: string
    measuredPower: string
    description: string
  }

  // 整体解析状态
  hasError: boolean
  errorMessage?: string
}

// 解析结果接口
interface ParsedPacket {
  original: string
  type: string
  macAddress: string
  rssi: number
  content: string
  parsedContent?: ParsedContent
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

    // 解析广播包内容
    const parsedContent = parsePacketContent(content)

    return {
      original: hexString,
      type,
      macAddress,
      rssi,
      content,
      parsedContent,
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

// AD类型描述
const adTypeDescriptions: Record<string, string> = {
  '01': 'Flags',
  '02': 'Incomplete List of 16-bit Service Class UUIDs',
  '03': 'Complete List of 16-bit Service Class UUIDs',
  '04': 'Incomplete List of 32-bit Service Class UUIDs',
  '05': 'Complete List of 32-bit Service Class UUIDs',
  '06': 'Incomplete List of 128-bit Service Class UUIDs',
  '07': 'Complete List of 128-bit Service Class UUIDs',
  '08': 'Shortened Local Name',
  '09': 'Complete Local Name',
  '0a': 'Tx Power Level',
  '0d': 'Class of Device',
  '0e': 'Simple Pairing Hash C',
  '0f': 'Simple Pairing Randomizer R',
  '10': 'Security Manager TK Value',
  '11': 'Security Manager Out of Band Flags',
  '12': 'Slave Connection Interval Range',
  '14': 'List of 16-bit Service Solicitation UUIDs',
  '15': 'List of 128-bit Service Solicitation UUIDs',
  '16': 'Service Data',
  '17': 'Public Target Address',
  '18': 'Random Target Address',
  '19': 'Appearance',
  '1a': 'Advertising Interval',
  '1b': 'LE Bluetooth Device Address',
  '1c': 'LE Role',
  '1d': 'Simple Pairing Hash C-256',
  '1e': 'Simple Pairing Randomizer R-256',
  '1f': 'List of 32-bit Service Solicitation UUIDs',
  '20': 'Service Data - 32-bit UUID',
  '21': 'Service Data - 128-bit UUID',
  '22': 'LE Secure Connections Confirmation Value',
  '23': 'LE Secure Connections Random Value',
  '24': 'URI',
  '25': 'Advertising Interval - Large',
  '26': 'Mesh Message',
  '27': 'Mesh Beacon',
  '3d': '3D Information Data',
  'ff': 'Manufacturer Specific Data',
}

// 解析广播包内容
function parsePacketContent(content: string): ParsedContent {
  const parsed: ParsedContent = {
    adStructures: [],
    flags: {
      length: 0,
      type: '',
      data: '',
      description: '',
      supportsLEOnlyDiscoverable: false,
      supportsGeneralDiscoverable: false,
      supportsBR_EDRNotSupported: false,
      supportsLEAndBR_EDRController: false,
      supportsLEAndBR_EDRHost: false,
    },
    iBeacon: {
      length: 0,
      type: '',
      companyId: '',
      subtype: '',
      iBeaconType: '',
      proximityUUID: '',
      major: '',
      minor: '',
      measuredPower: '',
      description: '',
    },
    hasError: false,
  }

  try {
    let offset = 0
    const adStructures: ADStructure[] = []

    // 解析所有AD结构
    while (offset < content.length) {
      if (offset + 1 >= content.length)
        break // 至少需要Length和Type

      const length = Number.parseInt(content.substring(offset, offset + 2), 16)
      if (length === 0 || offset + 2 + length * 2 > content.length)
        break

      const typeHex = content.substring(offset + 2, offset + 4).toLowerCase()
      const data = content.substring(offset + 4, offset + 4 + length * 2)
      const description = adTypeDescriptions[typeHex] || 'Unknown Type'

      const adStruct: ADStructure = {
        length,
        type: typeHex,
        data,
        description,
      }
      adStructures.push(adStruct)

      // 解析Flags AD结构 (Type: 0x01)
      if (typeHex === '01' && length >= 1) {
        const flagsByte = Number.parseInt(data.substring(0, 2), 16)
        parsed.flags = {
          length,
          type: typeHex,
          data,
          description,
          supportsLEOnlyDiscoverable: !!(flagsByte & 0x01),
          supportsGeneralDiscoverable: !!(flagsByte & 0x02),
          supportsBR_EDRNotSupported: !!(flagsByte & 0x04),
          supportsLEAndBR_EDRController: !!(flagsByte & 0x08),
          supportsLEAndBR_EDRHost: !!(flagsByte & 0x10),
        }
      }

      // 解析iBeacon AD结构 (Type: 0xFF, Manufacturer Specific Data)
      if (typeHex === 'ff' && length >= 25) { // 至少需要25字节: Company ID(2) + Subtype(1) + Type(1) + UUID(16) + Major(2) + Minor(2) + TxPower(1)
        const companyId = `${data.substring(2, 4)}${data.substring(0, 2)}` // 大端序
        const subtype = data.substring(4, 6)
        const iBeaconType = data.substring(6, 8)

        // 检查是否为Apple公司的iBeacon
        if (companyId.toLowerCase() === '004c' && subtype === '02' && iBeaconType === '15') {
          const uuidBytes = data.substring(8, 40)
          const majorBytes = data.substring(40, 44)
          const minorBytes = data.substring(44, 48)
          const measuredPowerByte = data.substring(48, 50)

          // 格式化UUID
          const proximityUUID = `${uuidBytes.substring(0, 8)}-${uuidBytes.substring(8, 12)}-${uuidBytes.substring(12, 16)}-${uuidBytes.substring(16, 20)}-${uuidBytes.substring(20, 32)}`.toUpperCase()

          // 解析Major和Minor (大端序)
          const major = Number.parseInt(`${majorBytes.substring(0, 2)}${majorBytes.substring(2, 4)}`, 16).toString()
          const minor = Number.parseInt(`${minorBytes.substring(0, 2)}${minorBytes.substring(2, 4)}`, 16).toString()

          // 解析Measured Power
          let measuredPower = Number.parseInt(measuredPowerByte, 16)
          if (measuredPower > 127) {
            measuredPower = measuredPower - 256
          }

          parsed.iBeacon = {
            length,
            type: typeHex,
            companyId,
            subtype,
            iBeaconType,
            proximityUUID,
            major,
            minor,
            measuredPower: `${measuredPower} dBm`,
            description: 'Apple iBeacon',
          }
        }
      }

      offset += 2 + length * 2
    }

    parsed.adStructures = adStructures

    // 检查是否成功解析到iBeacon
    parsed.hasError = !parsed.iBeacon.proximityUUID
    if (parsed.hasError) {
      parsed.errorMessage = '未找到有效的iBeacon数据结构'
    }
  }
  catch (error) {
    parsed.hasError = true
    parsed.errorMessage = error instanceof Error ? error.message : '解析过程中发生未知错误'
  }

  return parsed
}

// 解析结果
const parsedResults = computed(() => {
  return packets.value.map(packet => parsePacket(packet))
})

// 添加广播包
function addPackets() {
  let dataArray: string[] = []

  try {
    // 尝试解析为数组格式
    const parsed = JSON.parse(inputText.value)
    if (Array.isArray(parsed)) {
      dataArray = parsed
    }
    else {
      throw new TypeError('不是数组格式')
    }
  }
  catch {
    // 如果不是JSON数组，按原来的方式处理（按行分割）
    dataArray = inputText.value.split('\n').filter(line => line.trim())
  }

  dataArray.forEach((item) => {
    const trimmedItem = item.trim()
    if (trimmedItem && !packets.value.includes(trimmedItem)) {
      packets.value.push(trimmedItem)
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

// 滚动到指定广播包
function scrollToPacket(index: number) {
  const element = document.getElementById(`packet-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 滚动到顶部
function scrollToTop() {
  const container = document.querySelector('.overflow-y-auto')
  if (container) {
    container.scrollTop = 0
  }
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

    <div mx-auto gap-6 grid grid-cols-1 max-w-full lg:px-4 lg:grid-cols-2>
      <!-- 左侧输入区域 -->
      <div
        p-6 rounded-lg bg-white shadow-lg lg:h-fit lg:max-h-screen lg:top-4 lg:sticky lg:overflow-y-auto
        style="max-height: calc(100vh - 120px)"
      >
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center>
          <div rounded bg-blue-500 h-6 w-2 />
          输入广播包数据
        </h2>

        <div mb-4>
          <label text-sm text-gray-700 font-medium mb-2 block>
            请输入广播包数据（支持每行一个或JSON数组格式）
          </label>
          <textarea
            v-model="inputText"
            placeholder="格式1（每行一个）：&#10;00aea273f4f8deaa0201061aff4c000215ab8190d5d11e4941acc442f30510b40827473bd4b5&#10;00b059763f23acb60201061aff4c000215ab8190d5d11e4941acc442f30510b408277049f6c5&#10;&#10;格式2（JSON数组）：&#10;[&quot;00aea273f4f8deaa020106...&quot;, &quot;00b059763f23acb6020106...&quot;]"
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
          <div mb-3 flex items-center justify-between>
            <h3 text-sm text-gray-700 font-medium>
              已添加的广播包 ({{ packets.length }})
            </h3>
            <button
              v-if="packets.length > 10"
              text-xs text-blue-600 transition-colors hover:text-blue-800
              @click="scrollToTop"
            >
              ↑ 回到顶部
            </button>
          </div>
          <div border border-gray-200 rounded-md max-h-48 overflow-y-auto>
            <div
              v-for="(packet, index) in packets"
              :key="index"

              group p-2 border-b border-gray-100 flex items-center justify-between last:border-b-0 hover:bg-gray-50
            >
              <button
                text-xs text-blue-600 font-mono text-left flex-1 truncate transition-colors hover:text-blue-800
                @click="scrollToPacket(index)"
              >
                #{{ index + 1 }}: {{ packet }}
              </button>
              <div flex gap-1>
                <button
                  text-xs text-gray-500 opacity-0 transition-opacity hover:text-blue-600 group-hover:opacity-100
                  @click="scrollToPacket(index)"
                >
                  查看
                </button>
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
      </div>

      <!-- 右侧解析结果区域 -->
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center justify-between>
          <div flex gap-2 items-center>
            <div rounded bg-green-500 h-6 w-2 />
            解析结果
          </div>
          <div flex gap-2 items-center>
            <div text-sm text-gray-500 font-normal>
              共 {{ parsedResults.length }} 个广播包
            </div>
            <button
              v-if="parsedResults.length > 10"
              text-xs text-blue-600 transition-colors hover:text-blue-800
              @click="scrollToTop"
            >
              ↑ 回到顶部
            </button>
          </div>
        </h2>

        <div v-if="parsedResults.length === 0" text-gray-500 py-12 text-center>
          <div text-6xl mb-4>
            📡
          </div>
          暂无解析结果，请在左侧输入广播包数据
        </div>

        <div v-else max-h-screen overflow-y-auto space-y-4 style="max-height: calc(100vh - 200px);">
          <div
            v-for="(result, index) in parsedResults"
            :id="`packet-${index}`"
            :key="index"
            class="p-4 border rounded-lg scroll-mt-4"
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

                <!-- AD结构详细解析 -->
                <div v-if="result.parsedContent && result.parsedContent.adStructures.length > 0" mt-4>
                  <h4 text-sm text-gray-700 font-medium mb-3 flex gap-2 items-center>
                    <div rounded bg-orange-500 h-4 w-2 />
                    <span v-if="result.parsedContent.iBeacon.proximityUUID" flex gap-2 items-center>
                      🍎 iBeacon 数据解析
                      <span text-xs text-blue-800 px-2 py-1 rounded-full bg-blue-100>{{ result.parsedContent.iBeacon.description }}</span>
                    </span>
                    <span v-else>
                      广播数据解析
                      <span text-xs text-gray-800 ml-2 px-2 py-1 rounded-full bg-gray-100>{{ result.parsedContent.adStructures.length }} 个AD结构</span>
                    </span>
                  </h4>

                  <!-- AD结构概览 -->
                  <div v-if="result.parsedContent.adStructures.length > 0" mb-3 p-3 border border-blue-200 rounded-lg bg-blue-50>
                    <div text-xs text-blue-700 font-medium mb-2>
                      📋 AD结构概览
                    </div>
                    <div text-xs space-y-1>
                      <div
                        v-for="(adStruct, adStructIndex) in result.parsedContent.adStructures"
                        :key="adStructIndex"
                        flex gap-2 items-center
                      >
                        <span text-gray-500 font-mono>#{{ adStructIndex + 1 }}</span>
                        <span text-gray-600 font-mono>Length: {{ adStruct.length }}</span>
                        <span text-gray-600 font-mono>Type: 0x{{ adStruct.type.toUpperCase() }}</span>
                        <span text-gray-700>{{ adStruct.description }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Flags AD结构详情 -->
                  <div v-if="result.parsedContent.flags.data" mb-3 p-3 border border-green-200 rounded-lg bg-green-50>
                    <div text-xs text-green-700 font-medium mb-2>
                      🚩 Flags AD结构 (Type: 0x01)
                    </div>
                    <div text-xs space-y-2>
                      <div>
                        <span text-gray-600 font-medium>Flags数据：</span>
                        <span font-mono>0x{{ result.parsedContent.flags.data.toUpperCase() }}</span>
                      </div>
                      <div text-xs gap-2 grid grid-cols-1>
                        <div v-if="result.parsedContent.flags.supportsLEOnlyDiscoverable">
                          <span text-green-600>✓ LE Only Discoverable</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsGeneralDiscoverable">
                          <span text-green-600>✓ General Discoverable</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsBR_EDRNotSupported">
                          <span text-green-600>✓ BR/EDR Not Supported (LE Only)</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsLEAndBR_EDRController">
                          <span text-green-600>✓ LE and BR/EDR Controller (Simultaneous)</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsLEAndBR_EDRHost">
                          <span text-green-600>✓ LE and BR/EDR Host (Simultaneous)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- iBeacon AD结构详情 -->
                  <div v-if="result.parsedContent.iBeacon.proximityUUID" space-y-3>
                    <!-- 厂商信息 -->
                    <div p-3 border border-purple-200 rounded-lg bg-purple-50>
                      <div text-xs text-purple-700 font-medium mb-2>
                        🏢 厂商信息
                      </div>
                      <div text-xs space-y-1>
                        <div>
                          <span text-gray-600 font-medium>Company ID：</span>
                          <span font-mono>0x{{ result.parsedContent.iBeacon.companyId.toUpperCase() }}</span>
                          <span text-gray-500 ml-2>{{ result.parsedContent.iBeacon.companyId.toLowerCase() === '004c' ? '(Apple Inc.)' : '(其他厂商)' }}</span>
                        </div>
                        <div>
                          <span text-gray-600 font-medium>Subtype：</span>
                          <span font-mono>0x{{ result.parsedContent.iBeacon.subtype.toUpperCase() }}</span>
                          <span text-gray-500 ml-2>(数据子类型)</span>
                        </div>
                        <div>
                          <span text-gray-600 font-medium>iBeacon Type：</span>
                          <span font-mono>0x{{ result.parsedContent.iBeacon.iBeaconType.toUpperCase() }}</span>
                          <span text-gray-500 ml-2>(iBeacon数据类型)</span>
                        </div>
                      </div>
                    </div>

                    <!-- 标识信息 -->
                    <div p-3 border border-green-200 rounded-lg bg-green-50>
                      <div text-xs text-green-700 font-medium mb-2>
                        🏷️ 标识信息
                      </div>
                      <div text-xs space-y-2>
                        <div>
                          <span text-gray-600 font-medium>Proximity UUID：</span>
                          <span font-mono break-all>{{ result.parsedContent.iBeacon.proximityUUID }}</span>
                        </div>
                        <div text-xs gap-4 grid grid-cols-2>
                          <div>
                            <span text-gray-600 font-medium>Major：</span>
                            <span font-mono>{{ result.parsedContent.iBeacon.major }}</span>
                          </div>
                          <div>
                            <span text-gray-600 font-medium>Minor：</span>
                            <span font-mono>{{ result.parsedContent.iBeacon.minor }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 信号信息 -->
                    <div p-3 border border-yellow-200 rounded-lg bg-yellow-50>
                      <div text-xs text-yellow-700 font-medium mb-2>
                        📶 信号信息
                      </div>
                      <div text-xs>
                        <span text-gray-600 font-medium>Measured Power：</span>
                        <span font-mono>{{ result.parsedContent.iBeacon.measuredPower }}</span>
                        <span text-xs text-gray-500 ml-2>(1米距离处的信号强度)</span>
                      </div>
                    </div>
                  </div>

                  <!-- 解析错误提示 -->
                  <div v-if="result.parsedContent.hasError" text-sm text-orange-600>
                    <div mb-2 flex gap-2 items-center>
                      <span>⚠️</span>
                      <span font-medium>解析警告</span>
                    </div>
                    <p text-xs text-orange-500>
                      {{ result.parsedContent.errorMessage || '无法完全解析iBeacon数据' }}
                    </p>
                  </div>
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

    <!-- AD结构解析规则说明 -->
    <div mx-auto mt-8 max-w-7xl>
      <div p-6 rounded-lg bg-white shadow-lg>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center>
          <div rounded bg-purple-500 h-6 w-2 />
          AD结构解析规则说明
        </h2>

        <div mb-6 p-4 rounded-lg bg-blue-50>
          <p text-sm text-blue-800>
            <strong>蓝牙广播包采用AD (Advertising Data) 结构格式</strong>：每个AD结构由 [Length(1字节) + Type(1字节) + Data(Length字节)] 组成。
            一个广播包可包含多个AD结构，按顺序解析。
          </p>
        </div>

        <div overflow-x-auto>
          <table text-sm w-full border-collapse>
            <thead>
              <tr bg-gray-50>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  字节偏移
                </th>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  字段名称
                </th>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  数据类型
                </th>
                <th text-gray-700 font-medium px-4 py-2 text-left border border-gray-200>
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 基础广播包结构 -->
              <tr bg-blue-50>
                <td font-mono px-4 py-2 border border-gray-200 colspan="4">
                  <strong>📡 基础广播包结构</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  0
                </td>
                <td px-4 py-2 border border-gray-200>
                  Advertising Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200>
                  广播包类型 (0x00=可连接无定向广播)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  1-6
                </td>
                <td px-4 py-2 border border-gray-200>
                  MAC Address
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint8[6]
                </td>
                <td px-4 py-2 border border-gray-200>
                  设备MAC地址 (6字节)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  7
                </td>
                <td px-4 py-2 border border-gray-200>
                  RSSI
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  int8
                </td>
                <td px-4 py-2 border border-gray-200>
                  信号强度指示 (有符号整数)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  8+
                </td>
                <td px-4 py-2 border border-gray-200>
                  Advertising Data
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  bytes[]
                </td>
                <td px-4 py-2 border border-gray-200>
                  广播数据内容 (多个AD结构)
                </td>
              </tr>

              <!-- AD结构格式 -->
              <tr bg-green-50>
                <td font-mono px-4 py-2 border border-gray-200 colspan="4">
                  <strong>📋 AD结构通用格式</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  0
                </td>
                <td px-4 py-2 border border-gray-200>
                  Length
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200>
                  数据长度，表示后续Data字段的字节数 (不包括Length和Type字段)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  1
                </td>
                <td px-4 py-2 border border-gray-200>
                  Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200>
                  AD类型 (0x01=Flags, 0xFF=厂商自定义数据等)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  2+
                </td>
                <td px-4 py-2 border border-gray-200>
                  Data
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  bytes[]
                </td>
                <td px-4 py-2 border border-gray-200>
                  实际数据内容，长度由Length字段指定
                </td>
              </tr>

              <!-- Flags AD结构 -->
              <tr bg-yellow-50>
                <td font-mono px-4 py-2 border border-gray-200 colspan="4">
                  <strong>🚩 Flags AD结构 (Type: 0x01)</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  0
                </td>
                <td px-4 py-2 border border-gray-200>
                  Length
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0x02
                </td>
                <td px-4 py-2 border border-gray-200>
                  固定长度2字节
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  1
                </td>
                <td px-4 py-2 border border-gray-200>
                  Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0x01
                </td>
                <td px-4 py-2 border border-gray-200>
                  Flags类型标识
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  2
                </td>
                <td px-4 py-2 border border-gray-200>
                  Flags Data
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200>
                  设备能力标志位：<br>
                  • Bit 0: LE Only Discoverable<br>
                  • Bit 1: General Discoverable<br>
                  • Bit 2: BR/EDR Not Supported<br>
                  • Bit 3: LE and BR/EDR Controller<br>
                  • Bit 4: LE and BR/EDR Host
                </td>
              </tr>

              <!-- iBeacon AD结构 -->
              <tr bg-orange-50>
                <td font-mono px-4 py-2 border border-gray-200 colspan="4">
                  <strong>🍎 iBeacon AD结构 (Type: 0xFF, Apple Manufacturer)</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  0
                </td>
                <td px-4 py-2 border border-gray-200>
                  Length
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0x1A
                </td>
                <td px-4 py-2 border border-gray-200>
                  固定长度26字节 (25字节数据 + 1字节Length)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  1
                </td>
                <td px-4 py-2 border border-gray-200>
                  Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0xFF
                </td>
                <td px-4 py-2 border border-gray-200>
                  厂商自定义数据类型
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  2-3
                </td>
                <td px-4 py-2 border border-gray-200>
                  Company ID
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint16 (大端序)
                </td>
                <td px-4 py-2 border border-gray-200>
                  厂商标识符，Apple为0x004C
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  4
                </td>
                <td px-4 py-2 border border-gray-200>
                  Subtype
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0x02
                </td>
                <td px-4 py-2 border border-gray-200>
                  iBeacon子类型标识
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  5
                </td>
                <td px-4 py-2 border border-gray-200>
                  iBeacon Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  0x15
                </td>
                <td px-4 py-2 border border-gray-200>
                  iBeacon数据类型标识 (固定值21)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  6-21
                </td>
                <td px-4 py-2 border border-gray-200>
                  Proximity UUID
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint8[16]
                </td>
                <td px-4 py-2 border border-gray-200>
                  设备唯一标识符，格式为8-4-4-4-12的标准UUID
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  22-23
                </td>
                <td px-4 py-2 border border-gray-200>
                  Major
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint16 (大端序)
                </td>
                <td px-4 py-2 border border-gray-200>
                  主要标识，用于分组管理 (如商场楼层)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  24-25
                </td>
                <td px-4 py-2 border border-gray-200>
                  Minor
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  uint16 (大端序)
                </td>
                <td px-4 py-2 border border-gray-200>
                  次要标识，用于细分定位 (如具体店铺)
                </td>
              </tr>
              <tr hover:bg-gray-50>
                <td font-mono px-4 py-2 border border-gray-200>
                  26
                </td>
                <td px-4 py-2 border border-gray-200>
                  Measured Power
                </td>
                <td font-mono px-4 py-2 border border-gray-200>
                  int8
                </td>
                <td px-4 py-2 border border-gray-200>
                  1米距离处的信号强度，用于距离计算 (有符号整数)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 示例解析 -->
        <div mt-6 p-4 rounded-lg bg-purple-50>
          <h3 text-sm text-purple-800 font-semibold mb-2>
            📝 示例解析
          </h3>
          <p text-xs text-purple-700 mb-2>
            <strong>广播包数据:</strong> 00d25f2dab2ed0ba0201061aff4c000215fda50693a4e24fb1afcfc6eb07647825271128a6b5
          </p>
          <div text-xs text-purple-600 space-y-1>
            <div>• <strong>基础部分:</strong> 00 d25f2dab2ed0 ba = Type(0x00) + MAC(d2:5f:2d:ab:2e:d0) + RSSI(-70dBm)</div>
            <div>• <strong>AD结构1 (Flags):</strong> 020106 = Length(2) + Type(0x01) + Data(0x06)</div>
            <div>• <strong>AD结构2 (iBeacon):</strong> 1aff4c000215fda50693a4e24fb1afcfc6eb07647825271128a6b5</div>
            <div>  └─ Length(0x1A=26) + Type(0xFF) + Company ID(0x004C=Apple) + Subtype(0x02) + iBeacon Type(0x15) + UUID + Major + Minor + TxPower</div>
          </div>
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
