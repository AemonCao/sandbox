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

// 扫描返回包解析结果接口
interface ScanResponseData {
  macAddress: string
  rssi: number
  headerId: string
  vendorId: string
  dataLength: number
  dataType: string
  deviceName?: string
  customField?: string
  major?: number
  minor?: number
  voltage?: number
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

  // 扫描返回包数据 (04开头)
  scanResponse?: ScanResponseData

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
/**
 * 数据包解析主入口
 *
 * @param {string} hexString 十六进制字符串
 * @return {ParsedPacket} 解析后的数据包对象
 */
function parsePacket(hexString: string): ParsedPacket {
  // 移除空格和换行符
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase()

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

  // 检查报文类型
  const packetType = cleanHex.substring(0, 2)

  if (packetType === '04') {
    // 处理04开头的扫描返回包 (固定66字节长度)
    return parseScanResponsePacket(hexString)
  }
  else {
    // 处理普通广播包 (至少9字节)
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

    return parseNormalAdvertisementPacket(hexString)
  }
}

// 解析扫描返回包 (04开头)
/**
 * 处理 0x04 扫描响应包
 *
 * @param {string} hexString 十六进制字符串
 * @return {ParsedPacket} 解析后的数据包对象
 */
function parseScanResponsePacket(hexString: string): ParsedPacket {
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase()

  try {
    // 检查最小长度 (至少33字节 = 66个十六进制字符)
    if (cleanHex.length < 66) {
      return {
        original: hexString,
        type: '04',
        macAddress: '',
        rssi: 0,
        content: '',
        valid: false,
        error: `扫描返回包长度不足，至少需要33字节(66个十六进制字符)，实际为${cleanHex.length / 2}字节(${cleanHex.length}个十六进制字符)`,
      }
    }

    // 解析基本字段用于返回结果
    const type = cleanHex.substring(0, 2) // 0x04 - 报文类型
    const macBytes = cleanHex.substring(2, 14) // 字节1-6 - MAC地址
    const rssiHex = cleanHex.substring(14, 16) // 字节7 - RSSI

    // 格式化MAC地址
    const macAddress = macBytes.match(/.{2}/g)?.join(':').toUpperCase() || ''

    // 计算RSSI (有符号8位整数)
    let rssi = Number.parseInt(rssiHex, 16)
    if (rssi > 127) {
      rssi = rssi - 256
    }

    // 解析扫描返回包内容
    const parsedContent = parseScanResponseContent(cleanHex)

    return {
      original: hexString,
      type,
      macAddress,
      rssi,
      content: cleanHex.substring(16), // 从RSSI后的所有数据
      parsedContent,
      valid: true,
    }
  }
  catch (error) {
    return {
      original: hexString,
      type: '04',
      macAddress: '',
      rssi: 0,
      content: '',
      valid: false,
      error: `扫描返回包解析错误: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

// 解析扫描返回包内容
/**
 * 从扫描响应数据提取字段
 *
 * @param {string} hexData 十六进制数据字符串
 * @return {ParsedContent} 解析后的内容对象
 */
function parseScanResponseContent(hexData: string): ParsedContent {
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
    scanResponse: undefined,
    hasError: false,
  }

  try {
    // 根据新表格解析04扫描返回包 (固定33字节长度)
    if (hexData.length < 66) {
      parsed.hasError = true
      parsed.errorMessage = `扫描返回包长度不足，需要33字节(66个十六进制字符)，当前为${hexData.length / 2}字节`
      return parsed
    }

    // 按照表格结构解析字段
    // const packetType = hexData.substring(0, 2) // 字节0: 0x04 报文类型
    const macBytes = hexData.substring(2, 14) // 字节1-6: MAC地址 (6字节)
    const rssiHex = hexData.substring(14, 16) // 字节7: RSSI (1字节)
    const headerId = hexData.substring(16, 20) // 字节8-9: 广播标识头 (2字节)
    const vendorId = hexData.substring(20, 24) // 字节10-11: 厂商ID (2字节)
    const dataTypeHex = hexData.substring(24, 26) // 字节12: 数据长度 (1字节)
    const dataLengthHex = hexData.substring(26, 28) // 字节13: 数据类型 (1字节)

    // 字节14-22: 设备名称 (根据数据长度字段确定，表格显示9字节)
    const dataLength = Number.parseInt(dataLengthHex, 16)
    const deviceNameStart = 28
    const deviceNameEnd = deviceNameStart + dataLength * 2
    let deviceNameData = ''
    if (hexData.length >= deviceNameEnd) {
      deviceNameData = hexData.substring(deviceNameStart, deviceNameEnd)
    }

    // 字节23-26: UUID或自定义字段 (4字节)
    const customFieldStart = deviceNameEnd
    const customFieldEnd = customFieldStart + 8
    let customFieldData = ''
    if (hexData.length >= customFieldEnd) {
      customFieldData = hexData.substring(customFieldStart, customFieldEnd)
    }

    // 字节27-28: Major值 (2字节)
    const majorStart = customFieldEnd
    const majorEnd = majorStart + 4
    let majorHex = ''
    if (hexData.length >= majorEnd) {
      majorHex = hexData.substring(majorStart, majorEnd)
    }

    // 字节29-30: Minor值 (2字节)
    const minorStart = majorEnd
    const minorEnd = minorStart + 4
    let minorHex = ''
    if (hexData.length >= minorEnd) {
      minorHex = hexData.substring(minorStart, minorEnd)
    }

    // 字节31-32: 电压字段 (2字节)
    const voltageStart = minorEnd
    const voltageEnd = voltageStart + 4
    let voltageHex = ''
    if (hexData.length >= voltageEnd) {
      voltageHex = hexData.substring(voltageStart, voltageEnd)
    }

    // 格式化MAC地址
    const macAddress = macBytes.match(/.{2}/g)?.join(':').toUpperCase() || ''

    // 计算RSSI (有符号8位整数)
    let rssi = Number.parseInt(rssiHex, 16)
    if (rssi > 127) {
      rssi = rssi - 256
    }

    // 解析设备名称 (数据类型0x09表示完整名称)
    let deviceName = ''
    if (dataTypeHex === '09' && deviceNameData) {
      deviceName = hexToString(deviceNameData)
    }

    // 解析Major (大端序)
    let major: number | undefined
    if (majorHex.length === 4) {
      major = Number.parseInt(majorHex, 16)
    }

    // 解析Minor (大端序)
    let minor: number | undefined
    if (minorHex.length === 4) {
      minor = Number.parseInt(minorHex, 16)
    }

    // 解析电压 (小端序，最后2字节为电量信息)
    let voltage: number | undefined
    let batteryInfo = ''
    if (voltageHex.length === 4) {
      // 小端序转换
      const voltageRaw = Number.parseInt(`${voltageHex.substring(2, 4)}${voltageHex.substring(0, 2)}`, 16)
      // 首先除以100
      const baseVoltage = voltageRaw / 100
      // 然后除以电压系数
      const normalBatteryVoltage = baseVoltage / 1.35 // 一般电池系数
      const buttonCellBatteryVoltage = baseVoltage / 1.5 // 纽扣电池系数

      // 计算电量百分比
      const normalBatteryPercentage = calculateBatteryPercentage(normalBatteryVoltage)
      const buttonCellBatteryPercentage = calculateBatteryPercentage(buttonCellBatteryVoltage)

      // 默认使用一般电池电压
      voltage = normalBatteryVoltage
      batteryInfo = `原始值: ${voltageRaw}, 基础电压: ${baseVoltage.toFixed(2)}V, 一般电池: ${normalBatteryVoltage.toFixed(2)}V (${normalBatteryPercentage}%), 纽扣电池: ${buttonCellBatteryVoltage.toFixed(2)}V (${buttonCellBatteryPercentage}%)`
    }

    // 创建扫描返回包数据
    parsed.scanResponse = {
      macAddress,
      rssi,
      headerId: headerId.toUpperCase(),
      vendorId: vendorId.toUpperCase(),
      dataLength,
      dataType: `0x${dataTypeHex.toUpperCase()}`,
      deviceName: deviceName || undefined,
      customField: customFieldData || undefined,
      major,
      minor,
      voltage,
    }

    // 添加电池信息到描述中
    if (batteryInfo) {
      parsed.errorMessage = batteryInfo // 暂时用errorMessage字段显示电池计算信息
    }

    // 检查解析状态
    parsed.hasError = !parsed.scanResponse.macAddress
    if (parsed.hasError && !parsed.errorMessage) {
      parsed.errorMessage = '扫描返回包解析失败'
    }
  }
  catch (error) {
    parsed.hasError = true
    parsed.errorMessage = error instanceof Error ? error.message : '解析过程中发生未知错误'
  }

  return parsed
}

// 十六进制字符串转ASCII字符串
/**
 * 十六进制转 ASCII 字符串
 *
 * @param {string} hex 十六进制字符串
 * @return {string} ASCII 字符串
 */
function hexToString(hex: string): string {
  let result = ''
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = Number.parseInt(hex.substring(i, i + 2), 16)
    if (charCode === 0)
      break // 遇到0字符停止
    result += String.fromCharCode(charCode)
  }
  return result
}

// 计算电量百分比 (2.6V~3.65V线性范围)
/**
 * 从电压计算电池百分比
 *
 * @param {number} voltage 电压值（伏特）
 * @return {number} 电池百分比 (0-100)
 */
function calculateBatteryPercentage(voltage: number): number {
  const minVoltage = 2.6
  const maxVoltage = 3.65

  if (voltage <= minVoltage) {
    return 0
  }
  if (voltage >= maxVoltage) {
    return 100
  }

  // 线性计算: (电压 - 最小电压) / (最大电压 - 最小电压) * 100
  const percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100
  return Math.round(percentage)
}

// 解析普通广播包
/**
 * 处理标准 BLE 广告包
 *
 * @param {string} hexString 十六进制字符串
 * @return {ParsedPacket} 解析后的数据包对象
 */
function parseNormalAdvertisementPacket(hexString: string): ParsedPacket {
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase()

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
/**
 * 从广告数据解析 AD 结构
 *
 * @param {string} content 广告数据内容
 * @return {ParsedContent} 解析后的内容对象
 */
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

// 过滤状态
const filters = ref({
  packetType: '',
  major: '',
  minor: '',
  rssiMin: '',
  rssiMax: '',
  voltageMin: '',
  voltageMax: '',
  batteryMin: '',
  batteryMax: '',
})

// 过滤器展开状态
const showFilters = ref(false)

// 解析结果
const parsedResults = computed(() => {
  return packets.value.map(packet => parsePacket(packet))
})

// 过滤后的结果
const filteredResults = computed(() => {
  let results = parsedResults.value

  // 按广播包类型过滤
  if (filters.value.packetType) {
    results = results.filter(result => result.type.toLowerCase() === filters.value.packetType.toLowerCase())
  }

  // 按Major过滤
  if (filters.value.major) {
    const majorFilter = filters.value.major.toLowerCase()
    results = results.filter((result) => {
      // 检查扫描返回包的Major
      if (result.parsedContent?.scanResponse?.major !== undefined) {
        return result.parsedContent.scanResponse.major.toString().includes(majorFilter)
      }
      // 检查iBeacon的Major
      if (result.parsedContent?.iBeacon?.major) {
        return result.parsedContent.iBeacon.major.toLowerCase().includes(majorFilter)
      }
      return false
    })
  }

  // 按Minor过滤
  if (filters.value.minor) {
    const minorFilter = filters.value.minor.toLowerCase()
    results = results.filter((result) => {
      // 检查扫描返回包的Minor
      if (result.parsedContent?.scanResponse?.minor !== undefined) {
        return result.parsedContent.scanResponse.minor.toString().includes(minorFilter)
      }
      // 检查iBeacon的Minor
      if (result.parsedContent?.iBeacon?.minor) {
        return result.parsedContent.iBeacon.minor.toLowerCase().includes(minorFilter)
      }
      return false
    })
  }

  // 按RSSI范围过滤
  if (filters.value.rssiMin !== '') {
    const rssiMin = Number.parseInt(filters.value.rssiMin)
    if (!Number.isNaN(rssiMin)) {
      results = results.filter(result => result.rssi >= rssiMin)
    }
  }
  if (filters.value.rssiMax !== '') {
    const rssiMax = Number.parseInt(filters.value.rssiMax)
    if (!Number.isNaN(rssiMax)) {
      results = results.filter(result => result.rssi <= rssiMax)
    }
  }

  // 按电压范围过滤
  if (filters.value.voltageMin !== '') {
    const voltageMin = Number.parseFloat(filters.value.voltageMin)
    if (!Number.isNaN(voltageMin)) {
      results = results.filter((result) => {
        if (result.parsedContent?.scanResponse?.voltage !== undefined) {
          return result.parsedContent.scanResponse.voltage >= voltageMin
        }
        return false
      })
    }
  }
  if (filters.value.voltageMax !== '') {
    const voltageMax = Number.parseFloat(filters.value.voltageMax)
    if (!Number.isNaN(voltageMax)) {
      results = results.filter((result) => {
        if (result.parsedContent?.scanResponse?.voltage !== undefined) {
          return result.parsedContent.scanResponse.voltage <= voltageMax
        }
        return false
      })
    }
  }

  // 按电量百分比范围过滤
  if (filters.value.batteryMin !== '') {
    const batteryMin = Number.parseInt(filters.value.batteryMin)
    if (!Number.isNaN(batteryMin)) {
      results = results.filter((result) => {
        if (result.parsedContent?.scanResponse?.voltage !== undefined) {
          return calculateBatteryPercentage(result.parsedContent.scanResponse.voltage) >= batteryMin
        }
        return false
      })
    }
  }
  if (filters.value.batteryMax !== '') {
    const batteryMax = Number.parseInt(filters.value.batteryMax)
    if (!Number.isNaN(batteryMax)) {
      results = results.filter((result) => {
        if (result.parsedContent?.scanResponse?.voltage !== undefined) {
          return calculateBatteryPercentage(result.parsedContent.scanResponse.voltage) <= batteryMax
        }
        return false
      })
    }
  }

  return results
})

// 添加广播包
/**
 * 添加数据包（支持 JSON 数组或换行分隔）
 */
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
/**
 * 按索引删除数据包
 *
 * @param {number} index 数据包索引
 */
function removePacket(index: number) {
  packets.value.splice(index, 1)
}

// 清空所有
/**
 * 清除所有数据包和输入
 */
function clearAll() {
  packets.value = []
  inputText.value = ''
}

// 滚动到指定广播包
/**
 * 滚动到结果中的特定数据包
 *
 * @param {number} index 数据包索引
 */
function scrollToPacket(index: number) {
  const element = document.getElementById(`packet-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 滚动到顶部
/**
 * 滚动结果到顶部
 */
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

/**
 * 映射广告类型代码到描述
 *
 * @param {string} type 类型代码（十六进制字符串）
 * @return {string} 类型描述
 */
function getTypeDescription(type: string): string {
  // 将十六进制字符串转换为数字，然后查找对应的描述
  const typeCode = Number.parseInt(type, 16)
  return typeDescriptions[typeCode] || '未知类型'
}

// 重置过滤器
/**
 * 重置过滤器状态
 */
function resetFilters() {
  filters.value = {
    packetType: '',
    major: '',
    minor: '',
    rssiMin: '',
    rssiMax: '',
    voltageMin: '',
    voltageMax: '',
    batteryMin: '',
    batteryMax: '',
  }
}

// 检查是否有活动过滤器
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => value !== '')
})
</script>

<template>
  <div p-4 min-h-screen from-gray-50 to-blue-50 bg-gradient-to-br dark:from-gray-900 dark:to-blue-900>
    <div mb-6>
      <h1 text-3xl text-gray-800 font-bold text-center dark:text-white>
        蓝牙广播包解析器
      </h1>
      <p text-gray-600 mt-2 text-center dark:text-gray-300>
        支持同时解析多个蓝牙广播包和扫描返回包，支持批量输入
      </p>
    </div>

