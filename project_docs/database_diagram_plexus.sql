CREATE TABLE `partners` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` varchar(20) UNIQUE NOT NULL COMMENT 'PT-000125',
  `partner_code` varchar(20) UNIQUE NOT NULL COMMENT 'ABC-00125',
  `partner_name` varchar(255) NOT NULL,
  `legal_name` varchar(255),
  `business_name` varchar(255),
  `partner_type` varchar(50) NOT NULL COMMENT 'Reseller/Distributor/ISP/Corporate/Individual',
  `partner_category` varchar(10) COMMENT 'A/B/C/D',
  `contact_person` varchar(255),
  `contact_number` varchar(50),
  `email` varchar(255),
  `address` text,
  `area_id` bigint,
  `zone_id` bigint,
  `territory_id` bigint,
  `account_manager_id` bigint,
  `relationship_manager_id` bigint,
  `partner_since` date,
  `status` varchar(50) COMMENT 'Draft/Pending Approval/Active/Suspended/Blocked/Inactive/Terminated',
  `health_score` decimal(5,2),
  `health_status` varchar(20) COMMENT 'Excellent/Healthy/Watch/Risk/Critical',
  `logo_path` varchar(500),
  `created_by` bigint,
  `updated_by` bigint,
  `created_at` timestamp,
  `updated_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `partner_business_models` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `business_model` varchar(50) NOT NULL COMMENT 'Bandwidth Sales/Commission Based/End Device Based/Support Center',
  `is_active` boolean DEFAULT true,
  `assigned_at` timestamp,
  `assigned_by` bigint
);

CREATE TABLE `partner_profiles` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint UNIQUE NOT NULL,
  `business_type` varchar(100),
  `business_category` varchar(100),
  `operating_area` text,
  `contract_type` varchar(100),
  `contract_start_date` date,
  `contract_end_date` date,
  `payment_terms` varchar(100),
  `credit_limit` decimal(15,2) DEFAULT 0,
  `credit_days` int DEFAULT 0,
  `security_deposit` decimal(15,2) DEFAULT 0,
  `billing_cycle` varchar(50) COMMENT 'Monthly/Quarterly/Half-Yearly/Yearly',
  `pricing_model` varchar(100),
  `discount_policy` text,
  `commission_model` varchar(100),
  `notes` text,
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `partner_relationships` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `current_account_manager_id` bigint,
  `relationship_status` varchar(50) COMMENT 'Active/Inactive/On Hold',
  `last_meeting_date` date,
  `next_follow_up_date` date,
  `updated_at` timestamp
);

CREATE TABLE `partner_relationship_history` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `previous_manager_id` bigint,
  `new_manager_id` bigint,
  `assignment_date` date,
  `transfer_date` date,
  `transfer_reason` text,
  `created_by` bigint,
  `created_at` timestamp
);

CREATE TABLE `partner_approvals` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `requester_id` bigint,
  `reviewer_id` bigint,
  `approver_id` bigint,
  `status` varchar(50) COMMENT 'Draft/Submitted/Under Review/Approved/Rejected',
  `decision` varchar(20),
  `reason` text,
  `supporting_document` varchar(500),
  `requested_at` timestamp,
  `reviewed_at` timestamp,
  `approved_at` timestamp,
  `created_at` timestamp
);

CREATE TABLE `partner_marketing_metrics` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `metric_date` date NOT NULL,
  `opening_customers` int DEFAULT 0,
  `new_customers` int DEFAULT 0,
  `reactivations` int DEFAULT 0,
  `renewals` int DEFAULT 0,
  `suspensions` int DEFAULT 0,
  `terminations` int DEFAULT 0,
  `churn` int DEFAULT 0,
  `closing_customers` int DEFAULT 0,
  `growth_percentage` decimal(8,2) DEFAULT 0,
  `churn_rate` decimal(8,2) DEFAULT 0
);

CREATE TABLE `partner_customer_metrics` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `metric_date` date NOT NULL,
  `total_customers` int DEFAULT 0,
  `active_customers` int DEFAULT 0,
  `suspended_customers` int DEFAULT 0,
  `expired_customers` int DEFAULT 0,
  `new_customers` int DEFAULT 0,
  `renewals` int DEFAULT 0,
  `terminations` int DEFAULT 0,
  `churn` int DEFAULT 0,
  `avg_revenue_per_customer` decimal(12,2) DEFAULT 0
);

