# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from werkzeug.exceptions import Forbidden

class HRAccessController(http.Controller):
    
    @http.route(['/odoo/employees', '/odoo/employees/<path:subpath>'], type='http', auth='user', website=True)
    def block_employees_access(self, **kwargs):
        # Officer and Manager can access
        if not (request.env.user.has_group('hr.group_hr_user') or request.env.user.has_group('hr.group_hr_manager')):
            raise Forbidden("You don't have access to Employees module")
        return request.redirect('/web')
    
    @http.route(['/odoo/payroll', '/odoo/payroll/<path:subpath>'], type='http', auth='user', website=True)
    def block_payroll_access(self, **kwargs):
        # Officer and Manager can access
        if not (request.env.user.has_group('hr_payroll.group_hr_payroll_user') or request.env.user.has_group('hr_payroll.group_hr_payroll_manager')):
            raise Forbidden("You don't have access to Payroll module")
        return request.redirect('/web')
    
    @http.route(['/odoo/attendance', '/odoo/attendance/<path:subpath>'], type='http', auth='user', website=True)
    def block_attendance_access(self, **kwargs):
        # Officer can access
        if not request.env.user.has_group('hr_attendance.group_hr_attendance_officer'):
            raise Forbidden("You don't have access to Attendance module")
        return request.redirect('/web')
    
    @http.route(['/odoo/time_off', '/odoo/time_off/<path:subpath>'], type='http', auth='user', website=True)
    def block_timeoff_access(self, **kwargs):
        # Officer and Manager can access
        if not (request.env.user.has_group('hr_holidays.group_hr_holidays_user') or request.env.user.has_group('hr_holidays.group_hr_holidays_manager')):
            raise Forbidden("You don't have access to Time Off module")
        return request.redirect('/web')