    <div mx-auto gap-6 grid grid-cols-1 max-w-full lg:px-4 lg:grid-cols-2>
      <!-- 左侧输入区域 -->
      <div
        p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800 lg:h-fit lg:max-h-screen dark:shadow-gray-700 lg:top-4 lg:sticky lg:overflow-y-auto
        style="max-height: calc(100vh - 120px)"
      >
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center dark:text-white>
          <div rounded bg-blue-500 h-6 w-2 />
          输入广播包数据
        </h2>

        <div mb-4>
          <label text-sm text-gray-700 font-medium mb-2 block dark:text-gray-300>
            请输入广播包数据（支持每行一个或JSON数组格式）
          </label>
          <textarea
            v-model="inputText"
            placeholder="格式1（普通广播包）：&#10;00aea273f4f8deaa0201061aff4c000215ab8190d5d11e4941acc442f30510b40827473bd4b5&#10;&#10;格式2（扫描返回包 04开头）：&#10;046c3d20c67b90f00303f0ff0a094265654c696e6b65720a167825271436cd3401003401...&#10;&#10;格式3（JSON数组）：&#10;[&quot;00aea273f4f8deaa020106...&quot;, &quot;046c3d20c67b90f00303...&quot;]"

            text-sm font-mono px-3 py-2 border border-gray-300 rounded-md h-32 w-full resize-none dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500
            rows="6"
          />
        </div>

