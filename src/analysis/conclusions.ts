import type { ReconstructionResult } from './reconstruction';
import type { BehaviorAnalysis } from './driverBehavior';
import type { SafetyAudit } from './safetyAudit';

export interface AnalysisConclusions {
  summary: string;
  causeDescription: string;
  recommendations: string[];
  limitations: string[];
  disclaimer: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'MINORĂ',
  moderate: 'MODERATĂ',
  severe: 'SEVERĂ',
  fatal: 'CU RISC FATAL',
};

export function generateConclusions(
  recon: ReconstructionResult,
  behavior: BehaviorAnalysis,
  audit: SafetyAudit,
  recordId: string
): AnalysisConclusions {
  const sev = SEVERITY_LABELS[recon.severityClass] ?? recon.severityClass;

  const victimNote = recon.isStationaryVictim
    ? 'Vehiculul analizat era STAȚIONAR la momentul impactului (victimă a coliziunii din spate). '
    : '';

  const summary =
    `${victimNote}Accidentul analizat (înregistrare ${recordId}) prezintă o severitate ${sev}, ` +
    `cu un delta-V total de ${recon.deltaV_total_kmh.toFixed(1)} km/h. ` +
    (recon.isStationaryVictim
      ? `Energia absorbită de vehiculul victimă a fost ${(recon.energyDissipatedAtImpact_J / 1000).toFixed(1)} kJ.`
      : `Viteza la impact: ${recon.impactSpeed_kmh.toFixed(1)} km/h. Energia disipată: ${(recon.energyDissipatedAtImpact_J / 1000).toFixed(1)} kJ (${(recon.energyRatio * 100).toFixed(0)}% din energia totală).`);

  const causeLines: string[] = [];
  if (behavior.isStationaryVictim) {
    causeLines.push('Vehiculul analizat era staționar la un semafor sau în trafic oprit. Vina aparține conducătorului vehiculului agresor care nu a frânat la timp.');
  } else if (behavior.noReaction) {
    causeLines.push('Șoferul nu a reacționat la situația de pericol (posibil distras sau adormit).');
  } else {
    const prtLabel = behavior.prtAssessment === 'fast' ? 'RAPID' : behavior.prtAssessment === 'normal' ? 'NORMAL' : 'LENT';
    causeLines.push(
      `Șoferul a reacționat după un timp estimat de ${behavior.prtCalculated_s.toFixed(2)} s ` +
      `(referință Olson: 1.5 s — evaluare: ${prtLabel}).`
    );
  }
  if (behavior.excessiveSpeed) {
    causeLines.push(`Viteza inițială de ${recon.averageSpeed_kmh.toFixed(0)} km/h depășea limita legală.`);
  }
  if (behavior.couldHaveAvoided) {
    causeLines.push(
      `O frânare imediată la detectarea pericolului ar fi permis reducerea vitezei cu ` +
      `${behavior.speedReductionPossible_kmh.toFixed(0)} km/h înainte de impact.`
    );
  }
  if (audit.potentialDefects.length > 0) {
    causeLines.push(
      `Au fost identificate posibile defecțiuni ale sistemelor active: ${audit.potentialDefects.join('; ')}.`
    );
  }

  const recommendations: string[] = [
    'Verificarea stării tehnice a sistemelor ABS, ESC și airbag prin inspecție specializată.',
    'Prelevarea datelor EDR printr-o interfață certificată pentru confirmare oficială.',
  ];
  if (audit.potentialDefects.length > 0) {
    recommendations.push('Investigație tehnică suplimentară pentru defecțiunile identificate.');
  }
  if (!audit.seatbelt.driverBuckled) {
    recommendations.push('Emiterea unui raport separat privind neutilizarea centurii de siguranță.');
  }

  const limitations = [
    'Analiza se bazează exclusiv pe datele EDR disponibile la frecvența de înregistrare specificată (2 Hz pre-crash, 100 Hz crash).',
    'Estimarea timpului de percepție-reacție (PRT) folosește un model indirect și poate diferi de valoarea reală.',
    'Coeficientul de aderență (μ) este estimat și poate varia în funcție de starea reală a suprafeței carosabile.',
    'Datele EDR sunt anonimizate conform UN R160 și nu conțin informații despre locație sau identitatea șoferului.',
    'Analiza nu substituie expertiza tehnică judiciară realizată de un expert autorizat.',
  ];

  const disclaimer =
    'Acest raport este generat automat de aplicația TwinAccident v1.0 pe baza datelor EDR ' +
    'încărcate de utilizator. Rezultatele au caracter orientativ și nu constituie o expertiză ' +
    'tehnică judiciară în sensul legii. Utilizarea acestui raport în proceduri judiciare necesită ' +
    'validarea de către un expert tehnic autorizat RNATE.';

  return {
    summary,
    causeDescription: causeLines.join(' '),
    recommendations,
    limitations,
    disclaimer,
  };
}
