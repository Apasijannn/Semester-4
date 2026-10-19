// ─── Backgrounds ─────────────────────────────────────────────────────────────
// Figma asset — landscape hospital/clinic room photo from the original design
export const BG_ROOM =
  'https://www.figma.com/api/mcp/asset/2f8f0117-9265-4561-852a-adb52e55e323'

export const BG_ROOM_PLAIN =
  'https://www.figma.com/api/mcp/asset/2f8f0117-9265-4561-852a-adb52e55e323'

// ─── Patient / equipment overlays (Figma assets — valid ~7 days) ─────────────
export const PATIENT_GROUP = 'https://www.figma.com/api/mcp/asset/dba5b022-a572-43ec-aaa3-e430d2463e32'
export const PATIENT_BODY  = 'https://www.figma.com/api/mcp/asset/3f06de7e-407f-4753-bda6-da116f1400a8'

export const EQUIP = {
  OXIMETER:    'https://www.figma.com/api/mcp/asset/3481d926-cf3b-4cb8-89c3-832da607b8a5',
  HAND_FINGER: 'https://www.figma.com/api/mcp/asset/c429479a-eebf-4b6c-931a-976568deab55',
  BP_CUFF:     'https://www.figma.com/api/mcp/asset/05330cce-3916-4361-a02d-87e95c9bc244',
  BP_HAND:     'https://www.figma.com/api/mcp/asset/c86acd87-afe8-4e69-bc4b-bbc8f8e8f133',
  THERMOMETER: 'https://www.figma.com/api/mcp/asset/b4ceee58-99f3-4d15-a444-19f8daf1d98d',
  FACE_TEMP:   'https://www.figma.com/api/mcp/asset/89f06ccd-0b80-411c-acfb-88730eca6305',
  WOUND_ARM:   'https://www.figma.com/api/mcp/asset/cbd3e624-b993-4ea7-8b9c-55897e0a5974',
  IRRIGATION:  'https://www.figma.com/api/mcp/asset/6bf7708c-1449-406a-943a-1378e2343cb4',
}

// ─── AR highlight ring body-part positions (% of 874×402 viewport) ───────────
export const AR_POSITIONS = {
  finger:     { left: '63%', top: '66%', size: 38 },
  upperArm:   { left: '54%', top: '38%', size: 42 },
  mouth:      { left: '61%', top: '28%', size: 34 },
  forearm:    { left: '59%', top: '60%', size: 40 },
  innerElbow: { left: '52%', top: '48%', size: 42 },
}

