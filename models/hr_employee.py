# -*- coding: utf-8 -*-
from odoo import models, fields

class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    # Related fields from current contract (hr.version)
    contract_date_start = fields.Date(related='current_version_id.contract_date_start', readonly=True, store=False)
    contract_date_end = fields.Date(related='current_version_id.contract_date_end', readonly=True, store=False)
    
    # Override existing fields to allow base.group_user
    birthday = fields.Date(groups="base.group_user")
    current_version_id = fields.Many2one(groups="base.group_user")
    version_id = fields.Many2one(groups="base.group_user")