CREATE TABLE `partner_sales_metrics` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `period_month` int NOT NULL,
  `period_year` int NOT NULL,
  `sales_target` decimal(15,2) DEFAULT 0,
  `actual_sales` decimal(15,2) DEFAULT 0,
  `new_customers` int DEFAULT 0,
  `renewals` int DEFAULT 0,
  `package_sales` int DEFAULT 0,
  `upgrade_sales` int DEFAULT 0,
  `downgrade_sales` int DEFAULT 0,
  `revenue` decimal(15,2) DEFAULT 0,
  `achievement_percentage` decimal(8,2) DEFAULT 0
);

CREATE TABLE `partner_churn_metrics` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `metric_date` date NOT NULL,
  `churn_count` int DEFAULT 0,
  `churn_rate` decimal(8,2) DEFAULT 0,
  `churn_reason` varchar(255),
  `customer_type` varchar(100),
  `package_id` bigint,
  `area_id` bigint,
  `zone_id` bigint
);

CREATE TABLE `partner_campaigns` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `campaign_type` varchar(100),
  `start_date` date,
  `end_date` date,
  `target` int DEFAULT 0,
  `actual` int DEFAULT 0,
  `new_customers` int DEFAULT 0,
  `revenue` decimal(15,2) DEFAULT 0,
  `campaign_cost` decimal(15,2) DEFAULT 0,
  `conversion_percentage` decimal(8,2) DEFAULT 0,
  `roi` decimal(8,2) DEFAULT 0,
  `status` varchar(50) COMMENT 'Planned/Running/Completed/Cancelled',
  `created_at` timestamp
);

