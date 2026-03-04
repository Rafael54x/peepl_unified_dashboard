/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";

class MyDashboard extends Component {
    static template = "peepl_unified_dashboard.MyDashboard";

    setup() {
        this.orm = useService("orm");
        const fullName = session.partner_display_name || session.name || 'User';
        this.userName = fullName.includes(',') ? fullName.split(',').pop().trim() : fullName;
        console.log('Setup - User Name for query:', this.userName);
        this.state = useState({
            sidebarOpen: true,
            activePage: 'dashboard',
            selectedKpi: null,
            birthdays: [],
            anniversaries: [],
            tableData: [],
            kpiCounts: {
                leaves: 0,
                attendance: 0,
                expenses: 0,
                contracts: 0
            },
            isHRDashboardUserOnly: false,
            isHRDashboardManager: false,
            isHRDashboardAllAccess: false,
            calendarDates: [],
            selectedMonth: new Date().getMonth(),
            selectedYear: new Date().getFullYear(),
            selectedDate: null
        });

        this.checkUserRole();
        this.loadBirthdays();
        this.loadAnniversaries();

        this.kpiData = [
            { id: 1, title: 'Leaves', value: () => this.state.kpiCounts.leaves, icon: 'fa-sign-out', color: 'peepl-text-amber-500', bgColor: 'peepl-bg-amber-50' },
            { id: 2, title: 'Attendance', value: () => this.state.kpiCounts.attendance, icon: 'fa-calendar-check-o', color: 'peepl-text-emerald-500', bgColor: 'peepl-bg-emerald-50' },
            { id: 3, title: 'Expenses', value: () => this.state.kpiCounts.expenses, icon: 'fa-money', color: 'peepl-text-blue-500', bgColor: 'peepl-bg-blue-50' },
            { id: 4, title: 'Contracts', value: () => this.state.kpiCounts.contracts, icon: 'fa-file-text-o', color: 'peepl-text-violet-500', bgColor: 'peepl-bg-violet-50' },
        ];

        this.birthdays = [
            { id: 1, name: 'Kardoyo', date: '26 Oktober 1983', daysLeft: 3 },
            { id: 2, name: 'Sumiyati', date: '28 Oktober 1992', daysLeft: 5 },
            { id: 3, name: 'Enggun Gunardi A.', date: '30 Oktober 1971', daysLeft: 7 },
        ];

        this.anniversaries = [
            { id: 1, name: 'Ita Septiasari', date: '26 Oktober 2015', years: 10, isHighlighted: true },
        ];
    }

    async checkUserRole() {
        const result = await this.orm.call('unified.dashboard.access', 'check_user_access', []);
        this.state.isHRDashboardUserOnly = result.isHRDashboardUserOnly;
        this.state.isHRDashboardManager = result.isHRDashboardManager;
        this.state.isHRDashboardAllAccess = result.isHRDashboardAllAccess;
        await this.loadKpiCounts();
    }

    toggleSidebar() {
        this.state.sidebarOpen = !this.state.sidebarOpen;
    }

    setView(view) {
        this.state.activePage = view;
    }

    handleKpiClick(kpi) {
        this.state.selectedKpi = kpi;
        if (kpi.id === 1) {
            if (this.state.isHRDashboardUserOnly) {
                this.state.activePage = 'table';
                this.loadLeaveData();
            } else {
                this.state.activePage = 'calendar';
                this.loadCalendarDates();
            }
        } else if (kpi.id === 2) {
            if (this.state.isHRDashboardUserOnly) {
                this.state.activePage = 'table';
                this.loadAttendanceData();
            } else {
                this.state.activePage = 'calendar';
                this.loadCalendarDates();
            }
        } else {
            this.state.activePage = 'table';
            if (kpi.id === 3) {
                this.state.tableData = [];
            } else if (kpi.id === 4) {
                this.loadContractData();
            }
        }
    }

    backToDashboard() {
        this.state.activePage = 'dashboard';
        this.state.selectedDate = null;
    }

    backToCalendar() {
        this.state.activePage = 'calendar';
        this.state.selectedDate = null;
        this.state.tableData = [];
    }

    changeMonth(direction) {
        if (direction === 'prev') {
            if (this.state.selectedMonth === 0) {
                this.state.selectedMonth = 11;
                this.state.selectedYear--;
            } else {
                this.state.selectedMonth--;
            }
        } else {
            if (this.state.selectedMonth === 11) {
                this.state.selectedMonth = 0;
                this.state.selectedYear++;
            } else {
                this.state.selectedMonth++;
            }
        }
        this.loadCalendarDates();
    }