        <div flex gap-3>
          <button
            :disabled="!inputText.trim()"
            text-white px-4 py-2 rounded-md bg-blue-500 flex-1 transition-colors
            disabled:bg-gray-300 hover:bg-blue-600 disabled:cursor-not-allowed dark:disabled:bg-gray-600
            @click="addPackets"
          >
            添加广播包
          </button>
          <button
            :disabled="packets.length === 0"
            text-white px-4 py-2 rounded-md bg-red-500 flex-1 transition-colors
            disabled:bg-gray-300 hover:bg-red-600 disabled:cursor-not-allowed dark:disabled:bg-gray-600
            @click="clearAll"
          >
            清空所有
          </button>
        </div>

        <!-- 已添加的广播包列表 -->
        <div v-if="packets.length > 0" mt-6>
          <div mb-3 flex items-center justify-between>
            <h3 text-sm text-gray-700 font-medium dark:text-gray-300>
              已添加的广播包 ({{ packets.length }})
            </h3>
            <button
              v-if="packets.length > 10"
              text-xs text-blue-600 transition-colors dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
              @click="scrollToTop"
            >
              ↑ 回到顶部
            </button>
          </div>
          <div border border-gray-200 rounded-md max-h-48 overflow-y-auto dark:border-gray-600 dark:bg-gray-700>
            <div
              v-for="(packet, index) in packets"
              :key="index"

              group p-2 border-b border-gray-100 flex items-center justify-between last:border-b-0 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600
            >
              <button
                text-xs text-blue-600 font-mono text-left flex-1 truncate transition-colors dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200
                @click="scrollToPacket(index)"
              >
                #{{ index + 1 }}: {{ packet }}
              </button>
              <div flex gap-1>
                <button
                  text-xs text-gray-500 opacity-0 transition-opacity dark:text-gray-400 hover:text-blue-600 group-hover:opacity-100 dark:hover:text-blue-400
                  @click="scrollToPacket(index)"
                >
                  查看
                </button>
                <button
                  class="text-sm text-red-500 ml-2 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
      <div p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-700>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center justify-between dark:text-white>
          <div flex gap-2 items-center>
            <div rounded bg-green-500 h-6 w-2 />
            解析结果
          </div>
          <div flex gap-2 items-center>
            <div text-sm text-gray-500 font-normal dark:text-gray-400>
              共 {{ parsedResults.length }} 个广播包
              <span v-if="hasActiveFilters" text-blue-600 dark:text-blue-400>
                (已过滤: {{ filteredResults.length }})
              </span>
            </div>
            <button
              v-if="parsedResults.length > 10"
              text-xs text-blue-600 transition-colors dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
              @click="scrollToTop"
            >
              ↑ 回到顶部
            </button>
          </div>
        </h2>

