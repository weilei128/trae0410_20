<template>
  <div class="member-analysis">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon :size="24"><User /></el-icon>
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
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon :size="24"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(memberStore.memberStatistics.totalConsumption) }}</div>
              <div class="stat-label">总消费金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(memberStore.memberStatistics.avgConsumption) }}</div>
              <div class="stat-label">人均消费</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon :size="24"><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ memberStore.memberStatistics.activeThisMonth }}</div>
              <div class="stat-label">本月活跃</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>会员增长趋势</span>
            </div>
          </template>
          <div ref="growthChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>会员等级分布</span>
            </div>
          </template>
          <div ref="levelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>消费金额分布</span>
            </div>
          </template>
          <div ref="consumptionChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>消费TOP10会员</span>
            </div>
          </template>
          <el-table :data="topMembers" style="width: 100%">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="name" label="会员名称" min-width="120" />
            <el-table-column prop="level" label="等级" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="consumption" label="消费金额" width="120">
              <template #default="{ row }">
                <span class="consumption">¥{{ row.consumption }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>会员消费行为分析</span>
              <el-select v-model="selectedMemberId" placeholder="选择会员查看详情" style="width: 250px;" @change="loadMemberAnalysis">
                <el-option
                  v-for="member in memberStore.members"
                  :key="member.id"
                  :label="member.name"
                  :value="member.id"
                />
              </el-select>
            </div>
          </template>
          
          <div v-if="memberAnalysis" class="analysis-content">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <div class="analysis-item">
                  <div class="analysis-label">平均客单价</div>
                  <div class="analysis-value">¥{{ memberAnalysis.avgOrderValue }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="analysis-item">
                  <div class="analysis-label">购买频率</div>
                  <div class="analysis-value">{{ memberAnalysis.purchaseFrequency }}天/单</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="analysis-item">
                  <div class="analysis-label">偏好品类</div>
                  <div class="analysis-value">{{ memberAnalysis.categoryPreference[0]?.category || '-' }}</div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="analysis-item">
                  <div class="analysis-label">活跃时段</div>
                  <div class="analysis-value">{{ getActivePeriod() }}</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :xs="24" :md="12">
                <div class="chart-title">近7天消费趋势</div>
                <div ref="trendChartRef" class="small-chart"></div>
              </el-col>
              <el-col :xs="24" :md="12">
                <div class="chart-title">品类偏好分布</div>
                <div ref="categoryChartRef" class="small-chart"></div>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <div class="chart-title">下单时间分布</div>
                <div ref="timeChartRef" class="small-chart"></div>
              </el-col>
            </el-row>
          </div>
          
          <el-empty v-else description="请选择会员查看消费行为分析" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useMemberStore } from '@/stores/member'
import * as echarts from 'echarts'

const memberStore = useMemberStore()

const growthChartRef = ref(null)
const levelChartRef = ref(null)
const consumptionChartRef = ref(null)
const trendChartRef = ref(null)
const categoryChartRef = ref(null)
const timeChartRef = ref(null)

const selectedMemberId = ref('')
const memberAnalysis = ref(null)

const topMembers = computed(() => memberStore.getOverallAnalysis().topMembers)

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toLocaleString()
}

function getActivePeriod() {
  if (!memberAnalysis.value) return '-'
  const timeDist = memberAnalysis.value.orderTimeDistribution
  const maxPeriod = timeDist.reduce((max, item) => item.count > max.count ? item : max, timeDist[0])
  return maxPeriod.hour + '点'
}

function loadMemberAnalysis() {
  if (selectedMemberId.value) {
    memberAnalysis.value = memberStore.getMemberBehaviorAnalysis(selectedMemberId.value)
    nextTick(() => {
      initTrendChart()
      initCategoryChart()
      initTimeChart()
    })
  } else {
    memberAnalysis.value = null
  }
}

function initGrowthChart() {
  const chart = echarts.init(growthChartRef.value)
  const analysis = memberStore.getOverallAnalysis()

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增会员', '活跃会员']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: analysis.memberGrowth.map(m => m.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增会员',
        type: 'line',
        data: analysis.memberGrowth.map(m => m.newMembers),
        smooth: true,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '活跃会员',
        type: 'line',
        data: analysis.memberGrowth.map(m => m.activeMembers),
        smooth: true,
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initLevelChart() {
  const chart = echarts.init(levelChartRef.value)
  const analysis = memberStore.getOverallAnalysis()

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
        name: '会员等级',
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
        data: analysis.levelDistribution.map(item => ({
          value: item.value,
          name: item.name
        }))
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initConsumptionChart() {
  const chart = echarts.init(consumptionChartRef.value)
  const analysis = memberStore.getOverallAnalysis()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: analysis.consumptionDistribution.map(d => d.range)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '会员数',
        type: 'bar',
        data: analysis.consumptionDistribution.map(d => d.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initTrendChart() {
  if (!memberAnalysis.value) return
  const chart = echarts.init(trendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: memberAnalysis.value.consumptionTrend.map(t => t.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '消费金额',
        type: 'line',
        data: memberAnalysis.value.consumptionTrend.map(t => t.amount),
        smooth: true,
        itemStyle: { color: '#f56c6c' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initCategoryChart() {
  if (!memberAnalysis.value) return
  const chart = echarts.init(categoryChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '品类偏好',
        type: 'pie',
        radius: '60%',
        data: memberAnalysis.value.categoryPreference.map(c => ({
          value: c.amount,
          name: c.category
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initTimeChart() {
  if (!memberAnalysis.value) return
  const chart = echarts.init(timeChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: memberAnalysis.value.orderTimeDistribution.map(t => t.hour)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: memberAnalysis.value.orderTimeDistribution.map(t => t.count),
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

onMounted(async () => {
  await nextTick()
  initGrowthChart()
  initLevelChart()
  initConsumptionChart()
})
</script>

<style scoped>
.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  margin-left: 12px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.small-chart {
  height: 200px;
}

.chart-title {
  font-weight: 500;
  margin-bottom: 10px;
  color: #303133;
}

.analysis-content {
  padding: 10px 0;
}

.analysis-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.analysis-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.analysis-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.consumption {
  color: #f56c6c;
  font-weight: 500;
}
</style>
