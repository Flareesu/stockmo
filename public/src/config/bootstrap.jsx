    const { useState, useMemo, useEffect, useRef, useCallback } = React;

    /* ─── SUPABASE CLIENT ─── */
    const { createClient } = supabase;
    const sb = createClient(
      'https://jqnekpwerbfzrybsxcsv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbmVrcHdlcmJmenJ5YnN4Y3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM4NjQsImV4cCI6MjA5MTk3OTg2NH0.IJro2kA77epVt5uO6nXcrIoDh9BKCkafQrdi2VNpNhg'
    );

    /* ─── MODULE-LEVEL TECH REF (lets global techById stay reactive) ─── */
    const _techsRef = { current: [] };

    /* ─── IMAGES ─── */
    const IMG_SUV   = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8svI6pnN-DpIIJymTl44ZnRMBYnOp6ah9VmML5iQrclgtvYAnFSh67cDpOQakVCNYLM2ihIL8jOj6oXwfndYiR6W4VmJWw87i5wmf6yyb5zBPin5opCSYEN_p17A2fAvM0bQym9-lHB7N71z_Fc1cl1l0D3zzAD4BzAdzYVeir7NwDdAu6hvQ4sQWx58LkhqXv-nhkHsPGwktccmBzCzUL-WA6a2FHdTBHGsDWjpvtqviFs5dixF4tvha_H7G8zA_7r4_pig10AI';
    const IMG_SEDAN = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKCqGH3cgvNygdD7Y-Ic7XoAT-_RmmSMOtLczsN_DLDFYLACiw5a80mizoi_70_YoWVYGSqf8hZ6eazbi09__NjeChY7-pyj6bZ0efyncprb94hvO_oQ3MYS2nDSWLsG63ZUzNAe9Z05mRHZY1Bq-Rq4ZQpADzsqGCXDh4TWGUYJfdVDiir3QBFpJIFkb4nsde-_Kc4tz3MxY0WO7zqALVJ2kK6mXAMD7GfUHNnDaCjDYvTxF95bznLsdtok8OVKp6CXlp2iNSroM';
    const IMG_LARGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoywFCnU04O_BWrSkJozkdjF0Pcjcsr5hS7pjbrhCflKv-Xx8lk3cLt7kImgCkV7tZNcNvWSoPDqQtFNThjjHRTjhi9sWxiB03nVnWM7bSzdF5ZSZYw8Q_m27_lZ5nIZMB2bAmB3Q8NY7tbES3uIpOTNNefotoqP8J6hQUcZkseWS3p5Ec297lJIzvC22-KGMPJ3ddjaGDZmu5C3qrwIXLV6iMJr_R9i3p5gbDfV1Y09_r_7p2Y1GG7mKPwP3unXR12OyyPZXd4Bo';

    // Template data is loaded from Supabase tables:
    // vehicle_models, pdi_item_templates, maint_task_templates, final_check_templates
    // (seeded via migration 08_seed_templates.sql)

    /* ─── TECHNICIANS FALLBACK (replaced at runtime with live DB data) ─── */
    const TECH_FALLBACK = [
      { id:'t1', name:'Marco Reyes', ini:'MR', role:'Senior Technician', color:'#D0112B', online:true  },
      { id:'t2', name:'Ana Santos',  ini:'AS', role:'PDI Specialist',    color:'#3b82f6', online:true  },
      { id:'t3', name:'Ben Lim',     ini:'BL', role:'Technician',        color:'#8b5cf6', online:false },
      { id:'t4', name:'Carlo Diaz',  ini:'CD', role:'Junior Technician', color:'#22c55e', online:true  },
    ];
    // Keep TECHNICIANS alias so existing screens (TeamScreen, AdminDashboard) work during transition
    let TECHNICIANS = TECH_FALLBACK;
    const techById = (id) => {
      const list = _techsRef.current.length ? _techsRef.current : TECH_FALLBACK;
      if (!id) return { id:'', name:'Unassigned', ini:'?', role:'Technician', color:'#8A8FA3', online:false };
      return list.find(t => t.id === id) || { id, name:'Unknown', ini:'?', role:'Technician', color:'#8A8FA3', online:false };
    };

    /* ─── DB → COMPONENT DATA TRANSFORM ─── */
    const getModelType = (_modelName) => 'suv';

    // ── Date utilities ──────────────────────────────────────────────────────────
    const fmtDate = (d) => {
      if (!d) return '—';
      const s = String(d);
      const dt = new Date(s.includes('T') ? s : s + 'T00:00:00');
      return isNaN(dt) ? s : dt.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
    };

    const excelDateToISO = (v) => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') {
        const d = new Date((v - 25569) * 86400 * 1000);
        return isNaN(d) ? null : d.toISOString().split('T')[0];
      }
      const d = new Date(v);
      return isNaN(d) ? null : d.toISOString().split('T')[0];
    };

    // Detect fuel type from variant string AND model name
    const detectFuel = (variant = '', model = '') => {
      const v = (variant + ' ' + model).toUpperCase();
      if (v.includes('PHEV'))  return 'PHEV';
      if (v.includes('HEV'))   return 'HEV';
      if (v.includes(' EV') || v.startsWith('EV') || v.includes('BEV') || v.includes('ELECTRIC')) return 'Electric';
      if (v.includes('DIESEL')) return 'Diesel';
      if (/\bAION\b/.test(v))  return 'Electric';
      return 'Gasoline';
    };

    // Transforms a Supabase vehicle row (with nested join data) into the shape
    // the existing screen components expect.
    const transformVehicle = (row) => {
      const type = getModelType(row.model || '');
      // pdi_checks / final_checks already store section/name/priority inline
      const pdiChecks = (row.pdi_checks || []).map(c => ({
        id:        c.id       || '',   // actual row PK — reliable for updates
        itemId:    c.item_id  || '',   // template FK — kept for reference
        section:   c.section  || 'General',
        name:      c.name     || '',
        priority:  c.priority || 'med',
        state:     c.state    || 'pending',
        note:      c.note     || '',
        image_url: c.image_url || null,
      }));
      // stock_maintenance uses task_id as the FK and stores freq_days inline
      const stockMaint = (row.stock_maintenance || []).map(m => ({
        id:       m.task_id  || '',
        name:     m.name     || '',
        freq:     m.freq_days || 30,
        priority: m.priority  || 'med',
        lastDone: m.last_done || todayStr(),
        nextDue:  m.next_due  || todayStr(),
      }));
      const finalChecks = (row.final_checks || []).map(f => ({
        id:        f.id       || '',   // actual row PK — reliable for updates
        itemId:    f.item_id  || '',   // template FK — kept for reference
        section:   f.section  || 'General',
        name:      f.name     || '',
        priority:  f.priority || 'med',
        state:     f.state    || 'pending',
        note:      f.note     || '',
        image_url: f.image_url || null,
      }));
      const historyRaw = (row.vehicle_history || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const history = historyRaw.map(h => `${(h.created_at || '').slice(0, 10)}: ${h.action || ''}`);
      // vehicle_assignments stores profile_id directly — simple flat lookup
      const assignedTech = (row.vehicle_assignments || [])[0]?.profile_id || null;
      const num = row.vehicle_number;
      const label = num ? `${row.model || ''} #${num}` : (row.model || '');
      return {
        id:          row.id,
        label,
        vin:         row.vin          || '',
        make:        row.make         || 'GAC',
        model:       row.model        || '',
        type,
        year:        row.year         || 2025,
        color:       row.color        || '',
        engine:      row.engine       || '',
        fuel:          row.fuel || detectFuel(row.variant || '', row.model || ''),
        variant:       row.variant        || '',
        exteriorColor: row.exterior_color || row.color || '',
        interiorColor: row.interior_color || '',
        csNumber:      row.cs_number      || '',
        engineNumber:  row.engine_number  || '',
        invoiceNumber: row.invoice_number || '',
        blNumber:      row.bl_number      || '',
        contractNo:    row.contract_no    || '',
        salesStatus:   row.sales_status   || '',
        dealerGroup:   row.dealer_group   || '',
        region:        row.region         || '',
        lot:         row.lot          || '',
        stage:       row.stage        || '',
        img:         row.cover_photo_url || imgForType(type),
        arrivalDate: row.arrival_date || null,
        pdiDate:     row.pdi_date,
        stockDate:   row.stock_date,
        finalDate:   row.final_date,
        releaseDate: row.release_date,
        dealer:      row.dealer,
        notes:       row.notes        || '',
        assignedTech,
        pdiChecks,
        stockMaint,
        finalChecks,
        history,
        historyRaw,
        extraFields: row.extra_fields || {},
      };
    };

    /* ─── TRANSLATIONS ─── */
    const translations = {
      en: {
        // App
        appTagline: 'Automotive Intelligence',
        premium: 'Premium',
        // Role select
        welcomeTo: 'Welcome to',
        welcomeSubtitle: 'Streamline your automotive operations. Select your role to begin your session.',
        technician: 'Technician',
        techDesc: 'Perform vehicle inspections, log maintenance, and update repair status.',
        administrator: 'Administrator',
        adminDesc: 'Manage fleet overview, assign tasks, and access detailed yard analytics.',
        selectRole: 'Select Role',
        getStarted: 'Get Started',
        secureConnection: 'Secure Enterprise Connection',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        // Nav
        navDash: 'Dash',
        navFleet: 'Fleet',
        navTeam: 'Team',
        navHolds: 'Holds',
        navReports: 'Reports',
        navAdmin: 'Admin',
        navConfig: 'Config',
        navHome: 'Home',
        navInspect: 'Inspect',
        navStock: 'Stock',
        navDelivery: 'Delivery',
        navSettings: 'Settings',
        navAccount: 'Account',
        // Greetings
        goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon',
        goodEvening: 'Good Evening',
        // Dashboard stats
        assigned: 'Assigned',
        activePdi: 'Active PDI',
        overdue: 'Overdue',
        // Sections
        priorityQueue: 'Priority Queue',
        recentActivity: 'Recent Activity',
        readyForStockyard: 'Ready for Stockyard',
        finalInspection: 'Final Inspection',
        // Tech inspect
        pdiHoldVehicles: 'PDI & Hold vehicles assigned to you',
        noInspections: 'No inspections pending',
        issues: 'issues',
        // Tech stockyard
        stockyard: 'Stockyard',
        vehiclesInStock: '{count} vehicles in stock',
        filterAll: 'All',
        filterOverdue: 'Overdue',
        filterDueSoon: 'Due Soon',
        filterOk: 'OK',
        sortOverdueFirst: 'Overdue First',
        sortDaysInStock: 'Days in Stock',
        sortAZ: 'A-Z',
        noVehiclesMatch: 'No vehicles match filter',
        overdueLabel: '{count} overdue',
        dInStock: '{days}d in stock',
        // Tech delivery
        delivery: 'Delivery',
        readyFinalVehicles: 'Ready & final inspection vehicles',
        moveToStockyard: 'Move to Stockyard',
        noVehiclesDelivery: 'No vehicles ready for delivery',
        // Vehicle detail
        make: 'Make',
        model: 'Model',
        type: 'Type',
        year: 'Year',
        color: 'Color',
        engine: 'Engine',
        fuel: 'Fuel',
        vin: 'VIN',
        lot: 'Lot',
        assignedTo: 'Assigned',
        tabVehicle: 'VEHICLE',
        tabPdi: 'PDI',
        tabMaint: 'MAINT',
        tabFinal: 'FINAL',
        tabNotes: 'NOTES',
        tabReports: 'REPORTS',
        tabHistory: 'HISTORY',
        startPdi: 'Start PDI Inspection',
        pdiProgress: 'PDI Progress',
        putOnHold: 'Put on Hold — {count} issues',
        pdiPassed: 'PDI Passed — Move to Stockyard',
        resumePdi: 'Resume PDI After Repair',
        passToFinal: 'Pass to Final Inspection',
        finalProgress: 'Final Progress',
        dealerPlaceholder: 'Dealer name...',
        releaseToDealer: 'Release to Dealer',
        describeIssue: 'Describe the issue...',
        addNotes: 'Add notes about this vehicle...',
        noMaintenance: 'No maintenance tasks',
        maintHint: 'Tasks appear when the vehicle enters stockyard',
        every: 'Every {freq}d',
        overdueD: 'OVERDUE {days}d',
        dueIn: 'DUE IN {days}d',
        next: 'Next:',
        last: 'Last:',
        done: 'Done',
        noHistory: 'No history yet',
        // Status badges
        statusPort: 'port',
        statusPdi: 'pdi',
        statusHold: 'hold',
        statusStock: 'stock',
        statusReady: 'ready',
        statusReleased: 'released',
        statusOnline: 'online',
        statusOffline: 'offline',
        // Admin dashboard
        administratorPanel: 'Administrator Panel',
        fleetOperations: 'Fleet Operations',
        regionalCenter: 'Regional Distribution Center #04',
        exportReport: 'Export Report',
        addVehicle: 'Add Vehicle',
        totalFleet: 'Total Fleet',
        inbound: 'Port',
        processing: 'Stockyard',
        dispatched: 'Dispatched',
        pipelineProgress: 'Pipeline Progress',
        needsAttention: 'Needs Attention',
        onHold: 'on HOLD',
        technicianStatus: 'Technician Status',
        online: 'Online',
        // Fleet list
        fleet: 'Fleet',
        vehicles: '{count} vehicles',
        searchPlaceholder: 'Search by model, ID, or VIN...',
        noVehiclesFound: 'No vehicles found',
        // Team
        teamManagement: 'Team Management',
        team: 'Team',
        techRoster: 'Technician roster · {count} members',
        total: 'Total',
        vehiclesAssigned: '{count} vehicles assigned',
        // Reports
        reportsAnalytics: 'Reports & Analytics',
        reports: 'Reports',
        fleetPerformance: 'Fleet performance analytics',
        onHoldLabel: 'On Hold',
        maintOverdue: 'Maint Overdue',
        fleetPipeline: 'Fleet Pipeline',
        // Settings
        adminSettings: 'Admin Settings',
        techSettings: 'Tech Settings',
        notifications: 'Notifications',
        emailAlerts: 'Email Alerts',
        pushNotifications: 'Push Notifications',
        language: 'Language',
        system: 'System',
        version: 'Version',
        build: 'Build',
        environment: 'Environment',
        production: 'Production',
        signOut: 'Sign Out',
        // Notifications panel
        notificationsTitle: 'Notifications',
        unread: '{count} unread',
        allCaughtUp: 'All caught up',
        markAllRead: 'Mark all read',
        // Add vehicle modal
        addVehicleTitle: 'Add Vehicle',
        modelLabel: 'Model',
        colorLabel: 'Color',
        engineLabel: 'Engine',
        fuelLabel: 'Fuel',
        vinLabel: 'VIN (min 10 chars)',
        lotLabel: 'Lot Position',
        addToFleet: 'Add to Fleet',
        // Misc
        issuesFound: '{count} issues found',
        tasksOverdue: '{count} tasks overdue',
        complete: '{pct}% complete',
      },
      tl: {
        // App
        appTagline: 'Automotive Intelligence',
        premium: 'Premium',
        // Role select
        welcomeTo: 'Maligayang pagdating sa',
        welcomeSubtitle: 'I-streamline ang iyong mga operasyon sa automotive. Piliin ang iyong tungkulin upang simulan.',
        technician: 'Teknisyan',
        techDesc: 'Magsagawa ng inspeksyon ng sasakyan, mag-log ng maintenance, at i-update ang status ng pagkukumpuni.',
        administrator: 'Administrador',
        adminDesc: 'Pamahalaan ang pangkalahatang fleet, magtalaga ng gawain, at i-access ang analytics.',
        selectRole: 'Pumili ng Tungkulin',
        getStarted: 'Magsimula',
        secureConnection: 'Ligtas na Koneksyon',
        privacyPolicy: 'Patakaran sa Privacy',
        termsOfService: 'Mga Tuntunin ng Serbisyo',
        // Nav
        navDash: 'Home',
        navFleet: 'Fleet',
        navTeam: 'Koponan',
        navHolds: 'Hawak',
        navReports: 'Ulat',
        navAdmin: 'Admin',
        navConfig: 'Config',
        navHome: 'Home',
        navInspect: 'Inspeksyon',
        navStock: 'Bodega',
        navDelivery: 'Paghahatid',
        navSettings: 'Settings',
        navAccount: 'Account',
        // Greetings
        goodMorning: 'Magandang Umaga',
        goodAfternoon: 'Magandang Hapon',
        goodEvening: 'Magandang Gabi',
        // Dashboard stats
        assigned: 'Nakatalagang',
        activePdi: 'Aktibong PDI',
        overdue: 'Lampas na',
        // Sections
        priorityQueue: 'Prayoridad',
        recentActivity: 'Kamakailang Aktibidad',
        readyForStockyard: 'Handa para sa Bodega',
        finalInspection: 'Huling Inspeksyon',
        // Tech inspect
        pdiHoldVehicles: 'Mga sasakyan sa PDI at Hold na nakatalagang sa iyo',
        noInspections: 'Walang nakabinbing inspeksyon',
        issues: 'isyu',
        // Tech stockyard
        stockyard: 'Bodega',
        vehiclesInStock: '{count} sasakyan sa bodega',
        filterAll: 'Lahat',
        filterOverdue: 'Lampas na',
        filterDueSoon: 'Malapit na',
        filterOk: 'OK',
        sortOverdueFirst: 'Lampas na Muna',
        sortDaysInStock: 'Araw sa Bodega',
        sortAZ: 'A-Z',
        noVehiclesMatch: 'Walang tugmang sasakyan',
        overdueLabel: '{count} lampas na',
        dInStock: '{days}d sa bodega',
        // Tech delivery
        delivery: 'Paghahatid',
        readyFinalVehicles: 'Mga sasakyan para sa huling inspeksyon',
        moveToStockyard: 'Ilipat sa Bodega',
        noVehiclesDelivery: 'Walang sasakyang handa para sa paghahatid',
        // Vehicle detail
        make: 'Gawa',
        model: 'Modelo',
        type: 'Uri',
        year: 'Taon',
        color: 'Kulay',
        engine: 'Makina',
        fuel: 'Gasolina',
        vin: 'VIN',
        lot: 'Lot',
        assignedTo: 'Nakatalagang',
        tabVehicle: 'SASAKYAN',
        tabPdi: 'PDI',
        tabMaint: 'MAINT',
        tabFinal: 'HULING',
        tabNotes: 'NOTES',
        tabReports: 'REPORTS',
        tabHistory: 'KASAYSAYAN',
        startPdi: 'Simulan ang PDI',
        pdiProgress: 'Progreso ng PDI',
        putOnHold: 'I-hold — {count} isyu',
        pdiPassed: 'Pumasa ang PDI — Ilipat sa Bodega',
        resumePdi: 'Ipagpatuloy ang PDI',
        passToFinal: 'Ipasa sa Huling Inspeksyon',
        finalProgress: 'Progreso ng Huling Inspeksyon',
        dealerPlaceholder: 'Pangalan ng dealer...',
        releaseToDealer: 'I-release sa Dealer',
        describeIssue: 'Ilarawan ang isyu...',
        addNotes: 'Magdagdag ng mga tala...',
        noMaintenance: 'Walang gawain sa maintenance',
        maintHint: 'Lalabas ang mga gawain kapag pumasok sa bodega',
        every: 'Bawat {freq}d',
        overdueD: 'LAMPAS {days}d',
        dueIn: 'SA LOOB NG {days}d',
        next: 'Susunod:',
        last: 'Huli:',
        done: 'Tapos',
        noHistory: 'Wala pang kasaysayan',
        // Status badges
        statusPort: 'port',
        statusPdi: 'pdi',
        statusHold: 'hold',
        statusStock: 'bodega',
        statusReady: 'handa',
        statusReleased: 'inilabas',
        statusOnline: 'online',
        statusOffline: 'offline',
        // Admin dashboard
        administratorPanel: 'Panel ng Administrador',
        fleetOperations: 'Operasyon ng Fleet',
        regionalCenter: 'Regional Distribution Center #04',
        exportReport: 'I-export ang Ulat',
        addVehicle: 'Magdagdag ng Sasakyan',
        totalFleet: 'Kabuuang Fleet',
        inbound: 'Port',
        processing: 'Stockyard',
        dispatched: 'Naipadala',
        pipelineProgress: 'Progreso ng Pipeline',
        needsAttention: 'Nangangailangan ng Pansin',
        onHold: 'naka-HOLD',
        technicianStatus: 'Status ng Teknisyan',
        online: 'Online',
        // Fleet list
        fleet: 'Fleet',
        vehicles: '{count} sasakyan',
        searchPlaceholder: 'Maghanap ayon sa modelo, ID, o VIN...',
        noVehiclesFound: 'Walang nakitang sasakyan',
        // Team
        teamManagement: 'Pamamahala ng Koponan',
        team: 'Koponan',
        techRoster: 'Listahan ng teknisyan · {count} miyembro',
        total: 'Kabuuan',
        vehiclesAssigned: '{count} sasakyan ang nakatalagang',
        // Reports
        reportsAnalytics: 'Ulat at Analytics',
        reports: 'Ulat',
        fleetPerformance: 'Analytics ng pagganap ng fleet',
        onHoldLabel: 'Naka-Hold',
        maintOverdue: 'Maint Lampas',
        fleetPipeline: 'Pipeline ng Fleet',
        // Settings
        adminSettings: 'Settings ng Admin',
        techSettings: 'Settings ng Teknisyan',
        notifications: 'Mga Abiso',
        emailAlerts: 'Email Alerts',
        pushNotifications: 'Push Notifications',
        language: 'Wika',
        system: 'Sistema',
        version: 'Bersyon',
        build: 'Build',
        environment: 'Kapaligiran',
        production: 'Production',
        signOut: 'Mag-sign Out',
        // Notifications panel
        notificationsTitle: 'Mga Abiso',
        unread: '{count} hindi pa nabasa',
        allCaughtUp: 'Wala nang bago',
        markAllRead: 'Markahan lahat na nabasa',
        // Add vehicle modal
        addVehicleTitle: 'Magdagdag ng Sasakyan',
        modelLabel: 'Modelo',
        colorLabel: 'Kulay',
        engineLabel: 'Makina',
        fuelLabel: 'Gasolina',
        vinLabel: 'VIN (min 10 char)',
        lotLabel: 'Posisyon sa Lot',
        addToFleet: 'Idagdag sa Fleet',
        // Misc
        issuesFound: '{count} isyu ang natagpuan',
        tasksOverdue: '{count} gawain ang lampas na',
        complete: '{pct}% kumpleto',
      },
      zh: {
        // App
        appTagline: '汽车智能管理',
        premium: '高级版',
        // Role select
        welcomeTo: '欢迎使用',
        welcomeSubtitle: '简化您的汽车运营流程。请选择您的角色以开始会话。',
        technician: '技术员',
        techDesc: '执行车辆检查、记录维护保养，并更新维修状态。',
        administrator: '管理员',
        adminDesc: '管理车队概况、分配任务，并查看详细的场站分析数据。',
        selectRole: '选择角色',
        getStarted: '开始使用',
        secureConnection: '安全企业连接',
        privacyPolicy: '隐私政策',
        termsOfService: '服务条款',
        // Nav
        navDash: '首页',
        navFleet: '车队',
        navTeam: '团队',
        navHolds: '维修',
        navReports: '报表',
        navAdmin: '管理',
        navConfig: '配置',
        navHome: '首页',
        navInspect: '检查',
        navStock: '库存',
        navDelivery: '交付',
        navSettings: '设置',
        navAccount: '账户',
        // Greetings
        goodMorning: '早上好',
        goodAfternoon: '下午好',
        goodEvening: '晚上好',
        // Dashboard stats
        assigned: '已分配',
        activePdi: '进行中PDI',
        overdue: '逾期',
        // Sections
        priorityQueue: '优先队列',
        recentActivity: '最近活动',
        readyForStockyard: '准备入库',
        finalInspection: '最终检查',
        // Tech inspect
        pdiHoldVehicles: '分配给您的PDI和暂停车辆',
        noInspections: '暂无待检项目',
        issues: '个问题',
        // Tech stockyard
        stockyard: '库存场',
        vehiclesInStock: '{count} 辆车在库',
        filterAll: '全部',
        filterOverdue: '逾期',
        filterDueSoon: '即将到期',
        filterOk: '正常',
        sortOverdueFirst: '逾期优先',
        sortDaysInStock: '库存天数',
        sortAZ: 'A-Z',
        noVehiclesMatch: '没有匹配的车辆',
        overdueLabel: '{count} 项逾期',
        dInStock: '在库 {days} 天',
        // Tech delivery
        delivery: '交付',
        readyFinalVehicles: '待交付及最终检查车辆',
        moveToStockyard: '移至库存场',
        noVehiclesDelivery: '暂无待交付车辆',
        // Vehicle detail
        make: '品牌',
        model: '型号',
        type: '类型',
        year: '年份',
        color: '颜色',
        engine: '发动机',
        fuel: '燃料',
        vin: 'VIN码',
        lot: '车位',
        assignedTo: '负责人',
        tabVehicle: '车辆',
        tabPdi: 'PDI',
        tabMaint: '维护',
        tabFinal: '终检',
        tabNotes: '备注',
        tabReports: '报告',
        tabHistory: '历史',
        startPdi: '开始PDI检查',
        pdiProgress: 'PDI进度',
        putOnHold: '暂停 — {count} 个问题',
        pdiPassed: 'PDI通过 — 移至库存场',
        resumePdi: '维修后继续PDI',
        passToFinal: '移交最终检查',
        finalProgress: '终检进度',
        dealerPlaceholder: '经销商名称...',
        releaseToDealer: '发放给经销商',
        describeIssue: '描述问题...',
        addNotes: '添加关于此车辆的备注...',
        noMaintenance: '暂无维护任务',
        maintHint: '车辆进入库存场后将显示任务',
        every: '每 {freq} 天',
        overdueD: '逾期 {days} 天',
        dueIn: '{days} 天后到期',
        next: '下次:',
        last: '上次:',
        done: '完成',
        noHistory: '暂无记录',
        // Status badges
        statusPort: '到港',
        statusPdi: 'PDI',
        statusHold: '暂停',
        statusStock: '库存',
        statusReady: '就绪',
        statusReleased: '已发放',
        statusOnline: '在线',
        statusOffline: '离线',
        // Admin dashboard
        administratorPanel: '管理员面板',
        fleetOperations: '车队运营',
        regionalCenter: '区域配送中心 #04',
        exportReport: '导出报表',
        addVehicle: '添加车辆',
        totalFleet: '车队总数',
        inbound: 'Port',
        processing: 'Stockyard',
        dispatched: '已调度',
        pipelineProgress: '流程进度',
        needsAttention: '需要关注',
        onHold: '暂停中',
        technicianStatus: '技术员状态',
        online: '在线',
        // Fleet list
        fleet: '车队',
        vehicles: '{count} 辆车',
        searchPlaceholder: '按型号、ID或VIN搜索...',
        noVehiclesFound: '未找到车辆',
        // Team
        teamManagement: '团队管理',
        team: '团队',
        techRoster: '技术员名单 · {count} 名成员',
        total: '总计',
        vehiclesAssigned: '已分配 {count} 辆车',
        // Reports
        reportsAnalytics: '报表与分析',
        reports: '报表',
        fleetPerformance: '车队绩效分析',
        onHoldLabel: '暂停中',
        maintOverdue: '维护逾期',
        fleetPipeline: '车队流程',
        // Settings
        adminSettings: '管理设置',
        techSettings: '技术员设置',
        notifications: '通知',
        emailAlerts: '邮件提醒',
        pushNotifications: '推送通知',
        language: '语言',
        system: '系统',
        version: '版本',
        build: '构建号',
        environment: '环境',
        production: '生产环境',
        signOut: '退出登录',
        // Notifications panel
        notificationsTitle: '通知',
        unread: '{count} 条未读',
        allCaughtUp: '已全部查看',
        markAllRead: '全部标为已读',
        // Add vehicle modal
        addVehicleTitle: '添加车辆',
        modelLabel: '型号',
        colorLabel: '颜色',
        engineLabel: '发动机',
        fuelLabel: '燃料',
        vinLabel: 'VIN码（至少10位）',
        lotLabel: '车位位置',
        addToFleet: '添加到车队',
        // Misc
        issuesFound: '发现 {count} 个问题',
        tasksOverdue: '{count} 项任务逾期',
        complete: '已完成 {pct}%',
      },
    };

    /* ─── HELPERS ─── */
    const todayStr = () => new Date().toISOString().slice(0, 10);
    const daysAgo = (d) => { if (!d) return 0; return Math.floor((new Date() - new Date(d)) / 86400000); };
    const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
    const imgForType = (t) => t === 'sedan' ? IMG_SEDAN : t === 'mpv' ? IMG_LARGE : IMG_SUV;

    // These are legacy stubs — actual check data comes from Supabase (pdi_item_templates, etc.)
    const makePdi = () => [];
    const makeFinal = () => [];
    const makeMaint = (_start) => [];

    const pdiProgress = (car) => {
      const done = car.pdiChecks.filter(c => c.state === 'done' || c.state === 'na').length;
      return { done, total: car.pdiChecks.length, pct: car.pdiChecks.length ? Math.round((done / car.pdiChecks.length) * 100) : 0 };
    };
    const finalProgress = (car) => {
      const done = car.finalChecks.filter(c => c.state === 'done' || c.state === 'na').length;
      return { done, total: car.finalChecks.length, pct: car.finalChecks.length ? Math.round((done / car.finalChecks.length) * 100) : 0 };
    };
    const countIssues = (car) => [
      ...(car.pdiChecks  || []),
      ...(car.finalChecks || []),
    ].filter(c => c.state === 'issue').length;
    const hasMaintDue = (car) => car.stockMaint.some(m => daysAgo(m.nextDue) >= 0);
    const countMaintDue = (car) => car.stockMaint.filter(m => daysAgo(m.nextDue) >= 0).length;

    /* ─── SEED DATA REMOVED — vehicles & notifications loaded from Supabase ─── */
