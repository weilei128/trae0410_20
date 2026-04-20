<template>
  <div class="product-list">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="商品名称/ID" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择" clearable>
            <el-option
              v-for="cat in productStore.categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
          <span>商品列表</span>
          <el-button type="primary" @click="$router.push('/product/add')">
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="商品ID" width="100" />
        <el-table-column label="商品信息" min-width="250">
          <template #default="{ row }">
            <div class="product-info">
              <el-image :src="row.mainImage" fit="cover" class="product-image" />
              <div class="product-detail">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-desc">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column label="价格区间" width="150">
          <template #default="{ row }">
            <span v-if="row.skus.length > 0">
              ¥{{ Math.min(...row.skus.map(s => s.price)) }} - ¥{{ Math.max(...row.skus.map(s => s.price)) }}
            </span>
            <span v-else>¥{{ row.basePrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            <el-tag :type="getStockType(row)" size="small">
              {{ getTotalStock(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SKU数量" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.skus.length }} 个</el-tag>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleSkuManage(row)">SKU管理</el-button>
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

    <el-dialog v-model="skuDialogVisible" title="SKU管理" width="800px">
      <el-table :data="currentProduct?.skus || []" border>
        <el-table-column prop="sku" label="SKU编码" width="150" />
        <el-table-column label="规格" min-width="150">
          <template #default="{ row }">
            <span v-for="(value, key) in row.specs" :key="key" class="spec-tag">
              {{ key }}: {{ value }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.price" :min="0" :precision="2" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="库存" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.stock" :min="0" size="small" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSku">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const productStore = useProductStore()

const loading = ref(false)
const tableData = ref([])
const skuDialogVisible = ref(false)
const currentProduct = ref(null)

const searchForm = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

function fetchData() {
  loading.value = true
  productStore.fetchProducts({
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
  searchForm.categoryId = ''
  searchForm.status = ''
  handleSearch()
}

function handleStatusChange(row) {
  productStore.updateProduct(row.id, { status: row.status })
  ElMessage.success(row.status === 1 ? '商品已上架' : '商品已下架')
}

function handleEdit(row) {
  router.push(`/product/edit/${row.id}`)
}

function handleSkuManage(row) {
  currentProduct.value = JSON.parse(JSON.stringify(row))
  skuDialogVisible.value = true
}

function handleSaveSku() {
  if (currentProduct.value) {
    productStore.updateProduct(currentProduct.value.id, {
      skus: currentProduct.value.skus
    })
    ElMessage.success('SKU保存成功')
    skuDialogVisible.value = false
    fetchData()
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除商品 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    productStore.deleteProduct(row.id)
    ElMessage.success('删除成功')
    fetchData()
  }).catch(() => {})
}

function getTotalStock(product) {
  return product.skus.reduce((sum, sku) => sum + sku.stock, 0)
}

function getStockType(product) {
  const total = getTotalStock(product)
  if (total <= product.stockWarning) return 'danger'
  if (total <= product.stockWarning * 2) return 'warning'
  return 'success'
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
  color: #303133;
}

.product-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.spec-tag {
  margin-right: 8px;
  padding: 2px 6px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
}
</style>
