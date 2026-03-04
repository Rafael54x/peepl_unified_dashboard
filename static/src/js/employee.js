/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";

class Employee extends Component {
    static template = "peepl_unified_dashboard.Employee";

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        const fullName = session.partner_display_name || session.name || 'User';
        this.userName = fullName.includes(',') ? fullName.split(',').pop().trim() : fullName;
        
        this.state = useState({
            employees: [],
            isHRDashboardUserOnly: false,
            isHRDashboardManager: false,
            isHRDashboardAllAccess: false,
            searchQuery: '',
            filterDepartment: null,
            currentUserDepartment: null,
            allDepartments: []
        });

        this.initializeData();
    }

    async initializeData() {
        await this.checkUserRole();
        await this.loadEmployees();
    }

    async checkUserRole() {
        try {
            const result = await this.orm.call('unified.dashboard.access', 'check_user_access', []);
            this.state.isHRDashboardUserOnly = result.isHRDashboardUserOnly || false;
            this.state.isHRDashboardManager = result.isHRDashboardManager || false;
            this.state.isHRDashboardAllAccess = result.isHRDashboardAllAccess || false;
        } catch (error) {
            console.log('Could not check user role:', error);
        }
    }

    async loadEmployees() {
        let domain = [];

        if (this.state.isHRDashboardUserOnly) {
            const employees = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['id'],
                { limit: 1 }
            );
            if (employees.length > 0) {
                domain = [['id', '=', employees[0].id]];
            } else {
                domain = [['id', '=', -1]];
            }
        } else if (this.state.isHRDashboardManager) {
            const currentEmployee = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['department_id'],
                { limit: 1 }
            );
            if (currentEmployee.length > 0 && currentEmployee[0].department_id) {
                const deptId = currentEmployee[0].department_id[0];
                domain = [['department_id', '=', deptId]];
            } else {
                domain = [['id', '=', -1]];
            }
        }

        const employees = await this.orm.searchRead(
            'hr.employee',
            domain,
            ['id', 'name', 'work_email', 'work_phone', 'mobile_phone', 'department_id', 'job_title', 'image_1920'],
            { order: 'name asc' }
        );

        this.state.employees = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            email: emp.work_email || '-',
            phone: emp.work_phone || emp.mobile_phone || '-',
            department: emp.department_id ? emp.department_id[1] : '-',
            departmentId: emp.department_id ? emp.department_id[0] : null,
            jobTitle: emp.job_title || '-',
            image: emp.image_1920 ? `data:image/jpeg;base64,${emp.image_1920}` : null,
            initials: this.getInitials(emp.name)
        }));

        // Load departments for filter
        if (this.state.isHRDashboardAllAccess) {
            const departments = await this.orm.searchRead(
                'hr.department',
                [],
                ['id', 'name'],
                { order: 'name asc' }
            );
            this.state.allDepartments = departments;
        }
    }

    getInitials(name) {
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getFilteredEmployees() {
        let filtered = this.state.employees;

        // Filter by search query
        if (this.state.searchQuery.trim()) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.name.toLowerCase().includes(query) ||
                emp.email.toLowerCase().includes(query) ||
                emp.jobTitle.toLowerCase().includes(query)
            );
        }

        // Filter by department (only for all access)
        if (this.state.isHRDashboardAllAccess && this.state.filterDepartment) {
            filtered = filtered.filter(emp => emp.departmentId === this.state.filterDepartment);
        }

        return filtered;
    }

    handleSearchChange(value) {
        this.state.searchQuery = value;
    }

    handleDepartmentFilter(deptId) {
        this.state.filterDepartment = this.state.filterDepartment === deptId ? null : deptId;
    }

    openEmployeeForm(employeeId) {
        this.action.doAction({
            type: 'ir.actions.act_window',
            res_model: 'hr.employee',
            res_id: employeeId,
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'current',
            context: { 'form_view_ref': 'peepl_unified_dashboard.view_employee_form_readonly', 'readonly': true }
        });
    }
}

export { Employee };