CREATE TABLE `partner_revenues` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `revenue_date` date NOT NULL,
  `revenue_source` varchar(100) NOT NULL COMMENT 'Bandwidth Sales/Internet/GGC/FNA/BDIX/Package Sales/Activation Fee/etc',
  `source_reference` varchar(100) COMMENT 'Invoice ID / Txn ID',
  `source_system` varchar(100) COMMENT 'Billing / ERP',
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `created_by` bigint,
  `created_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `partner_costs` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `cost_date` date NOT NULL,
  `cost_type` varchar(100) NOT NULL COMMENT 'Bandwidth Cost/Upstream Cost/Commission/Equipment Cost/etc',
  `source_reference` varchar(100),
  `source_system` varchar(100),
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `created_by` bigint,
  `created_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `partner_payments` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) COMMENT 'Cash/Bank Transfer/Cheque/Online/Adjustment',
  `amount` decimal(15,2) NOT NULL,
  `reference_number` varchar(100),
  `invoice_id` bigint,
  `status` varchar(50) COMMENT 'Pending/Completed/Failed/Reversed',
  `remarks` text,
  `created_by` bigint,
  `created_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `partner_profit_losses` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `period_month` int NOT NULL,
  `period_year` int NOT NULL,
  `total_revenue` decimal(15,2) DEFAULT 0,
  `total_direct_cost` decimal(15,2) DEFAULT 0,
  `gross_profit` decimal(15,2) DEFAULT 0,
  `bandwidth_cost` decimal(15,2) DEFAULT 0,
  `commission_cost` decimal(15,2) DEFAULT 0,
  `equipment_cost` decimal(15,2) DEFAULT 0,
  `marketing_cost` decimal(15,2) DEFAULT 0,
  `support_center_cost` decimal(15,2) DEFAULT 0,
  `operational_cost` decimal(15,2) DEFAULT 0,
  `other_cost` decimal(15,2) DEFAULT 0,
  `net_profit` decimal(15,2) DEFAULT 0,
  `profit_margin` decimal(8,2) DEFAULT 0
);

CREATE TABLE `partner_financial_snapshots` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `snapshot_date` date NOT NULL,
  `total_invoiced` decimal(15,2) DEFAULT 0,
  `total_paid` decimal(15,2) DEFAULT 0,
  `outstanding` decimal(15,2) DEFAULT 0,
  `overdue` decimal(15,2) DEFAULT 0,
  `credit_limit` decimal(15,2) DEFAULT 0,
  `credit_utilization` decimal(8,2) DEFAULT 0,
  `last_payment_date` date,
  `next_due_date` date,
  `avg_payment_delay` int DEFAULT 0
);

CREATE TABLE `partner_roi` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `period_month` int,
  `period_year` int,
  `security_deposit` decimal(15,2) DEFAULT 0,
  `equipment_investment` decimal(15,2) DEFAULT 0,
  `infrastructure_investment` decimal(15,2) DEFAULT 0,
  `marketing_investment` decimal(15,2) DEFAULT 0,
  `setup_cost` decimal(15,2) DEFAULT 0,
  `credit_exposure` decimal(15,2) DEFAULT 0,
  `other_investment` decimal(15,2) DEFAULT 0,
  `total_investment` decimal(15,2) DEFAULT 0,
  `net_profit` decimal(15,2) DEFAULT 0,
  `roi_percentage` decimal(8,2) DEFAULT 0,
  `payback_period_months` int DEFAULT 0
);

CREATE TABLE `partner_bandwidth_allocations` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `service` varchar(50) NOT NULL COMMENT 'Internet/GGC/FNA/BDIX/Other',
  `allocated_mbps` decimal(10,2) NOT NULL,
  `used_mbps` decimal(10,2) DEFAULT 0,
  `available_mbps` decimal(10,2) DEFAULT 0,
  `utilization_percent` decimal(8,2) DEFAULT 0,
  `ratio` varchar(20) COMMENT '1:8',
  `price` decimal(15,2) DEFAULT 0,
  `cost` decimal(15,2) DEFAULT 0,
  `effective_date` date,
  `expiry_date` date,
  `status` varchar(50) COMMENT 'Active/Expired/Suspended/Pending',
  `work_order_id` varchar(100),
  `approval_id` bigint,
  `created_at` timestamp
);

CREATE TABLE `partner_bandwidth_changes` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `allocation_id` bigint,
  `change_type` varchar(50) COMMENT 'Upgrade/Downgrade/Temporary/Emergency/Administrative',
  `previous_mbps` decimal(10,2),
  `new_mbps` decimal(10,2),
  `difference_mbps` decimal(10,2),
  `revenue_impact` decimal(15,2) DEFAULT 0,
  `cost_impact` decimal(15,2) DEFAULT 0,
  `profit_impact` decimal(15,2) DEFAULT 0,
  `reason` text,
  `effective_date` date,
  `requester_id` bigint,
  `approver_id` bigint,
  `supporting_document` varchar(500),
  `status` varchar(50) COMMENT 'Requested/Capacity Check/Commercial Review/Approved/Rejected/Completed',
  `created_at` timestamp
);

CREATE TABLE `partner_bandwidth_history` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `allocation_id` bigint,
  `change_id` bigint,
  `event_type` varchar(50) COMMENT 'Allocated/Upgraded/Downgraded/Suspended/Resumed/Expired',
  `previous_value` decimal(10,2),
  `new_value` decimal(10,2),
  `changed_by` bigint,
  `changed_at` timestamp,
  `remarks` text
);

CREATE TABLE `partner_bandwidth_approvals` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `change_id` bigint NOT NULL,
  `approver_id` bigint,
  `approval_level` int DEFAULT 1,
  `status` varchar(50) COMMENT 'Pending/Approved/Rejected',
  `decision` varchar(20),
  `reason` text,
  `approved_at` timestamp
);

CREATE TABLE `partner_equipment` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `equipment_id` varchar(50) UNIQUE NOT NULL,
  `asset_id` varchar(50),
  `serial_number` varchar(100),
  `mac_address` varchar(50),
  `equipment_type` varchar(50) NOT NULL COMMENT 'Router/ONU/ONT/OLT/Switch/CPE/Access Point/etc',
  `manufacturer` varchar(100),
  `model` varchar(100),
  `vendor` varchar(100),
  `purchase_date` date,
  `purchase_cost` decimal(15,2) DEFAULT 0,
  `installation_date` date,
  `location` varchar(255),
  `partner_id` bigint,
  `customer_id` bigint,
  `ownership` varchar(50) COMMENT 'Company Owned/Partner Owned/Customer Owned/Leased/Rented',
  `warranty_start` date,
  `warranty_end` date,
  `status` varchar(50) COMMENT 'Available/Assigned/Installed/Active/Faulty/Under Maintenance/Replaced/Returned/Lost/Retired',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `partner_equipment_assignments` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `equipment_id` bigint NOT NULL,
  `partner_id` bigint,
  `customer_id` bigint,
  `assigned_date` date,
  `returned_date` date,
  `assigned_by` bigint,
  `status` varchar(50) COMMENT 'Active/Returned/Transferred',
  `remarks` text
);

CREATE TABLE `partner_equipment_history` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `equipment_id` bigint NOT NULL,
  `event_type` varchar(50) COMMENT 'Purchased/Assigned/Installed/Maintenance/Replaced/Returned/Retired',
  `event_date` date,
  `performed_by` bigint,
  `remarks` text,
  `created_at` timestamp
);

CREATE TABLE `partner_equipment_maintenance` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `equipment_id` bigint NOT NULL,
  `maintenance_date` date,
  `maintenance_type` varchar(50) COMMENT 'Preventive/Corrective/Emergency',
  `cost` decimal(15,2) DEFAULT 0,
  `description` text,
  `performed_by` varchar(255),
  `next_due_date` date,
  `status` varchar(50) COMMENT 'Scheduled/In Progress/Completed'
);

CREATE TABLE `partner_end_devices` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `device_type` varchar(50) NOT NULL COMMENT 'MAC Address/Router/ONU/ONT/CPE/Device ID/Serial Number/Other',
  `identifier` varchar(255) NOT NULL COMMENT 'MAC / Serial / Device ID',
  `customer_id` bigint,
  `package_id` bigint,
  `status` varchar(50) COMMENT 'Active/Offline/Faulty/Replaced/Suspended/Retired',
  `activation_date` date,
  `deactivation_date` date,
  `created_at` timestamp
);

CREATE TABLE `partner_device_history` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `device_id` bigint NOT NULL,
  `event_type` varchar(50) COMMENT 'Added/Assigned/Activated/Suspended/Replaced/Returned/Retired',
  `event_date` timestamp,
  `performed_by` bigint,
  `remarks` text
);

CREATE TABLE `partner_commission_rules` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `rule_name` varchar(255) NOT NULL,
  `service` varchar(100),
  `package_id` bigint,
  `commission_type` varchar(50) NOT NULL COMMENT 'Percentage/Fixed Amount/Per Customer/Per Activation/Per Renewal/Per Package/Revenue Based/Bandwidth Based/Custom',
  `rate` decimal(8,2) DEFAULT 0,
  `fixed_amount` decimal(15,2) DEFAULT 0,
  `target` decimal(15,2) DEFAULT 0,
  `maximum_limit` decimal(15,2) DEFAULT 0,
  `effective_date` date,
  `expiry_date` date,
  `status` varchar(50) COMMENT 'Active/Inactive/Expired',
  `created_at` timestamp
);

CREATE TABLE `partner_commissions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `rule_id` bigint,
  `source_reference` varchar(100) COMMENT 'Revenue Transaction ID',
  `source_amount` decimal(15,2) DEFAULT 0,
  `commission_amount` decimal(15,2) DEFAULT 0,
  `period_month` int,
  `period_year` int,
  `status` varchar(50) COMMENT 'Generated/Pending/Calculated/Approved/Payable/Paid/Rejected/Cancelled/Reversed',
  `generated_at` timestamp,
  `approved_at` timestamp,
  `paid_at` timestamp,
  `approved_by` bigint,
  `remarks` text,
  `deleted_at` timestamp
);

