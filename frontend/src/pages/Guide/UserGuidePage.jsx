import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Search,
  Building2,
  Layers,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Store,
  Wifi,
  Smartphone,
  Users,
  DollarSign,
  Folder,
  History,
  ClipboardList,
  TrendingUp,
  HelpCircle,
  Printer,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
  LayoutDashboard,
  Network,
  Coins,
  Wallet,
  ShieldAlert,
  BarChart3,
  Settings,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Link } from 'react-router-dom'

// 1. ALL SIDEBAR NAVIGATION MODULES
const SIDEBAR_MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    route: '/',
    icon: LayoutDashboard,
    color: 'primary',
    group: 'Core',
    description: 'Central executive cockpit providing high-level operational intelligence across all partner accounts.',
    features: [
      'Total Partner Portfolio count (Active, Pending, Suspended, Blocked).',
      'Total Monthly Revenue, Collected Payments, and Outstanding Overdue Receivables.',
      'Total Bandwidth Consumption (Aggregated DIA, BDIX, GGC, FNA peak Gbps).',
      'Health Score Distribution Widget (identifying high-risk vs healthy partners).',
      'Recent System Activity and Critical Operational Alerts feed.',
    ],
    howToUse: 'Use this page for daily morning operational check-ins. Click on metric tiles or alert cards to drill down directly into specific partner records.',
    example: 'Executive sees ৳ 24.5M monthly revenue, identifies 3 partners in red "High Risk" status due to overdue balances, and clicks the alert to investigate.',
  },
  {
    id: 'partners',
    title: 'Partners Directory',
    route: '/partners',
    icon: Users,
    color: 'primary',
    group: 'Core',
    description: 'Comprehensive directory table of all registered ISP, Reseller, Franchise, and Corporate partners.',
    features: [
      'Multi-parameter filtering: Filter by Status (Active, Pending, Suspended), Partner Tier (A, B, C), or Type (ISP, Reseller).',
      'Instant Search: Search by Partner Name, Partner Code (e.g. P-00102), Phone, or Email.',
      'Bulk Actions: Select multiple partners with checkboxes to perform bulk status transitions.',
      'Direct Profile Navigation: Click any partner name to open their 14-tab dedicated Master Profile.',
      'Add Partner Button: Dedicated button in the top-right header to launch the 5-step registration wizard.',
    ],
    howToUse: 'Navigate to this directory to find partners, check overall account standing, or initiate new partner onboarding.',
    example: 'Filter by Status = "Pending Approval" to see all partners awaiting KYC verification and management approval.',
  },
  {
    id: 'bandwidth',
    title: 'Bandwidth Allocation Hub',
    route: '/bw-dashboard',
    icon: Network,
    color: 'primary',
    group: 'Core',
    description: 'Central network capacity management dashboard tracking upstream transit and CDN peering.',
    features: [
      'Total Network Upstream vs Downstream throughput utilization graphs.',
      'Sub-allocation by Partner: Dedicated Internet Access (DIA), Google Cache (GGC), Facebook (FNA), and BDIX peering.',
      'Over-utilization and Bursting Alerts: Identifies partners exceeding 90% committed bandwidth capacity.',
      'Border Gateway IP allocation pools and VLAN bindings.',
    ],
    howToUse: 'Inspect peak traffic hours, verify if partners need bandwidth upgrades, and allocate additional transit quotas.',
    example: 'Identify that "SpeedNet" is running at 480 Mbps on a 500 Mbps DIA link during evening peak hours, prompting sales to propose a 200 Mbps upgrade.',
  },
  {
    id: 'devices',
    title: 'End Devices & CPE Registry',
    route: '/end-devices',
    icon: Smartphone,
    color: 'primary',
    group: 'Core',
    description: 'Enterprise hardware inventory managing all customer-premises equipment (CPE) deployed across partners.',
    features: [
      'Device Asset Ledger: Tracking ONUs, ONTs, Core Routers, Optical Switches, and SFP modules.',
      'MAC Address & Serial Lookup: Instant search to locate which partner or subscriber holds a specific MAC address.',
      'Inventory Statuses: In Stock, Deployed / Active, In Repair / RMA, and Faulty / Scrapped.',
      'Warranty Exchange & Device Replacement workflow.',
    ],
    howToUse: 'Use to audit hardware assets, issue new CPE to partners, and track defective units returned for warranty replacement.',
    example: 'A field engineer searches MAC address "48:D6:D5:12:34:56" to immediately determine it is deployed at SpeedNet under warranty until Dec 2026.',
  },
  {
    id: 'commission',
    title: 'Commission Management',
    route: '/commission',
    icon: Coins,
    color: 'success',
    group: 'Finance & Ops',
    description: 'Automated commission computation, incentive schemes, and partner payout disbursement ledger.',
    features: [
      'Rule Engine: Define Percentage-based revenue share or fixed cash bounty per retail subscriber activation.',
      'Monthly Ledger Generation: Automated calculation of partner commission statements from verified billing receipts.',
      'Payment Disbursement: Post payouts via Bank Transfer, Mobile Financial Services (bKash/Nagad), or Corporate Check.',
      'Audit log of approved vs pending commission payouts.',
    ],
    howToUse: 'At the end of each billing cycle, generate commission summaries, review for approval, and disburse payouts.',
    example: 'Generate September 2026 commission statement for Reseller "Apex Online" (৳ 34,500 based on 10% of ৳ 345,000 retail billings) and mark as Paid via City Bank.',
  },
  {
    id: 'support_centers',
    title: 'Support Centers',
    route: '/support-centers',
    icon: Building2,
    color: 'danger',
    group: 'Finance & Ops',
    description: 'Network-wide branch management hub monitoring physical customer care branches and regional offices.',
    features: [
      'Consolidated Branch Directory: View all customer care centers and regional support points nationwide.',
      'Staff Overhead & Operating Costs: Monthly salary expenses, office rent, utilities, and branch maintenance costs.',
      'Branch Profitability Tracking: Compares revenue generated through branch territory against operational running costs.',
      'Branch Status Controls: Manage centers under Active, Planned, Temporarily Closed, or Suspended states.',
    ],
    howToUse: 'Analyze which regional branches are profitable and monitor localized customer service capacity.',
    example: 'Reviewing 12 support centers across Dhaka Division, verifying that Uttara Care Center generates ৳ 120,000 profit contribution after deducting ৳ 75,000 operating costs.',
  },
  {
    id: 'partner_accounts',
    title: 'Financial Accounts & Billing',
    route: '/partner-accounts',
    icon: Wallet,
    color: 'success',
    group: 'Finance & Ops',
    description: 'Double-entry accounting ledger managing partner billings, invoice aging, and payment collection receipts.',
    features: [
      'Consolidated Receivables Ledger: Shows total billed invoices, total received payments, and net outstanding balances.',
      'Aging Analysis: 0-30 days, 31-60 days, 61-90 days, and 90+ days overdue buckets.',
      'User-Friendly "Record Payment" Modal: Searchable autocomplete dropdown to easily pick partners by name or code.',
      'Payment Method Tracking: Bank Transfer, bKash/Nagad, Check, Cash, with transaction reference slips.',
    ],
    howToUse: 'When a partner deposits money into the company account, open "Record Payment", select the partner, enter amount and bank transaction reference to instantly reconcile their ledger.',
    example: 'Partner "SpeedNet" deposits ৳ 85,000 into Eastern Bank. Accounts officer opens Record Payment, types "SpeedNet", enters ৳ 85,000, attaches reference "EBL-TRX-99412", and outstanding balance updates from ৳ 115,000 to ৳ 30,000.',
  },
  {
    id: 'audit_logs',
    title: 'Audit Logs & Forensics',
    route: '/audit-logs',
    icon: ShieldAlert,
    color: 'primary',
    group: 'Administration',
    description: 'Immutable system-level audit trail capturing every user transaction, status change, and data mutation.',
    features: [
      'User Attribution: Exact username, user ID, role, and client IP address for every mutation.',
      'Action Categories: Partner Created, Status Modified, Payment Posted, Bandwidth Changed, Device Replaced.',
      'Before & After Field Diffs: Detailed inspection of previous values vs updated values.',
      'Filterable by date range, target entity, or administrative user.',
    ],
    howToUse: 'Use during internal audits or forensic investigations to verify who approved an action or when commercial terms were changed.',
    example: 'Audit reveals that user "admin@plexuscloud.com" increased Credit Limit from ৳ 50,000 to ৳ 100,000 on 2026-09-25 at 14:32:10 from IP 192.168.1.105.',
  },
  {
    id: 'reports',
    title: 'Executive Reports Hub',
    route: '/reports',
    icon: BarChart3,
    color: 'warning',
    group: 'Administration',
    description: 'Centralized business intelligence reporting engine with CSV, Excel, and PDF export capabilities.',
    features: [
      'Partner Billing & Financial Statements report.',
      'Bandwidth Utilization & Peak Consumption Trends report.',
      'Commission Payout Summary report by territory and business model.',
      'Partner Health & Churn Risk report.',
    ],
    howToUse: 'Generate and download monthly operational and financial reports for executive management and board presentations.',
    example: 'Exporting "Q3 2026 Partner P&L Performance Report" to Excel to present regional profitability to the CEO.',
  },
  {
    id: 'settings',
    title: 'Platform Settings',
    route: '/settings',
    icon: Settings,
    color: 'secondary',
    group: 'Administration',
    description: 'Global system configuration, user access roles, security rules, and platform parameters.',
    features: [
      'Role-Based Access Control (RBAC): Configure permissions for Admins, Account Managers, Finance, and NOC Engineers.',
      'Commercial Defaults: Set default Payment Terms (Net 30), default Credit Days, and currency symbols.',
      'SLA & Health Score Thresholds: Customize scoring weights for payment punctuality and churn penalties.',
    ],
    howToUse: 'Authorized system administrators manage internal staff user accounts, assign roles, and adjust global billing defaults.',
    example: 'Creating a new user account for "Finance Executive" with permissions restricted strictly to invoice viewing and recording payments.',
  },
]

