<template>
  <div class="order-detail">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="order-no">订单号：{{ order?.orderNo }}</span>
            <el-tag :type="getStatusType(order?.status)" size="large">
              {{ getStatusLabel(order?.status) }}
            </el-tag>
          </div>
          <div class="header-right">
            <el-button
              v-if="order?.status === 1"
              type="success"
              @click="handleShip"
            >发货</el-button>
            <el-button
              v-if="order?.status === 0"
              type="warning"
              @click="handleCancel"
            >取消订单</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="never" class="section-card">
            <template #header>
              <span class="section-title">订单商品</span>
            </template>
            <el-table :data="order?.items || []" border>
              <el-table-column label="商品" min-width="250">
                <template #default="{ row }">
                  <div class="product-info">
                    <el-image :src="row.image" fit="cover" class="product-image" />
                    <div>
                      <div class="product-name">{{ row.productName }}</div>
                      <div class="product-sku">{{ row.sku }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="price" label="单价" width="120">
                <template #default="{ row }">
                  ¥{{ row.price }}
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column label="小计" width="120">
                <template #default="{ row }">
                  <span class="subtotal">¥{{ row.price * row.quantity }}</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="order-summary">
              <div class="summary-item">
                <span>商品总额：</span>
                <span>¥{{ order?.totalAmount }}</span>
              </div>
              <div class="summary-item">
                <span>优惠金额：</span>
                <span class="discount">-¥{{ order?.discountAmount }}</span>
              </div>
              <div class="summary-item">
                <span>运费：</span>
                <span>¥{{ order?.shippingFee }}</span>
              </div>
              <div class="summary-item total">
                <span>实付金额：</span>
                <span class="pay-amount">¥{{ order?.payAmount }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="section-card">
            <template #header>
              <span class="section-title">审核流程</span>
            </template>
            <el-steps :active="getApprovalStep()" align-center>
              <el-step
                v-for="step in order?.approvalSteps || []"
                :key="step.step"
                :title="step.name"
                :description="getStepDescription(step)"
                :status="getStepStatus(step)"
              />
            </el-steps>
            <div class="approval-actions" v-if="hasPendingApproval">
              <el-button type="success" @click="handleApprove(true)">通过</el-button>
              <el-button type="danger" @click="showRejectDialog">驳回</el-button>
            </div>
          </el-card>

          <el-card shadow="never" class="section-card" v-if="order?.logistics">
            <template #header>
              <span class="section-title">物流信息</span>
            </template>
            <div class="logistics-info">
              <div class="logistics-header">
                <span>快递公司：{{ order.logistics.company }}</span>
                <span>快递单号：{{ order.logistics.trackingNo }}</span>
              </div>
              <el-timeline>
                <el-timeline-item
                  v-for="(track, index) in order.logistics.tracks"
                  :key="index"
                  :timestamp="formatDate(track.time)"
                  placement="top"
                  :type="index === 0 ? 'primary' : 'info'"
                >
                  <div class="track-status">{{ track.status }}</div>
                  <div class="track-desc">{{ track.description }}</div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="section-card">
            <template #header>
              <span class="section-title">收货信息</span>
            </template>
            <div class="info-list">
              <div class="info-item">
                <span class="label">收货人：</span>
                <span>{{ order?.address?.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">联系电话：</span>
                <span>{{ order?.address?.phone }}</span>
              </div>
              <div class="info-item">
                <span class="label">收货地址：</span>
                <span>{{ order?.address?.province }}{{ order?.address?.city }}{{ order?.address?.district }}{{ order?.address?.detail }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="section-card">
            <template #header>
              <span class="section-title">订单信息</span>
            </template>
            <div class="info-list">
              <div class="info-item">
                <span class="label">订单编号：</span>
                <span>{{ order?.orderNo }}</span>
              </div>
              <div class="info-item">
                <span class="label">会员名称：</span>
                <span>{{ order?.memberName }}</span>
              </div>
              <div class="info-item">
                <span class="label">下单时间：</span>
                <span>{{ formatDate(order?.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="label">更新时间：</span>
                <span>{{ formatDate(order?.updatedAt) }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="section-card">
            <template #header>
              <span class="section-title">状态流转</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(history, index) in order?.statusHistory || []"
                :key="index"
                :timestamp="formatDate(history.time)"
                placement="top"
              >
                <div class="history-status">{{ history.statusName }}</div>
                <div class="history-remark" v-if="history.remark">{{ history.remark }}</div>
                <div class="history-operator">操作人：{{ history.operator }}</div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
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

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="500px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleApprove(false)">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '@/stores/order'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const order = ref(null)
const shipDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const shipForm = reactive({
  company: '',
  trackingNo: ''
})

const hasPendingApproval = computed(() => {
  if (!order.value?.approvalSteps) return false
  return order.value.approvalSteps.some(s => s.status === 'pending')
})

function loadOrder() {
  const orderData = orderStore.getOrderById(route.params.id)
  if (orderData) {
    order.value = orderData
  } else {
    ElMessage.error('订单不存在')
    router.push('/order')
  }
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
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : ''
}

function getApprovalStep() {
  if (!order.value?.approvalSteps) return 0
  const approvedCount = order.value.approvalSteps.filter(s => s.status === 'approved').length
  return approvedCount
}

function getStepStatus(step) {
  if (step.status === 'approved') return 'success'
  if (step.status === 'rejected') return 'error'
  if (step.status === 'pending') return 'process'
  return 'wait'
}

function getStepDescription(step) {
  if (step.status === 'approved') {
    return `${step.approver} - ${formatDate(step.approvedAt)}`
  }
  if (step.status === 'rejected') {
    return `驳回原因：${step.remark}`
  }
  return '待处理'
}

function handleShip() {
  shipForm.company = ''
  shipForm.trackingNo = ''
  shipDialogVisible.value = true
}

function confirmShip() {
  if (!shipForm.company || !shipForm.trackingNo) {
    ElMessage.warning('请填写完整的发货信息')
    return
  }

  orderStore.addLogistics(order.value.id, {
    company: shipForm.company,
    trackingNo: shipForm.trackingNo
  })

  ElMessage.success('发货成功')
  shipDialogVisible.value = false
  loadOrder()
}

function handleCancel() {
  ElMessageBox.confirm('确定要取消此订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    orderStore.updateOrderStatus(order.value.id, 5, '管理员取消订单')
    ElMessage.success('订单已取消')
    loadOrder()
  }).catch(() => {})
}

function showRejectDialog() {
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

function handleApprove(approved) {
  if (!approved && !rejectReason.value) {
    ElMessage.warning('请输入驳回原因')
    return
  }

  const pendingStep = order.value.approvalSteps.find(s => s.status === 'pending')
  if (pendingStep) {
    if (approved) {
      orderStore.approveOrder(order.value.id, pendingStep.step, '审核通过')
      ElMessage.success('审核通过')
    } else {
      orderStore.approveOrder(order.value.id, pendingStep.step, rejectReason.value)
      orderStore.updateOrderStatus(order.value.id, 5, '审核驳回：' + rejectReason.value)
      ElMessage.success('已驳回')
    }
    rejectDialogVisible.value = false
    loadOrder()
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.order-no {
  font-size: 16px;
  font-weight: 500;
}

.section-card {
  margin-bottom: 20px;
}

.section-title {
  font-weight: 500;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  margin-right: 12px;
}

.product-name {
  font-weight: 500;
}

.product-sku {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.subtotal {
  color: #f56c6c;
  font-weight: 500;
}

.order-summary {
  margin-top: 20px;
  text-align: right;
}

.summary-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.summary-item.total {
  font-size: 18px;
  font-weight: bold;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.discount {
  color: #67c23a;
}

.pay-amount {
  color: #f56c6c;
  font-size: 24px;
}

.approval-actions {
  margin-top: 20px;
  text-align: center;
}

.logistics-info {
  padding: 10px 0;
}

.logistics-header {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.track-status {
  font-weight: 500;
}

.track-desc {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}

.info-list {
  padding: 10px 0;
}

.info-item {
  margin-bottom: 15px;
}

.info-item .label {
  color: #909399;
  display: inline-block;
  width: 80px;
}

.history-status {
  font-weight: 500;
}

.history-remark {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}

.history-operator {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
