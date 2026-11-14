// Prepared, fictional examples for the public product walkthrough.
// This file contains no live assessment, NT engine, model connection or legal certification.
export const company = Object.freeze({name: 'MusterWerk GmbH', description: 'Fiktives mittelständisches Unternehmen', date: '14. November 2026'});
export const cases = [
  {
    id: 'DEMO-AI-01', name: 'Bewerber-Screening', short: 'Personal', department: 'Personal', owner: 'Personalverantwortliche',
    icon: 'people', tone: 'attention', label: 'Hochrisiko-Prüfbedarf', role: 'Betreiberrolle prüfen',
    purpose: 'Ein KI-System sortiert eingehende Bewerbungen nach ihrer Passung zur ausgeschriebenen Stelle. Das Personalteam entscheidet über die Einladung.',
    summary: 'Die KI unterstützt eine Entscheidung über Menschen. Auswahlwirkung und menschliche Kontrolle müssen vor dem Einsatz sorgfältig geprüft werden.',
    classification: 'Im vorbereiteten Beispiel besteht Hochrisiko-Prüfbedarf. Die endgültige Einordnung hängt vom konkreten Einsatz und der fachlichen Prüfung ab.',
    findings: [
      {text: 'Das System bildet eine Rangfolge von Bewerbungen und beeinflusst damit die Vorauswahl.', sources: ['DEMO-Q-101']},
      {text: 'Eine menschliche Entscheidung ist vorgesehen. Wie die Rangfolge kontrolliert wird, ist bisher nicht beschrieben.', sources: ['DEMO-Q-101', 'DEMO-Q-102']},
    ],
    questions: ['Kann das Personalteam die Rangfolge unabhängig prüfen und übersteuern?', 'Welche Nachweise liegen zur Qualität und zu möglichen Benachteiligungen vor?'],
    sources: [
      {id: 'DEMO-Q-101', title: 'Einsatzbeschreibung Recruiting', origin: 'Personal · fiktive Prozessbeschreibung', date: '12. November 2026', quote: 'Das System ordnet eingehende Bewerbungen nach ihrer Passung zur ausgeschriebenen Stelle. Die Rangfolge dient dem Personalteam als Grundlage für die Vorauswahl. Über eine Einladung entscheidet eine Mitarbeiterin oder ein Mitarbeiter.'},
      {id: 'DEMO-Q-102', title: 'Stand der internen Prüfung', origin: 'Personal · fiktive Prüfnotiz', date: '13. November 2026', quote: 'Ein dokumentierter Ablauf zur Kontrolle der KI-Rangfolge liegt noch nicht vor. Nachweise zur Ergebnisqualität und zur Untersuchung möglicher Benachteiligungen wurden angefordert.'},
    ],
    tasks: [
      {id: 'DEMO-T-101', title: 'Menschliche Kontrolle konkret beschreiben', owner: 'Personalverantwortliche', reason: 'Festhalten, wer die Rangfolge prüft, wie Abweichungen erkannt werden und wann die KI-Empfehlung verworfen wird.', sources: ['DEMO-Q-101', 'DEMO-Q-102']},
      {id: 'DEMO-T-102', title: 'Qualitätsnachweise zur fachlichen Prüfung anfordern', owner: 'Einkauf und Personal', reason: 'Vorhandene Unterlagen des Anbieters sammeln und die offene Prüfung zu Qualität und möglichen Benachteiligungen dokumentieren.', sources: ['DEMO-Q-102']},
    ],
  },
  {
    id: 'DEMO-AI-02', name: 'Antwortassistent im Kundenservice', short: 'Kundenservice', department: 'Kundenservice', owner: 'Leitung Kundenservice',
    icon: 'chat', tone: 'review', label: 'Transparenz / Einsatz klären', role: 'Einsatzgrenzen prüfen',
    purpose: 'Die KI erstellt Antwortentwürfe zu Kundenanfragen. Mitarbeitende lesen und bearbeiten jeden Entwurf, bevor sie ihn selbst versenden.',
    summary: 'Die beschriebene Nutzung ist eine interne Schreibhilfe. Entscheidend ist, dass die Prüfung durch Menschen erhalten bleibt und ein direkter Kundendialog gesondert bewertet wird.',
    classification: 'Das vorbereitete Beispiel hält die Einordnung offen, soweit die konkrete Nutzung oder ein späterer direkter Kundendialog betroffen ist.',
    findings: [
      {text: 'Aktuell erstellt die KI Entwürfe. Jede Nachricht wird vor dem Versand von einer Person geprüft.', sources: ['DEMO-Q-201']},
      {text: 'Ein späterer direkter Dialog mit Kundinnen und Kunden wird erwogen, ist aber noch nicht freigegeben.', sources: ['DEMO-Q-202']},
    ],
    questions: ['Ist technisch und organisatorisch sichergestellt, dass keine Antwort ungeprüft versendet wird?', 'Soll ein direkter KI-Dialog eingeführt werden, und wie würde dieser kenntlich gemacht?'],
    sources: [
      {id: 'DEMO-Q-201', title: 'Arbeitsablauf im Kundenservice', origin: 'Kundenservice · fiktive Arbeitsanweisung', date: '11. November 2026', quote: 'Der Antwortassistent erstellt interne Textentwürfe aus Kundenanfragen und freigegebenen Produktinformationen. Mitarbeitende prüfen und bearbeiten jeden Entwurf. Der Versand erfolgt ausschließlich durch die zuständige Person.'},
      {id: 'DEMO-Q-202', title: 'Geplante Erweiterung', origin: 'Produktteam · fiktive Planungsnotiz', date: '13. November 2026', quote: 'Ein direkter KI-Dialog im Kundenportal wird als spätere Erweiterung diskutiert. Dafür gibt es noch keine Freigabe. Die künftige Nutzerinformation und die Grenzen automatisierter Antworten sind noch offen.'},
    ],
    tasks: [
      {id: 'DEMO-T-201', title: 'Prüfung vor dem Versand dokumentieren', owner: 'Leitung Kundenservice', reason: 'Den Freigabeschritt im tatsächlichen Arbeitsablauf prüfen und Verantwortlichkeiten festhalten.', sources: ['DEMO-Q-201']},
      {id: 'DEMO-T-202', title: 'Direkten Kundendialog gesondert prüfen', owner: 'Produktverantwortliche', reason: 'Eine mögliche Erweiterung erst nach Klärung von Einsatzgrenzen, Nutzerinformation und fachlicher Einordnung freigeben.', sources: ['DEMO-Q-202']},
    ],
  },
  {
    id: 'DEMO-AI-03', name: 'Optische Qualitätsprüfung', short: 'Produktion', department: 'Produktion', owner: 'Qualitätsmanagement',
    icon: 'scan', tone: 'unclear', label: 'Offene Angaben', role: 'Sicherheitsfunktion ungeklärt',
    purpose: 'Eine Kamera und ein KI-Modell markieren sichtbare Abweichungen an gefertigten Bauteilen. Ob die Ausgabe eine sicherheitsrelevante Freigabe beeinflusst, ist noch nicht dokumentiert.',
    summary: 'Die Angaben reichen für eine abschließende Einordnung nicht aus. Eine reine Sichtprüfung und eine sicherheitsrelevante Freigabefunktion müssen auseinandergehalten werden.',
    classification: 'Vorläufige Einschätzung: weitere Angaben erforderlich. Aus der vorhandenen Beschreibung lässt sich die Sicherheitsrolle des Systems nicht bestimmen.',
    findings: [
      {text: 'Das Modell markiert Abweichungen. Die Beschreibung erklärt nicht, welche Folgen eine Markierung oder ein übersehener Fehler hat.', sources: ['DEMO-Q-301']},
      {text: 'Die Beteiligung an einer sicherheitsrelevanten Bauteilfreigabe ist ausdrücklich noch ungeklärt.', sources: ['DEMO-Q-302']},
    ],
    questions: ['Welche Bauteile werden geprüft, und welche Folgen hätte ein übersehener Fehler?', 'Ist die KI-Ausgabe Teil einer Sicherheitsfunktion oder einer verbindlichen Freigabe?', 'Wer trifft die endgültige Entscheidung über das Bauteil?'],
    sources: [
      {id: 'DEMO-Q-301', title: 'Beschreibung der Prüfanlage', origin: 'Produktion · fiktive Anlagenbeschreibung', date: '10. November 2026', quote: 'Eine Kamera erfasst die Oberfläche gefertigter Bauteile. Das KI-Modell markiert sichtbare Abweichungen auf dem Prüfmonitor. Die weitere Behandlung markierter Teile wird im jeweiligen Produktionsprozess festgelegt.'},
      {id: 'DEMO-Q-302', title: 'Offene Angaben zur Freigabe', origin: 'Qualitätsmanagement · fiktive Klärungsnotiz', date: '13. November 2026', quote: 'Noch nicht dokumentiert sind die betroffenen Bauteilarten, die Folgen übersehener Fehler und die verantwortliche Freigabestelle. Ob die KI-Ausgabe Teil einer sicherheitsrelevanten Freigabe ist, muss geklärt werden.'},
    ],
    tasks: [
      {id: 'DEMO-T-301', title: 'Sicherheitsrolle und Fehlerfolgen klären', owner: 'Technische Leitung', reason: 'Bauteilarten, Fehlerfolgen und die tatsächliche Rolle der KI im Freigabeprozess beschreiben.', sources: ['DEMO-Q-301', 'DEMO-Q-302']},
      {id: 'DEMO-T-302', title: 'Verantwortliche Freigabestelle benennen', owner: 'Qualitätsmanagement', reason: 'Festhalten, wer die endgültige Bauteilentscheidung trifft und welche Informationen dafür verwendet werden.', sources: ['DEMO-Q-302']},
    ],
  },
];