// 2. NEW PARTNER FORM 5 STEPS (WITH PRACTICAL EXAMPLES)
const NEW_PARTNER_STEPS = [
  {
    step: 1,
    title: 'Step 1: Basic Identity & Contact Information',
    badge: 'Essential',
    badgeCls: 'bg-primary-subtle text-primary border border-primary-subtle',
    desc: 'Captures the legal identity, branding names, and official contact coordinates of the partner organization.',
    howToComplete: 'Enter the trading brand name, official contact person, mobile number, and email. If legal registered name is different from brand name, specify it in Legal Name.',
    fields: [
      {
        name: 'Partner Name',
        type: 'Text',
        required: true,
        example: 'SpeedNet Communications',
        description: 'The primary brand or commercial display name used across dashboards, directory tables, and customer-facing reports.',
      },
      {
        name: 'Legal Name',
        type: 'Text',
        required: false,
        example: 'SpeedNet Communications Ltd.',
        description: 'The registered legal entity name as shown on the Trade License, Certificate of Incorporation, or regulatory filings.',
      },
      {
        name: 'Business Name',
        type: 'Text',
        required: false,
        example: 'SpeedNet Online',
        description: 'Trade or operational DBA (Doing Business As) name if different from the legal registered entity name.',
      },
      {
        name: 'Partner Type',
        type: 'Dropdown',
        required: true,
        example: 'ISP, Reseller, Corporate, Franchise, Support Center',
        description: 'Defines the operational category. Direct internet service providers should be classified as ISP; sub-distributors as Reseller.',
      },
      {
        name: 'Partner Category',
        type: 'Dropdown',
        required: true,
        example: 'Tier A, Tier B, Tier C',
        description: 'Volume tiering and commercial scale grading (Tier A = Enterprise/High volume, Tier C = Local access partner).',
      },
      {
        name: 'Contact Person',
        type: 'Text',
        required: false,
        example: 'Mr. Rafiqul Islam (Managing Director)',
        description: 'Primary authorized owner, executive, or point of contact representing the partner organization.',
      },
      {
        name: 'Contact Number',
        type: 'Phone',
        required: false,
        example: '+880 1712-345678',
        description: 'Official telephone or mobile number used for urgent operational calls, alerts, and SMS notifications.',
      },
      {
        name: 'Email Address',
        type: 'Email',
        required: false,
        example: 'billing@speednet.com',
        description: 'Designated corporate email inbox for monthly billing statements, service notifications, and formal correspondence.',
      },
      {
        name: 'Official Address',
        type: 'Textarea',
        required: false,
        example: 'House 12, Road 4, Sector 7, Uttara, Dhaka-1230',
        description: 'Full registered head office address for postal invoicing and regulatory compliance records.',
      },
    ],
  },
  {
    step: 2,
    title: 'Step 2: Business Models Assignment',
    badge: 'At least 1 required',
    badgeCls: 'bg-danger-subtle text-danger border border-danger-subtle',
    desc: 'Assigns operational business models to the partner. Multiple models can be assigned concurrently depending on the commercial agreement.',
    howToComplete: 'Click on the business model cards to toggle them ON or OFF. At least one business model must be active to proceed to Step 3.',
    fields: [
      {
        name: 'Bandwidth Sales',
        type: 'Model Toggle',
        required: true,
        example: 'Selected for partners purchasing DIA, GGC, FNA, or BDIX transit',
        description: 'Enables network transit and bandwidth quota tracking. Activates the "Bandwidth" management tab in the partner profile.',
      },
      {
        name: 'Commission Based',
        type: 'Model Toggle',
        required: true,
        example: 'Selected for reseller partners earning 10% revenue share',
        description: 'Enables commission calculation engine and payout ledgers. Activates the "Commission" management tab in the partner profile.',
      },
      {
        name: 'End Device Based',
        type: 'Model Toggle',
        required: true,
        example: 'Selected for partners receiving ONU/ONT hardware on consignment',
        description: 'Enables customer-premises hardware tracking, MAC binding, and warranty replacements. Activates the "Equipment & Devices" tab.',
      },
      {
        name: 'Support Center',
        type: 'Model Toggle',
        required: true,
        example: 'Selected for partners operating regional customer care branches',
        description: 'Enables physical branch office management, local staff registries, and branch operating cost mirroring into P&L.',
      },
    ],
  },
  {
    step: 3,
    title: 'Step 3: Commercials & Contract Terms',
    badge: 'Financial Critical',
    badgeCls: 'bg-warning-subtle text-warning border border-warning-subtle',
    desc: 'Sets up credit exposure limits, payment grace periods, contract validity dates, and billing cycle frequencies.',
    howToComplete: 'Specify the contract commencement date, select allowable payment terms (e.g. Net 30), and define a realistic Credit Limit (৳) to manage financial exposure.',
    fields: [
      {
        name: 'Contract Type',
        type: 'Dropdown',
        required: true,
        example: 'Standard (for typical ISP agreement) or Enterprise',
        description: 'Legal contract framework governing commercial terms. Defaults to Standard.',
      },
      {
        name: 'Contract Start Date',
        type: 'Date',
        required: true,
        example: '2026-01-01',
        description: 'Official commencement date of the partnership. Financial billing and SLA calculations begin from this date.',
      },
      {
        name: 'Contract End Date',
        type: 'Date',
        required: false,
        example: '2027-01-01 (1 year renewal term)',
        description: 'Expiration date of the current agreement. System raises renewal alerts 30 days prior to expiry.',
      },
      {
        name: 'Payment Terms',
        type: 'Dropdown',
        required: true,
        example: 'Net 30 (Payment due within 30 days of invoice)',
        description: 'Number of allowable calendar days from invoice generation before payment is deemed overdue. Default is Net 30.',
      },
      {
        name: 'Credit Limit (৳)',
        type: 'Currency (BDT)',
        required: false,
        example: '৳ 100,000',
        description: 'Maximum allowable outstanding invoice balance. Exceeding this limit triggers financial health risk alerts and warns operators.',
      },
      {
        name: 'Credit Days',
        type: 'Integer',
        required: false,
        example: '30 Days',
        description: 'Maximum grace period permitted for unsettled payments before automatic service suspension flags are triggered.',
      },
      {
        name: 'Security Deposit (৳)',
        type: 'Currency (BDT)',
        required: false,
        example: '৳ 50,000 (Held in escrow)',
        description: 'Refundable security cash deposit or bank guarantee retained by Plexus Cloud as risk mitigation.',
      },
      {
        name: 'Billing Cycle',
        type: 'Dropdown',
        required: true,
        example: 'Monthly',
        description: 'Frequency of automated invoice generation. Monthly is the default and recommended setting for ISP partners.',
      },
    ],
  },
  {
    step: 4,
    title: 'Step 4: Territory Allocation & Governance Leads',
    badge: 'Governance & Ops',
    badgeCls: 'bg-info-subtle text-info border border-info-subtle',
    desc: 'Assigns the partner to geographic divisions and designates internal commercial and technical account leads.',
    howToComplete: 'Select Territory, Zone, and Area from dropdowns. Assign internal Account Manager (AM) and Relationship Manager (RM). Keep status as "Pending Approval" for review.',
    fields: [
      {
        name: 'Territory / Division',
        type: 'Dropdown',
        required: false,
        example: 'Dhaka Division',
        description: 'The highest-level administrative territory where the partner is authorized to distribute connectivity.',
      },
      {
        name: 'Zone',
        type: 'Dropdown',
        required: false,
        example: 'Dhaka North',
        description: 'Specific geographic zone within the territory.',
      },
      {
        name: 'Area / Thana',
        type: 'Dropdown',
        required: false,
        example: 'Uttara, Mirpur, Gulshan',
        description: 'Localized coverage area or municipality.',
      },
      {
        name: 'Account Manager (AM)',
        type: 'Dropdown',
        required: false,
        example: 'Kamrul Hasan (Senior Sales Lead)',
        description: 'Internal commercial team lead responsible for partner sales targets, billing escalations, and commercial relationship.',
      },
      {
        name: 'Relationship Manager (RM)',
        type: 'Dropdown',
        required: false,
        example: 'Mahmudur Rahman (NOC Ops Lead)',
        description: 'Internal technical and support liaison managing service provisioning, NOC coordination, and day-to-day operations.',
      },
      {
        name: 'Initial Status',
        type: 'Dropdown',
        required: true,
        example: 'Pending Approval',
        description: 'Default onboarding state. Remains Pending Approval until management conducts KYC review and activates the account.',
      },
    ],
  },
  {
    step: 5,
    title: 'Step 5: Review, Validation & System Submission',
    badge: 'Finalize',
    badgeCls: 'bg-success-subtle text-success border border-success-subtle',
    desc: 'Comprehensive summary validation screen. Verify all inputs before committing. The system automatically creates a unique Partner Code (e.g., P-00105).',
    howToComplete: 'Review the preview card. If any value needs correction, click "Previous" to adjust. Click "Submit Partner" to create the master record.',
    fields: [],
  },
]

