from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1];issues=[]
worlds=(root/'src/data/worlds.ts').read_text();qf=(root/'src/data/questionFactory.ts').read_text();visual=(root/'src/components/QuestionVisual.tsx').read_text();subject=(root/'src/components/SubjectScreen.tsx').read_text();adv=(root/'src/engine/adventure.ts').read_text()
if worlds.count('open:true') != 1: issues.append('Exactly one adventure world must be open.')
if 'Array.from({length:9}' not in worlds or 'open:false' not in worlds: issues.append('Worlds 2-10 must remain nine locked placeholders.')
if re.search(r"Touch the word\s*\$\{",qf,re.I): issues.append('A generated sight-word prompt still prints its target word.')
if "{kind:'digitalTime',value:ans}" in qf: issues.append('A digital-time target is still being rendered as the question illustration.')
if 'equal parts shaded' in visual.lower() or re.search(r'numerator\}\s+of\s+\{v\.denominator',visual,re.I): issues.append('Fraction visual still prints the numerator/denominator answer.')
if "required.every(s=>subjectCompleted(state,kid,s).length>=1)" not in subject: issues.append("Harmoni's Reading Priority trigger must use one completion per required non-reading category.")
if not (root/'public/sw.js').exists(): issues.append('Offline service worker is missing.')
if 'zoneExplorationComplete' not in adv or 'p.adventure.level<next.minLevel' not in adv: issues.append('Region progression must require exploration + Adventure Level.')
if "!zone.boss||p.adventure.bossesDefeated.includes(zone.id)" not in adv: issues.append('Boss regions must require a mastery trial before progression.')
if issues:
 print('Content audit failed:');[print(' -',x) for x in issues];sys.exit(1)
manifest={'version':'10.0.0','world1Only':True,'worlds2to10Locked':True,'answerLeakRegressionChecks':True,'harmoniReadingPriorityOneCompletion':True,'generatedQuestionAudit':'scripts/audit-questions.ts','engineTests':'scripts/engine-tests.ts','offlineServiceWorker':True,'localSaveSnapshots':True,'bossMasteryTrials':True,'familyAchievements':True,'regionProgressionGate':'level+exploration+boss-when-required'}
(root/'public/build-audit.json').write_text(json.dumps(manifest,indent=2)+'\n');print('Python content audit passed and public/build-audit.json generated.')
