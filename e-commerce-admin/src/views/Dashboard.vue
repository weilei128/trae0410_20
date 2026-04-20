<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon :size="28"><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ productStore.total }}</div>
              <div class="stat-label">商品总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon :size="28"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ orderStore.orderStatistics.total }}</div>
              <div class="stat-label">订单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon :size="28"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ memberStore.memberStatistics.total }}</div>
              <div class="stat-label">会员总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon :size="28"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(orderStore.orderStatistics.totalAmount) }}</div>
              <div class="stat-label">总销售额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
            </div>
          </template>
          <div ref="orderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
            </div>
          </template>
          <div ref="statusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>库存预警</span>
              <el-tag type="danger" size="small">{{ productStore.lowStockProducts.length }} 件</el-tag>
            </div>
          </template>
          <el-table :data="lowStockList" style="width: 100%">
            <el-table-column prop="name" label="商品名称" min-width="150" />
            <el-table-column prop="skuName" label="SKU" min-width="120" />
            <el-table-column prop="stock" label="库存" width="80">
              <template #default="{ row }">
                <el-tag :type="row.stock <= 5 ? 'danger' : 'warning'" size="small">
                  {{ row.stock }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>待处理订单</span>
            </div>
          </template>
          <div class="pending-orders">
            <div class="pending-item">
              <span>待付款</span>
              <el-badge :value="orderStore.orderStatistics.pending" type="warning">
                <el-button size="small" @click="$router.push('/order?status=0')">查看</el-button>
              </el-badge>
            </div>
            <div class="pending-item">
              <span>待发货</span>
              <el-badge :value="orderStore.orderStatistics.paid" type="primary">
                <el-button size="small" @click="$router.push('/order?status=1')">查看</el-button>
              </el-badge>
            </div>
            <div class="pending-item">
              <span>已发货</span>
              <el-badge :value="orderStore.orderStatistics.shipped" type="info">
                <el-button size="small" @click="$router.push('/order?status=2')">查看</el-button>
              </el-badge>
            </div>
            <div class="pending-item">
              <span>已完成</span>
              <el-badge :value="orderStore.orderStatistics.completed" type="success">
                <el-button size="small" @click="$router.push('/order?status=4')">查看</el-button>
              </el-badge>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useProductStore } from '@/stores/product'
import { useOrderStore } from '@/stores/order'
import { useMemberStore } from '@/stores/member'
import * as echarts from 'echarts'

const productStore = useProductStore()
const orderStore = useOrderStore()
const memberStore = useMemberStore()

const orderChartRef = ref(null)
const statusChartRef = ref(null)

const lowStockList = computed(() => {
  const list = []
  productStore.lowStockProducts.forEach(product => {
    product.skus.filter(sku => sku.stock <= product.stockWarning).forEach(sku => {
      list.push({
        id: product.id,
        name: product.name,
        skuName: sku.sku || '默认',
        stock: sku.stock
      })
    })
  })
  return list.slice(0, 5)
})

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toLocaleString()
}

function initOrderChart() {
  const chart = echarts.init(orderChartRef.value)
  const stats = orderStore.getDailyStatistics(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    new Date()
  )

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单数', '销售额']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.map(s => s.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left'
      },
      {
        type: 'value',
        name: '销售额',
        position: 'right'
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: stats.map(s => s.orderCount),
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '销售额',
        type: 'line',
        yAxisIndex: 1,
        data: stats.map(s => s.amount),
        smooth: true,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initStatusChart() {
  const chart = echarts.init(statusChartRef.value)
  const stats = orderStore.orderStatistics

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: stats.pending, name: '待付款', itemStyle: { color: '#e6a23c' } },
          { value: stats.paid, name: '已付款', itemStyle: { color: '#409eff' } },
          { value: stats.shipped, name: '已发货', itemStyle: { color: '#909399' } },
          { value: stats.completed, name: '已完成', itemStyle: { color: '#67c23a' } },
          { value: stats.cancelled, name: '已取消', itemStyle: { color: '#f56c6c' } }
        ]
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

onMounted(async () => {
  await nextTick()
  initOrderChart()
  initStatusChart()
})
</script>

<style scoped>
.dashboard {
  min-height: 100%;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  margin-left: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.pending-orders {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
</style>
