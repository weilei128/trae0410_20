<template>
  <div class="member-list">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="会员名/手机号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="searchForm.level" placeholder="请选择" clearable>
            <el-option
              v-for="level in memberStore.levelOptions"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
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
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon :size="24"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ memberStore.memberStatistics.newThisMonth }}</div>
              <div class="stat-label">本月新增</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon :size="24"><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ memberStore.memberStatistics.activeThisMonth }}</div>
              <div class="stat-label">本月活跃</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon :size="24"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(memberStore.memberStatistics.avgConsumption) }}</div>
              <div class="stat-label">人均消费</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>会员列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加会员
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="会员ID" width="100" />
        <el-table-column label="会员信息" min-width="200">
          <template #default="{ row }">
            <div class="member-info">
              <el-avatar :size="40" icon="UserFilled" />
              <div class="member-detail">
                <div class="member-name">{{ row.name }}</div>
                <div class="member-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="会员等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ getLevelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100">
          <template #default="{ row }">
            <span class="points">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消费金额" width="120">
          <template #default="{ row }">
            <span class="consumption">¥{{ row.totalConsumption }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="80" />
        <el-table-column prop="couponCount" label="优惠券" width="80" />
        <el-table-column label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleIssueCoupon(row)">发券</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑会员' : '添加会员'" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日" prop="birthday">
          <el-date-picker v-model="formData.birthday" type="date" placeholder="请选择生日" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="couponDialogVisible" title="发放优惠券" width="500px">
      <el-form label-width="100px">
        <el-form-item label="会员">
          <span>{{ currentMember?.name }}</span>
        </el-form-item>
        <el-form-item label="选择优惠券">
          <el-select v-model="selectedCoupon" placeholder="请选择优惠券">
            <el-option
              v-for="coupon in availableCoupons"
              :key="coupon.id"
              :label="`${coupon.name} (剩余${coupon.remainCount}张)`"
              :value="coupon.id"
              :disabled="coupon.remainCount <= 0"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmIssueCoupon">确认发放</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawerVisible" title="会员详情" size="600px">
      <template v-if="currentMember">
        <div class="member-profile">
          <el-avatar :size="80" icon="UserFilled" />
          <div class="profile-info">
            <h3>{{ currentMember.name }}</h3>
            <el-tag :type="getLevelType(currentMember.level)" size="small">
              {{ getLevelName(currentMember.level) }}
            </el-tag>
          </div>
        </div>
        
        <el-descriptions :column="2" border style="margin-top: 20px;">
          <el-descriptions-item label="会员ID">{{ currentMember.id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentMember.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentMember.email }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentMember.gender === 'male' ? '男' : '女' }}</el-descriptions-item>
          <el-descriptions-item label="生日">{{ currentMember.birthday }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ currentMember.points }}</el-descriptions-item>
          <el-descriptions-item label="消费金额">¥{{ currentMember.totalConsumption }}</el-descriptions-item>
          <el-descriptions-item label="订单数">{{ currentMember.orderCount }}</el-descriptions-item>
          <el-descriptions-item label="优惠券">{{ currentMember.couponCount }}张</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(currentMember.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="level-progress" style="margin-top: 20px;">
          <h4>等级进度</h4>
          <el-progress
            :percentage="getLevelProgress(currentMember)"
            :format="() => `${currentMember.points} / ${getNextLevelPoints(currentMember)} 积分`"
          />
          <p class="level-tip" v-if="getNextLevelName(currentMember)">
            距离 {{ getNextLevelName(currentMember) }} 还需 {{ getNextLevelPoints(currentMember) - currentMember.points }} 积分
          </p>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMemberStore } from '@/stores/member'
import dayjs from 'dayjs'

const memberStore = useMemberStore()

const loading = ref(false)
const tableData = ref([])
const dateRange = ref([])
const dialogVisible = ref(false)
const couponDialogVisible = ref(false)
const detailDrawerVisible = ref(false)
const isEdit = ref(false)
const currentMember = ref(null)
const selectedCoupon = ref('')
const formRef = ref(null)

const searchForm = reactive({
  keyword: '',
  level: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  name: '',
  phone: '',
  email: '',
  gender: 'male',
  birthday: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const availableCoupons = computed(() => {
  return memberStore.coupons.filter(c => c.status === 1)
})

function fetchData() {
  loading.value = true
  memberStore.fetchMembers({
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
  searchForm.level = ''
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

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, {
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    birthday: ''
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentMember.value = row
  Object.assign(formData, {
    name: row.name,
    phone: row.phone,
    email: row.email,
    gender: row.gender,
    birthday: row.birthday
  })
  dialogVisible.value = true
}

function handleView(row) {
  currentMember.value = row
  detailDrawerVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      memberStore.updateMember(currentMember.value.id, formData)
      ElMessage.success('修改成功')
    } else {
      memberStore.addMember(formData)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除会员 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    memberStore.deleteMember(row.id)
    ElMessage.success('删除成功')
    fetchData()
  }).catch(() => {})
}

function handleIssueCoupon(row) {
  currentMember.value = row
  selectedCoupon.value = ''
  couponDialogVisible.value = true
}

function confirmIssueCoupon() {
  if (!selectedCoupon.value) {
    ElMessage.warning('请选择优惠券')
    return
  }
  
  const result = memberStore.issueCouponToMember(currentMember.value.id, selectedCoupon.value)
  if (result) {
    ElMessage.success('优惠券发放成功')
    couponDialogVisible.value = false
    fetchData()
  } else {
    ElMessage.error('优惠券发放失败')
  }
}

function getLevelName(level) {
  return memberStore.MEMBER_LEVELS[level]?.name || '未知'
}

function getLevelType(level) {
  return memberStore.MEMBER_LEVELS[level]?.color || ''
}

function getLevelProgress(member) {
  const currentLevel = memberStore.MEMBER_LEVELS[member.level]
  const nextLevel = memberStore.MEMBER_LEVELS[member.level + 1]
  if (!nextLevel) return 100
  const progress = (member.points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints) * 100
  return Math.min(100, Math.max(0, progress))
}

function getNextLevelPoints(member) {
  const nextLevel = memberStore.MEMBER_LEVELS[member.level + 1]
  return nextLevel ? nextLevel.minPoints : member.points
}

function getNextLevelName(member) {
  const nextLevel = memberStore.MEMBER_LEVELS[member.level + 1]
  return nextLevel ? nextLevel.name : ''
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : ''
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toLocaleString()
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

.stat-card {
  margin-bottom: 0;
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

.member-info {
  display: flex;
  align-items: center;
}

.member-detail {
  margin-left: 12px;
}

.member-name {
  font-weight: 500;
}

.member-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.points {
  color: #e6a23c;
  font-weight: 500;
}

.consumption {
  color: #f56c6c;
  font-weight: 500;
}

.member-profile {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: #fff;
}

.profile-info {
  margin-left: 20px;
}

.profile-info h3 {
  margin: 0 0 8px 0;
}

.level-progress {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.level-progress h4 {
  margin: 0 0 15px 0;
}

.level-tip {
  margin: 10px 0 0 0;
  font-size: 13px;
  color: #909399;
}
</style>
