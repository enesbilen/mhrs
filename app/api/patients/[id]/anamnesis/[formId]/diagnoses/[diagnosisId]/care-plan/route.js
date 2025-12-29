import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
const db = require('@/lib/db');

// GET /api/patients/[id]/anamnesis/[formId]/diagnoses/[diagnosisId]/care-plan
export async function GET(request, { params }) {
  try {
    const { id, formId, diagnosisId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const carePlans = await db.query(
      `SELECT * FROM nurse_care_plans
       WHERE patient_id = ? AND form_id = ? AND diagnosis_id = ?`,
      [id, formId, diagnosisId]
    );

    if (carePlans.length === 0) {
      return NextResponse.json({ carePlan: null });
    }

    const carePlan = carePlans[0];

    // Get all expected outcomes for this diagnosis (templates)
    const outcomes = await db.query(
      `SELECT id, outcome_text, order_index
       FROM diagnosis_expected_outcomes
       WHERE diagnosis_id = ?
       ORDER BY order_index ASC, id ASC`,
      [diagnosisId]
    );

    // Get selected outcomes for this care plan
    const selectedOutcomes = await db.query(
      `SELECT outcome_id FROM care_plan_selected_outcomes WHERE care_plan_id = ?`,
      [carePlan.id]
    );
    const selectedOutcomeIds = selectedOutcomes.map(s => s.outcome_id);

    // Get all interventions for this diagnosis (templates)
    const interventions = await db.query(
      `SELECT id, intervention_text, order_index
       FROM diagnosis_interventions
       WHERE diagnosis_id = ?
       ORDER BY order_index ASC, id ASC`,
      [diagnosisId]
    );

    // Get selected interventions for this care plan
    const selectedInterventions = await db.query(
      `SELECT intervention_id FROM care_plan_selected_interventions WHERE care_plan_id = ?`,
      [carePlan.id]
    );
    const selectedInterventionIds = selectedInterventions.map(s => s.intervention_id);

    return NextResponse.json({
      carePlan: {
        ...carePlan,
        expected_outcomes: outcomes.map(o => ({
          ...o,
          selected: selectedOutcomeIds.includes(o.id),
        })),
        interventions: interventions.map(i => ({
          ...i,
          selected: selectedInterventionIds.includes(i.id),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching care plan:', error);
    return NextResponse.json(
      { error: 'Bakım planı getirilemedi' },
      { status: 500 }
    );
  }
}

// POST /api/patients/[id]/anamnesis/[formId]/diagnoses/[diagnosisId]/care-plan
export async function POST(request, { params }) {
  try {
    const { id, formId, diagnosisId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expected_outcomes, interventions, evaluation } = body;

    const result = await db.transaction(async (connection) => {
      // Create care plan
      const [carePlanResult] = await connection.execute(
        `INSERT INTO nurse_care_plans (patient_id, form_id, diagnosis_id, evaluation, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [id, formId, diagnosisId, evaluation || null, user.id]
      );

      const carePlanId = carePlanResult.insertId;

      // Save selected outcomes
      if (expected_outcomes && Array.isArray(expected_outcomes) && expected_outcomes.length > 0) {
        for (const outcomeId of expected_outcomes) {
          await connection.execute(
            `INSERT INTO care_plan_selected_outcomes (care_plan_id, outcome_id, selected)
             VALUES (?, ?, TRUE)
             ON DUPLICATE KEY UPDATE selected = TRUE`,
            [carePlanId, outcomeId]
          );
        }
      }

      // Save selected interventions
      if (interventions && Array.isArray(interventions) && interventions.length > 0) {
        for (const interventionId of interventions) {
          await connection.execute(
            `INSERT INTO care_plan_selected_interventions (care_plan_id, intervention_id, selected)
             VALUES (?, ?, TRUE)
             ON DUPLICATE KEY UPDATE selected = TRUE`,
            [carePlanId, interventionId]
          );
        }
      }

      return { carePlanId };
    });

    return NextResponse.json(
      { message: 'Bakım planı oluşturuldu', id: result.carePlanId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating care plan:', error);
    return NextResponse.json(
      { error: 'Bakım planı oluşturulamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id]/anamnesis/[formId]/diagnoses/[diagnosisId]/care-plan
export async function PUT(request, { params }) {
  try {
    const { id, formId, diagnosisId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expected_outcomes, interventions, evaluation } = body;

    const result = await db.transaction(async (connection) => {
      // Get existing care plan
      const [carePlans] = await connection.query(
        `SELECT id FROM nurse_care_plans
         WHERE patient_id = ? AND form_id = ? AND diagnosis_id = ?`,
        [id, formId, diagnosisId]
      );

      if (carePlans.length === 0) {
        throw new Error('Bakım planı bulunamadı');
      }

      const carePlanId = carePlans[0].id;

      // Update evaluation
      await connection.execute(
        `UPDATE nurse_care_plans
         SET evaluation = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [evaluation || null, carePlanId]
      );

      // Update selected outcomes
      // Delete all existing selections first
      await connection.execute(
        'DELETE FROM care_plan_selected_outcomes WHERE care_plan_id = ?',
        [carePlanId]
      );

      // Insert new selections
      if (expected_outcomes && Array.isArray(expected_outcomes) && expected_outcomes.length > 0) {
        for (const outcomeId of expected_outcomes) {
          await connection.execute(
            `INSERT INTO care_plan_selected_outcomes (care_plan_id, outcome_id, selected)
             VALUES (?, ?, TRUE)`,
            [carePlanId, outcomeId]
          );
        }
      }

      // Update selected interventions
      // Delete all existing selections first
      await connection.execute(
        'DELETE FROM care_plan_selected_interventions WHERE care_plan_id = ?',
        [carePlanId]
      );

      // Insert new selections
      if (interventions && Array.isArray(interventions) && interventions.length > 0) {
        for (const interventionId of interventions) {
          await connection.execute(
            `INSERT INTO care_plan_selected_interventions (care_plan_id, intervention_id, selected)
             VALUES (?, ?, TRUE)`,
            [carePlanId, interventionId]
          );
        }
      }

      return { carePlanId };
    });

    return NextResponse.json(
      { message: 'Bakım planı güncellendi', id: result.carePlanId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating care plan:', error);
    return NextResponse.json(
      { error: error.message || 'Bakım planı güncellenemedi' },
      { status: 500 }
    );
  }
}

