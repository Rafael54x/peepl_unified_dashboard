/** @odoo-module **/

import { Component, useState, onWillStart, xml } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";

class EmployeeDetail extends Component {
    static template = xml`
        <div class="o_action o_view_controller">
            <t t-if="state.loading">
                <div class="text-center p-5">
                    <i class="fa fa-spinner fa-spin fa-3x"/>
                </div>
            </t>
            <t t-else="">
                <t t-if="state.employee">
                    <div class="o_form_view o_form_readonly">
                        <div class="o_form_sheet_bg">
                            <div class="o_form_sheet position-relative p-4">
                                <div t-if="!state.employee.active" class="alert alert-warning mb-3">
                                    <strong>Archived</strong>
                                </div>
                                
                                <div class="row flex-column flex-sm-row align-items-center mb-4">
                                    <div class="o_employee_avatar ms-2 p-0 h-100 mw-25 align-self-start align-self-sm-center">
                                        <t t-if="state.employee.image_1920">
                                            <img t-att-src="'data:image/jpeg;base64,' + state.employee.image_1920" 
                                                 class="img-fluid" style="max-width: 128px; max-height: 158px;"/>
                                        </t>
                                        <t t-else="">
                                            <div class="bg-secondary text-white d-flex align-items-center justify-content-center" 
                                                 style="width: 128px; height: 158px; font-size: 48px;">
                                                <i class="fa fa-user"/>
                                            </div>
                                        </t>
                                    </div>
                                    <div class="align-self-start o_employee_form_header_info ms-3">
                                        <div class="oe_title ps-0 pe-2 mw-100">
                                            <h1 class="d-flex flex-row align-items-center" style="font-size: min(4vw, 2.6rem);">
                                                <t t-esc="state.employee.name"/>
                                            </h1>
                                            <h5 class="d-flex align-items-baseline mb-0">
                                                <i class="fa fa-envelope fa-fw me-1 text-primary"/>
                                                <a t-att-href="'mailto:' + state.employee.work_email" t-esc="state.employee.work_email or '-'"/>
                                            </h5>
                                            <h5 class="d-flex align-items-baseline mb-0">
                                                <i class="fa fa-phone fa-fw me-1 text-primary"/>
                                                <span t-esc="state.employee.work_phone or '-'"/>
                                            </h5>
                                            <h5 class="d-flex align-items-baseline mb-0">
                                                <i class="fa fa-mobile fa-fw me-1 text-primary"/>
                                                <span t-esc="state.employee.mobile_phone or '-'"/>
                                            </h5>
                                            <h5 t-if="state.employee.category_ids and state.employee.category_ids.length">
                                                <i class="fa fa-tags fa-fw me-1 text-primary"/>
                                                <t t-foreach="state.employee.category_ids" t-as="cat" t-key="cat[0]">
                                                    <span class="badge bg-info me-1" t-esc="cat[1]"/>
                                                </t>
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="o_notebook mt-4">
                                    <ul class="nav nav-tabs border-bottom" role="tablist">
                                        <li class="nav-item">
                                            <a class="nav-link active" data-bs-toggle="tab" href="#work_info" role="tab">Work</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link" data-bs-toggle="tab" href="#resume" role="tab">Resume</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link" data-bs-toggle="tab" href="#personal" role="tab">Personal</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link" data-bs-toggle="tab" href="#payroll" role="tab">Payroll</a>
                                        </li>
                                    </ul>
                                    <div class="tab-content p-3">
                                        <div id="work_info" class="tab-pane fade show active pt-3">
                                            <div class="row">
                                                <div class="col-lg-7">
                                                    <div class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Work</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Company</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.company_id ? state.employee.company_id[1] : '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Department</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.department_id ? state.employee.department_id[1] : '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Job Position</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.job_id ? state.employee.job_id[1] : '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Job Title</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.job_title or '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Manager</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.parent_id ? state.employee.parent_id[1] : '-'"/>
                                                        </div>
                                                    </div>
                                                    <div class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Location</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Work Address</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.address_id ? state.employee.address_id[1] : '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Work Location</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.work_location_id ? state.employee.work_location_id[1] : '-'"/>
                                                        </div>
                                                    </div>
                                                    <div t-if="!state.employee.active" class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Departure</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Reason</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.departure_reason_id ? state.employee.departure_reason_id[1] : '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Date</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.departure_date or '-'"/>
                                                        </div>
                                                    </div>
                                                    <div t-if="state.employee.additional_note" class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Note</div>
                                                        </div>
                                                        <div class="o_cell o_cell_custom mb-3 mb-sm-0" style="--o-grid-column-span: 2;">
                                                            <p t-esc="state.employee.additional_note"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="resume" class="tab-pane fade pt-3">
                                            <div class="o_inner_group grid">
                                                <div class="g-col-sm-2">
                                                    <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Resume</div>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">Certificate</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.certificate or '-'"/>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">Study Field</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.study_field or '-'"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="personal" class="tab-pane fade pt-3">
                                            <div class="row">
                                                <div class="col-lg-6">
                                                    <div class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Private Contact</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Email</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.private_email or '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Phone</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.private_phone or '-'"/>
                                                        </div>
                                                    </div>
                                                    <div class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Personal Information</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Legal Name</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.legal_name or '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Birthday</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.birthday or '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Gender</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.sex or '-'"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-lg-6">
                                                    <div class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Emergency Contact</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Contact</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.emergency_contact or '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Phone</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.emergency_phone or '-'"/>
                                                        </div>
                                                    </div>
                                                    <div class="o_inner_group grid">
                                                        <div class="g-col-sm-2">
                                                            <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Citizenship</div>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">Country</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.country_id ? state.employee.country_id[1] : '-'"/>
                                                        </div>
                                                        <div class="o_cell o_wrap_label text-break text-900">
                                                            <label class="o_form_label">ID</label>
                                                        </div>
                                                        <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                            <span t-esc="state.employee.identification_id or '-'"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="payroll" class="tab-pane fade pt-3">
                                            <div class="o_inner_group grid">
                                                <div class="g-col-sm-2">
                                                    <div class="o_horizontal_separator mt-4 mb-3 text-uppercase fw-bolder small">Contract</div>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">Start Date</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.contract_date_start or '-'"/>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">End Date</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.contract_date_end or '-'"/>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">Wage</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.wage or '-'"/>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">Employee Type</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.employee_type or '-'"/>
                                                </div>
                                                <div class="o_cell o_wrap_label text-break text-900">
                                                    <label class="o_form_label">Contract Type</label>
                                                </div>
                                                <div class="o_cell o_wrap_input text-break mb-3 mb-sm-0">
                                                    <span t-esc="state.employee.contract_type_id ? state.employee.contract_type_id[1] : '-'"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </t>
                <t t-else="">
                    <div class="alert alert-warning m-3">
                        Employee not found or you don't have access.
                    </div>
                </t>
            </t>
        </div>
    `;

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        
        this.state = useState({
            employee: null,
            loading: true
        });

