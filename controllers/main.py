# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from werkzeug.exceptions import Forbidden

class HRAccessController(http.Controller):
    
    @http.route('/odoo/my-profile', type='http', auth='user', website=True)
    def my_employee_profile(self, **kwargs):
        employee = request.env['hr.employee'].search([('user_id', '=', request.uid)], limit=1)
        if employee:
            return request.redirect(f'/odoo/action-405/{employee.id}/action-peepl_unified_dashboard.employee_detail')
        return request.redirect('/web')
    
    @http.route(['/odoo/action-<int:action_id>/<int:employee_id>/<string:action_name>'], type='http', auth='user', website=True)
    def validate_employee_access(self, action_id, employee_id, action_name, **kwargs):
        # Only validate for employee_detail action
        if 'employee_detail' not in action_name:
            return request.redirect('/web')
        
        user = request.env.user
        
        # Check if user has HR access (can view all employees)
        has_hr_access = user.has_group('base.group_system') or \
                       user.has_group('hr.group_hr_user') or \
                       user.has_group('hr.group_hr_manager') or \
                       user.has_group('peepl_unified_dashboard.group_hr_dashboard_all_access')
        
        # If has HR access, allow
        if has_hr_access:
            return request.redirect(f'/web#action={action_id}&active_id={employee_id}&model=hr.employee&view_type=form')
        
        # Get user's employee record
        user_employee = request.env['hr.employee'].sudo().search([('user_id', '=', request.uid)], limit=1)
        
        if not user_employee:
            raise Forbidden("You don't have an employee record.")
        
        # Check if manager can view department employees
        if user.has_group('peepl_unified_dashboard.group_hr_dashboard_manager'):
            target_employee = request.env['hr.employee'].sudo().browse(employee_id)
            if target_employee.exists() and user_employee.department_id and \
               target_employee.department_id == user_employee.department_id:
                return request.redirect(f'/web#action={action_id}&active_id={employee_id}&model=hr.employee&view_type=form')
        
        # For regular users, only allow their own record
        if user_employee.id != employee_id:
            # Redirect to their own profile instead
            return request.redirect(f'/odoo/action-{action_id}/{user_employee.id}/{action_name}')
        
        return request.redirect(f'/web#action={action_id}&active_id={employee_id}&model=hr.employee&view_type=form')
