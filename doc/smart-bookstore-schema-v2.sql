-- ============================================================
-- 智慧书城 — 完整数据库设计 v2.0（已修复）
-- MySQL 8 + utf8mb4
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 用户表
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`        VARCHAR(50)     NOT NULL,
  `password`        VARCHAR(255)    NOT NULL,
  `nickname`        VARCHAR(50)     DEFAULT NULL,
  `avatar`          VARCHAR(500)    DEFAULT NULL,
  `phone`           VARCHAR(20)     DEFAULT NULL,
  `email`           VARCHAR(100)    DEFAULT NULL,
  `group_id`        INT UNSIGNED    DEFAULT NULL COMMENT '权限组ID',
  `status`          TINYINT         NOT NULL DEFAULT 1 COMMENT '1=正常 0=禁用',
  `last_login_at`   DATETIME        DEFAULT NULL,
  `last_login_ip`   VARCHAR(45)     DEFAULT NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`      DATETIME        DEFAULT NULL COMMENT '软删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. 分类表
-- ============================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(50)  NOT NULL,
  `parent_id`  INT UNSIGNED DEFAULT 0,
  `sort`       INT          NOT NULL DEFAULT 0,
  `icon`       VARCHAR(255) DEFAULT NULL,
  `status`     TINYINT      NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书分类表';

-- ============================================================
-- 3. 权限组表
-- ============================================================
DROP TABLE IF EXISTS `permission_groups`;
CREATE TABLE `permission_groups` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(50)  NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限组表';

-- ============================================================
-- 4. 菜单表
-- ============================================================
DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id`       INT UNSIGNED DEFAULT 0 COMMENT '0=顶级菜单',
  `name`            VARCHAR(50)  NOT NULL COMMENT '菜单名称',
  `path`            VARCHAR(200) DEFAULT NULL COMMENT '前端路由路径',
  `component`       VARCHAR(200) DEFAULT NULL COMMENT '前端组件路径',
  `icon`            VARCHAR(50)  DEFAULT NULL COMMENT '图标标识',
  `type`            ENUM('MENU','BUTTON') NOT NULL DEFAULT 'MENU',
  `permission_code` VARCHAR(100) DEFAULT NULL COMMENT '权限标识',
  `sort`            INT          NOT NULL DEFAULT 0,
  `visible`         TINYINT      NOT NULL DEFAULT 1 COMMENT '1=侧边栏可见 0=隐藏',
  `status`          TINYINT      NOT NULL DEFAULT 1,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort` (`sort`),
  KEY `idx_perm_code` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单权限表';