CREATE TABLE `partner_commission_payments` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `commission_id` bigint,
  `payment_date` date,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(50),
  `reference_number` varchar(100),
  `status` varchar(50) COMMENT 'Pending/Paid/Failed',
  `created_by` bigint,
  `created_at` timestamp,
  `deleted_at` timestamp
);

CREATE TABLE `partner_commission_adjustments` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `commission_id` bigint,
  `adjustment_type` varchar(50) COMMENT 'Reversal/Correction/Bonus/Penalty',
  `amount` decimal(15,2) NOT NULL,
  `reason` text,
  `adjusted_by` bigint,
  `adjusted_at` timestamp
);

CREATE TABLE `partner_support_centers` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `support_center_id` varchar(50) UNIQUE NOT NULL,
  `branch_code` varchar(50) UNIQUE,
  `partner_id` bigint NOT NULL,
  `center_name` varchar(255) NOT NULL,
  `branch_type` varchar(50) COMMENT 'Head Office/Branch/Support Center/Franchise',
  `address` text,
  `area_id` bigint,
  `zone_id` bigint,
  `contact_number` varchar(50),
  `email` varchar(255),
  `branch_manager_id` bigint,
  `staff_count` int DEFAULT 0,
  `working_hours` varchar(100),
  `weekly_off_day` varchar(50),
  `opening_date` date,
  `service_coverage` text,
  `status` varchar(50) COMMENT 'Planned/Active/Temporarily Closed/Suspended/Closed',
  `created_at` timestamp
);

