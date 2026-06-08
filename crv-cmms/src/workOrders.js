// Work orders — 2018 Honda CR-V AWD 1.5T
// Only OVERDUE and DUE SOON items from updated maintenance schedule

export const PRESET_WORK_ORDERS = [

  // ── OVERDUE ──
  {
    id: 'wo-carbon', title: 'Intake Valve Carbon Deposit Cleaning', priority: 'high',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'OVERDUE. GDI engine — fuel never touches intake valves, so carbon deposits accumulate on the back of the valves over time. Causes rough idle, misfires, reduced power, poor fuel economy. Walnut shell blasting is the only proper fix. Shop job unless you have blast equipment.',
    procedure: [
      'NOTE: Requires walnut shell blasting equipment. If not available, take to a trusted shop — describe as "GDI intake valve walnut blast cleaning." Cost: $200–$400.',
      'If DIY: disconnect intake hose from throttle body.',
      'Remove intake manifold to access intake ports. Note all vacuum line locations before removal.',
      'Rotate engine so cylinder 1 intake valves are CLOSED before blasting.',
      'Blast walnut shells at closed valves — breaks off carbon without damaging valve seats.',
      'Vacuum out ALL walnut shell debris from port before moving to next cylinder.',
      'Repeat for all 4 cylinders. Rotating engine to close each cylinder\'s intake valves before blasting.',
      'Inspect ports with flashlight — valves should be clean and shiny.',
      'Reinstall intake manifold with new gasket.',
      'Reconnect all vacuum lines and intake hose.',
      'Start engine — expect rough idle 1–2 minutes as debris clears.',
      'Going forward: use top-tier fuel (Petro-Canada, Shell V-Power) and consider catch can installation.',
    ],
    parts: [
      { partNumber: 'N/A', description: 'Intake manifold gasket set', qty: 1, unit: 'set' },
      { partNumber: 'N/A', description: 'Walnut shell blast media (if DIY)', qty: 1, unit: 'bag' },
    ],
  },

  {
    id: 'wo-brakefld', title: 'Brake Fluid Replacement', priority: 'high',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'OVERDUE since 130,000 km. Brake fluid is hygroscopic — it absorbs moisture over time, lowering the boiling point and corroding calipers and master cylinder. DOT 3 minimum; DOT 4 acceptable and offers higher boiling point. Flush completely — never top up contaminated fluid.',
    procedure: [
      'Gather: DOT 3 or DOT 4 brake fluid (2 bottles), clear vinyl tubing ~30cm, catch bottle, turkey baster, 8mm or 10mm wrench, nitrile gloves, shop rags.',
      'Park on level ground, engine off, parking brake applied.',
      'Locate brake fluid reservoir on driver-side firewall. Check fluid color — dark brown or black = contaminated.',
      'Use turkey baster to remove as much old fluid as possible from reservoir. Do NOT let reservoir run completely dry.',
      'Fill reservoir to MAX line with fresh fluid.',
      'Bleed order (furthest from master cylinder first): Rear Passenger → Rear Driver → Front Passenger → Front Driver.',
      'For each wheel: locate bleeder screw on caliper, attach clear tubing, submerge other end in catch bottle.',
      'Have assistant slowly press pedal to floor and hold. Open bleeder 1/4 turn — dark fluid flows out. Close bleeder BEFORE assistant releases pedal. Repeat until fluid runs clear and bubble-free (4–6 pumps per wheel).',
      'After each wheel, top up reservoir — never let it drop below MIN.',
      'Torque bleeder screws: 8–10 N·m. Do not overtighten — they strip easily.',
      'Reinstall wheels. Torque lug nuts: 108 N·m in star pattern.',
      'Pump brake pedal several times until firm. Check for leaks under vehicle.',
      'Test pedal feel — must be firm before moving vehicle.',
      'Dispose of old fluid at recycling center.',
    ],
    parts: [
      { partNumber: '08798-9008', description: 'Honda DOT 3 Brake Fluid 500mL', qty: 2, unit: 'bottle' },
      { partNumber: 'N/A', description: 'Clear vinyl tubing ~30cm', qty: 1, unit: 'piece' },
    ],
  },

  {
    id: 'wo-swaybar', title: 'Sway Bar End Links Inspection & Replacement', priority: 'high',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'OVERDUE by mileage. End links connect the sway bar to the strut assembly. Worn links cause clunking over bumps — very common on White River gravel roads. Inspect first — replace if worn, loose, or rubber boot is cracked.',
    procedure: [
      'Lift vehicle on jack stands. Do not work under vehicle on jack only.',
      'Locate front sway bar end links — one per side, connecting sway bar to bottom of strut.',
      'Inspect rubber boots on each ball joint — cracking or torn = contaminated and worn.',
      'Grab each end link and check for play — any looseness means replacement needed.',
      'Check for clunking by pushing/pulling sway bar while someone rocks vehicle.',
      'To replace: hold center stud with 6mm hex key, remove upper nut (14mm) and lower nut (14mm).',
      'Remove old end link. Install new one — hand tighten both ends first.',
      'Torque end link nuts: 38–44 N·m. Hold center stud with hex key to prevent spinning.',
      'Repeat on other side.',
      'Lower vehicle. Test drive on rough surface — clunking should be eliminated.',
    ],
    parts: [
      { partNumber: '51320-TLA-A01', description: 'Front Sway Bar End Link Left', qty: 1, unit: 'each' },
      { partNumber: '51320-TLA-A11', description: 'Front Sway Bar End Link Right', qty: 1, unit: 'each' },
    ],
  },

  // ── DUE SOON ──
  {
    id: 'wo-cabinair', title: 'Cabin Air Filter Replacement', priority: 'medium',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'Due at 170,000 km. Clogged cabin filter reduces HVAC airflow and makes blower motor work harder. In White River conditions — insects, dust, pollen, road debris — inspect every 15,000 km.',
    procedure: [
      'Open glove box and empty it completely.',
      'Squeeze both sides of the glove box inward to allow it to swing fully down past the stop tabs.',
      'Cabin air filter housing is now visible — rectangular cover with a clip on the right side.',
      'Release the clip and slide out the old filter. Note the airflow direction arrow on the frame.',
      'Inspect housing interior for debris — wipe out with dry cloth if needed.',
      'Insert new filter with arrow pointing DOWN (toward blower motor).',
      'Close housing cover and engage clip.',
      'Swing glove box back up — squeeze sides to re-engage stop tabs.',
      'Turn HVAC fan to full speed and verify improved airflow.',
    ],
    parts: [
      { partNumber: '80292-TBA-A11', description: 'OEM Honda Cabin Air Filter — 2017–2022 CR-V', qty: 1, unit: 'each' },
    ],
  },

  {
    id: 'wo-coolant', title: 'Engine Coolant Flush & Replacement', priority: 'medium',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'Due at 170,000 km (last done 120,000 km). Honda Type 2 (blue) coolant ONLY. Do NOT mix with green, orange, or universal coolant — causes corrosion and gel buildup. The 1.5T aluminum engine is especially susceptible to coolant corrosion. Flush completely.',
    procedure: [
      'Allow engine to cool completely — minimum 2 hours. NEVER open radiator cap on hot engine.',
      'Gather: Honda Type 2 coolant (OL999-9011) 4 bottles, distilled water, drain pan, funnel, coolant tester.',
      'Place drain pan under radiator. Open drain petcock on bottom of radiator — counterclockwise.',
      'Open coolant reservoir cap to allow faster draining.',
      'Allow complete drain — 10+ minutes. Close petcock.',
      'Fill system with distilled water only. Start engine, run to operating temp, then drain again. This removes remaining old coolant.',
      'Close petcock. Fill with 50/50 mix of Honda Type 2 and distilled water. Capacity: ~5.1L.',
      'Fill radiator to neck. Fill reservoir to MAX.',
      'Leave reservoir cap off. Start engine and idle. Watch for air bubbles — normal as system purges air.',
      'Run engine with heater on MAX until thermostat opens (temp gauge reaches middle). Top up as level drops.',
      'Once temp stabilizes and no more bubbles — install reservoir cap.',
      'Check for leaks at petcock, hose clamps, reservoir cap.',
      'After 1 drive cycle, recheck level when cold — top up if needed.',
      'Test freeze protection — must read good to at least -40°C for White River.',
    ],
    parts: [
      { partNumber: 'OL999-9011', description: 'Honda Type 2 Blue Coolant 1L', qty: 4, unit: 'bottle' },
      { partNumber: 'N/A', description: 'Distilled water only — NOT tap water', qty: 2, unit: 'L' },
    ],
  },

  {
    id: 'wo-diff', title: 'Rear Differential Fluid Replacement', priority: 'medium',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'Due at 170,000 km (last done 120,000 km). Honda DPS-F ONLY — do NOT substitute with generic ATF. Wrong fluid causes AWD shudder, clutch pack wear, and premature failure. Fill to overflow — do not guess quantity.',
    procedure: [
      'Warm up vehicle 10 minutes — warm fluid drains more completely.',
      'Lift vehicle on jack stands or ramps. Must be level for accurate fill.',
      'Locate rear differential — aluminum housing under rear axle between driveshafts.',
      'CRITICAL: Find FILL plug first (upper, 3/8" square drive). Confirm you can open it BEFORE opening drain plug. Never drain a diff you cannot refill.',
      'Remove fill plug. Inspect thread condition.',
      'Place drain pan under diff. Remove DRAIN plug (lower, 3/8" square drive). Allow full drain — 5–10 minutes.',
      'Inspect drain plug magnet — fine gray sludge is normal. Metal chunks = bearing wear.',
      'Install new sealing washer on drain plug. Reinstall. Torque: 40 N·m.',
      'Using fluid pump through fill hole, add Honda DPS-F until fluid seeps out of fill hole.',
      'Install new sealing washer on fill plug. Reinstall. Torque: 40 N·m.',
      'Wipe clean. Lower vehicle.',
      'Test drive with low-speed turns — verify no AWD shudder or binding.',
    ],
    parts: [
      { partNumber: '08200-9007', description: 'Honda DPS-F Dual Pump Fluid 1L', qty: 1, unit: 'bottle' },
      { partNumber: '90471-PX4-000', description: 'Drain/Fill Plug Sealing Washer (need 2)', qty: 2, unit: 'each' },
    ],
  },

  {
    id: 'wo-caliper', title: 'Brake Caliper Slides & Hardware Service', priority: 'medium',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'Due at 170,000 km. White River salt and grit seize caliper slides, causing uneven pad wear, brake pull, and heat buildup. Quick service — do at every pad inspection. Seized slides are the most common brake problem in Northern Ontario.',
    procedure: [
      'Lift vehicle and remove wheels. Work one axle at a time.',
      'Inspect brake pad thickness — replace if under 3mm.',
      'Remove caliper bolts (12mm or 14mm). Hang caliper from spring or wire — never let it hang by brake hose.',
      'Slide out caliper slide pins. Inspect rubber boots — replace if cracked or torn.',
      'Clean slide pin bores with wire brush or clean rag. Remove all old grease and corrosion.',
      'Inspect slide pins — should be smooth. Replace if pitted or corroded.',
      'Apply fresh silicone-based caliper slide grease to slide pins. Coat entire pin surface.',
      'Reinstall slide pins. Verify boots are properly seated.',
      'Check caliper piston — depress with C-clamp. Should move smoothly.',
      'Clean anti-squeal shim contact points. Apply brake quiet gel.',
      'Reinstall caliper. Torque bolts: 27–33 N·m.',
      'Reinstall wheel. Torque lug nuts: 108 N·m.',
      'Pump pedal several times until firm before moving vehicle.',
      'Test drive — verify no brake pull or dragging.',
    ],
    parts: [
      { partNumber: 'N/A', description: 'Caliper slide pin grease (silicone-based)', qty: 1, unit: 'tube' },
      { partNumber: 'N/A', description: 'Brake caliper hardware kit (if slides worn)', qty: 1, unit: 'kit' },
    ],
  },

  {
    id: 'wo-tires', title: 'Tire Rotation', priority: 'medium',
    status: 'open', createdKm: 150000, createdAt: new Date().toISOString(),
    notes: 'Due at 160,000 km. CRITICAL on AWD — the Real Time AWD rear coupling is sensitive to tire circumference differences. Uneven tread overworks the coupling and causes premature failure. Check sidewall for directional arrow before rotating.',
    procedure: [
      'Check sidewall for directional arrow. If present: front-to-rear same side only. If no arrow: full X-pattern.',
      'Loosen all lug nuts slightly while tires are on ground.',
      'Lift vehicle. Support on jack stands using proper jack points per owner manual.',
      'Remove all 4 wheels.',
      'Inspect each tire: tread depth (min 3mm), sidewall cracking, bulges, uneven wear. Record findings.',
      'Inspect brake components while wheels are off: rotor condition, pad thickness, caliper slides.',
      'Inspect CV axle boots for cracking or grease fling.',
      'Check sway bar end links and ball joints for play.',
      'NON-DIRECTIONAL (X-pattern): FR→RL, FL→RR, RR→FL, RL→FR.',
      'DIRECTIONAL: FR→RR, FL→RL only.',
      'Reinstall wheels. Hand-tighten lug nuts in star pattern.',
      'Lower vehicle to ground.',
      'Torque lug nuts to 108 N·m in star pattern. Two full passes.',
      'Check tire pressure — 33 PSI cold all around for 235/60R18.',
      'Test drive — listen for vibration or pulling.',
    ],
    parts: [
      { partNumber: 'N/A', description: 'Service only — no parts required', qty: 1, unit: 'each' },
    ],
  },

]
