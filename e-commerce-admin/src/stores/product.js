import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const categories = ref([
    { id: 1, name: '电子产品' },
    { id: 2, name: '服装鞋帽' },
    { id: 3, name: '食品饮料' },
    { id: 4, name: '家居用品' },
    { id: 5, name: '美妆护肤' }
  ])
  const loading = ref(false)
  const total = ref(0)

  const lowStockProducts = computed(() => {
    return products.value.filter(p => 
      p.skus.some(sku => sku.stock <= p.stockWarning)
    )
  })

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function generateSKUs(specs, basePrice, baseStock) {
    if (!specs || specs.length === 0) {
      return [{
        id: generateId(),
        specs: {},
        price: basePrice,
        stock: baseStock,
        sku: 'DEFAULT'
      }]
    }

    const specValues = specs.map(s => s.values)
    const combinations = specValues.reduce((acc, values) => {
      return acc.flatMap(accItem => 
        values.map(v => [...accItem, v])
      )
    }, [[]])

    return combinations.map((combo, index) => {
      const specObj = {}
      specs.forEach((spec, i) => {
        specObj[spec.name] = combo[i]
      })
      return {
        id: generateId(),
        specs: specObj,
        price: basePrice + (index * 10),
        stock: Math.max(0, baseStock - (index * 5)),
        sku: Object.values(specObj).join('-')
      }
    })
  }

  function fetchProducts(params = {}) {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...products.value]
        
        if (params.keyword) {
          result = result.filter(p => 
            p.name.includes(params.keyword) || 
            p.id.includes(params.keyword)
          )
        }
        if (params.categoryId) {
          result = result.filter(p => p.categoryId === params.categoryId)
        }
        if (params.status !== undefined && params.status !== '') {
          result = result.filter(p => p.status === params.status)
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

  function getProductById(id) {
    return products.value.find(p => p.id === id)
  }

  function addProduct(product) {
    const newProduct = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    products.value.unshift(newProduct)
    total.value++
    return newProduct
  }

  function updateProduct(id, data) {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        ...data,
        updatedAt: new Date().toISOString()
      }
      return products.value[index]
    }
    return null
  }

  function deleteProduct(id) {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value.splice(index, 1)
      total.value--
      return true
    }
    return false
  }

  function updateSKUStock(productId, skuId, stock) {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      const sku = product.skus.find(s => s.id === skuId)
      if (sku) {
        sku.stock = stock
        return true
      }
    }
    return false
  }

  function initMockData() {
    const mockProducts = [
      {
        id: 'P001',
        name: 'iPhone 15 Pro Max',
        categoryId: 1,
        categoryName: '电子产品',
        mainImage: 'https://picsum.photos/200/200?random=1',
        images: ['https://picsum.photos/200/200?random=1'],
        description: '最新款苹果手机，搭载A17 Pro芯片',
        detail: '<h2>iPhone 15 Pro Max</h2><p>全新钛金属设计，A17 Pro芯片，专业级摄像系统</p>',
        specs: [
          { name: '颜色', values: ['深空黑', '自然钛', '蓝色钛'] },
          { name: '存储', values: ['256GB', '512GB', '1TB'] }
        ],
        skus: [],
        basePrice: 9999,
        stockWarning: 10,
        status: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 'P002',
        name: 'MacBook Pro 14英寸',
        categoryId: 1,
        categoryName: '电子产品',
        mainImage: 'https://picsum.photos/200/200?random=2',
        images: ['https://picsum.photos/200/200?random=2'],
        description: 'M3 Pro芯片，强劲性能',
        detail: '<h2>MacBook Pro</h2><p>M3 Pro芯片，Liquid Retina XDR显示屏</p>',
        specs: [
          { name: '芯片', values: ['M3 Pro', 'M3 Max'] },
          { name: '内存', values: ['18GB', '36GB'] }
        ],
        skus: [],
        basePrice: 16999,
        stockWarning: 5,
        status: 1,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-16T00:00:00.000Z'
      },
      {
        id: 'P003',
        name: '经典款卫衣',
        categoryId: 2,
        categoryName: '服装鞋帽',
        mainImage: 'https://picsum.photos/200/200?random=3',
        images: ['https://picsum.photos/200/200?random=3'],
        description: '舒适纯棉，经典款式',
        detail: '<h2>经典款卫衣</h2><p>100%纯棉材质，舒适透气</p>',
        specs: [
          { name: '颜色', values: ['白色', '黑色', '灰色'] },
          { name: '尺码', values: ['S', 'M', 'L', 'XL'] }
        ],
        skus: [],
        basePrice: 199,
        stockWarning: 20,
        status: 1,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-17T00:00:00.000Z'
      },
      {
        id: 'P004',
        name: '有机绿茶礼盒',
        categoryId: 3,
        categoryName: '食品饮料',
        mainImage: 'https://picsum.photos/200/200?random=4',
        images: ['https://picsum.photos/200/200?random=4'],
        description: '高山有机绿茶，送礼佳品',
        detail: '<h2>有机绿茶礼盒</h2><p>精选高山茶叶，有机认证</p>',
        specs: [],
        skus: [],
        basePrice: 299,
        stockWarning: 15,
        status: 1,
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-18T00:00:00.000Z'
      },
      {
        id: 'P005',
        name: '智能台灯',
        categoryId: 4,
        categoryName: '家居用品',
        mainImage: 'https://picsum.photos/200/200?random=5',
        images: ['https://picsum.photos/200/200?random=5'],
        description: '护眼智能台灯，多档调节',
        detail: '<h2>智能台灯</h2><p>无蓝光危害，智能调光</p>',
        specs: [
          { name: '颜色', values: ['白色', '黑色'] }
        ],
        skus: [],
        basePrice: 159,
        stockWarning: 30,
        status: 1,
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-19T00:00:00.000Z'
      }
    ]

    mockProducts.forEach(product => {
      product.skus = generateSKUs(product.specs, product.basePrice, 100)
    })

    products.value = mockProducts
    total.value = mockProducts.length
  }

  initMockData()

  return {
    products,
    categories,
    loading,
    total,
    lowStockProducts,
    fetchProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSKUStock,
    generateSKUs
  }
})
