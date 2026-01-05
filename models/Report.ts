import mongoose, { Schema, Document } from 'mongoose';

export interface PersonalSnapshot {
    name?: string;
    email?: string;
    phoneNumber?: string;
    age?: string;
    primary_concern?: string;
    [key: string]: any;
}

export interface IReport extends Document {

    schema_version: string;
    report_type: string;
    personal_snapshot: PersonalSnapshot;
    clinical_insight_snapshot: any;
    movement_observations: any;
    kinetic_chain_hypothesis_a: any;
    kinetic_chain_hypothesis_b: any;
    load_vs_recovery_overview: any;
    lifestyle_and_postural_contributors: any;
    at_home_mobility_focus: any;
    why_this_pattern_matters: any;
    questions_to_ask_your_practitioner: string[];
    practitioner_hand_off_summary: any;
    next_steps_and_recovery_tools: any;
    disclaimer: string;
    practitioner_notes?: any;
}

const ReportSchema: Schema = new Schema(
    {
        schema_version: { type: String, required: true },
        report_type: { type: String, required: true },
        personal_snapshot: { type: Schema.Types.Mixed, default: {} },
        clinical_insight_snapshot: { type: Schema.Types.Mixed, default: {} },
        movement_observations: { type: Schema.Types.Mixed, default: {} },
        kinetic_chain_hypothesis_a: { type: Schema.Types.Mixed, default: {} },
        kinetic_chain_hypothesis_b: { type: Schema.Types.Mixed, default: {} },
        load_vs_recovery_overview: { type: Schema.Types.Mixed, default: {} },
        lifestyle_and_postural_contributors: { type: Schema.Types.Mixed, default: {} },
        at_home_mobility_focus: { type: Schema.Types.Mixed, default: {} },
        why_this_pattern_matters: { type: Schema.Types.Mixed, default: {} },
        questions_to_ask_your_practitioner: { type: [String], default: [] },
        practitioner_hand_off_summary: { type: Schema.Types.Mixed, default: {} },
        next_steps_and_recovery_tools: { type: Schema.Types.Mixed, default: {} },
        practitioner_notes: { type: Schema.Types.Mixed, default: {} },
        disclaimer: { type: String, default: '' },
    },
    { timestamps: true }
);

export default (mongoose.models.Report as mongoose.Model<IReport>) || mongoose.model<IReport>('Report', ReportSchema);