CREATE TABLE `partner_support_center_staff` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `support_center_id` bigint NOT NULL,
  `staff_name` varchar(255) NOT NULL,
  `staff_category` varchar(50) COMMENT 'Branch Manager/Customer Service/Technical Staff/Sales Staff/Marketing Staff/Accounts Staff/Other Staff',
  `designation` varchar(100),
  `contact_number` varchar(50),
  `email` varchar(255),
  `joining_date` date,
  `monthly_cost` decimal(15,2) DEFAULT 0,
  `status` varchar(50) COMMENT 'Active/Vacant/Resigned/Terminated'
);

CREATE TABLE `partner_support_center_services` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `support_center_id` bigint NOT NULL,
  `service_area` text,
  `zone_id` bigint,
  `territory_id` bigint,
  `coverage_area` text,
  `supported_services` text,
  `customer_capacity` int DEFAULT 0
);

CREATE TABLE `partner_support_center_costs` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `support_center_id` bigint NOT NULL,
  `cost_date` date NOT NULL,
  `cost_type` varchar(50) COMMENT 'Rent/Electricity/Internet/Staff Cost/Equipment Cost/Maintenance/Transportation/Marketing/Other',
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `created_at` timestamp
);

CREATE TABLE `partner_support_center_equipment` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `support_center_id` bigint NOT NULL,
  `equipment_type` varchar(50) COMMENT 'Router/ONU/Switch/Computer/Printer/WiFi AP/UPS/CCTV/Network Equipment/Office Equipment',
  `equipment_id` bigint,
  `quantity` int DEFAULT 1,
  `status` varchar(50)
);

CREATE TABLE `partner_support_center_history` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `support_center_id` bigint NOT NULL,
  `event_type` varchar(50) COMMENT 'Created/Opened/Manager Changed/Staff Changed/Location Changed/Coverage Changed/Equipment Added/Equipment Removed/Cost Changed/Suspended/Closed',
  `event_date` timestamp,
  `performed_by` bigint,
  `remarks` text
);

CREATE TABLE `partner_documents` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `document_id` varchar(50) UNIQUE NOT NULL,
  `document_type` varchar(50) NOT NULL COMMENT 'Legal/Financial/Network/Support Center',
  `document_category` varchar(100) COMMENT 'Agreement/Invoice/Work Order',
  `document_name` varchar(255) NOT NULL,
  `version` varchar(20) DEFAULT '1.0',
  `file_path` varchar(500),
  `effective_date` date,
  `expiry_date` date,
  `uploaded_by` bigint,
  `approved_by` bigint,
  `status` varchar(50) COMMENT 'Active/Expired/Pending Approval/Rejected',
  `remarks` text,
  `created_at` timestamp
);

