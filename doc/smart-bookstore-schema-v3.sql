DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id`       INT UNSIGNED DEFAULT 0 COMMENT '0=顶级菜单',
  `name`            VARCHAR(50)  NOT NULL COMMENT '菜单名称',
  `path`            VARCHAR(200) DEFAULT NULL COMMENT '前端路由路径（仅叶子节点）',
  `component`       VARCHAR(200) DEFAULT NULL COMMENT '前端组件路径（仅叶子节点）',
  `icon`            VARCHAR(50)  DEFAULT NULL,
  `sort`            INT          NOT NULL DEFAULT 0,
  `visible`         TINYINT      NOT NULL DEFAULT 1 COMMENT '1=侧边栏可见',
  `status`          TINYINT      NOT NULL DEFAULT 1,
  `permission_code` VARCHAR(100) NOT NULL COMMENT '菜单权限标识',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_permission_code` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表';

DROP TABLE IF EXISTS `menu_buttons`;
CREATE TABLE `menu_buttons` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_id`         INT UNSIGNED NOT NULL COMMENT '所属菜单（必须是叶子菜单）',
  `name`            VARCHAR(50)  NOT NULL COMMENT '按钮名称',
  `permission_code` VARCHAR(100) NOT NULL COMMENT '按钮权限标识',
  `description`     VARCHAR(200) DEFAULT NULL,
  `status`          TINYINT      NOT NULL DEFAULT 1,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_menu_permission` (`menu_id`, `permission_code`),
  KEY `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单按钮权限表';

DROP TABLE IF EXISTS `group_menus`;
CREATE TABLE `group_menus` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id`   INT UNSIGNED NOT NULL,
  `menu_id`    INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_menu` (`group_id`, `menu_id`)
) ENGINE=InnoDB COMMENT='权限组菜单关联表';

DROP TABLE IF EXISTS `group_buttons`;
CREATE TABLE `group_buttons` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id`   INT UNSIGNED NOT NULL,
  `button_id`  INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_button` (`group_id`, `button_id`)
) ENGINE=InnoDB COMMENT='权限组按钮关联表';

-- 一级菜单（无页面）
INSERT INTO `menus` (`id`, `parent_id`, `name`, `icon`, `permission_code`, `sort`) VALUES
(1, 0, '数据看板',   'DashboardOutlined', 'dashboard',     1),
(2, 0, '图书管理',   'BookOutlined',     'books',         2),
(3, 0, '订单管理',   'ShoppingCartOutlined', 'orders',    3),
(4, 0, '系统管理',   'SettingOutlined',  'system',        4);

-- 二级菜单（有页面）
INSERT INTO `menus` (`parent_id`, `name`, `path`, `component`, `permission_code`, `sort`) VALUES

-- 数据看板
(1, '总览',     '/dashboard/overview', 'views/dashboard/overview.vue', 'dashboard:overview', 1),
(1, '访问统计', '/dashboard/analytics', 'views/dashboard/analytics.vue', 'dashboard:analytics', 2),

-- 图书管理
(2, '图书列表',   '/books/list', 'views/books/list.vue', 'books:list', 1),
(2, '分类管理',   '/books/categories', 'views/books/categories.vue', 'books:categories', 2),
(2, 'Banner管理', '/books/banners', 'views/books/banners.vue', 'books:banners', 3),

-- 订单管理
(3, '订单列表', '/orders/list', 'views/orders/list.vue', 'orders:list', 1),
(3, '退款管理', '/orders/refunds', 'views/orders/refunds.vue', 'orders:refunds', 2),

-- 系统管理
(4, '权限组',   '/system/groups', 'views/system/groups.vue', 'system:groups', 1),
(4, '菜单管理', '/system/menus',  'views/system/menus.vue',  'system:menus', 2),
(4, 'AI 设置',  '/system/ai',     'views/system/ai.vue',     'system:ai', 3);


INSERT INTO `menu_buttons` (`menu_id`, `name`, `permission_code`) VALUES
(6,  '新增图书', 'books:create'),
(6,  '编辑图书', 'books:edit'),
(6,  '删除图书', 'books:delete'),
(7,  '新增分类', 'categories:create'),
(9,  '发货',     'orders:ship'),
(10, '退款审核', 'orders:refund');