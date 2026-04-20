# 电商后台管理系统

基于 Vue3 + Element Plus 的电商后台管理单页应用

## 技术栈

- Vue 3.4 (Composition API)
- Vue Router 4.2
- Pinia 2.1 (状态管理)
- Element Plus 2.4 (UI组件库)
- ECharts 5.4 (图表库)
- WangEditor 5.1 (富文本编辑器)
- Vite 5.0 (构建工具)
- Day.js (日期处理)

## 功能模块

### 1. 商品管理系统
- 商品 CRUD 操作
- 多规格商品管理
- 动态 SKU 生成
- 库存预警规则配置
- 富文本商品详情编辑

### 2. 订单处理中心
- 订单列表管理
- 订单状态流转（待付款→已付款→已发货→已送达→已完成）
- 分步订单审核流程
- 物流信息实时追踪
- 多维度订单数据统计图表

### 3. 会员营销系统
- 会员管理 CRUD
- 会员等级动态计算（普通→银卡→金卡→铂金→钻石）
- 优惠券批次管理（含限时限量规则）
- 会员消费行为分析看板

## 安装与运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 pnpm >= 7.0.0

### 安装依赖
```bash
cd e-commerce-admin
npm install
# 或
pnpm install
```

### 开发运行
```bash
npm run dev
# 或
pnpm dev
```

### 构建生产版本
```bash
npm run build
# 或
pnpm build
```

## 项目结构

```
e-commerce-admin/
├── src/
│   ├── layout/           # 布局组件
│   │   └── MainLayout.vue
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── stores/           # Pinia 状态管理
│   │   ├── product.js    # 商品状态
│   │   ├── order.js      # 订单状态
│   │   └── member.js     # 会员状态
│   ├── styles/           # 全局样式
│   │   └── index.css
│   ├── views/            # 页面组件
│   │   ├── product/      # 商品管理
│   │   │   ├── ProductList.vue
│   │   │   └── ProductForm.vue
│   │   ├── order/        # 订单管理
│   │   │   ├── OrderList.vue
│   │   │   └── OrderDetail.vue
│   │   ├── member/       # 会员营销
│   │   │   ├── MemberList.vue
│   │   │   ├── CouponList.vue
│   │   │   └── MemberAnalysis.vue
│   │   ├── Dashboard.vue # 控制台
│   │   └── Login.vue     # 登录页
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 登录信息

演示账号：
- 用户名：admin
- 密码：123456

## 功能特点

1. **组合式 API 封装业务逻辑**
   - 使用 Vue 3 Composition API 组织代码
   - 业务逻辑与视图分离

2. **Pinia 状态管理**
   - 模块化 Store 设计
   - 响应式数据管理

3. **表单验证**
   - Element Plus 表单验证
   - 自定义验证规则

4. **权限控制**
   - 路由守卫
   - 菜单权限控制

5. **加载状态**
   - 表格加载状态
   - 按钮加载状态

6. **错误处理**
   - 统一错误提示
   - 异常捕获

## 模拟数据

项目内置模拟数据，无需后端服务即可运行演示：
- 5 个商品数据
- 5 个订单数据
- 5 个会员数据
- 4 个优惠券数据