CREATE TABLE `partner_document_versions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `document_id` bigint NOT NULL,
  `version` varchar(20) NOT NULL,
  `file_path` varchar(500),
  `change_summary` text,
  `uploaded_by` bigint,
  `created_at` timestamp
);

CREATE TABLE `partner_document_expiry` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `document_id` bigint NOT NULL,
  `alert_days` int COMMENT '90, 60, 30, 15, 7',
  `alert_sent` boolean DEFAULT false,
  `alert_sent_at` timestamp
);

CREATE TABLE `partner_timeline_events` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `event_category` varchar(50) COMMENT 'Business/Marketing/Financial/Bandwidth/Equipment/Users/Commission/Support Center/Documents/Approval/System',
  `event_type` varchar(100) NOT NULL,
  `event_description` text,
  `reference_table` varchar(100),
  `reference_id` bigint,
  `performed_by` bigint,
  `event_at` timestamp
);

CREATE TABLE `partner_notes` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `note` text NOT NULL,
  `category` varchar(50) COMMENT 'Management/Sales/Finance/Network/Marketing/Support Center/General',
  `priority` varchar(20) COMMENT 'Low/Medium/High/Critical',
  `visibility` varchar(20) COMMENT 'Public/Internal/Private',
  `attachment_path` varchar(500),
  `created_by` bigint,
  `created_at` timestamp
);

CREATE TABLE `partner_health_scores` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `score_date` date NOT NULL,
  `financial_health` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 25%',
  `revenue_growth` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 20%',
  `profitability` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 20%',
  `payment_behavior` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 10%',
  `bandwidth_growth` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 10%',
  `customer_growth` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 10%',
  `operational_performance` decimal(5,2) DEFAULT 0 COMMENT 'Weight: 5%',
  `total_score` decimal(5,2) DEFAULT 0,
  `health_status` varchar(20) COMMENT 'Excellent/Healthy/Watch/Risk/Critical'
);

CREATE TABLE `partner_risk_indicators` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint NOT NULL,
  `risk_category` varchar(50) COMMENT 'Financial/Marketing/Network/Equipment/Support Center/Contract',
  `risk_type` varchar(100) NOT NULL,
  `risk_level` varchar(20) COMMENT 'Low/Medium/High/Critical',
  `description` text,
  `detected_at` timestamp,
  `resolved_at` timestamp,
  `status` varchar(20) COMMENT 'Active/Resolved/Ignored'
);

CREATE TABLE `partner_insights` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `partner_id` bigint,
  `insight_type` varchar(50) COMMENT 'Revenue/Bandwidth/Customer/Cost/Commission/Profitability/General',
  `insight_text` text NOT NULL,
  `insight_data` json,
  `severity` varchar(20) COMMENT 'Info/Warning/Critical',
  `generated_at` timestamp,
  `is_read` boolean DEFAULT false
);

CREATE TABLE `audit_logs` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) NOT NULL,
  `entity_id` bigint,
  `previous_value` json,
  `new_value` json,
  `ip_address` varchar(45),
  `user_agent` text,
  `created_at` timestamp
);

CREATE TABLE `users` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `email_verified_at` timestamp,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100),
  `phone` varchar(50),
  `role_id` bigint,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `roles` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) UNIQUE NOT NULL COMMENT 'Management/Partner Manager/Sales/Marketing/Finance/Accounts/Network/Inventory/Support Center Management/System Administrator',
  `description` text,
  `created_at` timestamp
);

CREATE TABLE `permissions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) UNIQUE NOT NULL,
  `module` varchar(100),
  `action` varchar(50) COMMENT 'view/create/edit/delete/approve',
  `created_at` timestamp
);