        <!-- 过滤器控件 -->
        <div mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-700>
          <div mb-3 flex items-center justify-between>
            <h3 text-sm text-gray-700 font-medium flex gap-2 items-center dark:text-gray-200>
              <div rounded bg-indigo-500 h-4 w-2 />
              过滤器
            </h3>
            <div flex gap-2>
              <button
                v-if="hasActiveFilters"
                text-xs text-red-600 transition-colors dark:text-red-400 hover:text-red-800 dark:hover:text-red-300
                @click="resetFilters"
              >
                重置过滤器
              </button>
              <button
                text-xs text-indigo-600 transition-colors dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300
                @click="showFilters = !showFilters"
              >
                {{ showFilters ? '收起' : '展开' }} {{ showFilters ? '▲' : '▼' }}
              </button>
            </div>
          </div>

          <div v-show="showFilters" space-y-3>
            <!-- 第一行：广播包类型、Major、Minor -->
            <div gap-3 grid grid-cols-3>
              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  广播包类型
                </label>
                <select
                  v-model="filters.packetType"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">
                    全部类型
                  </option>
                  <option value="00">
                    00 - 可连接无定向广播
                  </option>
                  <option value="01">
                    01 - 可连接定向广播
                  </option>
                  <option value="02">
                    02 - 不可连接无定向广播
                  </option>
                  <option value="03">
                    03 - 可扫描无定向广播
                  </option>
                  <option value="04">
                    04 - 扫描响应
                  </option>
                </select>
              </div>

              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  Major
                </label>
                <input
                  v-model="filters.major"
                  type="text"
                  placeholder="输入Major值"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>

              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  Minor
                </label>
                <input
                  v-model="filters.minor"
                  type="text"
                  placeholder="输入Minor值"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>
            </div>

            <!-- 第二行：RSSI范围 -->
            <div gap-3 grid grid-cols-2>
              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  RSSI最小值 (dBm)
                </label>
                <input
                  v-model="filters.rssiMin"
                  type="number"
                  placeholder="-100"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>

              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  RSSI最大值 (dBm)
                </label>
                <input
                  v-model="filters.rssiMax"
                  type="number"
                  placeholder="-30"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>
            </div>

            <!-- 第三行：电压范围 -->
            <div gap-3 grid grid-cols-2>
              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  电压最小值 (V)
                </label>
                <input
                  v-model="filters.voltageMin"
                  type="number"
                  step="0.01"
                  placeholder="2.6"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>

              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  电压最大值 (V)
                </label>
                <input
                  v-model="filters.voltageMax"
                  type="number"
                  step="0.01"
                  placeholder="3.65"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>
            </div>

            <!-- 第四行：电量范围 -->
            <div gap-3 grid grid-cols-2>
              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  电量最小值 (%)
                </label>
                <input
                  v-model="filters.batteryMin"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>

              <div>
                <label text-xs text-gray-600 font-medium mb-1 block dark:text-gray-300>
                  电量最大值 (%)
                </label>
                <input
                  v-model="filters.batteryMax"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  class="text-sm px-2 py-1 border border-gray-300 rounded w-full dark:text-gray-200 dark:border-gray-600 focus:border-blue-500 dark:bg-gray-800 focus:ring-1 focus:ring-blue-500"
                >
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredResults.length === 0" text-gray-500 py-12 text-center dark:text-gray-400>
          <div text-6xl mb-4>
            📡
          </div>
          <div v-if="parsedResults.length === 0">
            暂无解析结果，请在左侧输入广播包数据
          </div>
          <div v-else>
            没有符合过滤条件的结果
            <div text-sm mt-2>
              <button
                text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
                @click="resetFilters"
              >
                清除过滤器
              </button>
            </div>
          </div>
        </div>

        <div v-else max-h-screen overflow-y-auto space-y-4 style="max-height: calc(100vh - 200px);">
          <div
            v-for="(result, index) in filteredResults"
            :id="`packet-${index}`"
            :key="index"
            class="p-4 border rounded-lg scroll-mt-4"
            :class="result.valid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'"
          >
            <div mb-3 flex items-center justify-between>
              <h3 text-sm text-gray-700 font-semibold dark:text-gray-200>
                广播包 #{{ index + 1 }}
              </h3>
              <span
                text-xs px-2 py-1 rounded-full
                :class="result.valid ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300'"
              >
                {{ result.valid ? '解析成功' : '解析失败' }}
              </span>
            </div>

            <div v-if="result.valid" space-y-2>
              <div text-sm gap-4 grid grid-cols-2>
                <div>
                  <span text-gray-600 font-medium dark:text-gray-400>原始数据：</span>
                  <span text-xs text-gray-800 font-mono break-all dark:text-gray-200>{{ result.original }}</span>
                </div>
                <div>
                  <span text-gray-600 font-medium dark:text-gray-400>广播包类型：</span>
                  <span text-sm font-mono dark:text-gray-200>{{ result.type.toUpperCase() }} ({{ getTypeDescription(result.type) }})</span>
                </div>
                <div>
                  <span text-gray-600 font-medium dark:text-gray-400>MAC地址：</span>
                  <span text-sm text-blue-600 font-mono>{{ result.macAddress }}</span>
                </div>
                <div>
                  <span text-gray-600 font-medium dark:text-gray-400>RSSI：</span>
                  <span
                    text-sm font-mono
                    :class="result.rssi < -70 ? 'text-red-600' : result.rssi < -60 ? 'text-yellow-600' : 'text-green-600'"
                  >
                    {{ result.rssi }} dBm
                  </span>
                </div>
              </div>

              <div v-if="result.content">
                <span text-sm text-gray-600 font-medium dark:text-gray-400>广播包内容：</span>
                <div text-xs text-gray-800 font-mono mt-1 p-2 rounded bg-gray-100 break-all dark:text-gray-200 dark:bg-gray-700>
                  {{ result.content.toUpperCase() }}
                </div>

                <!-- 扫描返回包解析 -->
                <div v-if="result.parsedContent && result.parsedContent.scanResponse" mt-4>
                  <h4 text-sm text-gray-700 font-medium mb-3 flex gap-2 items-center dark:text-gray-200>
                    <div rounded bg-cyan-500 h-4 w-2 />
                    🔍 扫描返回包解析
                    <span text-xs text-cyan-800 px-2 py-1 rounded-full bg-cyan-100 dark:text-cyan-200 dark:bg-cyan-800>类型: 0x04</span>
                  </h4>

