import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const useMemberStore = defineStore('member', () => {
  const members = ref([])
  const coupons = ref([])
  const loading = ref(false)
  const total = ref(0)

  const MEMBER_LEVELS = {
    1: { name: '普通会员', minPoints: 0, discount: 1.0, color: '' },
    2: { name: '银卡会员', minPoints: 1000, discount: 0.98, color: 'info' },
    3: { name: '金卡会员', minPoints: 5000, discount: 0.95, color: 'warning' },
    4: { name: '铂金会员', minPoints: 10000, discount: 0.92, color: 'success' },
    5: { name: '钻石会员', minPoints: 50000, discount: 0.88, color: 'danger' }
  }

  const levelOptions = Object.entries(MEMBER_LEVELS).map(([value, config]) => ({
    value: Number(value),
    label: config.name,
    ...config
  }))

  const memberStatistics = computed(() => {
    const stats = {
      total: members.value.length,
      newThisMonth: 0,
      activeThisMonth: 0,
      levelDistribution: {},
      totalConsumption: 0,
      avgConsumption: 0
    }

    const thisMonth = dayjs().format('YYYY-MM')
    const thisMonthStart = dayjs().startOf('month')

    members.value.forEach(member => {
      if (dayjs(member.createdAt).format('YYYY-MM') === thisMonth) {
        stats.newThisMonth++
      }
      if (dayjs(member.lastOrderAt).isAfter(thisMonthStart)) {
        stats.activeThisMonth++
      }
      stats.totalConsumption += member.totalConsumption
      stats.levelDistribution[member.level] = (stats.levelDistribution[member.level] || 0) + 1
    })

    stats.avgConsumption = stats.total > 0 ? Math.round(stats.totalConsumption / stats.total) : 0

    return stats
  })

  function calculateLevel(points) {
    let level = 1
    for (const [lvl, config] of Object.entries(MEMBER_LEVELS)) {
      if (points >= config.minPoints) {
        level = Number(lvl)
      }
    }
    return level
  }

  function generateId() {
    return 'M' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase()
  }

  function fetchMembers(params = {}) {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...members.value]

        if (params.keyword) {
          result = result.filter(m =>
            m.name.includes(params.keyword) ||
            m.phone.includes(params.keyword)
          )
        }
        if (params.level) {
          result = result.filter(m => m.level === params.level)
        }
        if (params.startDate) {
          result = result.filter(m => dayjs(m.createdAt).isAfter(dayjs(params.startDate)))
        }
        if (params.endDate) {
          result = result.filter(m => dayjs(m.createdAt).isBefore(dayjs(params.endDate).add(1, 'day')))
        }

        total.value = result.length

        const page = params.page || 1
        const pageSize = params.pageSize || 10
        const start = (page - 1) * pageSize
        result = result.slice(start, start + pageSize)

        loading.value = false
        resolve({ list: result, total: total.value })
      }, 300)
    })
  }

  function getMemberById(id) {
    return members.value.find(m => m.id === id)
  }

  function addMember(member) {
    const newMember = {
      ...member,
      id: generateId(),
      points: 0,
      level: 1,
      totalConsumption: 0,
      orderCount: 0,
      couponCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    members.value.unshift(newMember)
    total.value++
    return newMember
  }

  function updateMember(id, data) {
    const index = members.value.findIndex(m => m.id === id)
    if (index !== -1) {
      if (data.points !== undefined) {
        data.level = calculateLevel(data.points)
      }
      members.value[index] = {
        ...members.value[index],
        ...data,
        updatedAt: new Date().toISOString()
      }
      return members.value[index]
    }
    return null
  }

  function deleteMember(id) {
    const index = members.value.findIndex(m => m.id === id)
    if (index !== -1) {
      members.value.splice(index, 1)
      total.value--
      return true
    }
    return false
  }

  function updateMemberConsumption(memberId, amount) {
    const member = members.value.find(m => m.id === memberId)
    if (member) {
      member.totalConsumption += amount
      member.orderCount++
      member.lastOrderAt = new Date().toISOString()
      const earnedPoints = Math.floor(amount / 10)
      member.points += earnedPoints
      member.level = calculateLevel(member.points)
      return true
    }
    return false
  }

  function fetchCoupons(params = {}) {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...coupons.value]

        if (params.keyword) {
          result = result.filter(c => c.name.includes(params.keyword))
        }
        if (params.status !== undefined && params.status !== '') {
          result = result.filter(c => c.status === params.status)
        }

        const couponTotal = result.length
        const page = params.page || 1
        const pageSize = params.pageSize || 10
        const start = (page - 1) * pageSize
        result = result.slice(start, start + pageSize)

        loading.value = false
        resolve({ list: result, total: couponTotal })
      }, 300)
    })
  }

  function getCouponById(id) {
    return coupons.value.find(c => c.id === id)
  }

  function addCoupon(coupon) {
    const newCoupon = {
      ...coupon,
      id: 'CPN' + Date.now().toString(36).toUpperCase(),
      usedCount: 0,
      createdAt: new Date().toISOString()
    }
    coupons.value.unshift(newCoupon)
    return newCoupon
  }

  function updateCoupon(id, data) {
    const index = coupons.value.findIndex(c => c.id === id)
    if (index !== -1) {
      coupons.value[index] = {
        ...coupons.value[index],
        ...data
      }
      return coupons.value[index]
    }
    return null
  }

  function deleteCoupon(id) {
    const index = coupons.value.findIndex(c => c.id === id)
    if (index !== -1) {
      coupons.value.splice(index, 1)
      return true
    }
    return false
  }

  function issueCouponToMember(memberId, couponId) {
    const member = members.value.find(m => m.id === memberId)
    const coupon = coupons.value.find(c => c.id === couponId)
    if (member && coupon && coupon.remainCount > 0) {
      coupon.usedCount++
      coupon.remainCount--
      member.couponCount++
      return true
    }
    return false
  }

  function getMemberBehaviorAnalysis(memberId) {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return null

    const behaviorData = {
      consumptionTrend: [],
      categoryPreference: [
        { category: '电子产品', amount: Math.floor(member.totalConsumption * 0.4) },
        { category: '服装鞋帽', amount: Math.floor(member.totalConsumption * 0.25) },
        { category: '食品饮料', amount: Math.floor(member.totalConsumption * 0.15) },
        { category: '家居用品', amount: Math.floor(member.totalConsumption * 0.12) },
        { category: '美妆护肤', amount: Math.floor(member.totalConsumption * 0.08) }
      ],
      orderTimeDistribution: [
        { hour: '0-6', count: Math.floor(Math.random() * 5) },
        { hour: '6-12', count: Math.floor(Math.random() * 15) + 5 },
        { hour: '12-18', count: Math.floor(Math.random() * 20) + 10 },
        { hour: '18-24', count: Math.floor(Math.random() * 25) + 15 }
      ],
      avgOrderValue: member.orderCount > 0 ? Math.round(member.totalConsumption / member.orderCount) : 0,
      purchaseFrequency: member.orderCount > 0 ? Math.round(30 / member.orderCount) : 0
    }

    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD')
      behaviorData.consumptionTrend.push({
        date,
        amount: Math.floor(Math.random() * 1000) + (member.totalConsumption / 30)
      })
    }

    return behaviorData
  }

  function getOverallAnalysis() {
    const analysis = {
      memberGrowth: [],
      consumptionDistribution: [],
      levelDistribution: levelOptions.map(level => ({
        name: level.label,
        value: members.value.filter(m => m.level === level.value).length
      })),
      topMembers: [...members.value]
        .sort((a, b) => b.totalConsumption - a.totalConsumption)
        .slice(0, 10)
        .map(m => ({
          id: m.id,
          name: m.name,
          consumption: m.totalConsumption,
          level: MEMBER_LEVELS[m.level].name
        }))
    }

    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD')
      const newCount = Math.floor(Math.random() * 10) + 1
      analysis.memberGrowth.push({
        date,
        newMembers: newCount,
        activeMembers: Math.floor(Math.random() * 50) + 20
      })
    }

    const consumptionRanges = [
      { range: '0-500', min: 0, max: 500 },
      { range: '500-2000', min: 500, max: 2000 },
      { range: '2000-5000', min: 2000, max: 5000 },
      { range: '5000-10000', min: 5000, max: 10000 },
      { range: '10000+', min: 10000, max: Infinity }
    ]

    analysis.consumptionDistribution = consumptionRanges.map(({ range, min, max }) => ({
      range,
      count: members.value.filter(m => m.totalConsumption >= min && m.totalConsumption < max).length
    }))

    return analysis
  }

  function initMockData() {
    const mockMembers = [
      {
        id: 'M001',
        name: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        gender: 'male',
        birthday: '1990-05-15',
        points: 15000,
        level: 4,
        totalConsumption: 45680,
        orderCount: 23,
        couponCount: 5,
        lastOrderAt: '2024-01-17T14:00:00.000Z',
        createdAt: '2023-03-15T00:00:00.000Z',
        updatedAt: '2024-01-17T14:00:00.000Z'
      },
      {
        id: 'M002',
        name: '李四',
        phone: '13800138002',
        email: 'lisi@example.com',
        gender: 'male',
        birthday: '1985-08-22',
        points: 8500,
        level: 3,
        totalConsumption: 28900,
        orderCount: 15,
        couponCount: 3,
        lastOrderAt: '2024-01-16T20:00:00.000Z',
        createdAt: '2023-06-20T00:00:00.000Z',
        updatedAt: '2024-01-16T20:00:00.000Z'
      },
      {
        id: 'M003',
        name: '王五',
        phone: '13800138003',
        email: 'wangwu@example.com',
        gender: 'female',
        birthday: '1995-12-03',
        points: 3200,
        level: 2,
        totalConsumption: 8500,
        orderCount: 8,
        couponCount: 2,
        lastOrderAt: '2024-01-17T09:30:00.000Z',
        createdAt: '2023-09-10T00:00:00.000Z',
        updatedAt: '2024-01-17T09:30:00.000Z'
      },
      {
        id: 'M004',
        name: '赵六',
        phone: '13800138004',
        email: 'zhaoliu@example.com',
        gender: 'male',
        birthday: '1992-03-28',
        points: 500,
        level: 1,
        totalConsumption: 1200,
        orderCount: 3,
        couponCount: 1,
        lastOrderAt: '2024-01-18T09:00:00.000Z',
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-18T09:00:00.000Z'
      },
      {
        id: 'M005',
        name: '孙七',
        phone: '13800138005',
        email: 'sunqi@example.com',
        gender: 'female',
        birthday: '1998-07-10',
        points: 52000,
        level: 5,
        totalConsumption: 125000,
        orderCount: 45,
        couponCount: 8,
        lastOrderAt: '2024-01-19T16:00:00.000Z',
        createdAt: '2022-11-20T00:00:00.000Z',
        updatedAt: '2024-01-19T16:00:00.000Z'
      }
    ]

    const mockCoupons = [
      {
        id: 'CPN001',
        name: '新年特惠券',
        type: 'discount',
        value: 50,
        minAmount: 200,
        totalCount: 1000,
        remainCount: 856,
        usedCount: 144,
        perLimit: 1,
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-31T23:59:59.000Z',
        status: 1,
        description: '满200减50，全场通用',
        createdAt: '2023-12-25T00:00:00.000Z'
      },
      {
        id: 'CPN002',
        name: '会员专享折扣券',
        type: 'percent',
        value: 10,
        minAmount: 500,
        totalCount: 500,
        remainCount: 423,
        usedCount: 77,
        perLimit: 2,
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-03-31T23:59:59.000Z',
        status: 1,
        description: '满500打9折，会员专享',
        createdAt: '2023-12-28T00:00:00.000Z'
      },
      {
        id: 'CPN003',
        name: '新人礼包券',
        type: 'discount',
        value: 30,
        minAmount: 100,
        totalCount: 2000,
        remainCount: 1890,
        usedCount: 110,
        perLimit: 1,
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-12-31T23:59:59.000Z',
        status: 1,
        description: '新用户专享，满100减30',
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'CPN004',
        name: '春节限时券',
        type: 'discount',
        value: 100,
        minAmount: 500,
        totalCount: 300,
        remainCount: 0,
        usedCount: 300,
        perLimit: 1,
        startTime: '2024-02-01T00:00:00.000Z',
        endTime: '2024-02-15T23:59:59.000Z',
        status: 0,
        description: '春节特惠，满500减100',
        createdAt: '2024-01-20T00:00:00.000Z'
      }
    ]

    members.value = mockMembers
    coupons.value = mockCoupons
    total.value = mockMembers.length
  }

  initMockData()

  return {
    members,
    coupons,
    loading,
    total,
    MEMBER_LEVELS,
    levelOptions,
    memberStatistics,
    calculateLevel,
    fetchMembers,
    getMemberById,
    addMember,
    updateMember,
    deleteMember,
    updateMemberConsumption,
    fetchCoupons,
    getCouponById,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    issueCouponToMember,
    getMemberBehaviorAnalysis,
    getOverallAnalysis
  }
})
