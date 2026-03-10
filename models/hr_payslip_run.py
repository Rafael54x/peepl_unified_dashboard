# -*- coding: utf-8 -*-
from odoo import models
from odoo.fields import Domain

class HrPayslipRun(models.Model):
    _inherit = 'hr.payslip.run'

    def action_payroll_hr_version_list_view_payrun(self, date_start=None, date_end=None, structure_id=None, company_id=None, schedule_pay=None):
        action = super().action_payroll_hr_version_list_view_payrun(date_start, date_end, structure_id, company_id, schedule_pay)
        
        structure = self.env['hr.payroll.structure'].browse(structure_id) if structure_id else self.structure_id
        if structure and structure.job_id:
            current_domain = action.get('domain', [])
            if current_domain and len(current_domain) > 0:
                version_ids = current_domain[0][2] if isinstance(current_domain[0], tuple) and len(current_domain[0]) > 2 else []
                if version_ids:
                    filtered_versions = self.env['hr.version'].browse(version_ids).filtered(
                        lambda v: v.employee_id.job_id.id == structure.job_id.id
                    )
                    action['domain'] = [('id', 'in', filtered_versions.ids)]
        
        return action
