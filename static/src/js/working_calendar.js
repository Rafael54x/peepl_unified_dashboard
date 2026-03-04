/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class WorkingCalendar extends Component {
    static template = "peepl_unified_dashboard.WorkingCalendar";

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.state = useState({
            selectedMonth: new Date().getMonth(),
            selectedYear: new Date().getFullYear(),
            calendarDays: [],
            viewMode: 'year',
            holidayTypes: [],
            isHRDashboardAllAccess: false
        });

        this.checkUserRole();
        this.loadHolidayTypes();
        this.loadCalendar();
    }

    async checkUserRole() {
        try {
            const result = await this.orm.call('unified.dashboard.access', 'check_user_access', []);
            this.state.isHRDashboardAllAccess = result.isHRDashboardAllAccess || false;
        } catch (error) {
            console.log('Could not check user role:', error);
            this.state.isHRDashboardAllAccess = false;
        }
    }

    handleEditClick() {
        this.actionService.doAction(264);
    }


    async loadHolidayTypes() {
        this.state.holidayTypes = await this.orm.searchRead(
            'resource.calendar.leaves',
            [['holiday_type_id', '!=', false]],
            ['holiday_type_id']
        );
        // Extract unique holiday types
        const uniqueTypes = new Map();
        this.state.holidayTypes.forEach(leave => {
            if (leave.holiday_type_id) {
                uniqueTypes.set(leave.holiday_type_id[0], leave.holiday_type_id[1]);
            }
        });
        this.state.holidayTypes = Array.from(uniqueTypes, ([id, name]) => ({ id, name }));
    }

    async loadCalendar() {
        if (this.state.viewMode === 'year') {
            await this.loadYearView();
        } else {
            await this.loadMonthView();
        }
    }

    async loadYearView() {
        const startStr = `${this.state.selectedYear}-01-01`;
        const endStr = `${this.state.selectedYear}-12-31`;
        
        const leaves = await this.orm.searchRead(
            'resource.calendar.leaves',
            [
                ['resource_id', '=', false],
                '|',
                '&', ['date_from', '>=', startStr], ['date_from', '<=', endStr],
                '&', ['date_to', '>=', startStr], ['date_to', '<=', endStr]
            ],
            ['name', 'date_from', 'date_to']
        );

        const monthData = [];
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(this.state.selectedYear, month, 1);
            const monthEnd = new Date(this.state.selectedYear, month + 1, 0);
            const daysInMonth = monthEnd.getDate();
            
            let holidayCount = 0;
            const holidayDates = {}; // Change to object to store holiday names
            
            leaves.forEach(leave => {
                const fromUTC = new Date(leave.date_from + 'Z');
                const toUTC = new Date(leave.date_to + 'Z');
                
                const currentDate = new Date(fromUTC);
                currentDate.setHours(0, 0, 0, 0);
                const endDate = new Date(toUTC);
                endDate.setHours(0, 0, 0, 0);
                
                while (currentDate <= endDate) {
                    if (currentDate.getMonth() === month && currentDate.getFullYear() === this.state.selectedYear) {
                        holidayCount++;
                        const day = currentDate.getDate();
                        if (!holidayDates[day]) {
                            holidayDates[day] = [];
                        }
                        if (!holidayDates[day].includes(leave.name)) {
                            holidayDates[day].push(leave.name);
                        }
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
            
            // Generate calendar days untuk bulan ini
            const firstDay = monthStart.getDay();
            const calendarDays = [];
            
            // Empty cells sebelum hari pertama
            for (let i = 0; i < firstDay; i++) {
                calendarDays.push({ 
                    empty: true, 
                    day: null,
                    uniqueKey: `empty-${month}-${i}`
                });
            }
            
            // Hari-hari dalam bulan
            for (let day = 1; day <= daysInMonth; day++) {
                const dayHolidays = holidayDates[day] || [];
                const isHoliday = dayHolidays.length > 0;
                calendarDays.push({
                    empty: false,
                    day: day,
                    isHoliday: isHoliday,
                    holidays: dayHolidays,
                    uniqueKey: `day-${month}-${day}`
                });
            }
            
            monthData.push({
                month: month,
                name: this.getMonthName(month),
                holidayCount: holidayCount,
                holidayDates: holidayDates,
                calendarDays: calendarDays,
                uniqueKey: `year-${this.state.selectedYear}-month-${month}`
            });
        }
        
        this.state.calendarDays = monthData;
    }

    async loadMonthView() {
        const startDate = new Date(this.state.selectedYear, this.state.selectedMonth, 1);
        const endDate = new Date(this.state.selectedYear, this.state.selectedMonth + 1, 0);
        const firstDay = startDate.getDay();
        
        const startStr = `${this.state.selectedYear}-${String(this.state.selectedMonth + 1).padStart(2, '0')}-01`;
        const endStr = `${this.state.selectedYear}-${String(this.state.selectedMonth + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        const leaves = await this.orm.searchRead(
            'resource.calendar.leaves',
            [
                ['resource_id', '=', false],
                '|',
                '&', ['date_from', '>=', startStr], ['date_from', '<=', endStr],
                '&', ['date_to', '>=', startStr], ['date_to', '<=', endStr]
            ],
            ['name', 'date_from', 'date_to']
        );

        const leaveDates = {};
        leaves.forEach(leave => {
            const fromUTC = new Date(leave.date_from + 'Z');
            const toUTC = new Date(leave.date_to + 'Z');
            
            const currentDate = new Date(fromUTC);
            while (currentDate <= toUTC) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                if (!leaveDates[dateStr]) leaveDates[dateStr] = [];
                if (!leaveDates[dateStr].includes(leave.name)) {
                    leaveDates[dateStr].push(leave.name);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push({ 
                empty: true, 
                uniqueKey: `empty-${this.state.selectedYear}-${this.state.selectedMonth}-${i}`
            });
        }

        for (let day = 1; day <= endDate.getDate(); day++) {
            const dateStr = `${this.state.selectedYear}-${String(this.state.selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const holidays = leaveDates[dateStr] || [];
            calendarDays.push({ 
                day, 
                date: dateStr,
                uniqueKey: dateStr,
                isHoliday: holidays.length > 0,
                holidays: holidays
            });
        }

        this.state.calendarDays = calendarDays;
    }

    changeMonth(direction) {
        if (this.state.viewMode === 'month') {
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
            this.loadCalendar();
        }
    }

    changeYear(direction) {
        this.state.selectedYear += direction;
        this.loadCalendar();
    }

    getMonthName(month = null) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month !== null ? month : this.state.selectedMonth];
    }

    selectMonth(month) {
        this.state.selectedMonth = month;
        this.state.viewMode = 'month';
        // Clear calendarDays before loading to avoid stale data
        this.state.calendarDays = [];
        this.loadMonthView();
    }

    backToYear() {
        this.state.viewMode = 'year';
        // Clear calendarDays before loading to avoid stale data
        this.state.calendarDays = [];
        this.loadYearView();
    }

    getDayName(index) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[index];
    }
}

export { WorkingCalendar };