// ─── Domain definitions ───────────────────────────────────────────────────────
export const DOMAINS = [
  {
    id: 'vital-signs',
    name: 'Vital Signs',
    shortName: 'Vital Signs',
    icon: '❤️',
    description: 'Assess and interpret vital signs',
    entryDesc:
      "Assess and record patient Zidan's vital signs — heart rate, blood pressure, and temperature — to evaluate his overall clinical condition.",
    color: '#e53e3e',
    accentBg: 'rgba(229,62,62,0.10)',
    accentBorder: 'rgba(229,62,62,0.25)',
    patient: {
      name: 'Zidan',
      age: 25,
      gender: 'Male',
      complaint:
        'Complains of chest tightness and mild shortness of breath after physical activity.',
    },
    steps: [
      {
        stepNum: 1,
        totalSteps: 3,
        arBodyPart: 'finger',
        title: 'Place pulse oximeter on index finger',
        desc: 'Ensure the sensor is snug and the light is active',
        vitals: { HR: '---', BP: '---', Temp: '---' },
        measurement: {
          label: 'Heart Rate',
          value: '98',
          unit: 'bpm',
          status: 'Normal',
          statusColor: '#16a34a',
          iconChar: '♥',
        },
      },
      {
        stepNum: 2,
        totalSteps: 3,
        arBodyPart: 'upperArm',
        title: 'Wrap BP cuff around upper arm, 2 cm above elbow',
        desc: 'Ensure cuff is snug but not too tight',
        vitals: { HR: '98 bpm', BP: '---', Temp: '---' },
        measurement: {
          label: 'Blood Pressure',
          value: '148/92',
          unit: 'mmHg',
          status: 'Elevated',
          statusColor: '#d97706',
          iconChar: '🩺',
        },
      },
      {
        stepNum: 3,
        totalSteps: 3,
        arBodyPart: 'mouth',
        title: "Measure patient's temperature with thermometer",
        desc: 'Place under tongue, keep mouth closed for accuracy.',
        vitals: { HR: '98 bpm', BP: '148/92 mmHg', Temp: '---' },
        measurement: {
          label: 'Temperature',
          value: '37.1',
          unit: '°C',
          status: 'Normal',
          statusColor: '#16a34a',
          iconChar: '🌡',
        },
      },
    ],
    vitalsPanel: [
      { key: 'HR',   label: 'Heart Rate',     value: '98',     unit: 'bpm',  status: 'Normal',    color: '#16a34a', revealStep: 0 },
      { key: 'BP',   label: 'Blood Pressure', value: '148/92', unit: 'mmHg', status: 'Elevated',  color: '#d97706', revealStep: 1 },
      { key: 'SpO2', label: 'SpO₂',           value: '94',     unit: '%',    status: 'Low-Norm',  color: '#d97706', revealStep: 0 },
      { key: 'Temp', label: 'Temperature',    value: '37.1',   unit: '°C',   status: 'Normal',    color: '#16a34a', revealStep: 2 },
    ],
    infoPanelType: 'vitals',
    completion: {
      subtitle: 'Vital Signs Assessment',
      stepsTotal: '3 / 3',
      accuracy: '92%',
      errors: '1',
    },
  },

  {
    id: 'wound-care',
    name: 'Wound Care',
    shortName: 'Wound Care',
    icon: '🩹',
    description: 'Clean, dress, and manage wounds',
    entryDesc:
      "Clean and dress patient Zidan's laceration on the left forearm to prevent infection and promote healing.",
    color: '#d97706',
    accentBg: 'rgba(217,119,6,0.10)',
    accentBorder: 'rgba(217,119,6,0.25)',
    patient: {
      name: 'Zidan',
      age: 25,
      gender: 'Male',
      complaint: 'Reports a laceration on the left forearm from a sharp object.',
    },
    steps: [
      {
        stepNum: 1,
        totalSteps: 3,
        arBodyPart: 'forearm',
        title: 'Irrigate wound with saline solution',
        desc: 'Use gentle pressure, irrigate from center outward',
        suppliesNeeded: [
          { name: 'Saline Solution',    done: false },
          { name: 'Sterile Gauze',      done: false },
          { name: 'Antiseptic Solution',done: false },
          { name: 'Sterile Dressing',   done: false },
        ],
      },
      {
        stepNum: 2,
        totalSteps: 3,
        arBodyPart: 'forearm',
        title: 'Apply antiseptic solution to wound',
        desc: 'Circular motion from center outward to prevent re-contamination',
        suppliesNeeded: [
          { name: 'Saline Solution',    done: true  },
          { name: 'Sterile Gauze',      done: false },
          { name: 'Antiseptic Solution',done: false },
          { name: 'Sterile Dressing',   done: false },
        ],
      },
      {
        stepNum: 3,
        totalSteps: 3,
        arBodyPart: 'forearm',
        title: 'Apply sterile dressing to the wound',
        desc: 'Secure with medical tape, no wrinkles. Check circulation.',
        suppliesNeeded: [
          { name: 'Saline Solution',    done: true  },
          { name: 'Sterile Gauze',      done: true  },
          { name: 'Antiseptic Solution',done: true  },
          { name: 'Sterile Dressing',   done: false },
        ],
      },
    ],
    woundInfo: { size: '4 cm', depth: 'Superficial', contamination: 'Moderate' },
    infoPanelType: 'wound',
    completion: {
      subtitle: 'Wound Care Assessment',
      stepsTotal: '3 / 3',
      accuracy: '88%',
      errors: '0',
    },
  },

  {
    id: 'iv-line',
    name: 'IV Line Placement',
    shortName: 'IV Line',
    icon: '💉',
    description: 'Insert and manage IV lines',
    entryDesc:
      'Insert an IV cannula and set up a drip for patient Zidan who presents with severe heat exhaustion and acute dehydration.',
    color: '#2563eb',
    accentBg: 'rgba(37,99,235,0.10)',
    accentBorder: 'rgba(37,99,235,0.25)',
    patient: {
      name: 'Zidan',
      age: 25,
      gender: 'Male',
      complaint:
        'Collapsed during marathon training. Presents with severe heat exhaustion and acute dehydration.',
    },
    steps: [
      {
        stepNum: 1,
        totalSteps: 3,
        arBodyPart: 'upperArm',
        title: 'Apply tourniquet and clean insertion site',
        desc: 'Apply tourniquet 4–5 cm above site; clean with alcohol swab',
        iv: { site: 'Antecubital vein', gauge: '18G', flowRate: '---' },
        suppliesNeeded: [
          { name: 'Tourniquet',        done: false },
          { name: 'Alcohol Swab',      done: false },
          { name: 'IV Cannula (18G)',  done: false },
          { name: 'Giving Set',        done: false },
        ],
      },
      {
        stepNum: 2,
        totalSteps: 3,
        arBodyPart: 'innerElbow',
        title: 'Insert IV cannula at 15–30° angle',
        desc: 'Bevel up — advance until blood flashback appears in chamber',
        iv: { site: 'Antecubital vein', gauge: '18G', flowRate: '---' },
        suppliesNeeded: [
          { name: 'Tourniquet',        done: true  },
          { name: 'Alcohol Swab',      done: true  },
          { name: 'IV Cannula (18G)',  done: false },
          { name: 'Giving Set',        done: false },
        ],
      },
      {
        stepNum: 3,
        totalSteps: 3,
        arBodyPart: 'innerElbow',
        title: 'Secure cannula and connect IV drip',
        desc: 'Tape cannula, connect giving set, set flow rate to 125 ml/hr',
        iv: { site: 'Antecubital vein', gauge: '18G', flowRate: '125 ml/hr' },
        suppliesNeeded: [
          { name: 'Tourniquet',        done: true  },
          { name: 'Alcohol Swab',      done: true  },
          { name: 'IV Cannula (18G)',  done: true  },
          { name: 'Giving Set',        done: false },
        ],
      },
    ],
    infoPanelType: 'iv',
    completion: {
      subtitle: 'IV Line Placement',
      stepsTotal: '3 / 3',
      accuracy: '95%',
      errors: '0',
    },
  },
]