    async loadCalendarDates() {
        const kpiId = this.state.selectedKpi.id;
        let domain = kpiId === 1 ? [['attendance_type', 'in', ['unpaid', 'sick']]] : [['attendance_type', 'in', ['present', 'late']]];
        
        const startDate = new Date(this.state.selectedYear, this.state.selectedMonth, 1);
        const endDate = new Date(this.state.selectedYear, this.state.selectedMonth + 1, 0);
        
        domain.push(['check_in', '>=', startDate.toISOString().split('T')[0]]);
        domain.push(['check_in', '<=', endDate.toISOString().split('T')[0] + ' 23:59:59']);
        
        if (this.state.isHRDashboardManager) {
            const currentEmployee = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['department_id'],
                { limit: 1 }
            );
            if (currentEmployee.length > 0 && currentEmployee[0].department_id) {
                const deptEmployees = await this.orm.searchRead(
                    'hr.employee',
                    [['department_id', '=', currentEmployee[0].department_id[0]]],
                    ['id']
                );
                const empIds = deptEmployees.map(e => e.id);
                domain.push(['employee_id', 'in', empIds]);
            } else {
                domain.push(['employee_id', '=', -1]);
            }
        }
        
        const attendances = await this.orm.searchRead(
            'hr.attendance',
            domain,
            ['check_in'],
            { order: 'check_in asc' }
        );

        const dateCounts = {};
        attendances.forEach(att => {
            const date = new Date(att.check_in).toISOString().split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });

        const daysInMonth = endDate.getDate();
        const firstDayOfMonth = new Date(this.state.selectedYear, this.state.selectedMonth, 1).getDay();
        const calendarDates = [];
        
