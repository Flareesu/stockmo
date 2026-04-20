    /* ─── ROLE / PERMISSION HELPERS ─── */
    const isAdminRole    = (role) => role === 'admin';
    const isEmployeeRole = (role) => role === 'employee';
    const canEdit = (role, perms) => isAdminRole(role) || (isEmployeeRole(role) && perms?.edit === true);
    const canConfig = (role) => isAdminRole(role);
    const canImport = (role, perms) => isAdminRole(role) || (isEmployeeRole(role) && perms?.edit === true);