// 3. ALL 14 PARTNER DETAILS TABS (WITH HOW-TO & REAL-WORLD EXAMPLES)
const PARTNER_DETAILS_TABS = [
  {
    id: 'overview',
    number: '1',
    label: 'Overview',
    icon: Building2,
    color: 'primary',
    tag: 'Dashboard',
    tagCls: 'bg-primary-subtle text-primary',
    title: '1. Overview (5-Group Operational Metrics Dashboard)',
    description: 'Comprehensive executive snapshot summarizing performance across 5 key operational dimensions.',
    highlights: [
      'Group 1 (Business Overview): Total revenue generated, active subscriber count, and assigned network devices.',
      'Group 2 (Financial Snapshot): Outstanding balance, paid YTD amounts, credit limit headroom, and payment terms.',
      'Group 3 (Bandwidth Allocations): Total committed DIA and local cache peering capacity (GGC, FNA, BDIX).',
      'Group 4 (Equipment & Devices): Hardware currently deployed on-site vs warehouse stock.',
      'Group 5 (Support Center Branches): Active support branch count, staff overhead costs, and monthly branch burn.',
    ],
    howToUse: 'Open this tab whenever you need a fast 360-degree health assessment of the partner. Use the "Quick Actions" button in the upper right header to execute common administrative tasks.',
    example: 'An Account Manager opens SpeedNet\'s Overview to check if their outstanding balance of ৳ 85,000 exceeds their ৳ 100,000 Credit Limit before approving an additional 100 Mbps DIA request.',
  },
  {
    id: 'business',
    number: '2',
    label: 'Business Info',
    icon: Building2,
    color: 'secondary',
    tag: 'Master Profile',
    tagCls: 'bg-secondary-subtle text-secondary',
    title: '2. Business Info (Master Profile & Regulatory Credentials)',
    description: 'Primary repository for corporate details, registered addresses, tax registrations, and assigned managers.',
    highlights: [
      'Edit Profile: Update partner legal name, trade name, official phone, and billing email addresses.',
      'Regulatory IDs: Track official Trade License numbers, Tax Identification Numbers (TIN), and VAT/BIN.',
      'Governance Alignment: Reassign Account Managers (AM) and Relationship Managers (RM) as organization scales.',
      'Coverage Mapping: Document specific geographic wards, zones, and street-level coverage zones.',
    ],
    howToUse: 'Click the "Edit Profile" button to update contact numbers, registered address, or corporate tax IDs when the partner submits renewal documents.',
    example: 'Partner renews their Trade License. Admin clicks "Edit Profile", updates Trade License field to "TRAD/DNCC/084912/2026", updates BIN to "00349281-0101", and saves.',
  },
  {
    id: 'models',
    number: '3',
    label: 'Business Models',
    icon: Layers,
    color: 'success',
    tag: 'Commercial Models',
    tagCls: 'bg-success-subtle text-success',
    title: '3. Business Models (Active Contracts & Revenue Slabs)',
    description: 'Configure and monitor specific commercial models assigned to this partner account.',
    highlights: [
      'Model Activation: View active statuses for Bandwidth Sales, Commission Based, End Device, or Support Center.',
      'Revenue Sharing & Slabs: Set custom revenue sharing percentages or tier-based incentive slabs.',
      'SLA & Targets: Monitor monthly customer acquisition targets and minimum commitment requirements.',
      'Direct Navigation Links: Click on any active model card to jump straight into its corresponding operational tab.',
    ],
    howToUse: 'Click "Assign New Model" to add a new business stream (e.g. enabling Support Center operations for an existing bandwidth partner). Click any active model card to jump directly to its management tab.',
    example: 'SpeedNet expands from pure Bandwidth Sales into operating a Support Center. Admin clicks "Assign Model", enables "Support Center", and the Support Centers tab unlocks immediately.',
  },
  {
    id: 'marketing',
    number: '4',
    label: 'Marketing & Sales',
    icon: TrendingUp,
    color: 'warning',
    tag: 'Growth Analytics',
    tagCls: 'bg-warning-subtle text-warning',
    title: '4. Marketing & Sales (Campaigns & Acquisition Targets)',
    description: 'Track retail customer acquisition momentum, marketing campaigns, and package performance.',
    highlights: [
      'Promotional Campaigns: Create and track targeted discounts, festive promotions, or regional campaigns.',
      'Sales Targets vs Actual: Real-time graphical visualization comparing monthly sales quotas against actual sales.',
      'Package Performance: Breakdown of which bandwidth speed tiers and internet packages generate the most revenue.',
    ],
    howToUse: 'Click "Add Campaign" to log promotional discounts or seasonal campaigns. Click "Record Sales Target" to register quarterly quotas and compare actual achievement.',
    example: 'Logging campaign "Eid Mega Double Speed Offer 2026" with a target of 150 new retail subscribers and a marketing budget of ৳ 20,000.',
  },
  {
    id: 'financial',
    number: '5',
    label: 'Financials & P&L',
    icon: DollarSign,
    color: 'danger',
    tag: 'Financial Intelligence',
    tagCls: 'bg-danger-subtle text-danger',
    title: '5. Financials & P&L (Financial Ledger & Net Profitability)',
    description: 'Complete double-entry accounting ledger, revenue recognition, direct cost tracking, and P&L analysis.',
    highlights: [
      'Record Revenue: Post manual billing invoices, bandwidth sales, and setup charges with source references.',
      'Record Cost: Post upstream bandwidth transit costs, power expenses, or infrastructure costs.',
      'Record Payment: Submit customer payment remittances with bank transaction slips or check references.',
      'Automated Net Margin: Real-time calculation of Net Profit (৳) and Profit Margin (%) for this partner.',
    ],
    howToUse: '1) Click "Record Revenue" to bill the partner. 2) Click "Record Cost" to log direct operating costs. 3) Click "Record Payment" when remittance arrives. The Net Profit card updates automatically.',
    example: 'Billing ৳ 120,000 bandwidth sales for invoice INV-1002. Logging ৳ 50,000 upstream transit cost. Recording ৳ 120,000 received payment via City Bank. Net Profit displays ৳ 70,000 (58.3% margin).',
  },
  {
    id: 'bandwidth',
    number: '6',
    label: 'Bandwidth',
    icon: Wifi,
    color: 'info',
    tag: 'Network Transit',
    tagCls: 'bg-info-subtle text-info',
    title: '6. Bandwidth Allocations (Transit Quotas & IP Subnets)',
    description: 'Manage allocated bandwidth capacity, routing policies, and assigned public IP blocks.',
    highlights: [
      'Traffic Quotas: Dedicated Internet Access (DIA), Google Global Cache (GGC), Facebook (FNA), and BDIX Peering.',
      'Public IP Pools: Allocate and bind /29, /28, or /27 IPv4 subnet blocks to partner border routers.',
      'Utilization Monitoring: High-watermark traffic monitoring and links to NOC telemetry / Grafana dashboards.',
    ],
    howToUse: 'Click "Allocate Bandwidth" to configure new traffic quotas or edit committed Mbps for existing streams. Click "Assign IP Pool" to bind public IPv4 subnets.',
    example: 'Allocating 500 Mbps DIA, 1 Gbps BDIX, and 1 Gbps GGC Cache on upstream VLAN 204, and assigning public IP subnet 103.145.22.64/29.',
  },
  {
    id: 'devices',
    number: '7',
    label: 'Equipment & Devices',
    icon: Smartphone,
    color: 'primary',
    tag: 'Asset Management',
    tagCls: 'bg-primary-subtle text-primary',
    title: '7. Equipment & Devices (Customer Premises Hardware Tracking)',
    description: 'Complete hardware registry tracking deployed ONUs, OLT optical ports, and core routers.',
    highlights: [
      'MAC & Serial Binding: Track hardware serial numbers, MAC addresses, and deployment dates.',
      'Replace Device: Warranty exchange workflow allowing damaged units to be replaced with new serials seamlessly.',
      'Return to Stock: De-provision and return hardware back to warehouse inventory upon subscriber termination.',
    ],
    howToUse: '1) Click "Assign Device" to issue equipment. 2) If a customer reports lightning damage, click "Replace Device" on the item, enter the RMA reason, and input the replacement unit serial.',
    example: 'A GPON ONU (MAC: 48:D6:D5:AA:BB:CC) suffers laser failure. Operator clicks "Replace Device", enters reason "Optical TX Dead", inputs new MAC "48:D6:D5:DD:EE:FF", and warranty history updates.',
  },
  {
    id: 'users_customers',
    number: '8',
    label: 'Users & Customers',
    icon: Users,
    color: 'secondary',
    tag: 'Subscriber Base',
    tagCls: 'bg-secondary-subtle text-secondary',
    title: '8. Users & Customers (Subscriber Health & Churn Analysis)',
    description: 'Monitor partner retail end-user subscriber base, account states, and churn analytics.',
    highlights: [
      'Subscriber Status Breakdown: Real-time counts of Active, Suspended, Expired, and Newly onboarded users.',
      'Churn Analytics: Monthly termination rates and subscriber attrition trends.',
      'Average Revenue Per User (ARPU): Measure retail monetization efficiency across the partner subscriber base.',
    ],
    howToUse: 'Review subscriber health metrics. Click "Sync Metrics" to trigger real-time subscriber sync from the billing radius engine.',
    example: 'Auditing SpeedNet\'s subscriber metrics: 1,420 Active, 85 Suspended, 12 Expired, with 0.8% Churn Rate and Average ARPU of ৳ 680/user.',
  },
  {
    id: 'commission',
    number: '9',
    label: 'Commission',
    icon: CreditCard,
    color: 'success',
    tag: 'Payout Automation',
    tagCls: 'bg-success-subtle text-success',
    title: '9. Commission System (Rules, Slabs & Payout Statements)',
    description: 'Automated commission computation engine, monthly reconciliation, and disbursement tracking.',
    highlights: [
      'Rule Definition: Create Percentage (%) rules or fixed bounty payouts per new subscriber activation.',
      'Monthly Ledger: Automated end-of-month commission statements calculated from verified collections.',
      'Disbursement Tracking: Mark approved commissions as Disbursed via Bank Transfer, bKash, or Corporate Check.',
    ],
    howToUse: '1) Click "Add Rule" to configure commission terms. 2) At month end, click "Generate Commission" to calculate earnings. 3) Click "Disburse Payment" to record payout remittance voucher.',
    example: 'Rule "Retail 20 Mbps 10% Recurring" calculates ৳ 28,400 commission for the month; finance clicks "Disburse", enters Bank Reference "BRAC-99201", and marks as Disbursed.',
  },
  {
    id: 'support_centers',
    number: '10',
    label: 'Support Centers',
    icon: Store,
    color: 'danger',
    tag: 'Branch Operations',
    tagCls: 'bg-danger-subtle text-danger',
    title: '10. Support Centers (Physical Branches, Staff & Branch Overhead)',
    description: 'Manage localized partner customer care centers, on-site personnel, and branch operating overheads.',
    highlights: [
      'Add Branch: Register center name, branch type (Branch, Head Office, Support Center, Franchise), and manager.',
      'Staff Directory: Maintain local team rosters, designations, contact numbers, and monthly salary costs.',
      'Operating Overhead: Log branch rent, electricity, and generator costs (automatically mirrored into partner P&L).',
      'Accordion Control: Expand All / Collapse All controls to inspect multiple branch centers simultaneously.',
    ],
    howToUse: '1) Click "Add Branch" (ensure Branch Type is Branch, Head Office, Support Center, or Franchise). 2) Expand branch to add staff rosters, equipment, and rent costs. 3) Use "Expand All" / "Collapse All" to toggle views.',
    example: 'Creating "Uttara Care Center" (Type: Branch, Manager: "Tareq Ahmed"). Adding 2 support engineers with ৳ 45,000 monthly cost. Logging ৳ 20,000 rent. System auto-mirrors ৳ 65,000 into partner P&L direct costs.',
  },
  {
    id: 'documents',
    number: '11',
    label: 'Documents & KYC',
    icon: Folder,
    color: 'warning',
    tag: 'Compliance & Legal',
    tagCls: 'bg-warning-subtle text-warning',
    title: '11. Documents & KYC (Bilateral Agreements & Legal Filings)',
    description: 'Secure digital repository for signed contracts, regulatory permits, and corporate identification.',
    highlights: [
      'KYC Filing: Upload certified Trade Licenses, TIN/BIN tax certificates, and National ID cards (NID).',
      'Signed Contracts: Store executed bilateral Master Service Agreements (MSA) and Service Level Agreements (SLA).',
      'Verification Auditing: Legal and compliance teams mark documents as Verified, Expired, or Rejected with notes.',
    ],
    howToUse: 'Click "Upload Document", select document type (Trade License, TIN, NID, Agreement), attach file, and save. Compliance officer clicks "Verify" after cross-checking official registry.',
    example: 'Uploading "SpeedNet_Trade_License_2026.pdf" with expiry date 2027-06-30. Compliance officer reviews document and updates status to "Verified".',
  },
  {
    id: 'history',
    number: '12',
    label: 'History & Timeline',
    icon: History,
    color: 'info',
    tag: 'Timeline & Notes',
    tagCls: 'bg-info-subtle text-info',
    title: '12. History & Notes (Lifecycle Events & Internal Team Notes)',
    description: 'Chronological timeline of all major lifecycle transitions and confidential collaboration notes.',
    highlights: [
      'Lifecycle Events: Immutable timeline logging when the partner was created, approved, suspended, or reactivated.',
      'Internal Notes: Post confidential credit collection notes, technical discussion logs, or operational warnings.',
      'Pinned Reminders: Pin urgent operational reminders to the top of the team feed.',
    ],
    howToUse: 'Type confidential notes in the Notes Panel (e.g. credit discussions or payment promises), check "Pin to top" for urgent alerts, and view lifecycle timestamps.',
    example: 'Finance officer adds note: "Spoke with Partner MD regarding overdue invoice INV-884 - agreed to pay ৳ 50,000 by 10th October via RTGS." and pins to top.',
  },
  {
    id: 'health_risk',
    number: '13',
    label: 'Health & Risk',
    icon: AlertTriangle,
    color: 'danger',
    tag: 'Risk Governance',
    tagCls: 'bg-danger-subtle text-danger',
    title: '13. Health & Risk (Predictive Risk Scoring & Default Flags)',
    description: 'Automated health index (0 to 100) scoring payment reliability, regulatory compliance, and churn risk.',
    highlights: [
      'Score 80-100 (Good): Punctual payments, healthy subscriber growth, and valid regulatory licenses.',
      'Score 60-79 (Medium): Occasional payment delays or moderate credit headroom usage.',
      'Score < 60 (High Risk): Frequent late payments, exceeded credit limits, or high customer churn rate.',
      'Late Payment Counter: Cumulative tracker counting instances where invoices exceeded allowable credit days.',
    ],
    howToUse: 'Inspect this tab prior to approving major credit limit increases or large hardware consignments. If score is below 60, review late payment flags and enforce advance billing.',
    example: 'SpeedNet shows Health Score 88/100 (Good / Green). Zero late payments in the last 12 months, license valid for 240 days, low churn rate (0.6%).',
  },
  {
    id: 'audit',
    number: '14',
    label: 'Audit Trail',
    icon: ClipboardList,
    color: 'primary',
    tag: 'Security & Forensics',
    tagCls: 'bg-primary-subtle text-primary',
    title: '14. Audit Trail (Immutable System Activity Logs)',
    description: 'Enterprise forensic audit log capturing every administrative mutation performed on this partner record.',
    highlights: [
      'Actor Attribution: Records exact user name, administrative role, and originating IP address.',
      'State Diffs: Complete before-and-after change diffs showing old values vs updated values.',
      'Immutable Security: Logs are append-only and cannot be altered or purged by any system user.',
    ],
    howToUse: 'Use when investigating unauthorized modifications or reconciling discrepancy disputes.',
    example: 'Audit log verifies that user "kamrul@plexuscloud.com" updated Credit Limit from ৳ 50,000 to ৳ 100,000 on 2026-09-22 at 11:20 AM from IP 192.168.1.45.',
  },
]

