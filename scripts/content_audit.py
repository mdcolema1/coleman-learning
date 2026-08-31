from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1];issues=[]
worlds=(root/'src/data/worlds.ts').read_text();app=(root/'src/App.tsx').read_text();home=(root/'src/components/HomeScreen.tsx').read_text();qf=(root/'src/data/questionFactory.ts').read_text();visual=(root/'src/components/QuestionVisual.tsx').read_text();subject=(root/'src/components/SubjectScreen.tsx').read_text();adv=(root/'src/engine/adventure.ts').read_text()
if worlds.count('open:true') != 1: issues.append('Exactly one adventure world must be open in backend progression data.')
if 'Array.from({length:9}' not in worlds or 'open:false' not in worlds: issues.append('Worlds 2-10 must remain locked in backend progression data.')
if any(x in app for x in ['AdventureHub','WorldMap','adventureHub','worldMap']): issues.append('Old Adventure Hub / World Map routes must not appear in the child-facing app.')
if re.search(r'World [2-9]|World 10|locked worlds',home,re.I): issues.append('Future worlds must not appear on the explorer-select experience.')
if re.search(r"Touch the word\s*\$\{",qf,re.I): issues.append('A generated sight-word prompt still prints its target word.')
if "{kind:'digitalTime',value:ans}" in qf: issues.append('A digital-time target is still being rendered as the question illustration.')
if 'equal parts shaded' in visual.lower() or re.search(r'numerator\}\s+of\s+\{v\.denominator',visual,re.I): issues.append('Fraction visual still prints the numerator/denominator answer.')
if "required.every(s=>subjectCompleted(state,kid,s).length>=1)" not in subject: issues.append("Harmoni's Reading Priority trigger must use one completion per required non-reading category.")
if not (root/'public/sw.js').exists(): issues.append('Offline service worker is missing.')
if 'zoneExplorationComplete' not in adv or 'p.adventure.level<next.minLevel' not in adv: issues.append('Region progression must require exploration + Adventure Level.')
if "!zone.boss||p.adventure.bossesDefeated.includes(zone.id)" not in adv: issues.append('Boss regions must require a mastery trial before progression.')
if issues:
 print('Content audit failed:');[print(' -',x) for x in issues];sys.exit(1)
manifest={'version':'11.0.0','world1Only':True,'futureWorldsHiddenFromChildUI':True,'worlds2to10LockedInBackend':True,'answerLeakRegressionChecks':True,'harmoniReadingPriorityOneCompletion':True,'generatedQuestionAudit':'scripts/audit-questions.ts','engineTests':'scripts/engine-tests.ts','offlineServiceWorker':True,'localSaveSnapshots':True,'bossMasteryTrials':True,'familyAchievements':True,'regionProgressionGate':'level+exploration+boss-when-required','primaryChildExperience':'full-screen-html5-phaser-expedition','oldWorldSelectorUI':False}
(root/'public/build-audit.json').write_text(json.dumps(manifest,indent=2)+'\n');print('Python content audit passed and public/build-audit.json generated.')
