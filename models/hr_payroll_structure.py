# -*- coding: utf-8 -*-
from odoo import models, fields

class HrPayrollStructure(models.Model):
    _inherit = 'hr.payroll.structure'

    job_id = fields.Many2one('hr.job', string='Job Position')
