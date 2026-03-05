# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import AccessError

class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    # Related fields from current contract (hr.version)
    contract_date_start = fields.Date(related='current_version_id.contract_date_start', readonly=True, store=False)
    contract_date_end = fields.Date(related='current_version_id.contract_date_end', readonly=True, store=False)
    
    # Override existing fields to allow base.group_user
    birthday = fields.Date(groups="base.group_user")
    current_version_id = fields.Many2one(groups="base.group_user")
    version_id = fields.Many2one(groups="base.group_user")

    @api.model
    def get_view(self, view_id=None, view_type='form', **options):
        if view_type == 'form':
            is_user_only = self.env.user.has_group('peepl_unified_dashboard.group_hr_dashboard_user') and \
                          not self.env.user.has_group('peepl_unified_dashboard.group_hr_dashboard_manager') and \
                          not self.env.user.has_group('peepl_unified_dashboard.group_hr_dashboard_all_access')
            if is_user_only:
                view = self.env.ref('peepl_unified_dashboard.view_employee_form_dashboard_user', raise_if_not_found=False)
                if view:
                    view_id = view.id
        return super().get_view(view_id, view_type, **options)
    
    def read(self, fields=None, load='_classic_read'):
        is_user_only = self.env.user.has_group('peepl_unified_dashboard.group_hr_dashboard_user') and \
                      not self.env.user.has_group('peepl_unified_dashboard.group_hr_dashboard_manager') and \
                      not self.env.user.has_group('peepl_unified_dashboard.group_hr_dashboard_all_access')
        
        if is_user_only:
            user_employee = self.env['hr.employee'].sudo().search([('user_id', '=', self.env.user.id)], limit=1)
            if user_employee:
                for record in self:
                    if record.id != user_employee.id:
                        raise AccessError("You can only access your own employee record.")
        
        return super().read(fields, load)
