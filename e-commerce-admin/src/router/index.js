import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台', icon: 'Odometer' }
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/product/ProductList.vue'),
        meta: { title: '商品管理', icon: 'Goods' }
      },
      {
        path: 'product/add',
        name: 'ProductAdd',
        component: () => import('@/views/product/ProductForm.vue'),
        meta: { title: '添加商品', hidden: true }
      },
      {
        path: 'product/edit/:id',
        name: 'ProductEdit',
        component: () => import('@/views/product/ProductForm.vue'),
        meta: { title: '编辑商品', hidden: true }
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        path: 'order/detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: { title: '订单详情', hidden: true }
      },
      {
        path: 'member',
        name: 'Member',
        component: () => import('@/views/member/MemberList.vue'),
        meta: { title: '会员管理', icon: 'User' }
      },
      {
        path: 'coupon',
        name: 'Coupon',
        component: () => import('@/views/member/CouponList.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' }
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('@/views/member/MemberAnalysis.vue'),
        meta: { title: '会员分析', icon: 'DataAnalysis' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '电商后台'} - 电商管理系统`
  next()
})

export default router