CREATE TABLE `role_permissions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL
);

CREATE INDEX `idx_partner_status` ON `partners` (`status`);

CREATE INDEX `idx_partner_area` ON `partners` (`area_id`);

CREATE INDEX `idx_partner_zone` ON `partners` (`zone_id`);

CREATE INDEX `idx_partner_am` ON `partners` (`account_manager_id`);

CREATE INDEX `idx_partner_code` ON `partners` (`partner_code`);

CREATE UNIQUE INDEX `uk_partner_model` ON `partner_business_models` (`partner_id`, `business_model`);

CREATE UNIQUE INDEX `uk_partner_metric_date` ON `partner_marketing_metrics` (`partner_id`, `metric_date`);

CREATE INDEX `idx_metric_date` ON `partner_marketing_metrics` (`metric_date`);

CREATE UNIQUE INDEX `uk_partner_period` ON `partner_sales_metrics` (`partner_id`, `period_month`, `period_year`);

CREATE INDEX `idx_revenue_date` ON `partner_revenues` (`revenue_date`);

CREATE INDEX `idx_revenue_source` ON `partner_revenues` (`revenue_source`);

CREATE INDEX `idx_cost_date` ON `partner_costs` (`cost_date`);

CREATE INDEX `idx_cost_type` ON `partner_costs` (`cost_type`);

CREATE INDEX `idx_payment_date` ON `partner_payments` (`payment_date`);

CREATE UNIQUE INDEX `uk_partner_period_pl` ON `partner_profit_losses` (`partner_id`, `period_month`, `period_year`);

CREATE UNIQUE INDEX `uk_partner_snapshot` ON `partner_financial_snapshots` (`partner_id`, `snapshot_date`);

CREATE INDEX `idx_bw_service` ON `partner_bandwidth_allocations` (`service`);

CREATE INDEX `idx_bw_status` ON `partner_bandwidth_allocations` (`status`);

CREATE INDEX `idx_equip_partner` ON `partner_equipment` (`partner_id`);

CREATE INDEX `idx_equip_status` ON `partner_equipment` (`status`);

CREATE INDEX `idx_equip_type` ON `partner_equipment` (`equipment_type`);

CREATE INDEX `idx_device_identifier` ON `partner_end_devices` (`identifier`);

CREATE INDEX `idx_device_status` ON `partner_end_devices` (`status`);

CREATE INDEX `idx_comm_status` ON `partner_commissions` (`status`);

CREATE INDEX `idx_sc_partner` ON `partner_support_centers` (`partner_id`);

CREATE INDEX `idx_sc_status` ON `partner_support_centers` (`status`);

CREATE INDEX `idx_doc_expiry` ON `partner_documents` (`expiry_date`);

CREATE INDEX `idx_doc_type` ON `partner_documents` (`document_type`);

CREATE INDEX `idx_timeline_partner` ON `partner_timeline_events` (`partner_id`);

CREATE INDEX `idx_timeline_category` ON `partner_timeline_events` (`event_category`);

CREATE UNIQUE INDEX `uk_partner_health_date` ON `partner_health_scores` (`partner_id`, `score_date`);

CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity`, `entity_id`);

CREATE INDEX `idx_audit_user` ON `audit_logs` (`user_id`);

CREATE INDEX `idx_audit_date` ON `audit_logs` (`created_at`);

CREATE UNIQUE INDEX `role_permissions_index_34` ON `role_permissions` (`role_id`, `permission_id`);

ALTER TABLE `partner_business_models` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_profiles` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_relationships` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_relationship_history` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_approvals` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_marketing_metrics` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_customer_metrics` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_sales_metrics` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_churn_metrics` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_campaigns` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_revenues` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_costs` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_payments` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_profit_losses` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_financial_snapshots` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_roi` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_bandwidth_allocations` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_bandwidth_changes` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_bandwidth_changes` ADD FOREIGN KEY (`allocation_id`) REFERENCES `partner_bandwidth_allocations` (`id`);

ALTER TABLE `partner_bandwidth_history` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_bandwidth_approvals` ADD FOREIGN KEY (`change_id`) REFERENCES `partner_bandwidth_changes` (`id`);

ALTER TABLE `partner_equipment` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_equipment_assignments` ADD FOREIGN KEY (`equipment_id`) REFERENCES `partner_equipment` (`id`);

ALTER TABLE `partner_equipment_history` ADD FOREIGN KEY (`equipment_id`) REFERENCES `partner_equipment` (`id`);

ALTER TABLE `partner_equipment_maintenance` ADD FOREIGN KEY (`equipment_id`) REFERENCES `partner_equipment` (`id`);

ALTER TABLE `partner_end_devices` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_device_history` ADD FOREIGN KEY (`device_id`) REFERENCES `partner_end_devices` (`id`);

ALTER TABLE `partner_commission_rules` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_commissions` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_commissions` ADD FOREIGN KEY (`rule_id`) REFERENCES `partner_commission_rules` (`id`);

ALTER TABLE `partner_commission_payments` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_commission_payments` ADD FOREIGN KEY (`commission_id`) REFERENCES `partner_commissions` (`id`);

ALTER TABLE `partner_commission_adjustments` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_support_centers` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_support_center_staff` ADD FOREIGN KEY (`support_center_id`) REFERENCES `partner_support_centers` (`id`);

ALTER TABLE `partner_support_center_services` ADD FOREIGN KEY (`support_center_id`) REFERENCES `partner_support_centers` (`id`);

ALTER TABLE `partner_support_center_costs` ADD FOREIGN KEY (`support_center_id`) REFERENCES `partner_support_centers` (`id`);