                  <!-- 扫描返回包基本信息 -->
                  <div mb-3 p-3 border border-cyan-200 rounded-lg bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900>
                    <div text-xs text-cyan-700 font-medium mb-2 dark:text-cyan-300>
                      📡 设备基本信息
                    </div>
                    <div text-xs space-y-2>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>设备MAC：</span>
                        <span text-blue-600 font-mono>{{ result.parsedContent.scanResponse.macAddress }}</span>
                      </div>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>信号强度：</span>
                        <span font-mono :class="result.parsedContent.scanResponse.rssi < -70 ? 'text-red-600' : result.parsedContent.scanResponse.rssi < -60 ? 'text-yellow-600' : 'text-green-600'">
                          {{ result.parsedContent.scanResponse.rssi }} dBm
                        </span>
                      </div>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>广播标识头：</span>
                        <span font-mono dark:text-gray-200>{{ result.parsedContent.scanResponse.headerId }}</span>
                        <span text-gray-500 ml-1 dark:text-gray-400>(固定值 0x0303)</span>
                      </div>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>厂商ID：</span>
                        <span font-mono dark:text-gray-200>{{ result.parsedContent.scanResponse.vendorId }}</span>
                      </div>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>数据长度：</span>
                        <span font-mono dark:text-gray-200>{{ result.parsedContent.scanResponse.dataLength }} 字节</span>
                      </div>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>数据类型：</span>
                        <span font-mono dark:text-gray-200>{{ result.parsedContent.scanResponse.dataType }}</span>
                        <span text-gray-500 ml-1 dark:text-gray-400>{{ result.parsedContent.scanResponse.dataType === '0x09' ? '(完整名称)' : '(其他类型)' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 设备名称 -->
                  <div
                    v-if="result.parsedContent.scanResponse.deviceName"
                    mb-3 p-3 border border-green-200 rounded-lg bg-green-50 dark:border-green-700 dark:bg-green-900
                  >
                    <div text-xs text-green-700 font-medium mb-2 dark:text-green-300>
                      🏷️ 设备名称
                    </div>
                    <div text-xs>
                      <span text-green-800 font-mono dark:text-green-200>{{ result.parsedContent.scanResponse.deviceName }}</span>
                    </div>
                  </div>

                  <!-- 自定义字段 -->
                  <div v-if="result.parsedContent.scanResponse.customField" mb-3 p-3 border border-purple-200 rounded-lg bg-purple-50 dark:border-purple-700 dark:bg-purple-900>
                    <div text-xs text-purple-700 font-medium mb-2 dark:text-purple-300>
                      🔧 自定义字段 / UUID
                    </div>
                    <div text-xs>
                      <span text-purple-800 font-mono dark:text-purple-200>{{ result.parsedContent.scanResponse.customField.toUpperCase() }}</span>
                    </div>
                  </div>

                  <!-- 标识信息 (Major/Minor) -->
                  <div v-if="result.parsedContent.scanResponse.major !== undefined || result.parsedContent.scanResponse.minor !== undefined" mb-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:border-blue-700 dark:bg-blue-900>
                    <div text-xs text-blue-700 font-medium mb-2 dark:text-blue-300>
                      📍 标识信息 (Major/Minor)
                    </div>
                    <div text-xs gap-4 grid grid-cols-2>
                      <div v-if="result.parsedContent.scanResponse.major !== undefined">
                        <span text-gray-600 font-medium dark:text-gray-400>Major：</span>
                        <span text-blue-800 font-mono dark:text-blue-200>{{ result.parsedContent.scanResponse.major }}</span>
                      </div>
                      <div v-if="result.parsedContent.scanResponse.minor !== undefined">
                        <span text-gray-600 font-medium dark:text-gray-400>Minor：</span>
                        <span text-blue-800 font-mono dark:text-blue-200>{{ result.parsedContent.scanResponse.minor }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 电压信息 -->
                  <div v-if="result.parsedContent.scanResponse.voltage !== undefined" mb-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900>
                    <div text-xs text-yellow-700 font-medium mb-2 dark:text-yellow-300>
                      ⚡ 电压信息
                    </div>
                    <div text-xs space-y-2>
                      <!-- 电压计算详情 -->
                      <div v-if="result.parsedContent.errorMessage && result.parsedContent.errorMessage.includes('原始值')">
                        <div text-xs text-gray-600 font-medium mb-1 dark:text-gray-400>
                          电压计算详情：
                        </div>
                        <div text-xs text-gray-500 pl-2 dark:text-gray-400>
                          {{ result.parsedContent.errorMessage }}
                        </div>
                      </div>

                      <!-- 两种电池类型的结果 -->
                      <div gap-2 grid grid-cols-1>
                        <div p-2 border border-green-200 rounded bg-green-50>
                          <div text-xs text-green-700 font-medium>
                            一般电池 (系数 1.35)：
                          </div>
                          <div flex gap-2 items-center>
                            <div text-sm text-green-800 font-mono>
                              {{ result.parsedContent.scanResponse.voltage.toFixed(2) }} V
                            </div>
                            <div text-xs px-2 py-1 rounded-full :class="calculateBatteryPercentage(result.parsedContent.scanResponse.voltage) > 50 ? 'bg-green-100 text-green-800' : calculateBatteryPercentage(result.parsedContent.scanResponse.voltage) > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'">
                              {{ calculateBatteryPercentage(result.parsedContent.scanResponse.voltage) }}%
                            </div>
                          </div>
                        </div>
                        <div p-2 border border-blue-200 rounded bg-blue-50>
                          <div text-xs text-blue-700 font-medium>
                            纽扣电池 (系数 1.5)：
                          </div>
                          <div flex gap-2 items-center>
                            <div text-sm text-blue-800 font-mono>
                              {{ (result.parsedContent.scanResponse.voltage * 1.35 / 1.5).toFixed(2) }} V
                            </div>
                            <div text-xs px-2 py-1 rounded-full :class="calculateBatteryPercentage(result.parsedContent.scanResponse.voltage * 1.35 / 1.5) > 50 ? 'bg-green-100 text-green-800' : calculateBatteryPercentage(result.parsedContent.scanResponse.voltage * 1.35 / 1.5) > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'">
                              {{ calculateBatteryPercentage(result.parsedContent.scanResponse.voltage * 1.35 / 1.5) }}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div text-xs text-gray-500 dark:text-gray-400>
                        电池有效工作电压范围: 2.6~3.65V
                      </div>
                    </div>
                  </div>
                </div>

                <!-- AD结构详细解析 -->
                <div v-else-if="result.parsedContent && result.parsedContent.adStructures.length > 0" mt-4>
                  <h4 text-sm text-gray-700 font-medium mb-3 flex gap-2 items-center dark:text-gray-200>
                    <div rounded bg-orange-500 h-4 w-2 />
                    <span v-if="result.parsedContent.iBeacon.proximityUUID" flex gap-2 items-center>
                      🍎 iBeacon 数据解析
                      <span text-xs text-blue-800 px-2 py-1 rounded-full bg-blue-100 dark:text-blue-200 dark:bg-blue-800>{{ result.parsedContent.iBeacon.description }}</span>
                    </span>
                    <span v-else>
                      广播数据解析
                      <span text-xs text-gray-800 ml-2 px-2 py-1 rounded-full bg-gray-100 dark:text-gray-200 dark:bg-gray-700>{{ result.parsedContent.adStructures.length }} 个AD结构</span>
                    </span>
                  </h4>

                  <!-- AD结构概览 -->
                  <div v-if="result.parsedContent.adStructures.length > 0" mb-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:border-blue-700 dark:bg-blue-900>
                    <div text-xs text-blue-700 font-medium mb-2 dark:text-blue-300>
                      📋 AD结构概览
                    </div>
                    <div text-xs space-y-1>
                      <div
                        v-for="(adStruct, adStructIndex) in result.parsedContent.adStructures"
                        :key="adStructIndex"
                        flex gap-2 items-center
                      >
                        <span text-gray-500 font-mono dark:text-gray-400>#{{ adStructIndex + 1 }}</span>
                        <span text-gray-600 font-mono dark:text-gray-300>Length: {{ adStruct.length }}</span>
                        <span text-gray-600 font-mono dark:text-gray-300>Type: 0x{{ adStruct.type.toUpperCase() }}</span>
                        <span text-gray-700 dark:text-gray-200>{{ adStruct.description }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Flags AD结构详情 -->
                  <div v-if="result.parsedContent.flags.data" mb-3 p-3 border border-green-200 rounded-lg bg-green-50 dark:border-green-700 dark:bg-green-900>
                    <div text-xs text-green-700 font-medium mb-2 dark:text-green-300>
                      🚩 Flags AD结构 (Type: 0x01)
                    </div>
                    <div text-xs space-y-2>
                      <div>
                        <span text-gray-600 font-medium dark:text-gray-400>Flags数据：</span>
                        <span font-mono dark:text-gray-200>0x{{ result.parsedContent.flags.data.toUpperCase() }}</span>
                      </div>
                      <div text-xs gap-2 grid grid-cols-1>
                        <div v-if="result.parsedContent.flags.supportsLEOnlyDiscoverable">
                          <span text-green-600 dark:text-green-400>✓ LE Only Discoverable</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsGeneralDiscoverable">
                          <span text-green-600 dark:text-green-400>✓ General Discoverable</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsBR_EDRNotSupported">
                          <span text-green-600 dark:text-green-400>✓ BR/EDR Not Supported (LE Only)</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsLEAndBR_EDRController">
                          <span text-green-600 dark:text-green-400>✓ LE and BR/EDR Controller (Simultaneous)</span>
                        </div>
                        <div v-if="result.parsedContent.flags.supportsLEAndBR_EDRHost">
                          <span text-green-600 dark:text-green-400>✓ LE and BR/EDR Host (Simultaneous)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- iBeacon AD结构详情 -->
                  <div v-if="result.parsedContent.iBeacon.proximityUUID" space-y-3>
                    <!-- 厂商信息 -->
                    <div p-3 border border-purple-200 rounded-lg bg-purple-50 dark:border-purple-700 dark:bg-purple-900>
                      <div text-xs text-purple-700 font-medium mb-2 dark:text-purple-300>
                        🏢 厂商信息
                      </div>
                      <div text-xs space-y-1>
                        <div>
                          <span text-gray-600 font-medium dark:text-gray-400>Company ID：</span>
                          <span font-mono dark:text-gray-200>0x{{ result.parsedContent.iBeacon.companyId.toUpperCase() }}</span>
                          <span text-gray-500 ml-2 dark:text-gray-400>{{ result.parsedContent.iBeacon.companyId.toLowerCase() === '004c' ? '(Apple Inc.)' : '(其他厂商)' }}</span>
                        </div>
                        <div>
                          <span text-gray-600 font-medium dark:text-gray-400>Subtype：</span>
                          <span font-mono dark:text-gray-200>0x{{ result.parsedContent.iBeacon.subtype.toUpperCase() }}</span>
                          <span text-gray-500 ml-2 dark:text-gray-400>(数据子类型)</span>
                        </div>
                        <div>
                          <span text-gray-600 font-medium dark:text-gray-400>iBeacon Type：</span>
                          <span font-mono dark:text-gray-200>0x{{ result.parsedContent.iBeacon.iBeaconType.toUpperCase() }}</span>
                          <span text-gray-500 ml-2 dark:text-gray-400>(iBeacon数据类型)</span>
                        </div>
                      </div>
                    </div>

                    <!-- 标识信息 -->
                    <div p-3 border border-green-200 rounded-lg bg-green-50 dark:border-green-700 dark:bg-green-900>
                      <div text-xs text-green-700 font-medium mb-2 dark:text-green-300>
                        🏷️ 标识信息
                      </div>
                      <div text-xs space-y-2>
                        <div>
                          <span text-gray-600 font-medium dark:text-gray-400>Proximity UUID：</span>
                          <span font-mono break-all dark:text-gray-200>{{ result.parsedContent.iBeacon.proximityUUID }}</span>
                        </div>
                        <div text-xs gap-4 grid grid-cols-2>
                          <div>
                            <span text-gray-600 font-medium dark:text-gray-400>Major：</span>
                            <span font-mono dark:text-gray-200>{{ result.parsedContent.iBeacon.major }}</span>
                          </div>
                          <div>
                            <span text-gray-600 font-medium dark:text-gray-400>Minor：</span>
                            <span font-mono dark:text-gray-200>{{ result.parsedContent.iBeacon.minor }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 信号信息 -->
                    <div p-3 border border-yellow-200 rounded-lg bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900>
                      <div text-xs text-yellow-700 font-medium mb-2 dark:text-yellow-300>
                        📶 信号信息
                      </div>
                      <div text-xs>
                        <span text-gray-600 font-medium dark:text-gray-400>Measured Power：</span>
                        <span font-mono dark:text-gray-200>{{ result.parsedContent.iBeacon.measuredPower }}</span>
                        <span text-xs text-gray-500 ml-2 dark:text-gray-400>(1米距离处的信号强度)</span>
                      </div>
                    </div>
                  </div>

                  <!-- 解析错误提示 -->
                  <div v-if="result.parsedContent.hasError" text-sm text-orange-600 dark:text-orange-400>
                    <div mb-2 flex gap-2 items-center>
                      <span>⚠️</span>
                      <span font-medium>解析警告</span>
                    </div>
                    <p text-xs text-orange-500 dark:text-orange-300>
                      {{ result.parsedContent.errorMessage || '无法完全解析iBeacon数据' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div v-else text-sm text-red-600 dark:text-red-400>
              <div mb-2 flex gap-2 items-center>
                <span>❌</span>
                <span font-medium>解析错误</span>
              </div>
              <p text-red-500 dark:text-red-300>
                {{ result.error }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AD结构解析规则说明 -->
    <div mx-auto mt-8 max-w-7xl>
      <div p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-700>
        <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center dark:text-white>
          <div rounded bg-purple-500 h-6 w-2 />
          AD结构解析规则说明
        </h2>

        <div mb-6 p-4 rounded-lg bg-blue-50 dark:border dark:border-blue-800 dark:bg-blue-900>
          <p text-sm text-blue-800 dark:text-blue-300>
            <strong>蓝牙广播包采用AD (Advertising Data) 结构格式</strong>：每个AD结构由 [Length(1字节) + Type(1字节) + Data(Length字节)] 组成。
            一个广播包可包含多个AD结构，按顺序解析。
          </p>
        </div>

        <div overflow-x-auto>
          <table text-sm w-full border-collapse>
            <thead>
              <tr text-gray-700 font-medium px-4 py-2 text-left border border-gray-200 bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:bg-gray-700>
                <th>
                  字节偏移
                </th>
                <th>
                  字段名称
                </th>
                <th>
                  数据类型
                </th>
                <th>
                  说明
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 基础广播包结构 -->
              <tr bg-blue-50 dark:bg-blue-900>
                <td colspan="4" font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  <strong>📡 基础广播包结构</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Advertising Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  广播包类型 (0x00=可连接无定向广播)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  1-6
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  MAC Address
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint8[6]
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  设备MAC地址 (6字节)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  7
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  RSSI
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  int8
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  信号强度指示 (有符号整数)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  8+
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Advertising Data
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  bytes[]
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  广播数据内容 (多个AD结构)
                </td>
              </tr>

              <!-- AD结构格式 -->
              <tr bg-green-50 dark:bg-green-900 dark:bg-opacity-30>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600 colspan="4">
                  <strong>📋 AD结构通用格式</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Length
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  数据长度，表示后续Data字段的字节数 (不包括Length和Type字段)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  1
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  AD类型 (0x01=Flags, 0xFF=厂商自定义数据等)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  2+
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Data
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  bytes[]
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  实际数据内容，长度由Length字段指定
                </td>
              </tr>

              <!-- Flags AD结构 -->
              <tr bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600 colspan="4">
                  <strong>🚩 Flags AD结构 (Type: 0x01)</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Length
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0x02
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  固定长度2字节
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  1
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0x01
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Flags类型标识
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  2
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Flags Data
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint8
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  设备能力标志位：<br>
                  • Bit 0: LE Only Discoverable<br>
                  • Bit 1: General Discoverable<br>
                  • Bit 2: BR/EDR Not Supported<br>
                  • Bit 3: LE and BR/EDR Controller<br>
                  • Bit 4: LE and BR/EDR Host
                </td>
              </tr>

              <!-- iBeacon AD结构 -->
              <tr bg-orange-50 dark:bg-orange-900 dark:bg-opacity-30>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600 colspan="4">
                  <strong>🍎 iBeacon AD结构 (Type: 0xFF, Apple Manufacturer)</strong>
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Length
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0x1A
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  固定长度26字节 (25字节数据 + 1字节Length)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  1
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0xFF
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  厂商自定义数据类型
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  2-3
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Company ID
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint16 (大端序)
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  厂商标识符，Apple为0x004C
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  4
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Subtype
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0x02
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  iBeacon子类型标识
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  5
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  iBeacon Type
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  0x15
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  iBeacon数据类型标识 (固定值21)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  6-21
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Proximity UUID
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint8[16]
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  设备唯一标识符，格式为8-4-4-4-12的标准UUID
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  22-23
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Major
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint16 (大端序)
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  主要标识，用于分组管理 (如商场楼层)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  24-25
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Minor
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  uint16 (大端序)
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  次要标识，用于细分定位 (如具体店铺)
                </td>
              </tr>
              <tr hover:bg-gray-50 dark:hover:bg-gray-700>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  26
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  Measured Power
                </td>
                <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  int8
                </td>
                <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                  1米距离处的信号强度，用于距离计算 (有符号整数)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 04扫描返回包解析规则 -->
        <div mt-6 p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900 dark:bg-opacity-30>
          <h3 text-sm text-cyan-800 font-semibold mb-3 flex gap-2 items-center dark:text-cyan-200>
            <div rounded bg-cyan-600 h-4 w-2 />
            📡 04扫描返回包解析规则
          </h3>
          <p text-sm text-cyan-700 mb-4 dark:text-cyan-300>
            <strong>04开头的报文表示扫描返回包，采用固定33字节长度格式</strong>，包含设备MAC地址、RSSI、厂商信息、设备名称和电量信息等。
            解析器根据实际代码实现精确提取各字段，支持动态设备名称长度解析。
          </p>

          <div overflow-x-auto>
            <table text-sm w-full border-collapse>
              <thead>
                <tr bg-cyan-100 dark:bg-cyan-900>
                  <th text-cyan-800 font-medium px-3 py-2 text-left border border-cyan-200 dark:text-cyan-200 dark:border-cyan-700>
                    字节偏移
                  </th>
                  <th text-cyan-800 font-medium px-3 py-2 text-left border border-cyan-200 dark:text-cyan-200 dark:border-cyan-700>
                    数据示例
                  </th>
                  <th text-cyan-800 font-medium px-3 py-2 text-left border border-cyan-200 dark:text-cyan-200 dark:border-cyan-700>
                    含义
                  </th>
                  <th text-cyan-800 font-medium px-3 py-2 text-left border border-cyan-200 dark:text-cyan-200 dark:border-cyan-700>
                    解析值/备注
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    0
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    0x04
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    报文类型标识
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    扫描返回包标识符，表示此为扫描响应数据
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    1–6
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    6c 3d 20 c6 7b 90
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    设备MAC地址
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    6C:3D:20:C6:7B:90 (格式化为XX:XX:XX:XX:XX:XX)
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    7
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    f0
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    RSSI信号强度
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    有符号整数，0xF0 = -16 dBm
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    8–9
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    03 03
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    广播标识头
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    固定值，用于识别包类型
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    10–11
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    f0 ff
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    厂商ID
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    示例厂商代码
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    12
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    0a
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    数据类型
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    完整名称类型
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    13
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    09
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    数据长度
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    9 字节
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    14–22
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    42 65 65 4c 69 6e 6b 65 72
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    设备名称
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    "BeeLinker"
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    23–26
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    09 16 b4 08
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    UUID或自定义字段
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    可用于识别不同设备类型
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    27–28
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    27 46
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    Major值
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    0x2746 = 10054
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    29–30
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    b9 49
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    Minor值
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    0xb949 = 47433
                  </td>
                </tr>
                <tr hover:bg-cyan-50 dark:hover:bg-cyan-800>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    31–32
                  </td>
                  <td font-mono px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    A1 01
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    电压字段
                  </td>
                  <td px-3 py-2 border border-cyan-200 dark:text-cyan-100 dark:border-cyan-700>
                    最后2字节为电量信息，计算步骤：原始值417→基础电压4.17V→一般电池3.09V/纽扣电池2.78V
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div text-xs text-cyan-600 mt-4>
            <p><strong>🔋 实际电压计算逻辑：</strong></p>
            <ul ml-4 list-disc space-y-1>
              <li><strong>小端序处理：</strong> 电压字段采用小端序，需字节颠倒：0x01A1 → 0xA101 = 417</li>
              <li><strong>基础电压：</strong> 原始值 ÷ 100 = 417 ÷ 100 = 4.17V</li>
              <li>
                <strong>电池类型系数：</strong>
                <ul ml-6 list-circle space-y-1>
                  <li>一般电池系数：1.35 → 4.17V ÷ 1.35 = 3.09V (19%电量)</li>
                  <li>纽扣电池系数：1.5 → 4.17V ÷ 1.5 = 2.78V (0%电量)</li>
                </ul>
              </li>
              <li><strong>电量百分比计算：</strong> 线性映射 (电压-2.6V) ÷ (3.65V-2.6V) × 100%</li>
              <li><strong>有效范围：</strong> 2.6V~3.65V，超出范围按0%或100%计算</li>
              <li><strong>显示规则：</strong> >50%绿色 ●，20-50%黄色 ●，≤20%红色 ●</li>
              <li><strong>默认显示：</strong> 界面优先显示一般电池电压，同时提供纽扣电池计算结果</li>
            </ul>

            <p class="mt-3">
              <strong>📝 动态字段解析：</strong>
            </p>
            <ul ml-4 list-disc space-y-1>
              <li><strong>设备名称长度：</strong> 字节13的值决定设备名称字段长度（0-255字节）</li>
              <li><strong>自适应偏移：</strong> 后续字段位置根据设备名称实际长度动态调整</li>
              <li><strong>名称解析：</strong> 仅当数据类型为0x09时才进行ASCII字符串转换</li>
              <li><strong>字符串终止：</strong> 遇到0x00字符时提前结束设备名称解析</li>
            </ul>
          </div>
        </div>

        <!-- 实际代码实现说明 -->
        <div mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900 dark:bg-opacity-30>
          <h3 text-sm text-green-800 font-semibold mb-3 flex gap-2 items-center dark:text-green-200>
            <div rounded bg-green-600 h-4 w-2 />
            💻 实际代码实现说明
          </h3>
          <div text-xs text-green-700 space-y-2 dark:text-green-300>
            <p><strong>解析器架构：</strong></p>
            <ul ml-4 list-disc space-y-1>
              <li><strong>双模式支持：</strong> 自动识别04开头扫描返回包和标准广播包，分别调用专门解析函数</li>
              <li><strong>错误处理：</strong> 完善的长度校验、格式验证和异常捕获机制</li>
              <li><strong>动态解析：</strong> 04包支持0-255字节可变设备名称长度，后续字段位置自动调整</li>
            </ul>

            <p><strong>扫描返回包解析 (parseScanResponseContent)：</strong></p>
            <ul ml-4 list-disc space-y-1>
              <li><strong>字段提取：</strong> 精确按字节偏移提取MAC、RSSI、厂商ID、设备名称等33个字段</li>
              <li><strong>名称转换：</strong> 数据类型0x09时调用hexToString进行ASCII转换，遇0x00终止</li>
              <li><strong>电压计算：</strong> 小端序处理+双重电池系数+线性电量百分比算法</li>
              <li><strong>结果封装：</strong> 创建ScanResponseData对象，包含所有解析字段和计算结果</li>
            </ul>

            <p><strong>标准广播包解析 (parsePacketContent)：</strong></p>
            <ul ml-4 list-disc space-y-1>
              <li><strong>AD结构迭代：</strong> while循环逐个解析Length+Type+Data结构</li>
              <li><strong>Flags解析：</strong> Type 0x01时提取位标志：LE发现、BR/EDR支持等</li>
              <li><strong>iBeacon识别：</strong> Type 0xFF且Apple 0x004C厂商ID时解析完整iBeacon结构</li>
              <li><strong>UUID格式化：</strong> 16字节转换为8-4-4-4-12标准UUID格式</li>
            </ul>

            <p><strong>用户界面特性：</strong></p>
            <ul ml-4 list-disc space-y-1>
              <li><strong>批量输入：</strong> 支持JSON数组和换行分隔两种输入格式</li>
              <li><strong>实时解析：</strong> 输入后立即解析并显示结构化结果</li>
              <li><strong>错误提示：</strong> 详细的解析失败原因和修复建议</li>
              <li><strong>导航功能：</strong> 多包快速定位和滚动导航</li>
            </ul>
          </div>
        </div>

        <!-- 示例解析 -->
        <div mt-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-900 dark:bg-opacity-30>
          <h3 text-sm text-purple-800 font-semibold mb-2 dark:text-purple-200>
            📝 示例解析
          </h3>
          <p text-xs text-purple-700 mb-2 dark:text-purple-300>
            <strong>广播包数据:</strong> 00d25f2dab2ed0ba0201061aff4c000215fda50693a4e24fb1afcfc6eb07647825271128a6b5
          </p>
          <div text-xs text-purple-600 space-y-1 dark:text-purple-400>
            <div>• <strong>基础部分:</strong> 00 d25f2dab2ed0 ba = Type(0x00) + MAC(d2:5f:2d:ab:2e:d0) + RSSI(-70dBm)</div>
            <div>• <strong>AD结构1 (Flags):</strong> 020106 = Length(2) + Type(0x01) + Data(0x06)</div>
            <div>• <strong>AD结构2 (iBeacon):</strong> 1aff4c000215fda50693a4e24fb1afcfc6eb07647825271128a6b5</div>
            <div>  └─ Length(0x1A=26) + Type(0xFF) + Company ID(0x004C=Apple) + Subtype(0x02) + iBeacon Type(0x15) + UUID + Major + Minor + TxPower</div>
          </div>
        </div>
      </div>

      <!-- Advertising Type Code 参考表 -->
      <div mx-auto mt-8 max-w-7xl>
        <div p-6 rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-700>
          <h2 text-xl text-gray-800 font-semibold mb-4 flex gap-2 items-center dark:text-white>
            <div rounded bg-indigo-500 h-6 w-2 />
            Advertising Type Code 参考表
          </h2>

          <div overflow-x-auto>
            <table text-sm w-full border-collapse>
              <thead>
                <tr text-gray-700 font-medium px-4 py-2 text-left border border-gray-200 bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:bg-gray-700>
                  <th>
                    Code
                  </th>
                  <th>
                    描述
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(description, code) in typeDescriptions"
                  :key="code"
                  hover:bg-gray-50 dark:hover:bg-gray-700
                >
                  <td font-mono px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
                    {{ code }}
                  </td>
                  <td px-4 py-2 border border-gray-200 dark:text-gray-200 dark:border-gray-600>
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