        onWillStart(async () => {
            await this.loadEmployee();
        });
    }

    async loadEmployee() {
        const employeeId = this.props.action.context.active_id || this.props.action.res_id;
        
        try {
            const employees = await this.orm.searchRead(
                'hr.employee',
                [['id', '=', employeeId]],
                [
                    'name', 'image_1920', 'work_email', 'work_phone', 'mobile_phone',
                    'company_id', 'department_id', 'job_id', 'job_title', 'parent_id',
                    'address_id', 'work_location_id', 'certificate', 'study_field',
                    'employee_properties', 'active', 'category_ids',
                    'private_email', 'private_phone', 'legal_name', 'birthday',
                    'place_of_birth', 'country_of_birth', 'sex',
                    'emergency_contact', 'emergency_phone', 'country_id',
                    'identification_id', 'ssnid', 'passport_id',
                    'contract_date_start', 'contract_date_end', 'wage',
                    'employee_type', 'contract_type_id', 'structure_type_id',
                    'resource_calendar_id', 'departure_reason_id', 'departure_date',
                    'departure_description', 'additional_note'
                ]
            );
            
            if (employees.length > 0) {
                this.state.employee = employees[0];
            }
        } catch (error) {
            console.error('Error loading employee:', error);
        } finally {
            this.state.loading = false;
        }
    }
}

registry.category("actions").add("peepl_unified_dashboard.employee_detail", EmployeeDetail);

export { EmployeeDetail };