ALTER TABLE `partner_support_center_equipment` ADD FOREIGN KEY (`support_center_id`) REFERENCES `partner_support_centers` (`id`);

ALTER TABLE `partner_support_center_history` ADD FOREIGN KEY (`support_center_id`) REFERENCES `partner_support_centers` (`id`);

ALTER TABLE `partner_documents` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_document_versions` ADD FOREIGN KEY (`document_id`) REFERENCES `partner_documents` (`id`);

ALTER TABLE `partner_document_expiry` ADD FOREIGN KEY (`document_id`) REFERENCES `partner_documents` (`id`);

ALTER TABLE `partner_timeline_events` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_notes` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_health_scores` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_risk_indicators` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `partner_insights` ADD FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

ALTER TABLE `role_permissions` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

ALTER TABLE `role_permissions` ADD FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`);

-- NOTE: নিচের ভুল FK বাদ দেওয়া হয়েছে (date column এ FK করা যায় না):
-- ALTER TABLE `partner_documents` ADD FOREIGN KEY (`expiry_date`) REFERENCES `partner_support_centers` (`id`);

-- ============================================================
-- LOOKUP TABLES (মিসিং ছিল — partners এর area/zone/territory ও
-- devices/commissions এর package FK গুলো এদের উপর নির্ভরশীল)
-- ============================================================

CREATE TABLE `areas` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `zone_id` bigint NOT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `zones` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `territory_id` bigint NOT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `territories` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `packages` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `package_id` varchar(50) UNIQUE,
  `package_name` varchar(255) NOT NULL,
  `service` varchar(50) COMMENT 'Internet/GGC/FNA/BDIX',
  `speed_mbps` decimal(10,2),
  `price` decimal(15,2) DEFAULT 0,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `settings` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `key` varchar(100) UNIQUE NOT NULL,
  `value` text,
  `group` varchar(50) DEFAULT 'general',
  `updated_by` bigint,
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `notifications` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint,
  `type` varchar(100),
  `title` varchar(255),
  `message` text,
  `entity` varchar(100),
  `entity_id` bigint,
  `is_read` boolean DEFAULT false,
  `read_at` timestamp,
  `created_at` timestamp
);

-- ============================================================
-- MISSING FKs (আগে ছিল না)
-- ============================================================

ALTER TABLE `users` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

ALTER TABLE `areas` ADD FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`);

ALTER TABLE `zones` ADD FOREIGN KEY (`territory_id`) REFERENCES `territories` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`territory_id`) REFERENCES `territories` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`account_manager_id`) REFERENCES `users` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`relationship_manager_id`) REFERENCES `users` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

ALTER TABLE `partners` ADD FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

ALTER TABLE `partner_churn_metrics` ADD FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`);

ALTER TABLE `partner_churn_metrics` ADD FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`);

ALTER TABLE `partner_churn_metrics` ADD FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`);

ALTER TABLE `partner_end_devices` ADD FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`);

ALTER TABLE `partner_commission_rules` ADD FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`);

ALTER TABLE `partner_support_centers` ADD FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`);

ALTER TABLE `partner_support_centers` ADD FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`);

ALTER TABLE `partner_support_center_services` ADD FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`);

ALTER TABLE `partner_support_center_services` ADD FOREIGN KEY (`territory_id`) REFERENCES `territories` (`id`);

ALTER TABLE `partner_business_models` ADD FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`);

ALTER TABLE `partner_relationships` ADD FOREIGN KEY (`current_account_manager_id`) REFERENCES `users` (`id`);

ALTER TABLE `partner_bandwidth_history` ADD FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

ALTER TABLE `partner_timeline_events` ADD FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`);

ALTER TABLE `notifications` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

-- ============================================================
-- MISSING INDEXES (duplicate রোধে unique দরকার ছিল)
-- ============================================================

CREATE UNIQUE INDEX `uk_customer_metric_date` ON `partner_customer_metrics` (`partner_id`, `metric_date`);

CREATE UNIQUE INDEX `uk_churn_metric` ON `partner_churn_metrics` (`partner_id`, `metric_date`, `churn_reason`);

CREATE INDEX `idx_notif_user` ON `notifications` (`user_id`, `is_read`);
