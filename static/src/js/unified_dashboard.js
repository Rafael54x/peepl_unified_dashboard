/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { MyDashboard } from "./my_dashboard";
import { WeeklyReportDashboard } from "./weekly_report_dashboard";
import { RecruitmentDashboard } from "./recruitment_dashboard";
import { AttendanceDashboard } from "./attendance_dashboard";
import { WorkingCalendar } from "./working_calendar";
import { Employee } from "./employee";
import { session } from "@web/session";

class UnifiedDashboard extends Component {
    static template = "peepl_unified_dashboard.UnifiedDashboard";
    static components = { MyDashboard, WeeklyReportDashboard, RecruitmentDashboard, AttendanceDashboard, WorkingCalendar, Employee };

    setup() {
        this.orm = useService("orm");
        this.weeklyReportSetView = null;
        this.state = useState({
            sidebarOpen: true,
            activeMenu: 'my_dashboard',
            hasWeeklyReportAccess: false,
            hasRecruitmentAccess: false,
            hasAttendanceAccess: false,
            weeklyDropdownOpen: false,
            weeklyView: 'dashboard'
        });

        onWillStart(async () => {
            await this.checkAccess();
        });
    }

    async checkAccess() {
        try {
            const result = await this.orm.call('unified.dashboard.access', 'check_user_access', []);
            
            if (result.isHRDashboardUserOnly) {
                this.state.hasWeeklyReportAccess = false;
                this.state.hasRecruitmentAccess = false;
                this.state.hasAttendanceAccess = false;
            } else {
                this.state.hasWeeklyReportAccess = result.hasWeeklyReportAccess;
                this.state.hasRecruitmentAccess = result.hasRecruitmentAccess;
                this.state.hasAttendanceAccess = result.hasAttendanceAccess;
            }
            
            console.log('Access Result:', result);
        } catch (error) {
            console.error('Error checking access:', error);
            this.state.hasWeeklyReportAccess = false;
            this.state.hasRecruitmentAccess = false;
            this.state.hasAttendanceAccess = false;
        }
    }

    toggleSidebar() {
        this.state.sidebarOpen = !this.state.sidebarOpen;
    }

    setActiveMenu(menu) {
        this.state.activeMenu = menu;
    }

    toggleWeeklyDropdown() {
        this.state.weeklyDropdownOpen = !this.state.weeklyDropdownOpen;
    }

    setWeeklyView(view) {
        this.state.weeklyView = view;
        this.state.activeMenu = 'weekly_report';
        if (this.weeklyReportSetView) {
            this.weeklyReportSetView(view);
        }
    }

    setWeeklyViewCallback(setViewFn) {
        this.weeklyReportSetView = setViewFn;
    }
}

registry.category("actions").add("peepl_unified_dashboard", UnifiedDashboard);

export { UnifiedDashboard };