// 4. COMMON OPERATIONAL FAQS
const FAQS = [
  {
    q: 'Why does a newly created partner show "Pending Approval" instead of "Active"?',
    a: 'This is an enterprise governance safeguard. Operators who register new partners place them in a verification queue. An authorized manager or administrator must inspect the profile and click "Approve / Reject" from the Quick Actions menu to promote the partner to "Active" status, which then unlocks live bandwidth provisioning and automated invoicing.',
  },
  {
    q: 'What causes a validation error when creating a branch in Support Centers?',
    a: 'Two common reasons: 1) "Center Name" is mandatory and cannot be empty. 2) "Branch Type" must strictly match one of the 4 allowable system values: "Branch", "Head Office", "Support Center", or "Franchise". Selecting or typing an unrecognized custom string will fail backend validation.',
  },
  {
    q: 'How does the Partner selector in the Record Payment modal work?',
    a: 'The Record Payment modal features a searchable autocomplete selector. Instead of memorizing numerical Partner IDs, simply start typing the partner\'s brand name or code (e.g. "SpeedNet" or "P-00105") to view their profile, current outstanding balance, and select them instantly.',
  },
  {
    q: 'What happens when a partner exceeds their Credit Limit?',
    a: 'When total unpaid invoices surpass the designated Credit Limit, the system flags the partner across executive dashboards with red financial risk indicators. While active traffic continues to flow, operators are prompted with warning dialogs before allocating additional bandwidth or provisioning new hardware devices.',
  },
  {
    q: 'How do Support Center branch operating costs affect company profitability?',
    a: 'Operating costs logged under Support Center branches (such as office rent, utilities, and branch maintenance) are automatically mirrored into the partner\'s Financials & P&L ledger. They are deducted from gross revenues to compute the true Net Profit (৳) and Profit Margin (%).',
  },
]

