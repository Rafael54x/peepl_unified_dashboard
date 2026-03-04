# -*- coding: utf-8 -*-
from odoo import models, api

class UnifiedDashboardAccess(models.TransientModel):
    _name = 'unified.dashboard.access'
    _description = 'Unified Dashboard Access Check'

    @api.model
    def check_user_access(self):
        user = self.env.user
        
        # Check if Administrator
        is_admin = user.has_group('base.group_system')
        
        # Check Weekly Report access
        is_staff = user.has_group('peepl_weekly_report.group_peepl_staff')
        is_supervisor = user.has_group('peepl_weekly_report.group_peepl_supervisor')
        is_manager = user.has_group('peepl_weekly_report.group_peepl_manager')
        is_bod = user.has_group('peepl_weekly_report.group_peepl_bod')
        
        has_weekly_report = (not is_staff) or is_supervisor or is_manager or is_bod
        
        # Check Recruitment access
        has_recruitment_manager = user.has_group('hr_recruitment.group_hr_recruitment_manager')
        has_recruitment_interviewer = user.has_group('hr_recruitment.group_hr_recruitment_interviewer')
        
        # Check Attendance access - only officer or admin
        has_attendance_officer = user.has_group('hr_attendance.group_hr_attendance_officer')
        
        # Check HR Dashboard access
        is_hr_dashboard_user = user.has_group('peepl_unified_dashboard.group_hr_dashboard_user') and not user.has_group('peepl_unified_dashboard.group_hr_dashboard_manager')
        is_hr_dashboard_manager = user.has_group('peepl_unified_dashboard.group_hr_dashboard_manager') and not user.has_group('peepl_unified_dashboard.group_hr_dashboard_all_access')
        is_hr_dashboard_all_access = user.has_group('peepl_unified_dashboard.group_hr_dashboard_all_access')
        
        # Check if user only has Attendance User role (not Officer)
        is_attendance_user_only = user.has_group('peepl_unified_dashboard.group_hr_attendance_dashboard_user') and not user.has_group('hr_attendance.group_hr_attendance_officer')
        
        return {
            'hasWeeklyReportAccess': is_admin or has_weekly_report,
            'hasRecruitmentAccess': is_admin or has_recruitment_manager or has_recruitment_interviewer,
            'hasAttendanceAccess': is_admin or is_hr_dashboard_all_access,
            'isAdminOrOfficer': is_admin or has_recruitment_manager,
            'hasWeeklyReportRole': has_weekly_report,
            'isHRDashboardUserOnly': is_hr_dashboard_user or is_attendance_user_only,
            'isHRDashboardManager': is_hr_dashboard_manager,
            'isHRDashboardAllAccess': is_hr_dashboard_all_access
        }
