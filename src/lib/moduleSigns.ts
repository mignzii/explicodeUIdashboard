// Panneau que l'app affiche pour un module quand il n'a pas de photo.
// Miroir de RoadSigns.forModule (explicode/lib/core/widgets/road_sign.dart) :
// à garder identique, y compris l'ordre (le premier mot trouvé l'emporte).

const MODULE_SIGNS: [keyword: string, file: string][] = [
  ['generalit', 'generalites'],
  ['signalisation', 'signalisation_routiere'],
  ['regle', 'regles_de_conduite'],
  ['permis', 'permis'],
  ['accident', 'premiers_secours'],
  ['securite', 'securite_routiere'],
  ['conduite', 'conduite_pratique'],
  ['obligation', 'conduite_pratique'],
  ['circulation', 'rond_point'],
  ['code', 'code_de_la_route'],
  ['secours', 'premiers_secours'],
]

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** URL du panneau SVG de l'app pour ce titre de module, ou null s'il n'en a pas. */
export function moduleSignUrl(title: string): string | null {
  const t = normalize(title)
  const hit = MODULE_SIGNS.find(([keyword]) => t.includes(keyword))
  return hit ? `/signs/${hit[1]}.svg` : null
}