// ─── Medi AI context-aware messages ──────────────────────────────────────────
export const MEDI_MESSAGES = {
  'vital-signs': [
    [
      "Hello! I'm Medi AI. Zidan presents with chest tightness after physical activity.",
      "Let's start the assessment. We'll measure heart rate, blood pressure, and temperature.",
    ],
    [
      "Place the pulse oximeter firmly on his index finger.",
      "HR normal range is 60–100 bpm. Watch for rhythm irregularities.",
    ],
    [
      "Good — HR is 98 bpm, within normal range ✓",
      "Now wrap the BP cuff 2 cm above the elbow crease. Ensure snug fit.",
    ],
    [
      "BP 148/92 mmHg — Stage 1 hypertension. This needs cardiology follow-up.",
      "Place thermometer under the tongue. Keep mouth closed for accuracy.",
    ],
    [
      "Temperature 37.1°C — normal ✓  All vitals recorded!",
      "Summary: HR normal, BP elevated (Stage 1), Temp normal. Recommend cardiology referral.",
    ],
  ],
  'wound-care': [
    [
      "Zidan has a 4 cm laceration on the left forearm. Starting wound care protocol.",
      "Gather supplies: saline, gauze, antiseptic, and sterile dressing.",
    ],
    [
      "Step 1: Irrigate the wound with saline solution.",
      "Use gentle pressure, moving from center outward to clear debris.",
    ],
    [
      "Good irrigation — wound is clean. Now apply antiseptic solution.",
      "Use circular motions from wound center outward to prevent re-contamination.",
    ],
    [
      "Excellent antiseptic technique! Now apply the sterile dressing.",
      "Ensure full coverage with no wrinkles. Check distal circulation after.",
    ],
    [
      "Wound care complete! Dressing secured correctly.",
      "Document: size 4 cm, superficial, moderate contamination. Monitor for infection signs.",
    ],
  ],
  'iv-line': [
    [
      "Zidan collapsed with severe heat exhaustion. IV access needed urgently.",
      "We'll insert an 18G cannula at the antecubital fossa for fluid resuscitation.",
    ],
    [
      "Apply tourniquet 4–5 cm above the antecubital fossa.",
      "Clean the site with alcohol swab in circular motion — wait 30 seconds to dry.",
    ],
    [
      "Good site prep! Insert the 18G cannula bevel-up at 15–30°.",
      "Watch for blood flashback in the chamber — this confirms intravenous placement.",
    ],
    [
      "Cannula placed! Advance the catheter and remove the needle carefully.",
      "Connect the giving set and set flow rate to 125 ml/hr for rapid rehydration.",
    ],
    [
      "IV line secured! Zidan is receiving 0.9% NaCl at 125 ml/hr ✓",
      "Monitor for infiltration. Reassess in 30 minutes for clinical improvement.",
    ],
  ],
}
