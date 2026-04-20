import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const loading = ref(false)
  const total = ref(0)

  const ORDER_STATUS = {
    PENDING: { value: 0, label: '待付款', color: 'warning' },
    PAID: { value: 1, label: '已付款', color: 'primary' },
    SHIPPED: { value: 2, label: '已发货', color: '' },
    DELIVERED: { value: 3, label: '已送达', color: 'success' },
    COMPLETED: { value: 4, label: '已完成', color: 'success' },
    CANCELLED: { value: 5, label: '已取消', color: 'info' },
    REFUNDING: { value: 6, label: '退款中', color: 'danger' },
    REFUNDED: { value: 7, label: '已退款', color: 'info' }
  }

  const statusOptions = Object.values(ORDER_STATUS)

  const orderStatistics = computed(() => {
    const stats = {
      total: orders.value.length,
      pending: 0,
      paid: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
      totalAmount: 0,
      todayAmount: 0,
      todayOrders: 0
    }

    const today = dayjs().format('YYYY-MM-DD')

    orders.value.forEach(order => {
      stats.totalAmount += order.totalAmount
      if (dayjs(order.createdAt).format('YYYY-MM-DD') === today) {
        stats.todayAmount += order.totalAmount
        stats.todayOrders++
      }
      switch (order.status) {
        case 0: stats.pending++; break
        case 1: stats.paid++; break
        case 2: stats.shipped++; break
        case 4: stats.completed++; break
        case 5: stats.cancelled++; break
      }
    })

    return stats
  })

  function generateId() {
    return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase()
  }

  function fetchOrders(params = {}) {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...orders.value]

        if (params.keyword) {
          result = result.filter(o =>
            o.orderNo.includes(params.keyword) ||
            o.memberName.includes(params.keyword)
          )
        }
        if (params.status !== undefined && params.status !== '') {
          result = result.filter(o => o.status === params.status)
        }
        if (params.startDate) {
          result = result.filter(o => dayjs(o.createdAt).isAfter(dayjs(params.startDate)))
        }
        if (params.endDate) {
          result = result.filter(o => dayjs(o.createdAt).isBefore(dayjs(params.endDate).add(1, 'day')))
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

  function getOrderById(id) {
    return orders.value.find(o => o.id === id)
  }

  function updateOrderStatus(id, status, remark = '') {
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = status
      order.statusHistory.push({
        status,
        statusName: ORDER_STATUS[Object.keys(ORDER_STATUS).find(k => ORDER_STATUS[k].value === status)]?.label,
        time: new Date().toISOString(),
        remark,
        operator: '管理员'
      })
      order.updatedAt = new Date().toISOString()
      return true
    }
    return false
  }

  function approveOrder(id, step, remark = '') {
    const order = orders.value.find(o => o.id === id)
    if (order && order.approvalSteps) {
      const currentStep = order.approvalSteps.find(s => s.step === step)
      if (currentStep) {
        currentStep.status = 'approved'
        currentStep.approvedAt = new Date().toISOString()
        currentStep.remark = remark
        currentStep.approver = '管理员'
        return true
      }
    }
    return false
  }

  function addLogistics(id, logistics) {
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.logistics = {
        ...logistics,
        tracks: [
          {
            time: new Date().toISOString(),
            status: '已发货',
            description: `快递单号：${logistics.trackingNo}，快递公司：${logistics.company}`
          },
          {
            time: new Date().toISOString(),
            status: '运输中',
            description: '包裹正在运输中'
          }
        ]
      }
      order.status = 2
      return true
    }
    return false
  }

  function updateLogisticsTrack(id, track) {
    const order = orders.value.find(o => o.id === id)
    if (order && order.logistics) {
      order.logistics.tracks.unshift({
        ...track,
        time: new Date().toISOString()
      })
      return true
    }
    return false
  }

  function getDailyStatistics(startDate, endDate) {
    const stats = []
    let current = dayjs(startDate)
    const end = dayjs(endDate)

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dateStr = current.format('YYYY-MM-DD')
      const dayOrders = orders.value.filter(o =>
        dayjs(o.createdAt).format('YYYY-MM-DD') === dateStr
      )

      stats.push({
        date: dateStr,
        orderCount: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      })

      current = current.add(1, 'day')
    }

    return stats
  }

  function initMockData() {
    const mockOrders = [
      {
        id: 'ORD001',
        orderNo: 'ORD202401150001',
        memberId: 'M001',
        memberName: '张三',
        memberPhone: '13800138001',
        status: 4,
        items: [
          { productId: 'P001', productName: 'iPhone 15 Pro Max', sku: '深空黑-256GB', price: 9999, quantity: 1, image: 'https://picsum.photos/100/100?random=1' }
        ],
        totalAmount: 9999,
        payAmount: 9699,
        discountAmount: 300,
        shippingFee: 0,
        address: {
          name: '张三',
          phone: '13800138001',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '建国路88号'
        },
        logistics: {
          company: '顺丰速运',
          trackingNo: 'SF1234567890',
          tracks: [
            { time: '2024-01-17T14:00:00.000Z', status: '已签收', description: '已签收，签收人：本人' },
            { time: '2024-01-17T10:00:00.000Z', status: '派送中', description: '快递员正在派送' },
            { time: '2024-01-16T20:00:00.000Z', status: '已到达', description: '已到达北京朝阳区营业点' },
            { time: '2024-01-15T18:00:00.000Z', status: '已发货', description: '包裹已发出' }
          ]
        },
        approvalSteps: [
          { step: 1, name: '订单审核', status: 'approved', approvedAt: '2024-01-15T10:00:00.000Z', approver: '管理员' },
          { step: 2, name: '财务确认', status: 'approved', approvedAt: '2024-01-15T11:00:00.000Z', approver: '财务' },
          { step: 3, name: '仓库发货', status: 'approved', approvedAt: '2024-01-15T18:00:00.000Z', approver: '仓库' }
        ],
        statusHistory: [
          { status: 0, statusName: '待付款', time: '2024-01-15T09:00:00.000Z', remark: '订单创建', operator: '系统' },
          { status: 1, statusName: '已付款', time: '2024-01-15T09:30:00.000Z', remark: '支付成功', operator: '系统' },
          { status: 2, statusName: '已发货', time: '2024-01-15T18:00:00.000Z', remark: '已发货', operator: '管理员' },
          { status: 3, statusName: '已送达', time: '2024-01-17T14:00:00.000Z', remark: '已送达', operator: '系统' },
          { status: 4, statusName: '已完成', time: '2024-01-17T14:00:00.000Z', remark: '订单完成', operator: '系统' }
        ],
        remark: '',
        createdAt: '2024-01-15T09:00:00.000Z',
        updatedAt: '2024-01-17T14:00:00.000Z'
      },
      {
        id: 'ORD002',
        orderNo: 'ORD202401160002',
        memberId: 'M002',
        memberName: '李四',
        memberPhone: '13800138002',
        status: 2,
        items: [
          { productId: 'P002', productName: 'MacBook Pro 14英寸', sku: 'M3 Pro-18GB', price: 16999, quantity: 1, image: 'https://picsum.photos/100/100?random=2' }
        ],
        totalAmount: 16999,
        payAmount: 16999,
        discountAmount: 0,
        shippingFee: 0,
        address: {
          name: '李四',
          phone: '13800138002',
          province: '上海市',
          city: '上海市',
          district: '浦东新区',
          detail: '陆家嘴环路1000号'
        },
        logistics: {
          company: '京东物流',
          trackingNo: 'JD0987654321',
          tracks: [
            { time: '2024-01-17T08:00:00.000Z', status: '运输中', description: '包裹正在运输中' },
            { time: '2024-01-16T20:00:00.000Z', status: '已发货', description: '包裹已发出' }
          ]
        },
        approvalSteps: [
          { step: 1, name: '订单审核', status: 'approved', approvedAt: '2024-01-16T10:00:00.000Z', approver: '管理员' },
          { step: 2, name: '财务确认', status: 'approved', approvedAt: '2024-01-16T11:00:00.000Z', approver: '财务' },
          { step: 3, name: '仓库发货', status: 'approved', approvedAt: '2024-01-16T20:00:00.000Z', approver: '仓库' }
        ],
        statusHistory: [
          { status: 0, statusName: '待付款', time: '2024-01-16T09:00:00.000Z', remark: '订单创建', operator: '系统' },
          { status: 1, statusName: '已付款', time: '2024-01-16T09:30:00.000Z', remark: '支付成功', operator: '系统' },
          { status: 2, statusName: '已发货', time: '2024-01-16T20:00:00.000Z', remark: '已发货', operator: '管理员' }
        ],
        remark: '',
        createdAt: '2024-01-16T09:00:00.000Z',
        updatedAt: '2024-01-16T20:00:00.000Z'
      },
      {
        id: 'ORD003',
        orderNo: 'ORD202401170003',
        memberId: 'M003',
        memberName: '王五',
        memberPhone: '13800138003',
        status: 1,
        items: [
          { productId: 'P003', productName: '经典款卫衣', sku: '白色-M', price: 199, quantity: 2, image: 'https://picsum.photos/100/100?random=3' },
          { productId: 'P005', productName: '智能台灯', sku: '白色', price: 159, quantity: 1, image: 'https://picsum.photos/100/100?random=5' }
        ],
        totalAmount: 557,
        payAmount: 557,
        discountAmount: 0,
        shippingFee: 0,
        address: {
          name: '王五',
          phone: '13800138003',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '科技园南区'
        },
        logistics: null,
        approvalSteps: [
          { step: 1, name: '订单审核', status: 'approved', approvedAt: '2024-01-17T10:00:00.000Z', approver: '管理员' },
          { step: 2, name: '财务确认', status: 'pending', approver: '' },
          { step: 3, name: '仓库发货', status: 'pending', approver: '' }
        ],
        statusHistory: [
          { status: 0, statusName: '待付款', time: '2024-01-17T09:00:00.000Z', remark: '订单创建', operator: '系统' },
          { status: 1, statusName: '已付款', time: '2024-01-17T09:30:00.000Z', remark: '支付成功', operator: '系统' }
        ],
        remark: '',
        createdAt: '2024-01-17T09:00:00.000Z',
        updatedAt: '2024-01-17T09:30:00.000Z'
      },
      {
        id: 'ORD004',
        orderNo: 'ORD202401180004',
        memberId: 'M004',
        memberName: '赵六',
        memberPhone: '13800138004',
        status: 0,
        items: [
          { productId: 'P004', productName: '有机绿茶礼盒', sku: 'DEFAULT', price: 299, quantity: 3, image: 'https://picsum.photos/100/100?random=4' }
        ],
        totalAmount: 897,
        payAmount: 897,
        discountAmount: 0,
        shippingFee: 0,
        address: {
          name: '赵六',
          phone: '13800138004',
          province: '浙江省',
          city: '杭州市',
          district: '西湖区',
          detail: '文三路269号'
        },
        logistics: null,
        approvalSteps: [
          { step: 1, name: '订单审核', status: 'pending', approver: '' },
          { step: 2, name: '财务确认', status: 'pending', approver: '' },
          { step: 3, name: '仓库发货', status: 'pending', approver: '' }
        ],
        statusHistory: [
          { status: 0, statusName: '待付款', time: '2024-01-18T09:00:00.000Z', remark: '订单创建', operator: '系统' }
        ],
        remark: '',
        createdAt: '2024-01-18T09:00:00.000Z',
        updatedAt: '2024-01-18T09:00:00.000Z'
      },
      {
        id: 'ORD005',
        orderNo: 'ORD202401190005',
        memberId: 'M001',
        memberName: '张三',
        memberPhone: '13800138001',
        status: 5,
        items: [
          { productId: 'P001', productName: 'iPhone 15 Pro Max', sku: '自然钛-512GB', price: 10999, quantity: 1, image: 'https://picsum.photos/100/100?random=1' }
        ],
        totalAmount: 10999,
        payAmount: 0,
        discountAmount: 0,
        shippingFee: 0,
        address: {
          name: '张三',
          phone: '13800138001',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '建国路88号'
        },
        logistics: null,
        approvalSteps: [
          { step: 1, name: '订单审核', status: 'rejected', remark: '库存不足', approver: '管理员' }
        ],
        statusHistory: [
          { status: 0, statusName: '待付款', time: '2024-01-19T09:00:00.000Z', remark: '订单创建', operator: '系统' },
          { status: 5, statusName: '已取消', time: '2024-01-19T10:00:00.000Z', remark: '库存不足，订单取消', operator: '管理员' }
        ],
        remark: '库存不足',
        createdAt: '2024-01-19T09:00:00.000Z',
        updatedAt: '2024-01-19T10:00:00.000Z'
      }
    ]

    orders.value = mockOrders
    total.value = mockOrders.length
  }

  initMockData()

  return {
    orders,
    loading,
    total,
    ORDER_STATUS,
    statusOptions,
    orderStatistics,
    fetchOrders,
    getOrderById,
    updateOrderStatus,
    approveOrder,
    addLogistics,
    updateLogisticsTrack,
    getDailyStatistics
  }
})