        // Add empty days at the beginning
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDates.push({
                empty: true,
                date: null,
                day: null,
                count: 0
            });
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.state.selectedYear}-${String(this.state.selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            calendarDates.push({
                date: dateStr,
                day: day,
                count: dateCounts[dateStr] || 0
            });
        }
        
        this.state.calendarDates = calendarDates;
    }

    async handleDateClick(dateStr) {
        this.state.selectedDate = dateStr;
        this.state.activePage = 'table';
        await this.loadAttendanceByDate(dateStr);
    }

    async loadAttendanceByDate(dateStr) {
        const kpiId = this.state.selectedKpi.id;
        let domain = [
            kpiId === 1 ? ['attendance_type', 'in', ['unpaid', 'sick']] : ['attendance_type', 'in', ['present', 'late']],
            ['check_in', '>=', dateStr + ' 00:00:00'],
            ['check_in', '<=', dateStr + ' 23:59:59']
        ];
        
        if (this.state.isHRDashboardManager) {
            const currentEmployee = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['department_id'],
                { limit: 1 }
            );
            if (currentEmployee.length > 0 && currentEmployee[0].department_id) {
                const deptEmployees = await this.orm.searchRead(
                    'hr.employee',
                    [['department_id', '=', currentEmployee[0].department_id[0]]],
                    ['id']
                );
                const empIds = deptEmployees.map(e => e.id);
                domain.push(['employee_id', 'in', empIds]);
            } else {
                domain.push(['employee_id', '=', -1]);
            }
        }
        
        const attendances = await this.orm.searchRead(
            'hr.attendance',
            domain,
            ['employee_id', 'check_in', 'attendance_type'],
            { order: 'check_in asc' }
        );

        const employeeIds = attendances.map(att => att.employee_id[0]);
        const employees = await this.orm.searchRead(
            'hr.employee',
            [['id', 'in', employeeIds]],
            ['id', 'department_id']
        );

        const empDeptMap = {};
        employees.forEach(emp => {
            empDeptMap[emp.id] = emp.department_id ? emp.department_id[1] : '-';
        });

        this.state.tableData = attendances.map((att, index) => ({
            id: index + 1,
            employeeName: att.employee_id[1],
            department: empDeptMap[att.employee_id[0]],
            date: new Date(att.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: kpiId === 1 ? 'sick' : (att.attendance_type === 'present' ? 'approved' : 'pending'),
            statusText: kpiId === 1 ? (att.attendance_type === 'sick' ? 'Sick Leave' : 'Unpaid Leave') : (att.attendance_type === 'present' ? 'Present' : 'Late')
        }));
    }

    getMonthName() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[this.state.selectedMonth];
    }

    getInitials(name) {
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    async loadBirthdays() {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        
        const employees = await this.orm.searchRead(
            'hr.employee',
            [['birthday', '!=', false]],
            ['name', 'birthday']
        );

        const birthdays = employees
            .filter(emp => {
                const birthday = new Date(emp.birthday);
                return birthday.getMonth() + 1 === currentMonth;
            })
            .map(emp => {
                const birthday = new Date(emp.birthday);
                const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
                const daysLeft = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
                
                return {
                    id: emp.id,
                    name: emp.name,
                    date: birthday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                    daysLeft: daysLeft,
                    daysText: daysLeft > 0 ? `${daysLeft} Days Left` : daysLeft === 0 ? 'Today' : `${Math.abs(daysLeft)} Days Ago`
                };
            })
            .sort((a, b) => {
                if (a.daysLeft === 0) return -1;
                if (b.daysLeft === 0) return 1;
                if (a.daysLeft < 0 && b.daysLeft >= 0) return 1;
                if (b.daysLeft < 0 && a.daysLeft >= 0) return -1;
                return a.daysLeft - b.daysLeft;
            });

        this.state.birthdays = birthdays;
    }

    async loadAnniversaries() {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        
        const employees = await this.orm.searchRead(
            'hr.employee',
            [['contract_date_start', '!=', false]],
            ['name', 'contract_date_start']
        );

        const anniversaries = employees
            .filter(emp => {
                const contractDate = new Date(emp.contract_date_start);
                return contractDate.getMonth() + 1 === currentMonth;
            })
            .map(emp => {
                const contractDate = new Date(emp.contract_date_start);
                const years = today.getFullYear() - contractDate.getFullYear();
                
                return {
                    id: emp.id,
                    name: emp.name,
                    date: contractDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                    years: years,
                    isHighlighted: years >= 5
                };
            })
            .filter(emp => emp.years > 0)
            .sort((a, b) => b.years - a.years);

        this.state.anniversaries = anniversaries;
    }

    async loadLeaveData() {
        let domain = [['attendance_type', 'in', ['unpaid', 'sick']]];
        
        if (this.state.isHRDashboardUserOnly) {
            const employees = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['id'],
                { limit: 1 }
            );
            if (employees.length > 0) {
                domain.push(['employee_id', '=', employees[0].id]);
            } else {
                domain.push(['employee_id', '=', -1]);
            }
        } else if (this.state.isHRDashboardManager) {
            const currentEmployee = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['department_id'],
                { limit: 1 }
            );
            if (currentEmployee.length > 0 && currentEmployee[0].department_id) {
                const deptEmployees = await this.orm.searchRead(
                    'hr.employee',
                    [['department_id', '=', currentEmployee[0].department_id[0]]],
                    ['id']
                );
                const empIds = deptEmployees.map(e => e.id);
                domain.push(['employee_id', 'in', empIds]);
            } else {
                domain.push(['employee_id', '=', -1]);
            }
        }
        
        const attendances = await this.orm.searchRead(
            'hr.attendance',
            domain,
            ['employee_id', 'check_in', 'attendance_type'],
            {order: 'check_in desc' }
        );

        const employeeIds = attendances.map(att => att.employee_id[0]);
        const employees = await this.orm.searchRead(
            'hr.employee',
            [['id', 'in', employeeIds]],
            ['id', 'department_id']
        );

        const empDeptMap = {};
        employees.forEach(emp => {
            empDeptMap[emp.id] = emp.department_id ? emp.department_id[1] : '-';
        });

        this.state.tableData = attendances.map((att, index) => ({
            id: index + 1,
            employeeName: att.employee_id[1],
            department: empDeptMap[att.employee_id[0]],
            date: new Date(att.check_in).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'sick',
            statusText: att.attendance_type === 'sick' ? 'Sick Leave' : 'Unpaid Leave'
        }));
    }

    async loadAttendanceData() {
        let domain = [['attendance_type', 'in', ['present', 'late']]];
        
        const employees = await this.orm.searchRead(
            'hr.employee',
            [['name', 'ilike', this.userName]],
            ['id'],
            { limit: 1 }
        );
        if (employees.length > 0) {
            domain.push(['employee_id', '=', employees[0].id]);
        } else {
            domain.push(['employee_id', '=', -1]);
        }
        
        const attendances = await this.orm.searchRead(
            'hr.attendance',
            domain,
            ['employee_id', 'check_in', 'attendance_type'],
            { order: 'check_in desc' }
        );

        const employeeIds = attendances.map(att => att.employee_id[0]);
        const employees2 = await this.orm.searchRead(
            'hr.employee',
            [['id', 'in', employeeIds]],
            ['id', 'department_id']
        );

        const empDeptMap = {};
        employees2.forEach(emp => {
            empDeptMap[emp.id] = emp.department_id ? emp.department_id[1] : '-';
        });

        this.state.tableData = attendances.map((att, index) => ({
            id: index + 1,
            employeeName: att.employee_id[1],
            department: empDeptMap[att.employee_id[0]],
            date: new Date(att.check_in).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: att.attendance_type === 'present' ? 'approved' : 'pending',
            statusText: att.attendance_type === 'present' ? 'Present' : 'Late'
        }));
    }

    async loadContractData() {
        let domain = [['contract_date_start', '!=', false]];
        
        if (this.state.isHRDashboardUserOnly) {
            let employees = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['id', 'name'],
                { limit: 1 }
            );
            console.log('User Only - Searching employee with name:', this.userName, 'Result:', employees);
            
            if (employees.length > 0) {
                const empId = employees[0].id;
                domain = [['id', '=', empId], ['contract_date_start', '!=', false]];
                console.log('Final Employee ID:', empId);
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
            console.log('Manager - Current Employee:', currentEmployee);
            if (currentEmployee.length > 0 && currentEmployee[0].department_id) {
                const deptId = currentEmployee[0].department_id[0];
                domain = [['department_id', '=', deptId], ['contract_date_start', '!=', false]];
                console.log('Manager - Department ID:', deptId, 'Domain:', domain);
            } else {
                domain = [['id', '=', -1]];
            }
        }
        
        const employees = await this.orm.searchRead(
            'hr.employee',
            domain,
            ['name', 'contract_date_start', 'contract_date_end', 'department_id'],
            { order: 'contract_date_start desc' }
        );

        this.state.tableData = employees.map((emp, index) => ({
            id: index + 1,
            employeeName: emp.name,
            department: emp.department_id ? emp.department_id[1] : '-',
            dateStart: new Date(emp.contract_date_start).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            dateEnd: emp.contract_date_end ? new Date(emp.contract_date_end).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            status: emp.contract_date_end && new Date(emp.contract_date_end) < new Date() ? 'expired' : 'approved',
            statusText: emp.contract_date_end && new Date(emp.contract_date_end) < new Date() ? 'Expired' : 'Active'
        }));
    }

    async loadKpiCounts() {
        let contractDomain = [['contract_date_start', '!=', false]];
        let leavesDomain = [['attendance_type', 'in', ['unpaid', 'sick']]];
        let attendanceDomain = [['attendance_type', 'in', ['present', 'late']]];
        
        if (this.state.isHRDashboardUserOnly) {
            let employees = await this.orm.searchRead(
                'hr.employee',
                [['name', 'ilike', this.userName]],
                ['id'],
                { limit: 1 }
            );
            
            if (employees.length > 0) {
                const empId = employees[0].id;
                contractDomain = [['id', '=', empId], ['contract_date_start', '!=', false]];
                leavesDomain.push(['employee_id', '=', empId]);
                attendanceDomain.push(['employee_id', '=', empId]);
            } else {
                contractDomain = [['id', '=', -1]];
                leavesDomain.push(['employee_id', '=', -1]);
                attendanceDomain.push(['employee_id', '=', -1]);
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
                contractDomain = [['department_id', '=', deptId], ['contract_date_start', '!=', false]];
                
                const deptEmployees = await this.orm.searchRead(
                    'hr.employee',
                    [['department_id', '=', deptId]],
                    ['id']
                );
                const empIds = deptEmployees.map(e => e.id);
                leavesDomain.push(['employee_id', 'in', empIds]);
                attendanceDomain.push(['employee_id', 'in', empIds]);
            } else {
                contractDomain = [['id', '=', -1]];
                leavesDomain.push(['employee_id', '=', -1]);
                attendanceDomain.push(['employee_id', '=', -1]);
            }
        }
        
        const leavesCount = await this.orm.searchCount(
            'hr.attendance',
            leavesDomain
        );

        const attendanceCount = await this.orm.searchCount(
            'hr.attendance',
            attendanceDomain
        );

        const contractsCount = await this.orm.searchCount(
            'hr.employee',
            contractDomain
        );

        this.state.kpiCounts.leaves = leavesCount;
        this.state.kpiCounts.attendance = attendanceCount;
        this.state.kpiCounts.expenses = 0;
        this.state.kpiCounts.contracts = contractsCount;
    }
}

export { MyDashboard };
