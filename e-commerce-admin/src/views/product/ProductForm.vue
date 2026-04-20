<template>
  <div class="product-form">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑商品' : '添加商品' }}</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        style="max-width: 800px;"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="请选择分类" @change="handleCategoryChange">
            <el-option
              v-for="cat in productStore.categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="商品主图" prop="mainImage">
          <el-input v-model="formData.mainImage" placeholder="请输入图片URL" />
          <div v-if="formData.mainImage" style="margin-top: 10px;">
            <el-image :src="formData.mainImage" fit="cover" style="width: 100px; height: 100px; border-radius: 4px;" />
          </div>
        </el-form-item>

        <el-form-item label="商品简介" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入商品简介" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="基础价格" prop="basePrice">
          <el-input-number v-model="formData.basePrice" :min="0" :precision="2" placeholder="基础价格" />
        </el-form-item>

        <el-form-item label="库存预警值" prop="stockWarning">
          <el-input-number v-model="formData.stockWarning" :min="0" placeholder="库存预警阈值" />
          <span style="margin-left: 10px; color: #909399;">当库存低于此值时将显示预警</span>
        </el-form-item>

        <el-divider content-position="left">商品规格</el-divider>

        <el-form-item label="规格配置">
          <div class="specs-container">
            <div v-for="(spec, index) in formData.specs" :key="index" class="spec-item">
              <el-input v-model="spec.name" placeholder="规格名称" style="width: 120px;" />
              <el-select
                v-model="spec.values"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="规格值"
                style="width: 300px; margin-left: 10px;"
              />
              <el-button type="danger" link @click="removeSpec(index)" style="margin-left: 10px;">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" link @click="addSpec">
              <el-icon><Plus /></el-icon>
              添加规格
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="SKU预览">
          <el-button type="primary" @click="generateSku" :disabled="!canGenerateSku">
            生成SKU
          </el-button>
          <span style="margin-left: 10px; color: #909399;">
            将生成 {{ skuCount }} 个SKU组合
          </span>
        </el-form-item>

        <el-form-item v-if="formData.skus.length > 0" label="SKU列表">
          <el-table :data="formData.skus" border max-height="400">
            <el-table-column prop="sku" label="SKU编码" width="150" />
            <el-table-column label="规格组合" min-width="150">
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
            <el-table-column label="库存" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.stock" :min="0" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-divider content-position="left">商品详情</el-divider>

        <el-form-item label="详情描述" prop="detail">
          <div style="border: 1px solid #dcdfe6; border-radius: 4px; width: 100%;">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="simple"
              style="border-bottom: 1px solid #dcdfe6;"
            />
            <Editor
              v-model="formData.detail"
              :defaultConfig="editorConfig"
              mode="simple"
              style="height: 400px; overflow-y: hidden;"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存修改' : '添加商品' }}
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/product'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const formRef = ref(null)
const editorRef = shallowRef()
const submitting = ref(false)

const isEdit = computed(() => !!route.params.id)

const formData = reactive({
  name: '',
  categoryId: '',
  categoryName: '',
  mainImage: '',
  images: [],
  description: '',
  basePrice: 0,
  stockWarning: 10,
  specs: [],
  skus: [],
  detail: '',
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  mainImage: [{ required: true, message: '请输入商品主图', trigger: 'blur' }],
  basePrice: [{ required: true, message: '请输入基础价格', trigger: 'blur' }]
}

const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入商品详情...',
  MENU_CONF: {
    uploadImage: {
      customUpload: () => {}
    }
  }
}

const canGenerateSku = computed(() => {
  return formData.specs.length > 0 && formData.specs.every(s => s.name && s.values.length > 0)
})

const skuCount = computed(() => {
  if (!canGenerateSku.value) return 0
  return formData.specs.reduce((count, spec) => count * spec.values.length, 1)
})

function handleEditorCreated(editor) {
  editorRef.value = editor
}

function handleCategoryChange(val) {
  const category = productStore.categories.find(c => c.id === val)
  formData.categoryName = category ? category.name : ''
}

function addSpec() {
  formData.specs.push({ name: '', values: [] })
}

function removeSpec(index) {
  formData.specs.splice(index, 1)
}

function generateSku() {
  if (!canGenerateSku.value) return
  
  formData.skus = productStore.generateSKUs(
    formData.specs,
    formData.basePrice,
    100
  )
  
  ElMessage.success(`已生成 ${formData.skus.length} 个SKU`)
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    if (formData.skus.length === 0) {
      formData.skus = productStore.generateSKUs([], formData.basePrice, 100)
    }

    submitting.value = true

    if (isEdit.value) {
      productStore.updateProduct(route.params.id, formData)
      ElMessage.success('修改成功')
    } else {
      productStore.addProduct(formData)
      ElMessage.success('添加成功')
    }

    router.push('/product')
  } catch (error) {
    console.error('Validation failed:', error)
  } finally {
    submitting.value = false
  }
}

function loadProductData() {
  if (isEdit.value) {
    const product = productStore.getProductById(route.params.id)
    if (product) {
      Object.assign(formData, JSON.parse(JSON.stringify(product)))
    } else {
      ElMessage.error('商品不存在')
      router.push('/product')
    }
  }
}

onMounted(() => {
  loadProductData()
})

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.specs-container {
  width: 100%;
}

.spec-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.spec-tag {
  margin-right: 8px;
  padding: 2px 6px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
}
</style>