-- ============================================================
-- 5. 权限组菜单关联表
-- ============================================================
DROP TABLE IF EXISTS `group_menus`;
CREATE TABLE `group_menus` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id`   INT UNSIGNED NOT NULL,
  `menu_id`    INT UNSIGNED NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_menu` (`group_id`, `menu_id`),
  KEY `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限组菜单关联表';

-- ============================================================
-- 6. 标签定义表
-- ============================================================
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(30)  NOT NULL,
  `type`       ENUM('GENRE','THEME','AUDIENCE','FORMAT') NOT NULL DEFAULT 'THEME',
  `sort`       INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签定义表';

-- ============================================================
-- 7. 图书标签关联表
-- ============================================================
DROP TABLE IF EXISTS `book_tag_relations`;
CREATE TABLE `book_tag_relations` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `book_id`    BIGINT UNSIGNED NOT NULL,
  `tag_id`     INT UNSIGNED    NOT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_book_tag` (`book_id`, `tag_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书标签关联表';

-- ============================================================
-- 8. 图书表
-- ============================================================
DROP TABLE IF EXISTS `books`;
CREATE TABLE `books` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`          VARCHAR(200)    NOT NULL,
  `subtitle`       VARCHAR(200)    DEFAULT NULL,
  `author`         VARCHAR(100)    NOT NULL,
  `translator`     VARCHAR(100)    DEFAULT NULL,
  `publisher`      VARCHAR(100)    DEFAULT NULL,
  `isbn`           VARCHAR(20)     DEFAULT NULL,
  `cover_url`      VARCHAR(500)    DEFAULT NULL,
  `price`          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `original_price` DECIMAL(10,2)   DEFAULT NULL,
  `category_id`    INT UNSIGNED    DEFAULT NULL,
  `description`    TEXT,
  `page_count`     INT UNSIGNED    DEFAULT NULL,
  `language`       VARCHAR(20)     DEFAULT '中文',
  `publish_date`   DATE            DEFAULT NULL,
  `binding`        ENUM('平装','精装','线装','其他') DEFAULT NULL,
  `format`         VARCHAR(20)     DEFAULT NULL,
  `weight`         INT             DEFAULT NULL,
  `stock`          INT             NOT NULL DEFAULT 0,
  `sales_count`    INT             NOT NULL DEFAULT 0,
  `view_count`     INT             NOT NULL DEFAULT 0,
  `rating`         DECIMAL(2,1)    DEFAULT NULL,
  `status`         TINYINT         NOT NULL DEFAULT 1,
  `created_by`     BIGINT UNSIGNED DEFAULT NULL,
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`     DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_author` (`author`),
  KEY `idx_title` (`title`),
  KEY `idx_isbn` (`isbn`),
  KEY `idx_sales_count` (`sales_count`),
  KEY `idx_publish_date` (`publish_date`),
  KEY `idx_deleted_at` (`deleted_at`),
  FULLTEXT KEY `ft_title_desc` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书表';

-- ============================================================
-- 9. 首页横幅表
-- ============================================================
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(100)  NOT NULL,
  `image_url`  VARCHAR(500)  NOT NULL,
  `link_url`   VARCHAR(500)  DEFAULT NULL,
  `link_type`  ENUM('BOOK','CATEGORY','URL','NONE') NOT NULL DEFAULT 'BOOK',
  `target_id`  BIGINT UNSIGNED DEFAULT NULL,
  `sort`       INT           NOT NULL DEFAULT 0,
  `status`     TINYINT       NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='首页横幅表';

-- ============================================================
-- 10. 图书评价表
-- ============================================================
DROP TABLE IF EXISTS `book_reviews`;
CREATE TABLE `book_reviews` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `book_id`    BIGINT UNSIGNED NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `order_id`   BIGINT UNSIGNED DEFAULT NULL,
  `rating`     TINYINT UNSIGNED NOT NULL,
  `content`    VARCHAR(1000) DEFAULT NULL,
  `status`     TINYINT        NOT NULL DEFAULT 1,
  `created_at` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_book_order` (`user_id`, `book_id`, `order_id`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书评价表';

-- ============================================================
-- 11. 用户收货地址表
-- ============================================================
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `receiver_name`  VARCHAR(50)     NOT NULL,
  `receiver_phone` VARCHAR(20)     NOT NULL,
  `province`       VARCHAR(50)     NOT NULL,
  `city`           VARCHAR(50)     NOT NULL,
  `district`       VARCHAR(50)     NOT NULL,
  `detail`         VARCHAR(200)    NOT NULL,
  `is_default`     TINYINT         NOT NULL DEFAULT 0,
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`     DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_default` (`user_id`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收货地址表';

-- ============================================================
-- 12. 浏览记录表
-- ============================================================
DROP TABLE IF EXISTS `browse_history`;
CREATE TABLE `browse_history` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `book_id`    BIGINT UNSIGNED NOT NULL,
  `duration`   INT UNSIGNED    DEFAULT 0,
  `source`     VARCHAR(50)     DEFAULT NULL,
  `browsed_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_browsed` (`user_id`, `browsed_at`),
  KEY `idx_book_id` (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览记录表';

-- ============================================================
-- 13. 购物车表
-- ============================================================
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `book_id`    BIGINT UNSIGNED NOT NULL,
  `quantity`   INT             NOT NULL DEFAULT 1,
  `selected`   TINYINT         NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_book` (`user_id`, `book_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- ============================================================
-- 14. 订单表
-- ============================================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          BIGINT UNSIGNED NOT NULL,
  `order_no`         VARCHAR(32)     NOT NULL,
  `total_amount`     DECIMAL(10,2)   NOT NULL,
  `status`           ENUM('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED','REFUNDING','REFUNDED','REJECTED')
                                     NOT NULL DEFAULT 'PENDING',
  `tracking_no`      VARCHAR(50)     DEFAULT NULL,
  `address_snapshot` JSON            NOT NULL,
  `remark`           VARCHAR(500)    DEFAULT NULL,
  `expire_at`        DATETIME        DEFAULT NULL,
  `paid_at`          DATETIME        DEFAULT NULL,
  `shipped_at`       DATETIME        DEFAULT NULL,
  `completed_at`     DATETIME        DEFAULT NULL,
  `cancelled_at`     DATETIME        DEFAULT NULL,
  `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_status` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ============================================================
-- 15. 订单明细表
-- ============================================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`      BIGINT UNSIGNED NOT NULL,
  `book_id`       BIGINT UNSIGNED NOT NULL,
  `book_snapshot` JSON            NOT NULL,
  `price`         DECIMAL(10,2)   NOT NULL,
  `quantity`      INT             NOT NULL DEFAULT 1,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_book_id` (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- ============================================================
-- 16. 支付记录表
-- ============================================================
DROP TABLE IF EXISTS `payment_records`;
CREATE TABLE `payment_records` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`     BIGINT UNSIGNED NOT NULL,
  `payment_no`   VARCHAR(64)     NOT NULL,
  `amount`       DECIMAL(10,2)   NOT NULL,
  `method`       ENUM('WECHAT','ALIPAY','MOCK') NOT NULL DEFAULT 'MOCK',
  `status`       ENUM('PENDING','SUCCESS','FAILED','CLOSED') NOT NULL DEFAULT 'PENDING',
  `paid_at`      DATETIME        DEFAULT NULL,
  `raw_response` JSON            DEFAULT NULL,
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- ============================================================
-- 17. 退款记录表
-- ============================================================
DROP TABLE IF EXISTS `refund_records`;
CREATE TABLE `refund_records` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`     BIGINT UNSIGNED NOT NULL,
  `refund_no`    VARCHAR(64)     NOT NULL,
  `amount`       DECIMAL(10,2)   NOT NULL,
  `reason`       VARCHAR(500)    NOT NULL,
  `status`       ENUM('PENDING','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `handler_id`   BIGINT UNSIGNED DEFAULT NULL,
  `handler_note` VARCHAR(500)    DEFAULT NULL,
  `handled_at`   DATETIME        DEFAULT NULL,
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款记录表';

-- ============================================================
-- 18. 库存变动日志表
-- ============================================================
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `book_id`       BIGINT UNSIGNED NOT NULL,
  `change_type`   ENUM('入库','出库','下单锁定','取消释放','退货回仓','盘点调整','手动修改') NOT NULL,
  `change_amount` INT             NOT NULL,
  `before_stock`  INT             NOT NULL,
  `after_stock`   INT             NOT NULL,
  `related_id`    BIGINT UNSIGNED DEFAULT NULL,
  `remark`        VARCHAR(200)    DEFAULT NULL,
  `operator_id`   BIGINT UNSIGNED DEFAULT NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存变动日志表';

-- ============================================================
-- 19. 操作审计日志表
-- ============================================================
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL,
  `username`    VARCHAR(50)     DEFAULT NULL,
  `action`      VARCHAR(50)     NOT NULL,
  `target_type` VARCHAR(50)     DEFAULT NULL,
  `target_id`   BIGINT UNSIGNED DEFAULT NULL,
  `detail`      JSON            DEFAULT NULL,
  `ip`          VARCHAR(45)     DEFAULT NULL,
  `user_agent`  VARCHAR(500)    DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志表';

-- ============================================================
-- 20. 登录日志表
-- ============================================================
DROP TABLE IF EXISTS `login_logs`;
CREATE TABLE `login_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL,
  `username`    VARCHAR(50)     NOT NULL,
  `status`      ENUM('SUCCESS','FAIL') NOT NULL,
  `fail_reason` VARCHAR(100)    DEFAULT NULL,
  `ip`          VARCHAR(45)     DEFAULT NULL,
  `user_agent`  VARCHAR(500)    DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ============================================================
-- 21. 收藏表
-- ============================================================
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `book_id`    BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_book` (`user_id`, `book_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_book_id` (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ============================================================
-- 22. AI 对话会话表
-- ============================================================
DROP TABLE IF EXISTS `ai_sessions`;
CREATE TABLE `ai_sessions` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL,
  `title`         VARCHAR(200)    DEFAULT '新对话',
  `status`        TINYINT         NOT NULL DEFAULT 1,
  `message_count` INT             NOT NULL DEFAULT 0,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_updated` (`user_id`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话会话表';

-- ============================================================
-- 23. AI 对话消息表
-- ============================================================
DROP TABLE IF EXISTS `ai_messages`;
CREATE TABLE `ai_messages` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id`  BIGINT UNSIGNED NOT NULL,
  `role`        ENUM('USER','ASSISTANT','SYSTEM') NOT NULL,
  `content`     TEXT            NOT NULL,
  `token_count` INT UNSIGNED    DEFAULT NULL,
  `book_ids`    JSON            DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话消息表';

-- ============================================================
-- 24. 系统配置表
-- ============================================================
DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`        VARCHAR(100) NOT NULL,
  `value`      TEXT         NOT NULL,
  `type`       ENUM('STRING','NUMBER','JSON','BOOLEAN') NOT NULL DEFAULT 'STRING',
  `group`      VARCHAR(50)  NOT NULL DEFAULT 'default',
  `label`      VARCHAR(100) DEFAULT NULL,
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 系统配置：AI
INSERT INTO `system_configs` (`key`, `value`, `type`, `group`, `label`) VALUES
('ai_model',        'deepseek-chat',     'STRING',  'ai', 'AI 模型名称'),
('ai_api_key',      '',                  'STRING',  'ai', 'AI API Key'),
('ai_api_base_url', 'https://api.deepseek.com/v1', 'STRING', 'ai', 'AI API 地址'),
('ai_temperature',  '0.7',               'NUMBER',  'ai', '生成温度'),
('ai_max_tokens',   '2048',              'NUMBER',  'ai', '最大输出 Token'),
('ai_prompt_template', '你是一个专业的图书推荐助手。', 'STRING', 'ai', 'AI 提示词模板');

-- 系统配置：站点
INSERT INTO `system_configs` (`key`, `value`, `type`, `group`, `label`) VALUES
('site_name',         '智慧书城',          'STRING', 'site', '站点名称'),
('site_logo',         '',                  'STRING', 'site', '站点 Logo'),
('order_expire_minutes', '15',            'NUMBER', 'order', '待付款超时时间'),
('free_shipping_threshold', '99',         'NUMBER', 'order', '包邮门槛');

-- 系统配置：订单
INSERT INTO `system_configs` (`key`, `value`, `type`, `group`, `label`) VALUES
('mock_payment_enabled', 'true',           'BOOLEAN', 'order', '启用模拟支付');

-- 默认分类
INSERT INTO `categories` (`id`, `name`, `parent_id`, `sort`) VALUES
(1, '计算机',      0, 1),
(2, '文学小说',    0, 2),
(3, '人文社科',    0, 3),
(4, '经济管理',    0, 4),
(5, '教育学习',    0, 5),
(6, '生活百科',    0, 6),
(7, '编程语言',    1, 1),
(8, '人工智能',    1, 2),
(9, '前端开发',    1, 3),
(10,'数据库',      1, 4);

-- 默认标签
INSERT INTO `tags` (`name`, `type`, `sort`) VALUES
('Python',        'GENRE',   1),
('JavaScript',    'GENRE',   2),
('机器学习',      'GENRE',   3),
('前端',          'GENRE',   4),
('后端',          'GENRE',   5),
('经典名著',      'THEME',   1),
('入门',          'AUDIENCE', 1),
('进阶',          'AUDIENCE', 2),
('专家',          'AUDIENCE', 3),
('平装',          'FORMAT',  1),
('精装',          'FORMAT',  2);

-- 默认权限组
INSERT INTO `permission_groups` (`id`, `name`, `description`) VALUES
(1, '超级管理员', '拥有全部菜单和操作权限'),
(2, '客服',       '订单管理 + 数据看板（只读）');

-- 默认管理员（密码需替换为 bcrypt 加密值）
INSERT INTO `users` (`username`, `password`, `nickname`, `group_id`) VALUES
('admin', '$2b$10$placeholder_hash', '超级管理员', 1);

-- 菜单数据
INSERT INTO `menus` (`id`, `parent_id`, `name`, `path`, `component`, `icon`, `type`, `permission_code`, `sort`) VALUES
(1,  0, '数据看板',   '/dashboard',   'views/dashboard/index.vue',   'DashboardOutlined',    'MENU', 'dashboard:view',   1),
(2,  0, '图书管理',   '/books',       'views/books/index.vue',       'BookOutlined',         'MENU', 'books:view',       2),
(3,  0, '订单管理',   '/orders',      'views/orders/index.vue',      'ShoppingCartOutlined', 'MENU', 'orders:view',      3),
(4,  0, 'AI 配置',    '/ai-config',   'views/ai-config/index.vue',   'RobotOutlined',        'MENU', 'ai:config',        4),
(5,  0, '成员管理',   '/members',     'views/members/index.vue',     'TeamOutlined',         'MENU', 'members:view',     5),
(6,  0, '系统设置',   NULL,           NULL,                          'SettingOutlined',      'MENU', NULL,               6),
(7,  6, '权限组',     '/settings/groups',  'views/settings/groups.vue',  'SafetyOutlined',   'MENU', 'settings:groups',  1),
(8,  6, '菜单管理',   '/settings/menus',   'views/settings/menus.vue',   'MenuOutlined',     'MENU', 'settings:menus',   2),
(9,  6, 'Banner管理', '/settings/banners', 'views/settings/banners.vue', 'PictureOutlined',  'MENU', 'settings:banners', 3),
(10, 6, '系统配置',   '/settings/configs', 'views/settings/configs.vue', 'ControlOutlined',  'MENU', 'settings:configs', 4),
(11, 2, '新增图书',   NULL, NULL, NULL, 'BUTTON', 'books:create',   0),
(12, 2, '编辑图书',   NULL, NULL, NULL, 'BUTTON', 'books:edit',     0),
(13, 2, '删除图书',   NULL, NULL, NULL, 'BUTTON', 'books:delete',   0),
(14, 2, '上下架',     NULL, NULL, NULL, 'BUTTON', 'books:toggle',   0),
(15, 3, '发货',       NULL, NULL, NULL, 'BUTTON', 'orders:ship',    0),
(16, 3, '退款审核',   NULL, NULL, NULL, 'BUTTON', 'orders:refund',  0),
(17, 5, '新增成员',   NULL, NULL, NULL, 'BUTTON', 'members:create', 0),
(18, 5, '禁用成员',   NULL, NULL, NULL, 'BUTTON', 'members:disable',0);

-- 权限组菜单分配
INSERT INTO `group_menus` (`group_id`, `menu_id`)
SELECT 1, id FROM `menus`;

INSERT INTO `group_menus` (`group_id`, `menu_id`) VALUES
(2, 1), (2, 3), (2, 15), (2, 16);

SET FOREIGN_KEY_CHECKS = 1;