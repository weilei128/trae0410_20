<template>
  <div class="order-list">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="订单号/会员名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option
              v-for="status in orderStore.statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" style="margin: 20px 0;">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ active: searchForm.status === '' }" @click="filterByStatus('')">
          <div class="stat-content">
            <span class="stat-label">全部订单</span>
            <span class="stat-value">{{ orderStore.orderStatistics.total }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card warning" :class="{ active: searchForm.status === 0 }" @click="filterByStatus(0)">
          <div class="stat-content">
            <span class="stat-label">待付款</span>
            <span class="stat-value">{{ orderStore.orderStatistics.pending }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card primary" :class="{ active: searchForm.status === 1 }" @click="filterByStatus(1)">
          <div class="stat-content">
            <span class="stat-label">待发货</span>
            <span class="stat-value">{{ orderStore.orderStatistics.paid }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card success" :class="{ active: searchForm.status === 4 }" @click="filterByStatus(4)">
          <div class="stat-content">
            <span class="stat-label">已完成</span>
            <span class="stat-value">{{ orderStore.orderStatistics.completed }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="商品信息" min-width="250">
          <template #default="{ row }">
            <div class="order-items">
              <div v-for="item in row.items.slice(0, 2)" :key="item.productId" class="order-item">
                <el-image :src="item.image" fit="cover" class="item-image" />
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="item-sku">{{ item.sku }} x{{ item.quantity }}</div>
                </div>
              </div>
              <div v-if="row.items.length > 2" class="more-items">
                +{{ row.items.length - 2 }} 件商品
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="100" />
        <el-table-column label="订单金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 1"
              type="success"
              link
              @click="handleShip(row)"
            >发货</el-button>
            <el-button
              v-if="row.status === 0"
              type="warning"
              link
              @click="handleCancel(row)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="shipDialogVisible" title="订单发货" width="500px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="快递公司">
          <el-select v-model="shipForm.company" placeholder="请选择快递公司">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="京东物流" value="京东物流" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通速递" value="圆通速递" />
            <el-option label="韵达快递" value="韵达快递" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="shipForm.trackingNo" placeholder="请输入快递单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '@/stores/order'
import dayjs from 'dayjs'

const router = useRouter()
const orderStore = useOrderStore()

const loading = ref(false)
const tableData = ref([])
const dateRange = ref([])
const shipDialogVisible = ref(false)
const currentOrder = ref(null)

const searchForm = reactive({
  keyword: '',
  status: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const shipForm = reactive({
  company: '',
  trackingNo: ''
})

function fetchData() {
  loading.value = true
  orderStore.fetchOrders({
    ...searchForm,
    page: pagination.page,
    pageSize: pagination.pageSize
  }).then(res => {
    tableData.value = res.list
    pagination.total = res.total
    loading.value = false
  })
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.startDate = ''
  searchForm.endDate = ''
  dateRange.value = []
  handleSearch()
}

function handleDateChange(val) {
  if (val) {
    searchForm.startDate = val[0]
    searchForm.endDate = val[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
}

function filterByStatus(status) {
  searchForm.status = status
  handleSearch()
}

function getStatusType(status) {
  const statusMap = {
    0: 'warning',
    1: 'primary',
    2: '',
    3: 'success',
    4: 'success',
    5: 'info',
    6: 'danger',
    7: 'info'
  }
  return statusMap[status] || ''
}

function getStatusLabel(status) {
  return orderStore.ORDER_STATUS[Object.keys(orderStore.ORDER_STATUS).find(
    key => orderStore.ORDER_STATUS[key].value === status
  )]?.label || '未知'
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function handleViewDetail(row) {
  router.push(`/order/detail/${row.id}`)
}

function handleShip(row) {
  currentOrder.value = row
  shipForm.company = ''
  shipForm.trackingNo = ''
  shipDialogVisible.value = true
}

function confirmShip() {
  if (!shipForm.company || !shipForm.trackingNo) {
    ElMessage.warning('请填写完整的发货信息')
    return
  }

  orderStore.addLogistics(currentOrder.value.id, {
    company: shipForm.company,
    trackingNo: shipForm.trackingNo
  })

  ElMessage.success('发货成功')
  shipDialogVisible.value = false
  fetchData()
}

function handleCancel(row) {
  ElMessageBox.confirm(`确定要取消订单 "${row.orderNo}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    orderStore.updateOrderStatus(row.id, 5, '管理员取消订单')
    ElMessage.success('订单已取消')
    fetchData()
  }).catch(() => {})
}

onMounted(() => {
  const status = router.currentRoute.value.query.status
  if (status !== undefined) {
    searchForm.status = Number(status)
  }
  fetchData()
})
</script>

<style scoped>
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover,
.stat-card.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.active {
  border: 2px solid #409eff;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.stat-card.primary .stat-value {
  color: #409eff;
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.stat-content {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #909399;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-top: 8px;
  color: #303133;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item {
  display: flex;
  align-items: center;
}

.item-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 8px;
}

.item-name {
  font-size: 13px;
  color: #303133;
}

.item-sku {
  font-size: 12px;
  color: #909399;
}

.more-items {
  font-size: 12px;
  color: #909399;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}
</style>