export default function UserGuidePage() {
  const [activeMainTab, setActiveMainTab] = useState('sidebar_menus') // 'sidebar_menus' | 'create_partner' | 'partner_details' | 'faq'
  const [searchQuery, setSearchQuery] = useState('')

  // Filter sidebar modules
  const filteredSidebarModules = useMemo(() => {
    if (!searchQuery.trim()) return SIDEBAR_MODULES
    const q = searchQuery.toLowerCase()
    return SIDEBAR_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.howToUse.toLowerCase().includes(q) ||
        m.example.toLowerCase().includes(q) ||
        m.features.some((f) => f.toLowerCase().includes(q))
    )
  }, [searchQuery])

  // Filter steps based on search
  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return NEW_PARTNER_STEPS
    const q = searchQuery.toLowerCase()
    return NEW_PARTNER_STEPS.map((s) => {
      const matchStep = s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
      const matchingFields = s.fields.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.example.toLowerCase().includes(q)
      )
      if (matchStep || matchingFields.length > 0) {
        return {
          ...s,
          fields: matchStep && matchingFields.length === 0 ? s.fields : matchingFields,
        }
      }
      return null
    }).filter(Boolean)
  }, [searchQuery])

  // Filter tabs based on search
  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return PARTNER_DETAILS_TABS
    const q = searchQuery.toLowerCase()
    return PARTNER_DETAILS_TABS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.howToUse.toLowerCase().includes(q) ||
        t.example.toLowerCase().includes(q) ||
        t.highlights.some((h) => h.toLowerCase().includes(q))
    )
  }, [searchQuery])

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS
    const q = searchQuery.toLowerCase()
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [searchQuery])

  return (
    <div className="pm-page">
      {/* Header Banner */}
      <div className="pm-page-header mb-4 p-4 rounded-3 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%)' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-2.5 py-1 rounded-pill mb-2" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(147, 197, 253, 0.3)', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
              <BookOpen size={14} /> Official Operating Standard & Complete User Manual
            </div>
            <h3 className="fw-bold mb-1 text-white">Partner Management System — Comprehensive User Guide</h3>
            <p className="text-light opacity-75 small mb-0" style={{ maxWidth: '850px' }}>
              Standard operating procedures for all 10 Sidebar Navigation Modules, the 5-Step New Partner Onboarding Wizard, and in-depth reference for all 14 Partner Details Tabs with practical real-world examples.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5" onClick={() => window.print()}>
              <Printer size={15} /> Print / Save PDF
            </button>
            <Link to="/partners/new" className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 shadow-sm">
              <Sparkles size={15} /> Create Partner
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar & Nav Tabs */}
      <div className="pm-card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <Search size={16} className="text-muted position-absolute top-50 start-0 translate-middle-y ms-3" />
              <input
                type="text"
                className="form-control form-control-sm ps-5 py-2"
                placeholder="🔍 Search any module, tab, or field (e.g. Credit Limit, Support Center, Bandwidth)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-sm btn-link text-muted position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-decoration-none" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-7">
            <div className="nav nav-pills nav-fill gap-2">
              <button
                className={`nav-link py-2 fs-7 fw-semibold ${activeMainTab === 'sidebar_menus' ? 'active bg-primary text-white shadow-sm' : 'bg-light text-secondary'}`}
                onClick={() => setActiveMainTab('sidebar_menus')}
              >
                1️⃣ Sidebar Modules ({SIDEBAR_MODULES.length})
              </button>
              <button
                className={`nav-link py-2 fs-7 fw-semibold ${activeMainTab === 'create_partner' ? 'active bg-primary text-white shadow-sm' : 'bg-light text-secondary'}`}
                onClick={() => setActiveMainTab('create_partner')}
              >
                2️⃣ New Partner Form (5 Steps)
              </button>
              <button
                className={`nav-link py-2 fs-7 fw-semibold ${activeMainTab === 'partner_details' ? 'active bg-primary text-white shadow-sm' : 'bg-light text-secondary'}`}
                onClick={() => setActiveMainTab('partner_details')}
              >
                3️⃣ Partner Details (14 Tabs)
              </button>
              <button
                className={`nav-link py-2 fs-7 fw-semibold ${activeMainTab === 'faq' ? 'active bg-primary text-white shadow-sm' : 'bg-light text-secondary'}`}
                onClick={() => setActiveMainTab('faq')}
              >
                4️⃣ FAQs & Best Practices
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: SIDEBAR MODULES GUIDE */}
      {activeMainTab === 'sidebar_menus' && (
        <div className="d-flex flex-column gap-4">
          <div className="alert alert-info py-2.5 px-3 fs-7 mb-0 d-flex align-items-center gap-2 border-0 bg-info-subtle text-info-emphasis rounded-3">
            <Info size={16} className="flex-shrink-0" />
            <span>
              The main navigation sidebar contains <strong>10 core operational modules</strong> organized by functional groups (Core, Finance &amp; Ops, and Administration). Each module is detailed below:
            </span>
          </div>

          <div className="row g-4">
            {filteredSidebarModules.length === 0 ? (
              <div className="col-12 text-center py-5 text-muted">
                <Search size={32} className="mb-2 opacity-50" />
                <div>No sidebar modules matched your search: "{searchQuery}"</div>
              </div>
            ) : (
              filteredSidebarModules.map((mod) => {
                const Icon = mod.icon
                return (
                  <div key={mod.id} className="col-12 col-lg-6">
                    <div className="card h-100 border shadow-sm rounded-3 overflow-hidden">
                      <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2.5">
                          <div className={`p-2 rounded-2 bg-${mod.color}-subtle text-${mod.color} d-flex align-items-center justify-content-center`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="fw-bold text-dark fs-6">{mod.title}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              Route: <code className="text-primary">{mod.route}</code> &bull; Group: <span className="badge bg-light text-secondary border">{mod.group}</span>
                            </div>
                          </div>
                        </div>
                        <Link to={mod.route} className="btn btn-xs btn-outline-primary py-1 px-2.5 d-flex align-items-center gap-1 fs-7">
                          Open <ArrowRight size={12} />
                        </Link>
                      </div>
                      <div className="card-body p-3">
                        <p className="text-muted small mb-3">{mod.description}</p>
                        
                        <div className="mb-3">
                          <div className="fw-semibold text-dark mb-1 fs-7">Key Features:</div>
                          <ul className="list-unstyled mb-0" style={{ fontSize: '0.78rem' }}>
                            {mod.features.map((f, fi) => (
                              <li key={fi} className="mb-1 text-secondary d-flex align-items-start gap-1.5">
                                <span className="text-success fw-bold">✓</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2.5 rounded-2 bg-light border mb-2 fs-7">
                          <strong className="text-dark d-block mb-1">📖 How to Use:</strong>
                          <span className="text-secondary">{mod.howToUse}</span>
                        </div>

                        <div className="p-2.5 rounded-2 bg-primary-subtle border border-primary-subtle fs-7">
                          <strong className="text-primary d-block mb-0.5">💡 Real-World Example:</strong>
                          <span className="text-dark opacity-90">{mod.example}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: CREATE PARTNER FORM GUIDE */}
      {activeMainTab === 'create_partner' && (
        <div className="d-flex flex-column gap-4">
          <div className="alert alert-info py-2.5 px-3 fs-7 mb-0 d-flex align-items-center gap-2 border-0 bg-info-subtle text-info-emphasis rounded-3">
            <Info size={16} className="flex-shrink-0" />
            <span>
              To register a new partner, use the <strong>"Create Partner"</strong> button above or navigate to <strong>Partners &rarr; Add Partner</strong> in the sidebar (URL: <code>/partners/new</code>).
            </span>
          </div>

          {filteredSteps.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Search size={32} className="mb-2 opacity-50" />
              <div>No form fields matched your query: "{searchQuery}"</div>
            </div>
          ) : (
            filteredSteps.map((step) => (
              <div key={step.step} className="pm-card p-4 shadow-sm">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2.5">
                    <span className="badge rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>
                      {step.step}
                    </span>
                    <h5 className="fw-bold mb-0 text-dark fs-6">{step.title}</h5>
                  </div>
                  <span className={`badge px-2.5 py-1 fs-7 ${step.badgeCls}`}>{step.badge}</span>
                </div>
                <p className="text-muted small mb-2">{step.desc}</p>
                <div className="p-2 rounded bg-light border mb-3 fs-7 text-secondary">
                  <strong>Instructions: </strong> {step.howToComplete}
                </div>

                {step.fields.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle border mb-0 fs-7">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '20%' }}>Field Name</th>
                          <th style={{ width: '13%' }}>Input Type</th>
                          <th style={{ width: '12%' }}>Requirement</th>
                          <th style={{ width: '25%' }}>Real-World Example</th>
                          <th style={{ width: '30%' }}>Operational Purpose & System Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {step.fields.map((f, i) => (
                          <tr key={i}>
                            <td className="fw-bold text-dark">{f.name}</td>
                            <td><span className="badge bg-light text-secondary border">{f.type}</span></td>
                            <td>
                              {f.required ? (
                                <span className="badge bg-danger-subtle text-danger">Required *</span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-muted">Optional</span>
                              )}
                            </td>
                            <td><code className="text-primary">{f.example}</code></td>
                            <td className="text-secondary">{f.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 3: PARTNER DETAILS 14 TABS */}
      {activeMainTab === 'partner_details' && (
        <div>
          <div className="alert alert-primary py-2.5 px-3 fs-7 mb-4 d-flex align-items-center gap-2 border-0 bg-primary-subtle text-primary rounded-3">
            <Info size={16} className="flex-shrink-0" />
            <span>
              Clicking any partner from the Partner Directory opens their dedicated master profile (URL: <code>/partners/:id</code>). Below is the comprehensive operational guide for all 14 tabs with step-by-step instructions and real-world examples:
            </span>
          </div>

          <div className="row g-4">
            {filteredTabs.length === 0 ? (
              <div className="col-12 text-center py-5 text-muted">
                <Search size={32} className="mb-2 opacity-50" />
                <div>No tabs matched your search query: "{searchQuery}"</div>
              </div>
            ) : (
              filteredTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <div key={tab.id} className="col-12 col-lg-6">
                    <div className="card h-100 border shadow-sm rounded-3 overflow-hidden">
                      <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2.5">
                          <div className={`p-2 rounded-2 bg-${tab.color}-subtle text-${tab.color} d-flex align-items-center justify-content-center`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="fw-bold text-dark fs-6">{tab.title}</div>
                            <div className="text-muted" style={{ fontSize: '0.68rem' }}>Tab ID: <code>{tab.id}</code></div>
                          </div>
                        </div>
                        <span className={`badge ${tab.tagCls}`} style={{ fontSize: '0.68rem' }}>{tab.tag}</span>
                      </div>
                      <div className="card-body p-3">
                        <p className="text-muted small mb-2">{tab.description}</p>
                        
                        <div className="mb-3">
                          <div className="fw-semibold text-dark mb-1 fs-7">Core Capabilities:</div>
                          <ul className="list-unstyled mb-0" style={{ fontSize: '0.78rem' }}>
                            {tab.highlights.map((h, hi) => (
                              <li key={hi} className="mb-1 text-secondary d-flex align-items-start gap-1.5">
                                <span className="text-success fw-bold">✓</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2.5 rounded-2 bg-light border mb-2 fs-7">
                          <strong className="text-dark d-block mb-1">📖 How to Use This Tab:</strong>
                          <span className="text-secondary">{tab.howToUse}</span>
                        </div>

                        <div className="p-2.5 rounded-2 bg-primary-subtle border border-primary-subtle fs-7">
                          <strong className="text-primary d-block mb-0.5">💡 Real-World Example:</strong>
                          <span className="text-dark opacity-90">{tab.example}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: FAQ & TROUBLESHOOTING */}
      {activeMainTab === 'faq' && (
        <div className="d-flex flex-column gap-3">
          <div className="alert alert-warning py-2.5 px-3 fs-7 mb-2 d-flex align-items-center gap-2 border-0 bg-warning-subtle text-warning-emphasis rounded-3">
            <HelpCircle size={16} className="flex-shrink-0" />
            <span>Frequently encountered operational questions, validation rules, and standard solutions:</span>
          </div>

          {filteredFaqs.map((faq, i) => (
            <div key={i} className="pm-card p-3 shadow-sm">
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white rounded-pill px-2">Q{i + 1}</span>
                {faq.q}
              </h6>
              <p className="text-secondary small mb-0 ps-4">{faq.a}</p>
            </div>
          ))}

          {/* Quick Help Card */}
          <div className="pm-card p-4 bg-light border text-center mt-3 shadow-sm">
            <h6 className="fw-bold text-dark mb-1">Require Technical Assistance or System Clarification?</h6>
            <p className="text-muted small mb-3">Reach out to the Plexus Cloud Platform Engineering and NOC operations team.</p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <span className="badge bg-white text-dark border px-3 py-2 fs-7">
                📧 Support Desk: support@plexuscloud.com
              </span>
              <span className="badge bg-white text-dark border px-3 py-2 fs-7">
                🌐 NOC Hotline: +880 96XX-XXXXXX
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
