<template>
  <div class="coupon-list">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="优惠券名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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

    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>优惠券列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加优惠券
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="name" label="优惠券名称" min-width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'discount' ? 'success' : 'warning'" size="small">
              {{ row.type === 'discount' ? '满减券' : '折扣券' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠内容" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 'discount'">满{{ row.minAmount }}减{{ row.value }}</span>
            <span v-else>{{ row.value }}折</span>
          </template>
        </el-table-column>
        <el-table-column label="发放/使用" width="120">
          <template #default="{ row }">
            <span>{{ row.usedCount }} / {{ row.totalCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余" width="100">
          <template #default="{ row }">
            <el-tag :type="row.remainCount > 50 ? 'success' : row.remainCount > 0 ? 'warning' : 'danger'" size="small">
              {{ row.remainCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">
            <div>{{ formatDate(row.startTime) }}</div>
            <div>至 {{ formatDate(row.endTime) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="限领" width="80">
          <template #default="{ row }">
            {{ row.perLimit }}张/人
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑优惠券' : '添加优惠券'" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入优惠券名称" maxlength="50" show-word-limit />
        </el-form-item>
        
        <el-form-item label="优惠券类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio value="discount">满减券</el-radio>
            <el-radio value="percent">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优惠金额" prop="value" v-if="formData.type === 'discount'">
          <el-input-number v-model="formData.value" :min="1" :precision="0" placeholder="优惠金额" />
          <span style="margin-left: 10px;">元</span>
        </el-form-item>

        <el-form-item label="折扣比例" prop="value" v-else>
          <el-input-number v-model="formData.value" :min="1" :max="99" :precision="0" placeholder="折扣比例" />
          <span style="margin-left: 10px;">折 (如：9表示9折)</span>
        </el-form-item>

        <el-form-item label="最低消费" prop="minAmount">
          <el-input-number v-model="formData.minAmount" :min="0" :precision="0" placeholder="最低消费金额" />
          <span style="margin-left: 10px;">元</span>
        </el-form-item>

        <el-form-item label="发放总量" prop="totalCount">
          <el-input-number v-model="formData.totalCount" :min="1" :precision="0" placeholder="发放总量" />
          <span style="margin-left: 10px;">张</span>
        </el-form-item>

        <el-form-item label="每人限领" prop="perLimit">
          <el-input-number v-model="formData.perLimit" :min="1" :precision="0" placeholder="每人限领" />
          <span style="margin-left: 10px;">张</span>
        </el-form-item>

        <el-form-item label="有效期" prop="dateRange">
          <el-date-picker
            v-model="formData.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
          />
        </el-form-item>

        <el-form-item label="使用说明" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入使用说明" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMemberStore } from '@/stores/member'
import dayjs from 'dayjs'

const memberStore = useMemberStore()

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentCoupon = ref(null)
const formRef = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  name: '',
  type: 'discount',
  value: 10,
  minAmount: 100,
  totalCount: 100,
  perLimit: 1,
  dateRange: [],
  description: '',
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入优惠金额或折扣', trigger: 'blur' }],
  totalCount: [{ required: true, message: '请输入发放总量', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

function fetchData() {
  loading.value = true
  memberStore.fetchCoupons({
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
  handleSearch()
}

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, {
    name: '',
    type: 'discount',
    value: 10,
    minAmount: 100,
    totalCount: 100,
    perLimit: 1,
    dateRange: [],
    description: '',
    status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentCoupon.value = row
  Object.assign(formData, {
    name: row.name,
    type: row.type,
    value: row.value,
    minAmount: row.minAmount,
    totalCount: row.totalCount,
    perLimit: row.perLimit,
    dateRange: [row.startTime, row.endTime],
    description: row.description,
    status: row.status
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    const couponData = {
      name: formData.name,
      type: formData.type,
      value: formData.value,
      minAmount: formData.minAmount,
      totalCount: formData.totalCount,
      remainCount: formData.totalCount,
      perLimit: formData.perLimit,
      startTime: formData.dateRange[0],
      endTime: formData.dateRange[1],
      description: formData.description,
      status: formData.status
    }

    if (isEdit.value) {
      memberStore.updateCoupon(currentCoupon.value.id, couponData)
      ElMessage.success('修改成功')
    } else {
      memberStore.addCoupon(couponData)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

function handleStatusChange(row) {
  memberStore.updateCoupon(row.id, { status: row.status })
  ElMessage.success(row.status === 1 ? '优惠券已启用' : '优惠券已禁用')
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除优惠券 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    memberStore.deleteCoupon(row.id)
    ElMessage.success('删除成功')
    fetchData()
  }).catch(() => {})
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
